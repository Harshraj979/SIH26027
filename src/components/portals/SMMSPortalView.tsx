"use client";

import React, { useState } from "react";
import type { WorkOrder } from "@/types";

interface Props {
  workOrders: WorkOrder[];
  onAddWorkOrder: (wo: Partial<WorkOrder>) => void;
  onDirectToCOA?: () => void;
}

const SMMS_SSR_OPTIONS = [
  {
    code: "SMMS-SSR-01",
    name: "Damaged point-machine motor replacement",
    standardMinutes: 45,
    severity: "Critical",
    defaultPrio: 1,
    defaultRisk: 94.6,
    desc: "Replace burnt 110V DC rotary point machine motor, test stroke detection and lock.",
  },
  {
    code: "SMMS-SSR-02",
    name: "Multi-aspect LED signal aspect unit overhaul",
    standardMinutes: 30,
    severity: "Major",
    defaultPrio: 2,
    defaultRisk: 72.0,
    desc: "Swap degraded LED optical aspect unit, calibrate current regulator module.",
  },
  {
    code: "SMMS-SSR-03",
    name: "Digital Axle Counter (DAC) reset & sensor calibration",
    standardMinutes: 40,
    severity: "Critical",
    defaultPrio: 1,
    defaultRisk: 91.0,
    desc: "High-frequency wheel detector sensor alignment and trackside evaluator module reset.",
  },
  {
    code: "SMMS-SSR-04",
    name: "Track circuit relay overhaul & impedance bond tuning",
    standardMinutes: 60,
    severity: "Major",
    defaultPrio: 2,
    defaultRisk: 65.0,
    desc: "Tune audio-frequency track circuit (AFTC) oscillators and replace Q-series track relays.",
  },
  {
    code: "SMMS-SSR-05",
    name: "Electronic Interlocking (EI) CPU card swap",
    standardMinutes: 45,
    severity: "Critical",
    defaultPrio: 1,
    defaultRisk: 95.0,
    desc: "SIL-4 electronic interlocking redundant processor board replacement and cold reboot.",
  },
  {
    code: "SMMS-SSR-06",
    name: "Signalling cable trench inspection & post repainting",
    standardMinutes: 30,
    severity: "Minor",
    defaultPrio: 3,
    defaultRisk: 15.0,
    desc: "Visual marker survey and post protective coat application.",
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

export default function SMMSPortalView({
  workOrders,
  onAddWorkOrder,
  onDirectToCOA,
}: Props) {
  const smmsOrders = workOrders.filter((w) => w.department === "SMMS");
  const criticalCount = smmsOrders.filter((w) => w.priority === 1 || (w.assetRisk ?? 0) >= 90).length;

  const [selectedSSR, setSelectedSSR] = useState(SMMS_SSR_OPTIONS[0]);
  const [selectedSection, setSelectedSection] = useState(SECTIONS[1]); // Panipat section
  const [lineId, setLineId] = useState("UP_FAST");
  const [kmMarker, setKmMarker] = useState("90.1");
  const [pointId, setPointId] = useState("Point 104-B (Panipat Jn)");
  const [description, setDescription] = useState("Rotary motor lock detection failure on turnout switch");
  const [overdueDays, setOverdueDays] = useState("3");
  const [requireOHECut, setRequireOHECut] = useState(true);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const kmNum = parseFloat(kmMarker) || 90.0;
  const depotKm = kmNum <= 45 ? 0.0 : kmNum <= 140 ? 90.0 : kmNum <= 250 ? 197.0 : 312.0;
  const depotName = kmNum <= 45 ? "New Delhi Yard Depot (KM 0.0)" :
    kmNum <= 140 ? "Panipat Jn Depot (KM 90.0)" :
    kmNum <= 250 ? "Ambala Cantt Depot (KM 197.0)" : "Ludhiana Jn Yard (KM 312.0)";
  const dist = Math.abs(kmNum - depotKm);
  const transitMin = dist <= 2.0 ? 5 : Math.round((dist / 30.0) * 60);

  const isCritical = selectedSSR.severity === "Critical";
  const previewRisk = isCritical
    ? Math.min(99.0, 91.0 + 1.2 * parseInt(overdueDays || "0"))
    : Math.min(75.0, selectedSSR.defaultRisk + 0.5 * parseInt(overdueDays || "0"));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const kmFrom = kmNum;
    const kmTo = Math.round((kmFrom + 0.2) * 10) / 10;
    const isOverride = previewRisk >= 90.0;

    onAddWorkOrder({
      department: "SMMS",
      description: `[SMMS] ${selectedSSR.name} — ${pointId} (${description})`,
      kmFrom,
      kmTo,
      durationMinutes: selectedSSR.standardMinutes,
      priority: selectedSSR.defaultPrio,
      overdueDays: parseInt(overdueDays || "0"),
      trackId: lineId,
      lineId: lineId,
      defectType: selectedSSR.code === "SMMS-SSR-01" ? "POINT_MACHINE_FAILURE" : "SIGNAL_FAILURE",
      ssrTaskCode: selectedSSR.code,
      ssrStandardMin: selectedSSR.standardMinutes,
      aiAdjustedMin: selectedSSR.standardMinutes + transitMin,
      nearestDepot: depotName,
      transitMinutes: transitMin,
      hardSafetyOverride: isOverride,
      kpMarker: `Section: ${selectedSection.id} | Line: ${lineId} | Location: ${pointId}`,
      horizonType: previewRisk >= 70 ? "WEEKLY" : "MONTHLY",
      assetRisk: previewRisk,
      explanation: requireOHECut ? "Cross-dependency: Mandatory OHE power isolation flagged." : undefined,
    });

    setSubmittedMessage(
      `S&T Requisition logged for ${selectedSSR.name} at KM ${kmNum.toFixed(1)} (${lineId}). Routed to COA Central Administrator!`
    );
    setTimeout(() => setSubmittedMessage(null), 6000);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 to-blue-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🚥</span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-800/80 text-blue-200 border border-blue-700">
              IR-RBAC • S&amp;T Signalling Portal
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight">
            Signal Maintenance Management System (SMMS) • S&amp;T Console
          </h2>
          <p className="text-xs text-blue-100/80 mt-1 max-w-2xl">
            Section Officer: <strong>Smt. Khush Patel, Sr. DSTE / Signalling (Delhi Division)</strong> • SIL-4 Interlocking, Digital Axle Counters &amp; Point Machine Assurance
          </p>
        </div>

        <div className="bg-blue-900/50 border border-blue-400/40 text-blue-100 text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs whitespace-nowrap self-start md:self-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>SMMS Dedicated Console</span>
        </div>
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
          <p className="text-[10.5px] uppercase font-bold text-slate-500">Active S&amp;T Demands</p>
          <p className="text-2xl font-black text-blue-900 mt-1">{smmsOrders.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Signalling &amp; Telecom Logs</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[10.5px] uppercase font-bold text-slate-500">Point Machine Alarms</p>
          <p className="text-2xl font-black text-rose-700 mt-1">{criticalCount}</p>
          <p className="text-[11px] text-rose-600 font-medium mt-0.5">Priority &gt; 90 (Safety Override)</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[10.5px] uppercase font-bold text-slate-500">SIL-4 Route Integrity</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">99.98%</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Electronic Interlocking Normal</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[10.5px] uppercase font-bold text-slate-500">Axle Counter Health</p>
          <p className="text-2xl font-black text-slate-800 mt-1">100%</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Dual Evaluator Redundancy</p>
        </div>
      </div>

      {/* Interactive Logging Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span>🚥</span> S&amp;T Requisition Dispatch (Standard Schedule of Rates)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Standardized motor replacement, aspect swap, and relay overhaul metrics
            </p>
          </div>
          <span className="text-xs font-bold text-blue-800 bg-blue-100/60 px-2.5 py-1 rounded-full border border-blue-300">
            S&amp;T SSR Active
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Step 1: Select SSR Rate */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              1. Select S&amp;T Maintenance Task (Standard Schedule of Rates)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {SMMS_SSR_OPTIONS.map((opt) => {
                const isSel = selectedSSR.code === opt.code;
                return (
                  <button
                    type="button"
                    key={opt.code}
                    onClick={() => setSelectedSSR(opt)}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSel
                        ? "bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                        : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold text-blue-800 bg-blue-100/80 px-1.5 py-0.2 rounded">
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
                <option value="UP_FAST">UP_FAST (Main Express Line - 160 km/h)</option>
                <option value="DN_FAST">DN_FAST (Main Express Line - 160 km/h)</option>
                <option value="UP_SLOW">UP_SLOW (Commuter &amp; Freight - 110 km/h)</option>
                <option value="DN_SLOW">DN_SLOW (Commuter &amp; Freight - 110 km/h)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Kilometer &amp; Point Machine ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={kmMarker}
                  onChange={(e) => setKmMarker(e.target.value)}
                  placeholder="KM (e.g. 90.1)"
                  className="w-1/3 text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-800"
                />
                <input
                  type="text"
                  value={pointId}
                  onChange={(e) => setPointId(e.target.value)}
                  placeholder="Point ID / Aspect ID"
                  className="w-2/3 text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Description & Cross-Dependency */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Fault Description &amp; Interlocking Symptoms
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
                Cross-Department Dependency
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireOHECut}
                  onChange={(e) => setRequireOHECut(e.target.checked)}
                  className="rounded text-[#000075]"
                />
                <span>Requires 25kV OHE Power Block (PTW)</span>
              </label>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50/40 border border-blue-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <p className="font-bold text-slate-900">
                S&amp;T Pipeline Live Preview:
              </p>
              <p className="text-slate-600">
                Nearest Base: <strong>{depotName}</strong> ({dist.toFixed(1)} km away $\rightarrow$ +{transitMin} min transit)
              </p>
              <p className="text-slate-600">
                Standard Time: <strong>{selectedSSR.standardMinutes} min</strong> • Cross-Dept: {requireOHECut ? "Flagged for OHE Shadow Bundling" : "Autonomous"}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-500">Calculated Priority Score</p>
                <p className={`text-xl font-black ${previewRisk >= 90 ? "text-rose-700" : "text-amber-700"}`}>
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

      {/* Active SMMS Demands */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Registered S&amp;T Demands ({smmsOrders.length})
          </h3>
          <span className="text-[11px] text-slate-500">Synchronized with Central COA Repository</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="py-2.5 px-4">ID &amp; Task Code</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4">LRS Location</th>
                <th className="py-2.5 px-4">Standard Rate</th>
                <th className="py-2.5 px-4">Priority Score</th>
                <th className="py-2.5 px-4">COA Scheduling Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {smmsOrders.slice(0, 15).map((wo) => (
                <tr key={wo.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#000075]">
                    {wo.id}
                    <span className="block text-[10px] text-slate-400 font-normal">{wo.ssrTaskCode ?? "SMMS-SSR-01"}</span>
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
                      (wo.assetRisk ?? 0) >= 90
                        ? "bg-rose-100 text-rose-800 border-rose-300 animate-pulse"
                        : "bg-blue-100 text-blue-800 border-blue-300"
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
