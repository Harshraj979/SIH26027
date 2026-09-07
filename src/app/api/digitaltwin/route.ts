/**
 * GET /api/digitaltwin
 * Returns the corridor Digital Twin topology, including:
 *   - Geo-tagged assets (Tracks, Signals, OHE Feeders, Crossovers)
 *   - Cross-asset dependencies (Electrical isolation, SLW crossover links)
 *   - Health status and statistics
 */

import { NextResponse } from "next/server";
import { DigitalTwinGraph } from "@/lib/digitalTwinGraph";

export async function GET() {
  try {
    const snapshot = await DigitalTwinGraph.getSnapshot();
    return NextResponse.json(snapshot);
  } catch (err) {
    console.error("[/api/digitaltwin GET]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
