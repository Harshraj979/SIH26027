/**
 * GET /api/corridor
 * Returns full corridor topology, all trains with stops, pending work orders,
 * and active operational events. This is the primary data-loading endpoint.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DigitalTwinGraph } from "@/lib/digitalTwinGraph";
import { CorridorData } from "@/types";

export async function GET() {
  try {
    const corridor = await prisma.corridor.findFirst({
      where: { id: "cor-ndls-ldh" },
    });

    if (!corridor) {
      return NextResponse.json({ error: "Corridor not found — run seed first" }, { status: 404 });
    }

    const stations = await prisma.station.findMany({
      where: { corridorId: corridor.id },
      orderBy: { chainage: "asc" },
    });

    const trains = await prisma.train.findMany({
      where: { isActive: true },
      orderBy: [{ priority: "asc" }, { number: "asc" }],
      include: {
        stops: {
          orderBy: { sequence: "asc" },
          include: {
            station: {
              select: { code: true, name: true, chainage: true },
            },
          },
        },
      },
    });

    const workOrders = await prisma.workOrder.findMany({
      where: { status: { in: ["PENDING", "SCHEDULED"] } },
      orderBy: [{ department: "asc" }, { kmFrom: "asc" }],
    });

    const events = await prisma.operationalEvent.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Shape trains with flattened stop data including chainage
    const shapedTrains = trains.map((t) => ({
      id:          t.id,
      number:      t.number,
      name:        t.name,
      priority:    t.priority,
      trainType:   t.trainType,
      rakeType:    t.rakeType,
      maxSpeedKmh: t.maxSpeedKmh,
      direction:   t.direction,
      isActive:    t.isActive,
      provenance:  t.provenance,
      stops: t.stops.map((s) => ({
        sequence:      s.sequence,
        arrivalMin:    s.arrivalMin,
        departureMin:  s.departureMin,
        arrivalHHMM:   s.arrivalHHMM,
        departureHHMM: s.departureHHMM,
        haltMinutes:   s.haltMinutes,
        isOrigin:      s.isOrigin,
        isDestination: s.isDestination,
        chainage:      s.station.chainage,
        stationCode:   s.station.code,
        stationName:   s.station.name,
      })),
    }));

    const response: CorridorData = {
      corridor: { id: corridor.id, name: corridor.name, totalKm: corridor.totalKm },
      stations: stations.map((s) => ({
        id:         s.id,
        code:       s.code,
        name:       s.name,
        chainage:   s.chainage,
        zone:       s.zone,
        division:   s.division,
        provenance: s.provenance,
      })),
      trains:     shapedTrains,
      workOrders: workOrders.map((wo) => ({
        id:               wo.id,
        department:       wo.department as "TMS" | "SMMS" | "TDMS",
        description:      wo.description,
        kmFrom:           wo.kmFrom,
        kmTo:             wo.kmTo,
        durationMinutes:  wo.durationMinutes,
        priority:         wo.priority,
        status:           wo.status as "PENDING" | "SCHEDULED" | "COMPLETED" | "CANCELLED",
        overdueDays:      wo.overdueDays,
        cumulativeGmt:    wo.cumulativeGmt,
        tqiScore:         wo.tqiScore,
        assetRisk:        wo.assetRisk,
        penaltyWeight:    wo.penaltyWeight,
        isShadowBlock:    wo.isShadowBlock,
        trackId:          wo.trackId,
        lineId:           wo.lineId ?? "UP_FAST",
        kpMarker:         wo.kpMarker,
        defectType:       wo.defectType,
        ssrTaskCode:      wo.ssrTaskCode,
        ssrStandardMin:   wo.ssrStandardMin,
        aiAdjustedMin:    wo.aiAdjustedMin,
        nearestDepot:     wo.nearestDepot,
        transitMinutes:   wo.transitMinutes,
        hardSafetyOverride: wo.hardSafetyOverride,
        explanation:      wo.explanation,
        horizonType:      (wo.horizonType as "WEEKLY" | "MONTHLY") ?? "WEEKLY",
        provenance:       wo.provenance,
      })),
      events: events.map((e) => ({
        id:             e.id,
        eventType:      e.eventType,
        description:    e.description,
        severity:       e.severity as "CRITICAL" | "CAUTION" | "INFO",
        kmFrom:         e.kmFrom,
        kmTo:           e.kmTo,
        startMin:       e.startMin,
        endMin:         e.endMin,
        delayMinutes:   e.delayMinutes,
        affectedTrains: e.affectedTrains,
        isActive:       e.isActive,
        provenance:     e.provenance,
      })),
      digitalTwin: await DigitalTwinGraph.getSnapshot(),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/corridor]", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
