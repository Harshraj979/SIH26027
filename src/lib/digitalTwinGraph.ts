/**
 * RailBlock AI — Digital Twin Knowledge Graph Engine
 *
 * Models physical, electrical, and interlocking topology of the
 * Northern Railway Delhi–Ambala–Ludhiana mainline corridor (312 km).
 *
 * Core capabilities:
 *  - Asset lookup (Tracks, Signals, OHE Feeders, Crossovers, Stations)
 *  - Dependency resolution (e.g., S&T signal work requiring TRD power shutoff)
 *  - Single-Line Working (SLW) routing between adjacent universal crossovers
 *  - Physical possession feasibility checking
 */

import { prisma } from "@/lib/prisma";

export interface DigitalTwinAsset {
  id: string;
  assetCode: string;
  name: string;
  assetType: "TRACK_SEGMENT" | "SIGNAL" | "OHE_FEEDER" | "CROSSOVER" | "STATION";
  kmFrom: number;
  kmTo: number;
  trackId: string;
  status: string;
  metadata?: Record<string, unknown>;
  dependencies?: {
    type: string;
    targetCode: string;
    description: string;
  }[];
}

export interface CrossDepRequirement {
  sourceDept: "TMS" | "SMMS" | "TDMS";
  requiredDept: "TMS" | "SMMS" | "TDMS";
  assetCode: string;
  feederZone?: string;
  kmFrom: number;
  kmTo: number;
  reason: string;
  isMandatory: boolean;
}

export interface SLWPair {
  entryCrossover: string;
  exitCrossover: string;
  kmFrom: number;
  kmTo: number;
  openTrack: "UP" | "DN";
  blockedTrack: "UP" | "DN";
  maxSpeedKmh: number;
  bufferHeadwayMin: number;
}

export class DigitalTwinGraph {
  /**
   * Resolve cross-departmental dependencies for any proposed work order.
   * E.g., S&T Signal work at km 197 automatically requires TRD OHE power block
   * on OHE-TSS-UMB from km 195 to 225.
   */
  static async resolveDependencies(
    dept: string,
    kmFrom: number,
    kmTo: number,
    trackId: string
  ): Promise<CrossDepRequirement[]> {
    const requirements: CrossDepRequirement[] = [];

    // Query relevant assets overlapping or adjacent to the maintenance segment
    const assets = await prisma.assetNode.findMany({
      where: {
        kmFrom: { lte: kmTo + 2.0 },
        kmTo:   { gte: kmFrom - 2.0 },
      },
      include: {
        outgoingDeps: { include: { targetAsset: true } },
      },
    });

    for (const asset of assets) {
      for (const dep of asset.outgoingDeps) {
        if (dep.dependencyType === "ELECTRICAL_ISOLATION") {
          requirements.push({
            sourceDept: dept as "TMS" | "SMMS" | "TDMS",
            requiredDept: "TDMS",
            assetCode: dep.targetAsset.assetCode,
            feederZone: dep.targetAsset.name,
            kmFrom: dep.targetAsset.kmFrom,
            kmTo: dep.targetAsset.kmTo,
            reason: dep.description,
            isMandatory: true,
          });
        }
      }
    }

    // Civil track deep tamping requires OHE neutral sectioning & adjacent line speed restrictions
    if (dept === "TMS" && kmTo - kmFrom >= 15.0) {
      requirements.push({
        sourceDept: "TMS",
        requiredDept: "TDMS",
        assetCode: "OHE-MAINT-BOND",
        kmFrom,
        kmTo,
        reason: "Heavy tamping machine operations require TRD bond inspection and height survey.",
        isMandatory: false,
      });
    }

    return requirements;
  }

  /**
   * Find candidate Single-Line Working (SLW) crossovers bounding a blocked track segment.
   * When track UP is blocked between kmFrom and kmTo, returns the nearest upstream and
   * downstream crossovers to divert traffic onto DN line.
   */
  static async findSLWPair(
    kmFrom: number,
    kmTo: number,
    blockedTrack: "UP" | "DN"
  ): Promise<SLWPair | null> {
    const crossovers = await prisma.assetNode.findMany({
      where: { assetType: "CROSSOVER" },
      orderBy: { kmFrom: "asc" },
    });

    if (crossovers.length < 2) return null;

    // Upstream crossover: highest km <= kmFrom
    let upstream = crossovers[0];
    for (const x of crossovers) {
      if (x.kmTo <= kmFrom + 1.0) {
        upstream = x;
      } else {
        break;
      }
    }

    // Downstream crossover: lowest km >= kmTo
    let downstream = crossovers[crossovers.length - 1];
    for (let i = crossovers.length - 1; i >= 0; i--) {
      if (crossovers[i].kmFrom >= kmTo - 1.0) {
        downstream = crossovers[i];
      } else {
        break;
      }
    }

    if (upstream.assetCode === downstream.assetCode) return null;

    return {
      entryCrossover: upstream.assetCode,
      exitCrossover: downstream.assetCode,
      kmFrom: upstream.kmFrom,
      kmTo: downstream.kmTo,
      openTrack: blockedTrack === "UP" ? "DN" : "UP",
      blockedTrack,
      maxSpeedKmh: 45, // speed restriction over crossover & single line working
      bufferHeadwayMin: 15, // extra clearance headway for bidirectional working
    };
  }

  /**
   * Full snapshot of the digital twin topology with active dependencies.
   */
  static async getSnapshot(): Promise<{
    assets: DigitalTwinAsset[];
    crossoversCount: number;
    feedersCount: number;
    signalsCount: number;
  }> {
    const rawAssets = await prisma.assetNode.findMany({
      include: {
        outgoingDeps: { include: { targetAsset: true } },
      },
      orderBy: { kmFrom: "asc" },
    });

    const assets: DigitalTwinAsset[] = rawAssets.map((a) => ({
      id: a.id,
      assetCode: a.assetCode,
      name: a.name,
      assetType: a.assetType as DigitalTwinAsset["assetType"],
      kmFrom: a.kmFrom,
      kmTo: a.kmTo,
      trackId: a.trackId,
      status: a.status,
      metadata: a.metadata ? JSON.parse(a.metadata) : undefined,
      dependencies: a.outgoingDeps.map((d) => ({
        type: d.dependencyType,
        targetCode: d.targetAsset.assetCode,
        description: d.description,
      })),
    }));

    return {
      assets,
      crossoversCount: assets.filter((a) => a.assetType === "CROSSOVER").length,
      feedersCount:    assets.filter((a) => a.assetType === "OHE_FEEDER").length,
      signalsCount:    assets.filter((a) => a.assetType === "SIGNAL").length,
    };
  }
}
