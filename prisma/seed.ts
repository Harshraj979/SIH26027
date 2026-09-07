/**
 * RailBlock AI — Database Seed Script
 * Populates: NDLS→LDH Northern Railway Corridor, Real Timetable Data,
 * Rolling Stock, and representative Work Orders across TMS/SMMS/TDMS.
 *
 * Run: npx tsx prisma/seed.ts
 */

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || "file:./dev.db" });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);



// ─── HELPER ──────────────────────────────────────────────────────────────────
function hhmm(h: number, m: number): string {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function toMin(h: number, m: number): number {
  return h * 60 + m;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Seeding RailBlock AI database…");

  // ── Corridor ────────────────────────────────────────────────────────────
  const corridor = await prisma.corridor.upsert({
    where: { id: "cor-ndls-ldh" },
    update: {},
    create: {
      id:           "cor-ndls-ldh",
      name:         "Delhi–Ambala–Ludhiana Mainline",
      divisionCode: "DLI",
      zoneCode:     "NR",
      totalKm:      312.0,
    },
  });
  console.log(`  ✔ Corridor: ${corridor.name}`);

  // ── Stations ─────────────────────────────────────────────────────────────
  // Authentic Northern Railway mainline chainage data
  const stationDefs = [
    { code: "NDLS", name: "New Delhi",          chainage: 0.0,   latitude: 28.6419, longitude: 77.2191 },
    { code: "SNP",  name: "Sonipat",             chainage: 61.0,  latitude: 28.9931, longitude: 77.0151 },
    { code: "PNP",  name: "Panipat Jn",          chainage: 90.0,  latitude: 29.3868, longitude: 76.9694 },
    { code: "KUN",  name: "Kurukshetra Jn",       chainage: 157.0, latitude: 29.9695, longitude: 76.8783 },
    { code: "KKDE", name: "Karnal",               chainage: 124.0, latitude: 29.6857, longitude: 76.9905 },
    { code: "UMB",  name: "Ambala Cant Jn",       chainage: 197.0, latitude: 30.3782, longitude: 76.7767 },
    { code: "RPJ",  name: "Rajpura Jn",           chainage: 224.0, latitude: 30.4842, longitude: 76.5956 },
    { code: "SIR",  name: "Sirhind",              chainage: 258.0, latitude: 30.6337, longitude: 76.3932 },
    { code: "LDH",  name: "Ludhiana Jn",          chainage: 312.0, latitude: 30.9010, longitude: 75.8573 },
  ] as const;

  // Sort by chainage for correct sequence
  const sortedStations = [...stationDefs].sort((a, b) => a.chainage - b.chainage);

  const stationMap: Record<string, string> = {};
  for (const s of sortedStations) {
    const rec = await prisma.station.upsert({
      where: { code: s.code },
      update: {},
      create: {
        code:       s.code,
        name:       s.name,
        chainage:   s.chainage,
        zone:       "NR",
        division:   "DLI",
        latitude:   s.latitude,
        longitude:  s.longitude,
        provenance: "AUTHORITATIVE",
        corridorId: corridor.id,
      },
    });
    stationMap[s.code] = rec.id;
    console.log(`  ✔ Station: ${s.code} (${s.chainage} km)`);
  }

  // ── Tracks ───────────────────────────────────────────────────────────────
  const upTrack = await prisma.track.upsert({
    where: { id: "trk-up" },
    update: {},
    create: {
      id:          "trk-up",
      trackId:     "UP",
      kmFrom:      0.0,
      kmTo:        312.0,
      trackType:   "MAIN",
      maxSpeedKmh: 160,
      corridorId:  corridor.id,
    },
  });
  const dnTrack = await prisma.track.upsert({
    where: { id: "trk-dn" },
    update: {},
    create: {
      id:          "trk-dn",
      trackId:     "DN",
      kmFrom:      0.0,
      kmTo:        312.0,
      trackType:   "MAIN",
      maxSpeedKmh: 160,
      corridorId:  corridor.id,
    },
  });
  console.log("  ✔ Tracks: UP, DN");

  // ── Trains & Timetables ──────────────────────────────────────────────────
  // All times in minutes from midnight (IST)

  interface StopDef {
    code:    string;
    arr?:    [number, number];  // [h, m]
    dep?:    [number, number];
    origin?: boolean;
    dest?:   boolean;
  }

  interface TrainDef {
    number:     string;
    name:       string;
    priority:   number;
    trainType:  string;
    rakeType:   string;
    maxSpeed:   number;
    direction:  string;
    stops:      StopDef[];
  }

  const trainDefs: TrainDef[] = [
    // ── Priority 1: Vande Bharat Express #22439 (NDLS→LDH)
    {
      number:    "22439",
      name:      "Vande Bharat Express",
      priority:  1,
      trainType: "VANDE_BHARAT",
      rakeType:  "EMU",
      maxSpeed:  160,
      direction: "UP",
      stops: [
        { code: "NDLS", dep: [6,  0],  origin: true },
        { code: "SNP",  arr: [6, 52],  dep: [6, 54]  },
        { code: "PNP",  arr: [7, 22],  dep: [7, 24]  },
        { code: "KKDE", arr: [7, 54],  dep: [7, 56]  },
        { code: "KUN",  arr: [8, 16],  dep: [8, 18]  },
        { code: "UMB",  arr: [8, 42],  dep: [8, 44]  },
        { code: "RPJ",  arr: [9,  4],  dep: [9,  6]  },
        { code: "SIR",  arr: [9, 28],  dep: [9, 30]  },
        { code: "LDH",  arr: [10, 0],  dest: true   },
      ],
    },

    // ── Priority 1: Kalka Shatabdi #12011 (NDLS→UMB/Kalka)
    {
      number:    "12011",
      name:      "Kalka Shatabdi",
      priority:  1,
      trainType: "SHATABDI",
      rakeType:  "LHB",
      maxSpeed:  150,
      direction: "UP",
      stops: [
        { code: "NDLS", dep: [7, 40],  origin: true },
        { code: "SNP",  arr: [8, 28],  dep: [8, 30]  },
        { code: "PNP",  arr: [8, 58],  dep: [9,  0]  },
        { code: "KKDE", arr: [9, 30],  dep: [9, 32]  },
        { code: "KUN",  arr: [9, 52],  dep: [9, 54]  },
        { code: "UMB",  arr: [10, 20], dest: true   },
      ],
    },

    // ── Priority 2: Shan-e-Punjab #12497 (NDLS→LDH)
    {
      number:    "12497",
      name:      "Shan-e-Punjab Express",
      priority:  2,
      trainType: "MAIL_EXPRESS",
      rakeType:  "LHB",
      maxSpeed:  130,
      direction: "UP",
      stops: [
        { code: "NDLS", dep: [19, 30], origin: true },
        { code: "SNP",  arr: [20, 30], dep: [20, 32] },
        { code: "PNP",  arr: [21,  5], dep: [21,  7] },
        { code: "KKDE", arr: [21, 43], dep: [21, 45] },
        { code: "KUN",  arr: [22,  8], dep: [22, 10] },
        { code: "UMB",  arr: [22, 44], dep: [22, 46] },
        { code: "RPJ",  arr: [23, 10], dep: [23, 12] },
        { code: "SIR",  arr: [23, 38], dep: [23, 40] },
        { code: "LDH",  arr: [0,  30], dest: true   },
      ],
    },

    // ── Priority 2: Paschim SF #12925 (NDLS→LDH)
    {
      number:    "12925",
      name:      "Paschim SF Express",
      priority:  2,
      trainType: "MAIL_EXPRESS",
      rakeType:  "LHB",
      maxSpeed:  130,
      direction: "DN",
      stops: [
        { code: "NDLS", dep: [23, 30], origin: true },
        { code: "SNP",  arr: [0,  32], dep: [0, 34]  },
        { code: "PNP",  arr: [1,   8], dep: [1, 10]  },
        { code: "KKDE", arr: [1,  46], dep: [1, 48]  },
        { code: "KUN",  arr: [2,  12], dep: [2, 14]  },
        { code: "UMB",  arr: [2,  48], dep: [2, 50]  },
        { code: "RPJ",  arr: [3,  15], dep: [3, 17]  },
        { code: "SIR",  arr: [3,  44], dep: [3, 46]  },
        { code: "LDH",  arr: [4,  30], dest: true   },
      ],
    },

    // ── Priority 3: Morning MEMU #64563 (Commuter)
    {
      number:    "64563",
      name:      "NDLS-UMB MEMU",
      priority:  3,
      trainType: "MEMU",
      rakeType:  "EMU",
      maxSpeed:  100,
      direction: "UP",
      stops: [
        { code: "NDLS", dep: [5, 45],  origin: true },
        { code: "SNP",  arr: [6, 55],  dep: [6, 57]  },
        { code: "PNP",  arr: [7, 38],  dep: [7, 40]  },
        { code: "KKDE", arr: [8, 26],  dep: [8, 28]  },
        { code: "KUN",  arr: [8, 58],  dep: [9,  0]  },
        { code: "UMB",  arr: [9, 52],  dest: true   },
      ],
    },

    // ── Priority 4: Coal Rake BOXN_01 (Freight)
    {
      number:    "BOXN_01",
      name:      "Coal Rake — NTPC Sirhind",
      priority:  4,
      trainType: "FREIGHT",
      rakeType:  "BOXN",
      maxSpeed:  75,
      direction: "UP",
      stops: [
        { code: "NDLS", dep: [2,  0],  origin: true },
        { code: "PNP",  arr: [4,  0],  dep: [4, 10]  },
        { code: "UMB",  arr: [6, 30],  dep: [6, 40]  },
        { code: "SIR",  arr: [9, 10],  dep: [9, 20]  },
        { code: "LDH",  arr: [11, 45], dest: true   },
      ],
    },

    // ── Priority 4: Container Rake CONCOR_02 (Freight)
    {
      number:    "CONCOR_02",
      name:      "CONCOR Container Rake — LDH ICD",
      priority:  4,
      trainType: "FREIGHT",
      rakeType:  "FLATBED",
      maxSpeed:  75,
      direction: "DN",
      stops: [
        { code: "LDH",  dep: [14,  0], origin: true },
        { code: "SIR",  arr: [16,  30], dep: [16, 40] },
        { code: "RPJ",  arr: [18,  15], dep: [18, 25] },
        { code: "UMB",  arr: [19,  45], dep: [19, 55] },
        { code: "PNP",  arr: [22,  30], dep: [22, 40] },
        { code: "NDLS", arr: [1,   30], dest: true   },
      ],
    },
  ];

  for (const td of trainDefs) {
    const train = await prisma.train.upsert({
      where: { number: td.number },
      update: {},
      create: {
        number:     td.number,
        name:       td.name,
        priority:   td.priority,
        trainType:  td.trainType,
        rakeType:   td.rakeType,
        maxSpeedKmh: td.maxSpeed,
        direction:  td.direction,
        isActive:   true,
        provenance: "AUTHORITATIVE",
      },
    });

    // Delete existing stops before re-seeding
    await prisma.trainStop.deleteMany({ where: { trainId: train.id } });

    for (let i = 0; i < td.stops.length; i++) {
      const s = td.stops[i];
      if (!stationMap[s.code]) {
        console.warn(`    ⚠ Station ${s.code} not found, skipping stop`);
        continue;
      }
      await prisma.trainStop.create({
        data: {
          sequence:     i + 1,
          arrivalMin:   s.arr  ? toMin(s.arr[0],  s.arr[1])  : null,
          departureMin: s.dep  ? toMin(s.dep[0],  s.dep[1])  : null,
          arrivalHHMM:  s.arr  ? hhmm(s.arr[0],  s.arr[1])  : null,
          departureHHMM: s.dep ? hhmm(s.dep[0],  s.dep[1])  : null,
          haltMinutes:  s.arr && s.dep ? toMin(s.dep[0], s.dep[1]) - toMin(s.arr[0], s.arr[1]) : 0,
          isOrigin:     s.origin ?? false,
          isDestination: s.dest ?? false,
          trainId:      train.id,
          stationId:    stationMap[s.code],
        },
      });
    }
    console.log(`  ✔ Train: ${td.number} — ${td.name} (P${td.priority})`);
  }

  // ── Work Orders (TMS / SMMS / TDMS) ─────────────────────────────────────
  // Each WO has real-world asset parameters for ML scoring
  const workOrderDefs = [
    // TMS — Civil/Track Maintenance
    {
      id:          "wo-tms-001",
      department:  "TMS",
      description: "Weld Joint Destressing & Rail Creep Correction — UMB–RPJ",
      kmFrom:      197.0, kmTo: 224.0,
      durationMinutes: 180,
      overdueDays:  45, cumulativeGmt: 280.0, tqiScore: 42.0,
      trackId:     "trk-up",
      requestedDate: new Date("2026-09-08"),
    },
    {
      id:          "wo-tms-002",
      department:  "TMS",
      description: "Ballast Tamping & Profile Correction — PNP–KKDE",
      kmFrom:      90.0, kmTo: 124.0,
      durationMinutes: 240,
      overdueDays:  60, cumulativeGmt: 340.0, tqiScore: 38.0,
      trackId:     "trk-dn",
      requestedDate: new Date("2026-09-08"),
    },
    {
      id:          "wo-tms-003",
      department:  "TMS",
      description: "Level Crossing Gate Renewal — SNP (km 58–63)",
      kmFrom:      58.0, kmTo: 63.0,
      durationMinutes: 120,
      overdueDays:  15, cumulativeGmt: 150.0, tqiScore: 68.0,
      trackId:     "trk-up",
      requestedDate: new Date("2026-09-08"),
    },

    // SMMS — Signalling Maintenance
    {
      id:          "wo-smms-001",
      department:  "SMMS",
      description: "IPS Battery Replacement & Relay Testing — UMB Station",
      kmFrom:      195.0, kmTo: 200.0,
      durationMinutes: 120,
      overdueDays:  30, cumulativeGmt: 0.0, tqiScore: 60.0,
      trackId:     "trk-up",
      requestedDate: new Date("2026-09-08"),
    },
    {
      id:          "wo-smms-002",
      department:  "SMMS",
      description: "UFSBI Optical Fibre Splicing — PNP–KUN Section",
      kmFrom:      90.0, kmTo: 157.0,
      durationMinutes: 150,
      overdueDays:  20, cumulativeGmt: 0.0, tqiScore: 55.0,
      trackId:     "trk-dn",
      requestedDate: new Date("2026-09-08"),
    },

    // TDMS — Traction / OHE Maintenance
    {
      id:          "wo-tdms-001",
      department:  "TDMS",
      description: "OHE Tension & Stagger Check — UMB–RPJ (AT Feeder)",
      kmFrom:      197.0, kmTo: 224.0,
      durationMinutes: 150,
      overdueDays:  35, cumulativeGmt: 0.0, tqiScore: 50.0,
      trackId:     "trk-up",
      requestedDate: new Date("2026-09-08"),
    },
    {
      id:          "wo-tdms-002",
      department:  "TDMS",
      description: "Return Conductor Bond Renewal — SIR–LDH",
      kmFrom:      258.0, kmTo: 312.0,
      durationMinutes: 180,
      overdueDays:  55, cumulativeGmt: 0.0, tqiScore: 44.0,
      trackId:     "trk-dn",
      requestedDate: new Date("2026-09-08"),
    },
    {
      id:          "wo-tdms-003",
      department:  "TDMS",
      description: "Pantograph Inspection & OHE Height Survey — PNP–KKDE",
      kmFrom:      90.0, kmTo: 124.0,
      durationMinutes: 120,
      overdueDays:  25, cumulativeGmt: 0.0, tqiScore: 62.0,
      trackId:     "trk-dn",
      requestedDate: new Date("2026-09-08"),
    },
  ];

  for (const wo of workOrderDefs) {
    await prisma.workOrder.upsert({
      where:  { id: wo.id },
      update: {},
      create: {
        id:               wo.id,
        department:       wo.department,
        description:      wo.description,
        kmFrom:           wo.kmFrom,
        kmTo:             wo.kmTo,
        durationMinutes:  wo.durationMinutes,
        overdueDays:      wo.overdueDays,
        cumulativeGmt:    wo.cumulativeGmt,
        tqiScore:         wo.tqiScore,
        trackId:          wo.trackId,
        requestedDate:    wo.requestedDate,
        provenance:       "LIVE",
        status:           "PENDING",
      },
    });
    console.log(`  ✔ WorkOrder: [${wo.department}] ${wo.description.substring(0, 40)}…`);
  }

  // ── Digital Twin Knowledge Graph Assets ─────────────────────────────────
  console.log("\n🌐 Seeding Digital Twin Knowledge Graph Assets & Dependencies…");

  const assetDefs = [
    // Crossovers enabling Single-Line Working (SLW)
    { code: "XOVER-NDLS-01", name: "NDLS Diamond Scissors Crossover", assetType: "CROSSOVER", kmFrom: 0.0, kmTo: 0.5, trackId: "BOTH", metadata: JSON.stringify({ speedLimitKmh: 30, pointMachine: "IRS-50" }) },
    { code: "XOVER-SNP-01",  name: "SNP Universal Crossover #102",    assetType: "CROSSOVER", kmFrom: 60.8, kmTo: 61.2, trackId: "BOTH", metadata: JSON.stringify({ speedLimitKmh: 50, pointMachine: "IRS-50" }) },
    { code: "XOVER-PNP-01",  name: "PNP Jn Fast Turnout Crossover",   assetType: "CROSSOVER", kmFrom: 89.5, kmTo: 90.2, trackId: "BOTH", metadata: JSON.stringify({ speedLimitKmh: 50, pointMachine: "IRS-50" }) },
    { code: "XOVER-KKDE-01", name: "KKDE Trailing Crossover #4",      assetType: "CROSSOVER", kmFrom: 123.6, kmTo: 124.2, trackId: "BOTH", metadata: JSON.stringify({ speedLimitKmh: 30, pointMachine: "IRS-50" }) },
    { code: "XOVER-KUN-01",  name: "KUN Station Crossover #7",        assetType: "CROSSOVER", kmFrom: 156.7, kmTo: 157.3, trackId: "BOTH", metadata: JSON.stringify({ speedLimitKmh: 30, pointMachine: "IRS-50" }) },
    { code: "XOVER-UMB-01",  name: "UMB Interlocking Junction Crossover", assetType: "CROSSOVER", kmFrom: 196.5, kmTo: 197.5, trackId: "BOTH", metadata: JSON.stringify({ speedLimitKmh: 50, pointMachine: "M90" }) },
    { code: "XOVER-RPJ-01",  name: "RPJ Trailing Crossover #12",      assetType: "CROSSOVER", kmFrom: 223.7, kmTo: 224.3, trackId: "BOTH", metadata: JSON.stringify({ speedLimitKmh: 30, pointMachine: "IRS-50" }) },
    { code: "XOVER-SIR-01",  name: "SIR Loop Line Turnout #3",        assetType: "CROSSOVER", kmFrom: 257.6, kmTo: 258.4, trackId: "BOTH", metadata: JSON.stringify({ speedLimitKmh: 30, pointMachine: "IRS-50" }) },
    { code: "XOVER-LDH-01",  name: "LDH South Yard Crossover #1",     assetType: "CROSSOVER", kmFrom: 311.2, kmTo: 312.0, trackId: "BOTH", metadata: JSON.stringify({ speedLimitKmh: 30, pointMachine: "IRS-50" }) },

    // Signalling Assets (SMMS)
    { code: "SIG-UMB-42",    name: "UMB Up Advanced Starter Signal #42", assetType: "SIGNAL", kmFrom: 197.0, kmTo: 197.2, trackId: "UP", metadata: JSON.stringify({ aspect: "4-ASPECT", lampType: "LED", interlocking: "EI-SIEMENS" }) },
    { code: "SIG-PNP-18",    name: "PNP Automatic Block Signal #18",     assetType: "SIGNAL", kmFrom: 90.5, kmTo: 90.7, trackId: "DN", metadata: JSON.stringify({ aspect: "4-ASPECT", lampType: "LED", interlocking: "EI-KYOSAN" }) },
    { code: "SIG-SNP-04",    name: "SNP Down Home Signal #04",           assetType: "SIGNAL", kmFrom: 60.5, kmTo: 60.7, trackId: "DN", metadata: JSON.stringify({ aspect: "3-ASPECT", lampType: "LED" }) },

    // Traction OHE Feeder Sections & Switching Posts (TRD)
    { code: "OHE-TSS-UMB",   name: "UMB 25kV Traction Substation & SP",  assetType: "OHE_FEEDER", kmFrom: 195.0, kmTo: 225.0, trackId: "BOTH", metadata: JSON.stringify({ voltageKV: 25, currentRatingAmps: 600, isolatorCode: "ISO-UMB-201" }) },
    { code: "OHE-TSS-PNP",   name: "PNP 25kV Feeder Section & SSP",      assetType: "OHE_FEEDER", kmFrom: 88.0, kmTo: 126.0, trackId: "BOTH", metadata: JSON.stringify({ voltageKV: 25, currentRatingAmps: 600, isolatorCode: "ISO-PNP-104" }) },
    { code: "OHE-TSS-SIR",   name: "SIR 25kV Sectioning Post",           assetType: "OHE_FEEDER", kmFrom: 255.0, kmTo: 312.0, trackId: "BOTH", metadata: JSON.stringify({ voltageKV: 25, currentRatingAmps: 600, isolatorCode: "ISO-SIR-305" }) },
  ];

  const createdAssets: Record<string, string> = {};
  for (const a of assetDefs) {
    const res = await prisma.assetNode.upsert({
      where: { assetCode: a.code },
      update: {},
      create: {
        assetCode: a.code,
        name: a.name,
        assetType: a.assetType,
        kmFrom: a.kmFrom,
        kmTo: a.kmTo,
        trackId: a.trackId,
        metadata: a.metadata,
      },
    });
    createdAssets[a.code] = res.id;
    console.log(`  ✔ AssetNode: [${a.assetType}] ${a.code} — ${a.name} (${a.kmFrom} km)`);
  }

  // Cross-Asset Dependencies (Digital Twin Edges)
  await prisma.assetDependency.deleteMany({});
  const depDefs = [
    {
      source: "SIG-UMB-42",
      target: "OHE-TSS-UMB",
      type: "ELECTRICAL_ISOLATION",
      desc: "Repairing UMB Signal gantry/cables at km 197.0 requires 25kV OHE power block & isolation on OHE-TSS-UMB feeder (km 195–225).",
    },
    {
      source: "XOVER-UMB-01",
      target: "XOVER-RPJ-01",
      type: "SLW_CROSSOVER",
      desc: "Single-Line Working (SLW) corridor between UMB (km 196.5) and RPJ (km 223.7) over DN line when UP line undergoes block.",
    },
    {
      source: "SIG-PNP-18",
      target: "OHE-TSS-PNP",
      type: "ELECTRICAL_ISOLATION",
      desc: "UFSBI optical fiber splicing & signal renewal at PNP km 90.5 requires adjacent line OHE neutral sectioning.",
    },
    {
      source: "XOVER-PNP-01",
      target: "XOVER-KKDE-01",
      type: "SLW_CROSSOVER",
      desc: "Single-Line Working pairing from Panipat to Karnal/Kurukshetra for opposing traffic deflection.",
    },
  ];

  for (const d of depDefs) {
    if (createdAssets[d.source] && createdAssets[d.target]) {
      await prisma.assetDependency.create({
        data: {
          sourceAssetId: createdAssets[d.source],
          targetAssetId: createdAssets[d.target],
          dependencyType: d.type,
          description: d.desc,
        },
      });
      console.log(`  ✔ Dependency: ${d.source} ──(${d.type})──► ${d.target}`);
    }
  }

  console.log("\n✅ Database seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

