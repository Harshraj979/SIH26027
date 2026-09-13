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
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5 text-slate-800">
      
      {/* ── 1. Header Banner ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-blue-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-blue-900/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xl">🚥</span>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-800/70 text-blue-200 border border-blue-700/60">
              IR-RBAC • S&amp;T Signalling Portal
            </span>
            <span className="text-[10px] text-blue-200/70 font-mono">
              Role: SR_DSTE
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight">
            Signal Maintenance Management System (SMMS) • S&amp;T Console
          </h2>
          <p className="text-xs text-blue-100/80 mt-1 max-w-2xl font-medium">
            Section Officer: <strong className="text-white">Smt. Khush Patel, Sr. DSTE / Signalling (Delhi Division)</strong> • SIL-4 Interlocking, Digital Axle Counters &amp; Point Machine Assurance
          </p>
        </div>

        <div className="bg-blue-900/60 border border-blue-400/40 text-blue-100 text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs whitespace-nowrap self-start md:self-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>SMMS Field Console Active</span>
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
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active S&amp;T Demands</p>
          <p className="text-2xl font-black text-blue-900 mt-0.5">{smmsOrders.length}</p>
          <p className="text-[11px] text-slate-500 font-medium">Signalling &amp; Telecom Logs</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Point Machine Alarms</p>
          <p className="text-2xl font-black text-rose-700 mt-0.5">{criticalCount}</p>
          <p className="text-[11px] text-rose-600 font-medium">Priority &gt; 90 (Safety Override)</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">SIL-4 Route Integrity</p>
          <p className="text-2xl font-black text-emerald-700 mt-0.5">99.98%</p>
          <p className="text-[11px] text-emerald-700 font-medium">Electronic Interlocking Normal</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Axle Counter Health</p>
          <p className="text-2xl font-black text-slate-800 mt-0.5">100%</p>
          <p className="text-[11px] text-slate-500 font-medium">Dual Evaluator Redundancy</p>
        </div>
      </div>

      {/* ── 3. Ergonomic Two-Column Requisition Console ────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span>🚥</span> S&amp;T Requisition Dispatch Console (SSR &amp; Interlocking)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Standardized motor replacement, aspect unit swap, and relay overhaul metrics
            </p>
          </div>
          <span className="text-xs font-bold text-blue-900 bg-blue-100/70 px-2.5 py-1 rounded-full border border-blue-300">
            S&amp;T SSR Active
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ── LEFT COLUMN: S&T Task Catalog (5 Cols) ────────────────────── */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  1. Standard Maintenance Task (SSR)
                </label>
                <span className="text-[10.5px] text-slate-500 font-medium">6 IR Standards</span>
              </div>

              {/* Compact Task List */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {SMMS_SSR_OPTIONS.map((opt) => {
                  const isSel = selectedSSR.code === opt.code;
                  return (
                    <div
                      key={opt.code}
                      onClick={() => setSelectedSSR(opt)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSel
                          ? "bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                          : "bg-slate-50/60 border-slate-200 hover:bg-slate-100/60"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-mono font-bold text-blue-900 bg-blue-100 px-1.5 py-0.2 rounded">
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
              <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-200/80 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-blue-900">Task Scope Spec:</span>
                  <span className="text-[10px] font-mono font-bold text-blue-800">{selectedSSR.code}</span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium leading-relaxed">{selectedSSR.desc}</p>
                <div className="pt-1.5 border-t border-blue-200/60 flex items-center justify-between text-[10.5px] text-slate-600 font-semibold">
                  <span>Standard Duration: <strong className="text-[#000075]">{selectedSSR.standardMinutes} min</strong></span>
                  <span>Default Priority: <strong className="text-slate-800">P{selectedSSR.defaultPrio}</strong></span>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Location, Parameters & AI Dispatch (7 Cols) ─── */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Location &amp; Interlocking Parameters
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
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
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
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="UP_FAST">UP_FAST (Main Express Line - 160 km/h)</option>
                    <option value="DN_FAST">DN_FAST (Main Express Line - 160 km/h)</option>
                    <option value="UP_SLOW">UP_SLOW (Commuter &amp; Freight - 110 km/h)</option>
                    <option value="DN_SLOW">DN_SLOW (Commuter &amp; Freight - 110 km/h)</option>
                  </select>
                </div>
              </div>

              {/* Chainage KM & Point Machine ID */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Chainage KM
                  </label>
                  <input
                    type="text"
                    value={kmMarker}
                    onChange={(e) => setKmMarker(e.target.value)}
                    placeholder="e.g. 90.1"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Point ID / Interlocking Asset ID
                  </label>
                  <input
                    type="text"
                    value={pointId}
                    onChange={(e) => setPointId(e.target.value)}
                    placeholder="e.g. Point 104-B (Panipat Jn)"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Description & Overdue Days */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Fault Description &amp; Interlocking Symptoms
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide signalling fault details..."
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Days Overdue
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={overdueDays}
                    onChange={(e) => setOverdueDays(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Cross-Department Dependency Checkbox */}
              <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-200/70 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireOHECut}
                    onChange={(e) => setRequireOHECut(e.target.checked)}
                    className="rounded text-[#000075] focus:ring-blue-500 h-4 w-4"
                  />
                  <span>Requires 25kV OHE Power Block (PTW) — <strong>Enables Shadow Block Bundling with TDMS</strong></span>
                </label>
                <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded border border-purple-200 hidden sm:inline">
                  +20m Corridor Saved
                </span>
              </div>

              {/* Live AI Sizing & Dispatch Card */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-50 via-blue-50/30 to-blue-50/60 border border-blue-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    <span className="font-bold text-slate-900 text-xs">Dynamic AI Sizing:</span>
                    <span className="text-[11px] text-slate-600">
                      Nearest Base: <strong>{depotName.split("(")[0]}</strong> (+{transitMin}m transit)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Window Required: <strong>{selectedSSR.standardMinutes}m</strong> SSR + <strong>{transitMin}m</strong> transit = <strong className="text-[#000075]">{selectedSSR.standardMinutes + transitMin} min</strong>
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-[9.5px] uppercase font-bold text-slate-500">ML Risk Score</p>
                    <p className={`text-base font-black ${previewRisk >= 90 ? "text-rose-700" : "text-blue-700"}`}>
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

      {/* ── 4. Active SMMS Work Orders Table ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Registered S&amp;T Demands ({smmsOrders.length})
            </h3>
            <span className="text-[10.5px] text-slate-500">• Northern Railway (Delhi Division)</span>
          </div>
          <span className="text-[11px] text-blue-800 font-semibold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            Synchronized with Central COA
          </span>
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
                <th className="py-2.5 px-4">COA Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {smmsOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No active S&amp;T demands registered. Log a requisition above.
                  </td>
                </tr>
              ) : (
                smmsOrders.slice(0, 15).map((wo) => (
                  <tr key={wo.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-[#000075]">
                      {wo.id}
                      <span className="block text-[10px] text-slate-400 font-normal">{wo.ssrTaskCode ?? "SMMS-SSR-01"}</span>
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
                        (wo.assetRisk ?? 0) >= 90
                          ? "bg-rose-100 text-rose-800 border-rose-300 animate-pulse"
                          : "bg-blue-100 text-blue-800 border-blue-300"
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
