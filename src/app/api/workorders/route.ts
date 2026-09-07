/**
 * GET  /api/workorders — list work orders (with optional ?status= filter)
 * POST /api/workorders — create a new work order
 * PATCH /api/workorders?id=xxx — update status/fields
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const dept   = req.nextUrl.searchParams.get("dept")   ?? undefined;

  const workOrders = await prisma.workOrder.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(dept   ? { department: dept } : {}),
    },
    orderBy: [{ department: "asc" }, { kmFrom: "asc" }],
  });

  return NextResponse.json(workOrders);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const track = await prisma.track.findFirst({
      where: { trackId: body.trackId ?? "UP" },
    });
    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 400 });
    }

    const wo = await prisma.workOrder.create({
      data: {
        department:       body.department,
        description:      body.description,
        kmFrom:           parseFloat(body.kmFrom),
        kmTo:             parseFloat(body.kmTo),
        durationMinutes:  parseInt(body.durationMinutes),
        priority:         parseInt(body.priority ?? 2),
        overdueDays:      parseInt(body.overdueDays ?? 0),
        cumulativeGmt:    parseFloat(body.cumulativeGmt ?? 0),
        tqiScore:         parseFloat(body.tqiScore ?? 70),
        trackId:          track.id,
        requestedDate:    new Date(body.requestedDate ?? Date.now()),
        provenance:       "LIVE",
        status:           "PENDING",
      },
    });

    return NextResponse.json(wo, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const body = await req.json();
    const wo = await prisma.workOrder.update({
      where: { id },
      data:  body,
    });
    return NextResponse.json(wo);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
