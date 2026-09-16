"use client";

import React, { useState } from "react";
import type { WorkOrder } from "@/types";

interface Props {
  workOrders: WorkOrder[];
  onAddWorkOrder: (wo: Partial<WorkOrder>) => void;
  onDirectToCOA?: () => void;
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
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5 text-slate-800">
      
      {/* ── 1. Header Banner ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-rose-950 via-red-950 to-rose-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-rose-900/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xl">⚡</span>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-800/70 text-rose-200 border border-rose-700/60">
              IR-RBAC • 25kV OHE Traction Portal
            </span>
            <span className="text-[10px] text-rose-200/70 font-mono">
              Role: SR_DEE_TRD
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight">
            Traction Distribution Management System (TDMS) • OHE Console
          </h2>
          <p className="text-xs text-rose-100/80 mt-1 max-w-2xl font-medium">
            Section Officer: <strong className="text-white">Er. Mann Butani, DEE / TRD Traction (Delhi Division)</strong> • 25kV Catenary, Tower Wagons &amp; Power Block Clearances (PTW)
          </p>
        </div>

        <div className="bg-rose-900/60 border border-rose-400/40 text-rose-100 text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs whitespace-nowrap self-start md:self-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>TDMS Field Console Active</span>
        </div>
      </div>

      {submittedMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="text-base">✓</span>
            <span>{submittedMessage}</span>
          </div>
          <button onClick={() => setSubmittedMessage(null)} className="text-emerald-700 font-bold hover:text-emerald-900">✕</button>
        </div>
      )}

      {/* ── 2. Metrics Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active OHE Demands</p>
          <p className="text-2xl font-black text-rose-900 mt-0.5">{tdmsOrders.length}</p>
          <p className="text-[11px] text-slate-500 font-medium">Traction Distribution Logs</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Critical Flashovers</p>
          <p className="text-2xl font-black text-rose-700 mt-0.5">{criticalCount}</p>
          <p className="text-[11px] text-rose-600 font-medium">High Derailment/PTW Hazard</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tower Wagons Active</p>
          <p className="text-2xl font-black text-slate-800 mt-0.5">2 Units</p>
          <p className="text-[11px] text-slate-500 font-medium">RU-04 &amp; 8-Wheeler Wagon</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">25kV Substation Status</p>
          <p className="text-2xl font-black text-emerald-700 mt-0.5">All Energized</p>
          <p className="text-[11px] text-emerald-700 font-medium">UMB, PNP, SIR Normal</p>
        </div>
      </div>

      {/* ── 3. Ergonomic Two-Column Requisition Console ────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span>⚡</span> Submit Traction / OHE Request
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Select fault type and location — the AI automatically calculates power block duration &amp; priority score
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-900 bg-emerald-100/70 px-2.5 py-1 rounded-full border border-emerald-300">
            AI Scoring Active
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ── LEFT COLUMN: Traction Task Catalog (5 Cols) ──────────────── */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  1. Standard Maintenance Task (SSR)
                </label>
                <span className="text-[10.5px] text-slate-500 font-medium">6 IR Standards</span>
              </div>

              {/* Compact Task List */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {TDMS_SSR_OPTIONS.map((opt) => {
                  const isSel = selectedSSR.code === opt.code;
                  return (
                    <div
                      key={opt.code}
                      onClick={() => setSelectedSSR(opt)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSel
                          ? "bg-rose-50/90 border-rose-500 ring-2 ring-rose-500/20 shadow-xs"
                          : "bg-slate-50/60 border-slate-200 hover:bg-slate-100/60"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-mono font-bold text-rose-900 bg-rose-100 px-1.5 py-0.2 rounded">
                            {opt.code}
                          </span>
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                            opt.severity === "Critical" ? "bg-rose-100 text-rose-800" :
                            opt.severity === "Major" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                          }`}>
                            {opt.severity}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 truncate">{opt.name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-[#000075] tabular-nums">{opt.standardMinutes}m</span>
                        <span className="block text-[9px] text-slate-500 font-medium">Standard</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Task Specification Card */}
              <div className="p-3 bg-rose-50/40 rounded-xl border border-rose-200/80 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-rose-900">Task Scope Spec:</span>
                  <span className="text-[10px] font-mono font-bold text-rose-800">{selectedSSR.code}</span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium leading-relaxed">{selectedSSR.desc}</p>
                <div className="pt-1.5 border-t border-rose-200/60 flex items-center justify-between text-[10.5px] text-slate-600 font-semibold">
                  <span>Standard Duration: <strong className="text-[#000075]">{selectedSSR.standardMinutes} min</strong></span>
                  <span>Default Priority: <strong className="text-slate-800">P{selectedSSR.defaultPrio}</strong></span>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Location, Parameters & AI Dispatch (7 Cols) ─── */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Location &amp; Power Block Parameters
              </label>

              {/* Section & Line Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Railway Section (LRS Span)
                  </label>
                  <select
                    value={selectedSection.id}
                    onChange={(e) => {
                      const s = SECTIONS.find((x) => x.id === e.target.value);
                      if (s) setSelectedSection(s);
                    }}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                  >
                    {SECTIONS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id} — {s.name} ({s.kmStart}–{s.kmEnd} km)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Track Identification
                  </label>
                  <select
                    value={lineId}
                    onChange={(e) => setLineId(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="UP_FAST">UP_FAST (Main Express Track - 160 km/h)</option>
                    <option value="DN_FAST">DN_FAST (Main Express Track - 160 km/h)</option>
                    <option value="UP_SLOW">UP_SLOW (Commuter &amp; Freight - 110 km/h)</option>
                    <option value="DN_SLOW">DN_SLOW (Commuter &amp; Freight - 110 km/h)</option>
                  </select>
                </div>
              </div>

              {/* KM Post only */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kilometre Post (KM)
                </label>
                <input
                  type="text"
                  value={kmMarker}
                  onChange={(e) => setKmMarker(e.target.value)}
                  placeholder="e.g. 14.4"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                />
              </div>

              {/* Description only */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  OHE Defect Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the overhead wire or insulator defect observed..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                />
              </div>

              {/* Live AI Sizing & Dispatch Card */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-50 via-rose-50/30 to-rose-50/60 border border-rose-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                    <span className="font-bold text-slate-900 text-xs">TRD Dynamic AI Sizing:</span>
                    <span className="text-[11px] text-slate-600">
                      Nearest Base: <strong>{depotName.split("(")[0]}</strong> (+{transitMin}m tower wagon transit)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Window Required: <strong>{selectedSSR.standardMinutes}m</strong> SSR + <strong>{transitMin}m</strong> transit = <strong className="text-[#000075]">{selectedSSR.standardMinutes + transitMin} min</strong>
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-[9.5px] uppercase font-bold text-slate-500">ML Risk Score</p>
                    <p className={`text-base font-black ${previewRisk >= 85 ? "text-rose-700" : previewRisk >= 50 ? "text-amber-700" : "text-emerald-700"}`}>
                      {previewRisk.toFixed(1)} / 100
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#000075] hover:bg-blue-900 active:bg-blue-950 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Forward to COA &rarr;
                  </button>
                </div>
              </div>

            </div>

          </div>
        </form>
      </div>

      {/* ── 4. Active TDMS Work Orders Table ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Registered Traction &amp; OHE Demands ({tdmsOrders.length})
            </h3>
            <span className="text-[10.5px] text-slate-500">• Northern Railway (Delhi Division)</span>
          </div>
          <span className="text-[11px] text-rose-800 font-semibold bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
            Synchronized with Central COA
          </span>
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
                <th className="py-2.5 px-4">COA Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tdmsOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No active 25kV Traction demands registered. Log a requisition above.
                  </td>
                </tr>
              ) : (
                tdmsOrders.slice(0, 15).map((wo) => (
                  <tr key={wo.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-[#000075]">
                      {wo.id}
                      <span className="block text-[10px] text-slate-400 font-normal">{wo.ssrTaskCode ?? "TDMS-SSR-01"}</span>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800 max-w-xs truncate">
                      {wo.description}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">
                      <span className="font-bold text-slate-800">{wo.lineId ?? "UP_FAST"}</span>
                      <span className="block text-[10px] text-slate-400">{wo.kpMarker ?? `KM ${wo.kmFrom.toFixed(1)}`}</span>
                    </td>
                    <td className="py-2.5 px-4 tabular-nums font-semibold text-slate-700">
                      {wo.durationMinutes} min
                    </td>
                    <td className="py-2.5 px-4">
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
                    <td className="py-2.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        wo.status === "SCHEDULED" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}>
                        {wo.status === "SCHEDULED" ? "✓ Scheduled in COA" : "⏳ Pending COA Solve"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
