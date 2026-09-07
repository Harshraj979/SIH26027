/**
 * POST /api/negotiate
 * Triggers autonomous Multi-Agent Negotiation across:
 *   - Engineering Agent (TMS)
 *   - S&T Agent (SMMS)
 *   - TRD Agent (TDMS)
 *   - Operations Agent (COA)
 * Mediated by the Arbitration Coordinator Agent.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runSolver } from "@/lib/pythonBridge";
import { SolverPayload } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const monsoonActive = Boolean(body.monsoonActive);
    const planDate = (body.date as string) || new Date().toISOString().split("T")[0];

    const workOrders = await prisma.workOrder.findMany({
      where: { status: { in: ["PENDING", "SCHEDULED"] } },
      include: { track: true },
    });

    const trains = await prisma.train.findMany({
      where: { isActive: true },
      include: {
        stops: {
          orderBy: { sequence: "asc" },
          include: { station: { select: { code: true, chainage: true } } },
        },
      },
    });

    const payload: SolverPayload = {
      date: planDate,
      horizonMinutes: 1440,
      monsoonActive,
      trains: trains.map((t) => ({
        id: t.id,
        number: t.number,
        priority: t.priority,
        stops: t.stops.map((s) => ({
          stationCode: s.station.code,
          chainage: s.station.chainage,
          arrivalMin: s.arrivalMin,
          departureMin: s.departureMin,
          arrivalHHMM: s.arrivalHHMM,
          departureHHMM: s.departureHHMM,
        })),
      })),
      workOrders: workOrders.map((wo) => ({
        id: wo.id,
        department: wo.department,
        description: wo.description,
        kmFrom: wo.kmFrom,
        kmTo: wo.kmTo,
        durationMinutes: wo.durationMinutes,
        overdueDays: wo.overdueDays,
        cumulativeGmt: wo.cumulativeGmt,
        tqiScore: wo.tqiScore,
        trackId: wo.track.trackId,
      })),
    };

    const solverResult = await runSolver(payload);

    // Persist arbitration record
    if (solverResult.arbitrationTranscript) {
      const planDateTime = new Date(`${planDate}T00:00:00+05:30`);
      await prisma.arbitrationLog.create({
        data: {
          planDate: planDateTime,
          totalBidsReceived: solverResult.arbitrationTranscript.totalBids,
          bundledBlocksCount: solverResult.arbitrationTranscript.shadowBlocksCount,
          naturalLanguageJustification: solverResult.arbitrationTranscript.justifications.join("\n\n"),
          compromiseMetrics: JSON.stringify(solverResult.arbitrationTranscript.departmentalSatisfaction),
        },
      });
    }

    return NextResponse.json({
      success: true,
      arbitrationTranscript: solverResult.arbitrationTranscript,
      scheduledBlocks: solverResult.scheduledBlocks,
      trainPerturbations: solverResult.trainPerturbations,
      kpis: solverResult.kpis,
      solverStats: solverResult.solverStats,
    });
  } catch (err) {
    console.error("[/api/negotiate POST]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
