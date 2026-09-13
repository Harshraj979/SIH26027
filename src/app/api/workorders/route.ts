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
    const lineId = body.lineId || body.trackId || "UP_FAST";

    // Locate track matching lineId or fallback
    let track = await prisma.track.findFirst({
      where: { trackId: lineId },
    });
    if (!track) {
      track = await prisma.track.findFirst({
        where: { trackId: { in: ["UP_FAST", "UP"] } },
      });
    }
    if (!track) {
      return NextResponse.json({ error: "Track line not found" }, { status: 400 });
    }

    const kmFrom = parseFloat(body.kmFrom);
    const kmTo = parseFloat(body.kmTo);
    const durationMinutes = parseInt(body.durationMinutes) || 60;
    const priority = parseInt(body.priority ?? 2);

    // Calculate nearest depot if not provided
    const depotKm = kmFrom <= 45 ? 0.0 : kmFrom <= 140 ? 90.0 : kmFrom <= 250 ? 197.0 : 312.0;
    const depotName = kmFrom <= 45 ? "New Delhi Yard Depot (KM 0.0)" :
      kmFrom <= 140 ? "Panipat Jn Depot (KM 90.0)" :
      kmFrom <= 250 ? "Ambala Cantt Depot (KM 197.0)" : "Ludhiana Jn Yard (KM 312.0)";
    const dist = Math.abs(kmFrom - depotKm);
    const transitMin = body.transitMinutes ? parseInt(body.transitMinutes) : (dist <= 2.0 ? 5 : Math.round((dist / 30.0) * 60));

    const isEmergency = priority === 1 || (body.defectType && ["RAIL_FRACTURE", "POINT_MACHINE_FAILURE"].includes(body.defectType));
    const assetRisk = body.assetRisk ? parseFloat(body.assetRisk) : (isEmergency ? 95.0 : priority === 2 ? 70.0 : 25.0);

    const wo = await prisma.workOrder.create({
      data: {
        department:       body.department,
        description:      body.description,
        kmFrom:           kmFrom,
        kmTo:             kmTo,
        durationMinutes:  durationMinutes,
        priority:         priority,
        overdueDays:      parseInt(body.overdueDays ?? 0),
        cumulativeGmt:    parseFloat(body.cumulativeGmt ?? 120),
        tqiScore:         parseFloat(body.tqiScore ?? 70),
        trackId:          track.id,
        lineId:           lineId,
        kpMarker:         body.kpMarker || `KM ${kmFrom.toFixed(1)} / ${Math.floor(kmFrom * 2)}-${Math.floor(kmFrom * 2) + 2}`,
        defectType:       body.defectType || "MAINTENANCE_DEMAND",
        ssrTaskCode:      body.ssrTaskCode || null,
        ssrStandardMin:   body.ssrStandardMin ? parseInt(body.ssrStandardMin) : durationMinutes,
        aiAdjustedMin:    body.aiAdjustedMin ? parseInt(body.aiAdjustedMin) : durationMinutes + transitMin,
        nearestDepot:     body.nearestDepot || depotName,
        transitMinutes:   transitMin,
        hardSafetyOverride: body.hardSafetyOverride ?? (assetRisk >= 90.0),
        horizonType:      body.horizonType || (assetRisk >= 70.0 ? "WEEKLY" : "MONTHLY"),
        explanation:      body.explanation || `Requisition from ${body.department} on ${lineId} line.`,
        assetRisk:        assetRisk,
        penaltyWeight:    Math.round(100 + 99 * assetRisk),
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
