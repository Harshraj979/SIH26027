/**
 * POST /api/optimize
 * Triggers the Python OR-Tools solver for a given planning date.
 * Saves results back into the database and returns the full solution.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runSolver } from "@/lib/pythonBridge";
import { SolverPayload, OptimizeResponse } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const planDate = (body.date as string) || new Date().toISOString().split("T")[0];

    // ── 1. Load trains from DB ───────────────────────────────────────────────
    const trains = await prisma.train.findMany({
      where: { isActive: true },
      include: {
        stops: {
          orderBy: { sequence: "asc" },
          include: { station: { select: { code: true, chainage: true } } },
        },
      },
    });

    // ── 2. Load pending work orders ──────────────────────────────────────────
    const workOrders = await prisma.workOrder.findMany({
      where: { status: { in: ["PENDING", "SCHEDULED"] } },
      include: { track: true },
    });

    if (workOrders.length === 0) {
      return NextResponse.json({
        scheduledBlocks: [],
        trainPerturbations: [],
        solverStats: { status: "TRIVIAL", wallTimeMs: 0 },
        kpis: {
          blocksScheduled: 0, shadowBlocks: 0,
          p1TrainsProtected: trains.filter(t => t.priority === 1).length,
          avgRisk: 0, totalWorkOrders: 0, perturbedTrains: 0,
        },
        planDate,
      } satisfies OptimizeResponse);
    }

    // ── 3. Build solver payload ──────────────────────────────────────────────
    const payload: SolverPayload = {
      date:           planDate,
      horizonMinutes: 1440,
      horizonType:    (body.horizonType as "WEEKLY" | "MONTHLY") || undefined,
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
        lineId:           wo.lineId || wo.track.trackId,
        defectType:       wo.defectType,
        ssrTaskCode:      wo.ssrTaskCode,
        ssrStandardMin:   wo.ssrStandardMin,
        aiAdjustedMin:    wo.aiAdjustedMin,
        nearestDepot:     wo.nearestDepot,
        transitMinutes:   wo.transitMinutes,
        hardSafetyOverride: wo.hardSafetyOverride,
        horizonType:      (wo.horizonType as "WEEKLY" | "MONTHLY") || "WEEKLY",
      })),
    };

    // ── 4. Invoke Python solver ──────────────────────────────────────────────
    console.log(`[/api/optimize] Invoking solver for ${planDate} with ${workOrders.length} WOs`);
    const result = await runSolver(payload);

    // ── 5. Persist scheduled blocks and update WO status ────────────────────
    const planDateTime = new Date(`${planDate}T00:00:00+05:30`);

    if (result.scheduledBlocks && result.scheduledBlocks.length > 0) {
      // Clear old scheduled blocks for this date
      await prisma.scheduledBlock.deleteMany({
        where: { planDate: planDateTime },
      });

      for (const block of result.scheduledBlocks) {
        const primaryWoId = block.clusterIds[0];

        await prisma.scheduledBlock.create({
          data: {
            startMin:         block.startMin,
            endMin:           block.endMin,
            startHHMM:        block.startHHMM,
            endHHMM:          block.endHHMM,
            durationMinutes:  block.durationMinutes,
            isShadowBlock:    block.isShadowBlock,
            departments:      JSON.stringify(block.departments),
            status:           "APPROVED",
            planDate:         planDateTime,
            provenance:       "MODELED",
            lineId:           block.lineId ?? "UP_FAST",
            slotOptionType:   block.slotOptionType ?? "NATURAL_GAP",
            slotScore:        block.slotScore ?? 0,
            delayPenalty:     block.delayPenalty ?? 0,
            clubbingBonus:    block.clubbingBonus ?? 0,
            setupSavedMin:    block.setupSavedMin ?? 0,
            horizonType:      block.horizonType ?? "WEEKLY",
            workOrder: {
              connect: { id: primaryWoId },
            },
          },
        });

        // Update all clustered WOs to SCHEDULED
        await prisma.workOrder.updateMany({
          where: { id: { in: block.clusterIds } },
          data:  {
            status: "SCHEDULED",
            assetRisk: block.assetRisk,
            penaltyWeight: block.penaltyWeight,
          },
        });
      }

      // Persist train perturbations
      await prisma.trainPerturbation.deleteMany({
        where: { planDate: planDateTime },
      });

      for (const pert of result.trainPerturbations ?? []) {
        const train = await prisma.train.findUnique({ where: { number: pert.trainNumber } });
        if (train) {
          await prisma.trainPerturbation.create({
            data: {
              train: {
                connect: { id: train.id },
              },
              stationCode:       pert.stationCode,
              originalDeparture: pert.originalDeparture || "—",
              delayMinutes:      pert.delayMinutes,
              cause:             pert.cause,
              planDate:          planDateTime,
            },
          });
        }
      }
    }

    const response: OptimizeResponse = { ...result, planDate };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/optimize]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
