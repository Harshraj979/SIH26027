/**
 * RailBlock AI — Database Seed Script
 * Populates: NDLS→LDH Northern Railway Corridor, Real Timetable Data,
 * Rolling Stock, and representative Work Orders across TMS/SMMS/TDMS.
 *
 * Run: npx tsx prisma/seed.ts
 */

import fs from "fs";
import path from "path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || "file:./dev.db" });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

// ─── CSV PARSER & SECTION MAPPINGS ───────────────────────────────────────────
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const matches: string[] = [];
    let match: RegExpExecArray | null;
    const re = /(?:^|,)(\"(?:[^\"]+|\"\")*\"|[^,]*)/g;
    while ((match = re.exec(line)) !== null) {
      let val = match[1];
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1).replace(/""/g, '"');
      }
      matches.push(val.trim());
    }
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = matches[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

const SECTION_BASES: Record<string, { baseKm: number; lenKm: number; name: string }> = {
  SEC005: { baseKm: 37.0,  lenKm: 37.0, name: "Delhi-Panipat" },
  SEC006: { baseKm: 15.0,  lenKm: 35.0, name: "Delhi-Rewari Feeder" },
  SEC010: { baseKm: 45.0,  lenKm: 25.0, name: "Ghaziabad Feeder" },
  SEC007: { baseKm: 70.0,  lenKm: 20.0, name: "Panipat South" },
  SEC008: { baseKm: 90.0,  lenKm: 34.0, name: "Panipat-Karnal" },
  SEC012: { baseKm: 124.0, lenKm: 33.0, name: "Karnal-Kurukshetra" },
  SEC001: { baseKm: 157.0, lenKm: 40.0, name: "Kurukshetra-Ambala" },
  SEC002: { baseKm: 197.0, lenKm: 27.0, name: "Ambala-Rajpura" },
  SEC009: { baseKm: 224.0, lenKm: 34.0, name: "Rajpura-Sirhind" },
  SEC003: { baseKm: 258.0, lenKm: 25.0, name: "Sirhind-Khanna" },
  SEC004: { baseKm: 283.0, lenKm: 20.0, name: "Khanna-Ludhiana Outer" },
  SEC011: { baseKm: 300.0, lenKm: 12.0, name: "Ludhiana Jn Yard" },
};

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}



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

  // ── Work Orders from Trained Defects Dataset ─────────────────────────────
  console.log("\n📦 Loading 181 Maintenance Defects from Data training…");
  const dataDir = path.resolve(process.cwd(), "Data training");

  // Read scored defects map
  const scoredPath = path.join(dataDir, "scored_defects.csv");
  const scoredMap: Record<string, { priority_score: string; explanation: string }> = {};
  if (fs.existsSync(scoredPath)) {
    const scoredRows = parseCSV(fs.readFileSync(scoredPath, "utf8"));
    for (const r of scoredRows) {
      scoredMap[r.defect_id] = {
        priority_score: r.priority_score,
        explanation: r.explanation,
      };
    }
  }

  // Clear old scheduled blocks and work orders
  await prisma.scheduledBlock.deleteMany({});
  await prisma.workOrder.deleteMany({});

  const defectsPath = path.join(dataDir, "4_defects_maintenance.csv");
  let seededWOCount = 0;

  if (fs.existsSync(defectsPath)) {
    const defectRows = parseCSV(fs.readFileSync(defectsPath, "utf8"));

    for (let idx = 0; idx < defectRows.length; idx++) {
      const row = defectRows[idx];
      const sec = SECTION_BASES[row.section_id] ?? { baseKm: 60.0, lenKm: 30.0, name: row.section_id };
      const rawKm = parseFloat(row.km_point) || 10.0;
      const kmOffset = Math.abs(rawKm % sec.lenKm);
      const kmFrom = Math.round(Math.min(308.0, Math.max(2.0, sec.baseKm + kmOffset)) * 10) / 10;
      const repairHours = parseFloat(row.estimated_repair_hours) || 2.0;
      const kmTo = Math.min(312.0, Math.round((kmFrom + Math.max(0.8, Math.min(3.0, repairHours * 0.4))) * 10) / 10);
      const durationMinutes = Math.max(60, Math.min(300, Math.round(repairHours * 60)));
      const department = row.source_system === "TMS" ? "TMS" : row.source_system === "SMMS" ? "SMMS" : "TDMS";
      const priority = row.severity === "Critical" ? 1 : row.severity === "Major" ? 2 : 3;
      const status = row.status === "Resolved" ? "COMPLETED" : row.status === "Scheduled" ? "SCHEDULED" : "PENDING";
      const overdueDays = parseInt(row.overdue_days) || 0;
      const scoredInfo = scoredMap[row.defect_id];
      const assetRisk = scoredInfo ? parseFloat(scoredInfo.priority_score) : (priority === 1 ? 92.0 : priority === 2 ? 74.0 : 45.0);
      const penaltyWeight = Math.round(100 + 99 * assetRisk);
      const trackId = idx % 2 === 0 ? upTrack.id : dnTrack.id;

      await prisma.workOrder.create({
        data: {
          id:               row.defect_id,
          department:       department as "TMS" | "SMMS" | "TDMS",
          description:      `[${row.defect_id}] ${row.severity} — ${row.defect_type} (${sec.name})`,
          kmFrom:           kmFrom,
          kmTo:             kmTo,
          durationMinutes:  durationMinutes,
          priority:         priority,
          overdueDays:      overdueDays,
          cumulativeGmt:    Math.round((120.0 + (idx * 3.7) % 250) * 10) / 10,
          tqiScore:         priority === 1 ? 38.0 : priority === 2 ? 56.0 : 75.0,
          assetRisk:        round1(assetRisk),
          penaltyWeight:    penaltyWeight,
          trackId:          trackId,
          requestedDate:    new Date(row.date_reported || "2026-09-08"),
          provenance:       "LIVE",
          status:           status,
        },
      });
      seededWOCount++;
    }
  }
  console.log(`  ✔ Seeded ${seededWOCount} authentic Work Orders from Data training`);

  // ── Operational Events from Data training (9_disruption_events.csv) ──────
  console.log("\n⚡ Loading 12 Operational Events from Data training…");
  await prisma.operationalEvent.deleteMany({});
  const eventsPath = path.join(dataDir, "9_disruption_events.csv");
  let seededEventCount = 0;

  if (fs.existsSync(eventsPath)) {
    const eventRows = parseCSV(fs.readFileSync(eventsPath, "utf8"));
    const eventTypeMap: Record<string, string> = {
      "VIP Train Movement (Block Cancelled)": "VIP_MOVEMENT",
      "Weather Alert Issued": "WEATHER_MONSOON",
      "Emergency Speed Restriction Imposed": "SPEED_RESTRICTION",
      "Machine Breakdown": "MACHINE_BREAKDOWN",
      "Goods Train Rescheduled": "GOODS_RESCHEDULE",
      "New Critical Defect Reported": "RAIL_FRACTURE",
      "Crew Shortage": "CREW_SHORTAGE",
    };

    for (const ev of eventRows) {
      const sec = SECTION_BASES[ev.section_id] ?? { baseKm: 100.0, lenKm: 30.0, name: ev.section_id };
      const kmFrom = sec.baseKm;
      const kmTo = Math.min(312.0, sec.baseKm + sec.lenKm);
      const isCrit = ev.event_type.includes("Critical") || ev.event_type.includes("VIP");
      const isWarn = ev.event_type.includes("Weather") || ev.event_type.includes("Speed") || ev.event_type.includes("Breakdown");
      const severity = isCrit ? "CRITICAL" : isWarn ? "CAUTION" : "INFO";

      await prisma.operationalEvent.create({
        data: {
          id:             ev.event_id,
          eventType:      eventTypeMap[ev.event_type] ?? "DELAY",
          description:    `[${ev.section_id} ${ev.division}] ${ev.event_type}: ${ev.description}`,
          severity:       severity,
          kmFrom:         kmFrom,
          kmTo:           kmTo,
          delayMinutes:   isCrit ? 45 : isWarn ? 30 : 15,
          affectedTrains: JSON.stringify(["22439", "12011", "12497"]),
          isActive:       true,
          provenance:     "LIVE",
        },
      });
      seededEventCount++;
    }
  }
  console.log(`  ✔ Seeded ${seededEventCount} Operational Events from Data training`);

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

  // ── Seed Demo RBAC User Accounts ──────────────────────────────────────────
  console.log("\n👤 Seeding RBAC Demo User Accounts…");
  const demoUsers = [
    { employeeId: "ADMIN001", name: "Rajesh Kumar", role: "SYSTEM_ADMIN", designation: "Chief Operations Manager", division: "DLI" },
    { employeeId: "DRM001",   name: "Priya Sharma", role: "DRM", designation: "Divisional Railway Manager — Delhi", division: "DLI" },
    { employeeId: "OBS001",   name: "Arjun Singh",  role: "OBSERVER", designation: "External Stakeholder / Auditor", division: "NR" },
  ];

  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { employeeId: u.employeeId },
      update: {},
      create: {
        employeeId:   u.employeeId,
        name:         u.name,
        role:         u.role,
        designation:  u.designation,
        division:     u.division,
        passwordHash: "demo",
        isActive:     true,
      },
    });
    console.log(`  ✔ User: [${u.role}] ${u.employeeId} — ${u.name}`);
  }

  console.log("\n✅ Database seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

