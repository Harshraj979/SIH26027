"use client";

import React, { useState } from "react";
import type { WorkOrder } from "@/types";

interface Props {
  workOrders: WorkOrder[];
  onAddWorkOrder: (wo: Partial<WorkOrder>) => void;
  onDirectToCOA: () => void;
}

const TDMS_SSR_OPTIONS = [
  {
    code: "TDMS-SSR-01",
    name: "Broken overhead 25kV composite insulator replacement",
    standardMinutes: 30,
    severity: "Critical",
    defaultPrio: 1,
    defaultRisk: 88.5,
    desc: "De-energize 25kV OHE, earth line, replace flashed-over silicone insulator.",
  },
  {
    code: "TDMS-SSR-02",
    name: "Catenary & contact wire dropper tension adjustment",
    standardMinutes: 60,
    severity: "Major",
    defaultPrio: 2,
    defaultRisk: 74.0,
    desc: "Tower wagon hoist, adjust auto-tensioning device (ATD) weights and dropper spacing.",
  },
  {
    code: "TDMS-SSR-03",
    name: "25kV sub-station feeder cable splice & jointing",
    standardMinutes: 90,
    severity: "Critical",
    defaultPrio: 1,
    defaultRisk: 92.0,
    desc: "Cut faulty underground XLPE feeder, execute heat-shrinkable high-voltage joint kit.",
  },
  {
    code: "TDMS-SSR-04",
    name: "Traction mast cantilever & bracket realignment",
    standardMinutes: 45,
    severity: "Major",
    defaultPrio: 2,
    defaultRisk: 68.0,
    desc: "Correct stagger and height of contact wire assembly using 8-wheeler tower wagon.",
  },
  {
    code: "TDMS-SSR-05",
    name: "Traction Substation (TSS) isolator overhaul",
    standardMinutes: 40,
    severity: "Major",
    defaultPrio: 2,
    defaultRisk: 60.0,
    desc: "Inspect and clean high-voltage motorized sectioning isolator contacts.",
  },
  {
    code: "TDMS-SSR-06",
    name: "Rust removal & anti-corrosion painting on OHE pole mast",
    standardMinutes: 40,
    severity: "Minor",
    defaultPrio: 3,
    defaultRisk: 18.0,
    desc: "Brush off superficial rust and apply zinc-chromate primer and aluminium paint.",
  },
];

const SECTIONS = [
  { id: "NDLS-SNP", name: "New Delhi – Sonipat", kmStart: 0, kmEnd: 61 },
  { id: "SNP-PNP",  name: "Sonipat – Panipat Jn", kmStart: 61, kmEnd: 90 },
  { id: "PNP-KKDE", name: "Panipat – Karnal", kmStart: 90, kmEnd: 124 },
  { id: "KKDE-KUN", name: "Karnal – Kurukshetra", kmStart: 124, kmEnd: 157 },
  { id: "KUN-UMB",  name: "Kurukshetra – Ambala Cantt", kmStart: 157, kmEnd: 197 },
  { id: "UMB-RPJ",  name: "Ambala Cantt – Rajpura", kmStart: 197, kmEnd: 224 },
  { id: "RPJ-SIR",  name: "Rajpura – Sirhind", kmStart: 224, kmEnd: 258 },
  { id: "SIR-LDH",  name: "Sirhind – Ludhiana Jn", kmStart: 258, kmEnd: 312 },
];

export default function TDMSPortalView({
  workOrders,
  onAddWorkOrder,
  onDirectToCOA,
}: Props) {
  const tdmsOrders = workOrders.filter((w) => w.department === "TDMS");
  const criticalCount = tdmsOrders.filter((w) => w.priority === 1 || (w.assetRisk ?? 0) >= 90).length;

  const [selectedSSR, setSelectedSSR] = useState(TDMS_SSR_OPTIONS[0]);
  const [selectedSection, setSelectedSection] = useState(SECTIONS[0]);
  const [lineId, setLineId] = useState("UP_FAST");
  const [kmMarker, setKmMarker] = useState("14.4");
  const [mastMarker, setMastMarker] = useState("16-18");
  const [description, setDescription] = useState("Silicone insulator flashed over; micro-cracks on shed skirt");
  const [overdueDays, setOverdueDays] = useState("2");
  const [ptwSector, setPtwSector] = useState("OHE-TSS-PNP (Substation Feeder 25kV)");
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const kmNum = parseFloat(kmMarker) || 14.0;
  const depotKm = kmNum <= 45 ? 0.0 : kmNum <= 140 ? 90.0 : kmNum <= 250 ? 197.0 : 312.0;
  const depotName = kmNum <= 45 ? "New Delhi Yard Depot (KM 0.0)" :
    kmNum <= 140 ? "Panipat Jn Depot (KM 90.0)" :
    kmNum <= 250 ? "Ambala Cantt Depot (KM 197.0)" : "Ludhiana Jn Yard (KM 312.0)";
  const dist = Math.abs(kmNum - depotKm);
  const transitMin = dist <= 2.0 ? 5 : Math.round((dist / 30.0) * 60);

  const isCritical = selectedSSR.severity === "Critical";
  const isRoutine = selectedSSR.code === "TDMS-SSR-06"; // Rusting on pole
  const previewRisk = isRoutine
    ? 18.0
    : isCritical
    ? Math.min(95.0, 88.0 + 1.0 * parseInt(overdueDays || "0"))
    : Math.min(80.0, selectedSSR.defaultRisk + 0.5 * parseInt(overdueDays || "0"));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const kmFrom = kmNum;
    const kmTo = Math.round((kmFrom + 0.2) * 10) / 10;
    const isOverride = previewRisk >= 90.0;

    onAddWorkOrder({
      department: "TDMS",
      description: `[TDMS] ${selectedSSR.name} (${description})`,
      kmFrom,
      kmTo,
      durationMinutes: selectedSSR.standardMinutes,
      priority: selectedSSR.defaultPrio,
      overdueDays: parseInt(overdueDays || "0"),
      trackId: lineId,
      lineId: lineId,
      defectType: selectedSSR.code === "TDMS-SSR-06" ? "POLE_RUST" : "OHE_INSULATOR_BROKEN",
      ssrTaskCode: selectedSSR.code,
      ssrStandardMin: selectedSSR.standardMinutes,
      aiAdjustedMin: selectedSSR.standardMinutes + transitMin,
      nearestDepot: depotName,
      transitMinutes: transitMin,
      hardSafetyOverride: isOverride,
      kpMarker: `Section: ${selectedSection.id} | Line: ${lineId} | Mast: ${mastMarker}`,
      horizonType: previewRisk >= 70 ? "WEEKLY" : "MONTHLY",
      assetRisk: previewRisk,
      explanation: `Power Block (PTW) requested on ${ptwSector}.`,
    });

    setSubmittedMessage(
      `Traction Requisition logged for ${selectedSSR.name} at KM ${kmNum.toFixed(1)} (${lineId}). Routed to COA Central Administrator!`
    );
    setTimeout(() => setSubmittedMessage(null), 6000);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-950 to-rose-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">⚡</span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-800/80 text-rose-200 border border-rose-700">
              IR-RBAC • 25kV OHE Traction Portal
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight">
            Traction Distribution Management System (TDMS) • OHE Console
          </h2>
          <p className="text-xs text-rose-100/80 mt-1 max-w-2xl">
            Section Officer: <strong>Er. Mann Butani, DEE / TRD Traction (Delhi Division)</strong> • 25kV Catenary, Tower Wagons &amp; Power Block Clearances (PTW)
          </p>
        </div>

        <button
          onClick={onDirectToCOA}
          className="bg-rose-100 hover:bg-white text-rose-950 text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap self-start md:self-auto"
        >
          View Central COA Decision Engine &rarr;
        </button>
      </div>

      {submittedMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <span>✓ {submittedMessage}</span>
          <button onClick={() => setSubmittedMessage(null)} className="text-emerald-700 font-bold">✕</button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[10.5px] uppercase font-bold text-slate-500">Active OHE Demands</p>
          <p className="text-2xl font-black text-rose-900 mt-1">{tdmsOrders.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Traction Distribution Logs</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[10.5px] uppercase font-bold text-slate-500">Critical Flashovers</p>
          <p className="text-2xl font-black text-rose-700 mt-1">{criticalCount}</p>
          <p className="text-[11px] text-rose-600 font-medium mt-0.5">High Derailment/PTW Hazard</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[10.5px] uppercase font-bold text-slate-500">Tower Wagons Active</p>
          <p className="text-2xl font-black text-slate-800 mt-1">2 Units</p>
          <p className="text-[11px] text-slate-500 mt-0.5">RU-04 &amp; 8-Wheeler Wagon</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[10.5px] uppercase font-bold text-slate-500">25kV Substation Status</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">All Energized</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-0.5">UMB, PNP, SIR Normal</p>
        </div>
      </div>

      {/* Interactive Logging Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span>⚡</span> Traction Requisition &amp; Power Block (PTW) Generator
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Standardized insulator replacement, catenary tensioning, and mast anti-corrosion metrics
            </p>
          </div>
          <span className="text-xs font-bold text-rose-800 bg-rose-100/60 px-2.5 py-1 rounded-full border border-rose-300">
            TRD SSR Active
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Step 1: Select SSR Rate */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              1. Select Traction Maintenance Task (Indian Railways SSR Rates)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {TDMS_SSR_OPTIONS.map((opt) => {
                const isSel = selectedSSR.code === opt.code;
                return (
                  <button
                    type="button"
                    key={opt.code}
                    onClick={() => setSelectedSSR(opt)}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSel
                        ? "bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20 shadow-xs"
                        : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-100/80 px-1.5 py-0.2 rounded">
                          {opt.code}
                        </span>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                          opt.severity === "Critical" ? "bg-rose-100 text-rose-800" :
                          opt.severity === "Major" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                        }`}>
                          {opt.severity}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">{opt.name}</p>
                      <p className="text-[10.5px] text-slate-500 mt-1 line-clamp-2">{opt.desc}</p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-700">
                      <span>Standard SSR Duration:</span>
                      <span className="font-bold text-[#000075]">{opt.standardMinutes} min</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location & Multi-Track */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                2. Railway Section
              </label>
              <select
                value={selectedSection.id}
                onChange={(e) => {
                  const s = SECTIONS.find((x) => x.id === e.target.value);
                  if (s) setSelectedSection(s);
                }}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800"
              >
                {SECTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} — {s.name} ({s.kmStart}–{s.kmEnd} km)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Line Identification
              </label>
              <select
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800"
              >
                <option value="UP_FAST">UP_FAST (Main Express Track - 160 km/h)</option>
                <option value="DN_FAST">DN_FAST (Main Express Track - 160 km/h)</option>
                <option value="UP_SLOW">UP_SLOW (Commuter &amp; Freight - 110 km/h)</option>
                <option value="DN_SLOW">DN_SLOW (Commuter &amp; Freight - 110 km/h)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Kilometer &amp; Traction Mast Marker
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={kmMarker}
                  onChange={(e) => setKmMarker(e.target.value)}
                  placeholder="KM (e.g. 14.4)"
                  className="w-1/2 text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-800"
                />
                <input
                  type="text"
                  value={mastMarker}
                  onChange={(e) => setMastMarker(e.target.value)}
                  placeholder="Mast (e.g. 16-18)"
                  className="w-1/2 text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Description & Power Block Isolation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                OHE Catenary Condition &amp; Defect Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Power Block (PTW) Sector
              </label>
              <input
                type="text"
                value={ptwSector}
                onChange={(e) => setPtwSector(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800"
              />
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-rose-50/40 border border-rose-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <p className="font-bold text-slate-900">
                TRD AI Pipeline Live Preview:
              </p>
              <p className="text-slate-600">
                Nearest Base: <strong>{depotName}</strong> ({dist.toFixed(1)} km away $\rightarrow$ +{transitMin} min tower wagon transit)
              </p>
              <p className="text-slate-600">
                Standard Time: <strong>{selectedSSR.standardMinutes} min</strong> • Priority Classification: {isRoutine ? "Routine Maintenance (Monthly)" : "Urgent Corridor Work (Weekly)"}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-500">Calculated Priority Score</p>
                <p className={`text-xl font-black ${previewRisk >= 85 ? "text-rose-700" : previewRisk >= 50 ? "text-amber-700" : "text-emerald-700"}`}>
                  {previewRisk.toFixed(1)} / 100
                </p>
                {isRoutine ? (
                  <span className="text-[9px] font-bold uppercase text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                    Routine Low Priority
                  </span>
                ) : (
                  <span className="text-[9px] font-bold uppercase text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                    High Operational Priority
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="px-5 py-3 bg-[#000075] hover:bg-[#00005a] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                Forward to Central COA Pipeline &rarr;
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Active TDMS Demands */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Registered Traction &amp; OHE Demands ({tdmsOrders.length})
          </h3>
          <span className="text-[11px] text-slate-500">Synchronized with Central COA Repository</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="py-2.5 px-4">ID &amp; Task Code</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4">LRS Mast Marker</th>
                <th className="py-2.5 px-4">Standard Rate</th>
                <th className="py-2.5 px-4">Priority Score</th>
                <th className="py-2.5 px-4">COA Scheduling Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tdmsOrders.slice(0, 15).map((wo) => (
                <tr key={wo.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#000075]">
                    {wo.id}
                    <span className="block text-[10px] text-slate-400 font-normal">{wo.ssrTaskCode ?? "TDMS-SSR-01"}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 max-w-xs truncate">
                    {wo.description}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                    <span className="font-bold text-slate-800">{wo.lineId ?? "UP_FAST"}</span>
                    <span className="block text-[10px] text-slate-400">{wo.kpMarker ?? `KM ${wo.kmFrom.toFixed(1)}`}</span>
                  </td>
                  <td className="py-3 px-4 tabular-nums font-semibold text-slate-700">
                    {wo.durationMinutes} min
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-black tabular-nums px-2 py-0.5 rounded border ${
                      (wo.assetRisk ?? 0) >= 80
                        ? "bg-rose-100 text-rose-800 border-rose-300"
                        : (wo.assetRisk ?? 0) >= 50
                        ? "bg-amber-100 text-amber-800 border-amber-300"
                        : "bg-emerald-100 text-emerald-800 border-emerald-300"
                    }`}>
                      {(wo.assetRisk ?? 50).toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      wo.status === "SCHEDULED" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}>
                      {wo.status === "SCHEDULED" ? "✓ Scheduled in COA" : "⏳ Pending COA Solve"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
