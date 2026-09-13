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
    const isTms = body.department === "TMS";
    const numeric = (value: unknown) => typeof value === "number" && Number.isFinite(value);
    if (isTms) {
      if (!body.sectionId || !body.railwayLocation || !body.assetType || !body.defectType ||
          !body.inspectionMethod || !body.protectionStatus) {
        return NextResponse.json({ error: "TMS section, railway location, asset, defect, inspection and protection fields are required" }, { status: 400 });
      }
      if (!numeric(body.kmFrom) || !numeric(body.kmTo) || body.kmFrom < 0 || body.kmTo <= body.kmFrom) {
        return NextResponse.json({ error: "TMS kmFrom/kmTo must be numeric and kmTo must be greater than kmFrom" }, { status: 400 });
      }
      const sections: Record<string, [number, number]> = {
        "NDLS-SNP": [0, 61], "SNP-PNP": [61, 90], "PNP-KKDE": [90, 124],
        "KKDE-KUN": [124, 157], "KUN-UMB": [157, 197], "UMB-RPJ": [197, 224],
        "RPJ-SIR": [224, 258], "SIR-LDH": [258, 312],
      };
      const range = sections[body.sectionId];
      if (!range || body.kmFrom < range[0] || body.kmTo > range[1]) {
        return NextResponse.json({ error: "TMS km range must be within the selected railway section" }, { status: 400 });
      }
      if (!numeric(body.tqiScore) || body.tqiScore < 0 || body.tqiScore > 100) {
        return NextResponse.json({ error: "TMS TQI must be a number between 0 and 100" }, { status: 400 });
      }
      if (body.defectSeverity === "CRITICAL" && body.protectionStatus === "NOT_REQUIRED") {
        return NextResponse.json({ error: "Critical TMS defects require protection before work" }, { status: 400 });
      }
    }

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
        kpMarker:        body.kpMarker || null,
        sectionId:       body.sectionId || null,
        railwayLocation: body.railwayLocation || null,
        assetType:       body.assetType || null,
        assetId:         body.assetId || null,
        defectType:      body.defectType || (isTms ? null : "MAINTENANCE_DEMAND"),
        defectSeverity:  body.defectSeverity || null,
        inspectionMethod: body.inspectionMethod || null,
        protectionStatus: body.protectionStatus || null,
        approvalStatus:  body.approvalStatus || "PENDING",
        ssrTaskCode:      body.ssrTaskCode || null,
        ssrStandardMin:   body.ssrStandardMin ? parseInt(body.ssrStandardMin) : durationMinutes,
        aiAdjustedMin:    body.aiAdjustedMin ? parseInt(body.aiAdjustedMin) : durationMinutes + transitMin,
        nearestDepot:     body.nearestDepot || depotName,
        transitMinutes:   transitMin,
        hardSafetyOverride: body.hardSafetyOverride ?? (assetRisk >= 90.0 || body.defectSeverity === "CRITICAL"),
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
