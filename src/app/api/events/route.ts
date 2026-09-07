/**
 * POST /api/events — create an operational event (perturbation)
 * GET  /api/events — list active events
 *
 * Creating a fog/delay event writes to the DB and re-triggers optimization
 * in the same request, returning updated solver results.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runSolver } from "@/lib/pythonBridge";
import { SolverPayload } from "@/types";

export async function GET() {
  const events = await prisma.operationalEvent.findMany({
    where:   { isActive: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      eventType   = "DELAY",
      description = "Operational perturbation",
      severity    = "CAUTION",
      kmFrom,
      kmTo,
      delayMinutes = 0,
      affectedTrainNumbers = [] as string[],
    } = body;

    // 1. Persist the event
    const event = await prisma.operationalEvent.create({
      data: {
        eventType,
        description,
        severity,
        kmFrom:         kmFrom != null ? parseFloat(kmFrom) : null,
        kmTo:           kmTo   != null ? parseFloat(kmTo)   : null,
        delayMinutes:   parseInt(delayMinutes),
        affectedTrains: affectedTrainNumbers.length
          ? JSON.stringify(affectedTrainNumbers)
          : null,
        isActive:   true,
        provenance: "LIVE",
      },
    });

    // 2. Apply delay to affected trains by shifting their stop times
    if (delayMinutes > 0 && affectedTrainNumbers.length > 0) {
      for (const num of affectedTrainNumbers) {
        const train = await prisma.train.findUnique({ where: { number: num } });
        if (!train) continue;

        const stops = await prisma.trainStop.findMany({
          where: { trainId: train.id },
          orderBy: { sequence: "asc" },
          include: { station: true },
        });

        for (const stop of stops) {
          const geo_in_range =
            kmFrom == null ||
            (stop.station.chainage >= parseFloat(kmFrom) &&
             stop.station.chainage <= parseFloat(kmTo ?? kmFrom));

          if (geo_in_range) {
            await prisma.trainStop.update({
              where: { id: stop.id },
              data: {
                arrivalMin:    stop.arrivalMin  != null ? stop.arrivalMin  + parseInt(delayMinutes) : null,
                departureMin:  stop.departureMin != null ? stop.departureMin + parseInt(delayMinutes) : null,
              },
            });
          }
        }
      }
    }

    // 3. Re-run solver with updated state
    const trains = await prisma.train.findMany({
      where: { isActive: true },
      include: {
        stops: {
          orderBy: { sequence: "asc" },
          include: { station: { select: { code: true, chainage: true } } },
        },
      },
    });

    const workOrders = await prisma.workOrder.findMany({
      where:   { status: { in: ["PENDING", "SCHEDULED"] } },
      include: { track: true },
    });

    const planDate = new Date().toISOString().split("T")[0];

    const payload: SolverPayload = {
      date:           planDate,
      horizonMinutes: 1440,
      trains: trains.map((t) => ({
        id:       t.id,
        number:   t.number,
        priority: t.priority,
        stops: t.stops.map((s) => ({
          stationCode:   s.station.code,
          chainage:      s.station.chainage,
          arrivalMin:    s.arrivalMin,
          departureMin:  s.departureMin,
          arrivalHHMM:   s.arrivalHHMM,
          departureHHMM: s.departureHHMM,
        })),
      })),
      workOrders: workOrders.map((wo) => ({
        id:               wo.id,
        department:       wo.department,
        description:      wo.description,
        kmFrom:           wo.kmFrom,
        kmTo:             wo.kmTo,
        durationMinutes:  wo.durationMinutes,
        overdueDays:      wo.overdueDays,
        cumulativeGmt:    wo.cumulativeGmt,
        tqiScore:         wo.tqiScore,
        trackId:          wo.track.trackId,
      })),
    };

    const solverResult = await runSolver(payload);

    return NextResponse.json({
      event,
      solverResult,
      message: `Event logged. Solver re-run: ${solverResult.solverStats.status}`,
    });
  } catch (err) {
    console.error("[/api/events POST]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
