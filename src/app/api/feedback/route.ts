/**
 * POST /api/feedback — log actual block execution from track-side
 * GET  /api/feedback — view historical execution logs for retraining
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const logs = await prisma.executionLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(logs);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      workOrderId,
      blockDescription,
      plannedStartMin,
      plannedEndMin,
      actualStartMin,
      actualEndMin,
      overrunReason = "NONE",
      notes = "",
      loggedByEngineer = "SSE/P-Way/UMB",
    } = body;

    const plannedDur = (plannedEndMin ?? 0) - (plannedStartMin ?? 0);
    const actualDur  = (actualEndMin ?? 0) - (actualStartMin ?? 0);
    const overrunMinutes = Math.max(0, actualDur - plannedDur);

    const log = await prisma.executionLog.create({
      data: {
        workOrderId,
        blockDescription: blockDescription || "Routine Maintenance Block",
        plannedStartMin:  parseInt(plannedStartMin ?? 0),
        plannedEndMin:    parseInt(plannedEndMin ?? 0),
        actualStartMin:   parseInt(actualStartMin ?? 0),
        actualEndMin:     parseInt(actualEndMin ?? 0),
        overrunMinutes,
        overrunReason,
        notes,
        loggedByEngineer,
      },
    });

    return NextResponse.json({
      success: true,
      log,
      message: `Execution logged. Overrun: +${overrunMinutes} min. Feedback recorded for duration model retraining.`,
    });
  } catch (err) {
    console.error("[/api/feedback POST]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
