"use client";

import React, { useState } from "react";
import type { WorkOrder } from "@/types";

interface Props {
  workOrders: WorkOrder[];
  onAddWorkOrder: (wo: Partial<WorkOrder>) => void;
  onDirectToCOA: () => void;
}

const TMS_SSR_OPTIONS = [
  {
    code: "TMS-SSR-01",
    name: "Replacing 6m fractured rail section",
    standardMinutes: 60,
    severity: "Critical",
    defaultPrio: 1,
    defaultRisk: 99.2,
    desc: "Cut and replace fractured rail section with 60kg 90UTS rail and thermit weld.",
  },
  {
    code: "TMS-SSR-02",
    name: "Turnout & 1-in-12 Crossover packing & alignment",
    standardMinutes: 90,
    severity: "Major",
    defaultPrio: 2,
    defaultRisk: 76.0,
    desc: "Mechanized packing and tamping of diamond crossover switches and point rails.",
  },
  {
    code: "TMS-SSR-03",
    name: "Ballast deep screening & mechanized tamping (CSM-09)",
    standardMinutes: 120,
    severity: "Major",
    defaultPrio: 2,
    defaultRisk: 68.0,
    desc: "Ballast cleaning machine (BCM) and tamping consist deep screening on mainline.",
  },
  {
    code: "TMS-SSR-04",
    name: "USFD Ultrasonic Flaw Detection verification",
    standardMinutes: 45,
    severity: "Minor",
    defaultPrio: 3,
    defaultRisk: 35.0,
    desc: "Digital ultrasonic probe scanning for internal transverse railhead cracks.",
  },
  {
    code: "TMS-SSR-05",
    name: "Fish plate joint tightening & emergency bolt replacement",
    standardMinutes: 30,
    severity: "Major",
    defaultPrio: 2,
    defaultRisk: 62.0,
    desc: "Inspection and high-tensile bolt torquing on insulated fishplates.",
  },
  {
    code: "TMS-SSR-06",
    name: "Routine track bed cleaning & cess clearing",
    standardMinutes: 40,
    severity: "Minor",
    defaultPrio: 3,
    defaultRisk: 12.0,
    desc: "Vegetation clearing, drain declogging, and cosmetic trackbed dressing.",
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

export default function TMSPortalView({
  workOrders,
  onAddWorkOrder,
  onDirectToCOA,
}: Props) {
  const tmsOrders = workOrders.filter((w) => w.department === "TMS");
  const criticalCount = tmsOrders.filter((w) => w.priority === 1 || (w.assetRisk ?? 0) >= 90).length;

  const [selectedSSR, setSelectedSSR] = useState(TMS_SSR_OPTIONS[0]);
  const [selectedSection, setSelectedSection] = useState(SECTIONS[0]);
  const [lineId, setLineId] = useState("UP_FAST");
  const [kmMarker, setKmMarker] = useState("14.2");
  const [mastMarker, setMastMarker] = useState("12-14");
  const [description, setDescription] = useState("Severe rail fracture observed on mainline track");
  const [overdueDays, setOverdueDays] = useState("4");
  const [tqiScore, setTqiScore] = useState("38");
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  // Compute LRS depot distance & transit
  const kmNum = parseFloat(kmMarker) || 14.0;
  const depotKm = kmNum <= 45 ? 0.0 : kmNum <= 140 ? 90.0 : kmNum <= 250 ? 197.0 : 312.0;
  const depotName = kmNum <= 45 ? "New Delhi Yard Depot (KM 0.0)" :
    kmNum <= 140 ? "Panipat Jn Depot (KM 90.0)" :
    kmNum <= 250 ? "Ambala Cantt Depot (KM 197.0)" : "Ludhiana Jn Yard (KM 312.0)";
  const dist = Math.abs(kmNum - depotKm);
  const transitMin = dist <= 2.0 ? 5 : Math.round((dist / 30.0) * 60);

  // Live priority preview
  const isCritical = selectedSSR.severity === "Critical" || selectedSSR.code === "TMS-SSR-01";
  const isRoutine = selectedSSR.severity === "Minor";
  const previewRisk = isCritical
    ? Math.min(99.9, 92.0 + 0.8 * parseInt(overdueDays || "0"))
    : isRoutine
    ? Math.min(25.0, 10.0 + 0.3 * parseInt(overdueDays || "0"))
    : Math.min(85.0, selectedSSR.defaultRisk + 0.5 * parseInt(overdueDays || "0"));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const kmFrom = kmNum;
    const kmTo = Math.round((kmFrom + 0.1) * 10) / 10;
    const isOverride = previewRisk >= 90.0;

    onAddWorkOrder({
      department: "TMS",
      description: `[TMS] ${selectedSSR.name} (${description})`,
      kmFrom,
      kmTo,
      durationMinutes: selectedSSR.standardMinutes,
      priority: selectedSSR.defaultPrio,
      overdueDays: parseInt(overdueDays || "0"),
      tqiScore: parseFloat(tqiScore || "60"),
      trackId: lineId,
      lineId: lineId,
      defectType: selectedSSR.code === "TMS-SSR-01" ? "RAIL_FRACTURE" : "MAINTENANCE_DEMAND",
      ssrTaskCode: selectedSSR.code,
      ssrStandardMin: selectedSSR.standardMinutes,
      aiAdjustedMin: selectedSSR.standardMinutes + transitMin,
      nearestDepot: depotName,
      transitMinutes: transitMin,
      hardSafetyOverride: isOverride,
      kpMarker: `Section: ${selectedSection.id} | Line: ${lineId} | KM: ${kmNum.toFixed(1)} / ${mastMarker}`,
      horizonType: previewRisk >= 70 ? "WEEKLY" : "MONTHLY",
      assetRisk: previewRisk,
    });

    setSubmittedMessage(
      `Requisition logged for ${selectedSSR.name} at KM ${kmNum.toFixed(1)} (${lineId}). Routed to COA Central Administrator!`
    );
    setTimeout(() => setSubmittedMessage(null), 6000);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-900 to-amber-800 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🛤️</span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-700/80 text-amber-200 border border-amber-600">
              IR-RBAC • Civil P-Way Portal
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight">
            Track Management System (TMS) • Civil Engineering Console
          </h2>
          <p className="text-xs text-amber-100/80 mt-1 max-w-2xl">
            Section Officer: <strong>Sh. Harsh Savalia, Sr. DEN (Delhi Division)</strong> • NDLS – UMB – LDH Mainline Corridor (312 km) • USFD, Track Geometry &amp; Rail Weld Safety
          </p>
        </div>

        <button
          onClick={onDirectToCOA}
          className="bg-amber-100 hover:bg-white text-amber-950 text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap self-start md:self-auto"
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
          <p className="text-[10.5px] uppercase font-bold text-slate-500">Active TMS Requisitions</p>
          <p className="text-2xl font-black text-amber-900 mt-1">{tmsOrders.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Civil P-Way Work Orders</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[10.5px] uppercase font-bold text-slate-500">Critical Fractures</p>
          <p className="text-2xl font-black text-rose-700 mt-1">{criticalCount}</p>
          <p className="text-[11px] text-rose-600 font-medium mt-0.5">Priority &gt; 90 (Safety Override)</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[10.5px] uppercase font-bold text-slate-500">Machine Consists Staged</p>
          <p className="text-2xl font-black text-slate-800 mt-1">4 Rakes</p>
          <p className="text-[11px] text-slate-500 mt-0.5">CSM-09 Tamping &amp; BCM-12</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[10.5px] uppercase font-bold text-slate-500">Average Section TQI</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">68.4</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Track Quality Index (Safe)</p>
        </div>
      </div>

      {/* Interactive Logging Form: Standard Schedule of Rates (SSR) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span>📋</span> Requisition Dispatch: Standard Schedule of Rates (SSR) Selector
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Standardized Indian Railways metrics automatically determine baseline duration and transit constraints
            </p>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-100/60 px-2.5 py-1 rounded-full border border-amber-300">
            SSR Blueprint Active
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Step 1: Select SSR Rate */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              1. Select Engineering Maintenance Task (Indian Railways SSR Catalogue)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {TMS_SSR_OPTIONS.map((opt) => {
                const isSel = selectedSSR.code === opt.code;
                return (
                  <button
                    type="button"
                    key={opt.code}
                    onClick={() => setSelectedSSR(opt)}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSel
                        ? "bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-xs"
                        : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.2 rounded">
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

          {/* Step 2: Linear Referencing System (LRS) Address */}
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
                Line Identification (Multi-Track)
              </label>
              <select
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800"
              >
                <option value="UP_FAST">UP_FAST (Main Northbound Express Line - 160 km/h)</option>
                <option value="DN_FAST">DN_FAST (Main Southbound Express Line - 160 km/h)</option>
                <option value="UP_SLOW">UP_SLOW (Northbound Commuter &amp; Freight - 110 km/h)</option>
                <option value="DN_SLOW">DN_SLOW (Southbound Commuter &amp; Freight - 110 km/h)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Kilometer Post (KP) &amp; Mast
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={kmMarker}
                  onChange={(e) => setKmMarker(e.target.value)}
                  placeholder="KM Point (e.g. 14.2)"
                  className="w-1/2 text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-800"
                />
                <input
                  type="text"
                  value={mastMarker}
                  onChange={(e) => setMastMarker(e.target.value)}
                  placeholder="Masts (e.g. 12-14)"
                  className="w-1/2 text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Description & Engineering Context */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Defect Field Description &amp; Visual Notes
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
                Days Overdue / Inspection Lag
              </label>
              <input
                type="number"
                min="0"
                value={overdueDays}
                onChange={(e) => setOverdueDays(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-800"
              />
            </div>
          </div>

          {/* AI Pre-Calculation Live Summary Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-amber-50/40 border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <p className="font-bold text-slate-900">
                AI Pipeline Live Preview:
              </p>
              <p className="text-slate-600">
                Nearest Crew Depot: <strong>{depotName}</strong> ({dist.toFixed(1)} km away $\rightarrow$ +{transitMin} min transit @ 30 km/h)
              </p>
              <p className="text-slate-600">
                Standard Time: <strong>{selectedSSR.standardMinutes} min</strong> • True Window with Depot Transit: <strong>{selectedSSR.standardMinutes + transitMin} min</strong>
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-500">Calculated Priority Score</p>
                <p className={`text-xl font-black ${previewRisk >= 90 ? "text-rose-700" : previewRisk >= 60 ? "text-amber-700" : "text-emerald-700"}`}>
                  {previewRisk.toFixed(1)} / 100
                </p>
                {previewRisk >= 90 && (
                  <span className="text-[9px] font-black uppercase text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded border border-rose-300">
                    Hard Safety Override Active
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

      {/* Active TMS Work Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Registered Civil P-Way Demands ({tmsOrders.length})
          </h3>
          <span className="text-[11px] text-slate-500">Synchronized with Central COA Repository</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="py-2.5 px-4">ID &amp; Task Code</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4">LRS Address (KM / Line)</th>
                <th className="py-2.5 px-4">Standard Rate</th>
                <th className="py-2.5 px-4">Nearest Depot &amp; Transit</th>
                <th className="py-2.5 px-4">Priority Score</th>
                <th className="py-2.5 px-4">COA Scheduling Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tmsOrders.slice(0, 15).map((wo) => {
                const isCritical = (wo.assetRisk ?? 0) >= 90;
                return (
                  <tr key={wo.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#000075]">
                      {wo.id}
                      <span className="block text-[10px] text-slate-400 font-normal">{wo.ssrTaskCode ?? "TMS-SSR-01"}</span>
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
                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      {wo.nearestDepot ? wo.nearestDepot.split("(")[0] : "Depot"}
                      <span className="block text-[10px] text-blue-700 font-semibold">+{wo.transitMinutes ?? 5}m transit</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-black tabular-nums px-2 py-0.5 rounded border ${
                        isCritical
                          ? "bg-rose-100 text-rose-800 border-rose-300 animate-pulse"
                          : (wo.assetRisk ?? 0) >= 60
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
