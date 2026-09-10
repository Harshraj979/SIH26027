"use client";

/**
 * BlockScheduleRegistry — Clean, Clear, and Minimal Registry of Scheduled Maintenance Blocks
 *
 * Provides a crystal-clear, minimal view of all scheduled possessions:
 *  - Time window (HH:MM – HH:MM) & duration
 *  - Chainage span (km From – km To) & Track (UP/DN)
 *  - Participating departments (TMS Civil, SMMS S&T, TDMS OHE)
 *  - Shadow bundle indicator with corridor minutes saved
 *  - ML-assessed Asset Risk score & priority badge
 *  - Authentic SHAP Explainable AI (XAI) natural language reasoning
 *  - Real-time search, department filtering, and view switcher (Table / Cards)
 */

import React, { useState, useMemo } from "react";
import type { ScheduledBlock, Station } from "@/types";

interface Props {
  scheduledBlocks: ScheduledBlock[];
  stations: Station[];
  onSwitchToChart?: () => void;
}

const DEPT_INFO: Record<string, { label: string; badgeClass: string; short: string }> = {
  TMS:  { label: "Civil / Track", badgeClass: "bg-amber-50 text-amber-800 border-amber-200", short: "Civil" },
  SMMS: { label: "Signal & Telecom", badgeClass: "bg-blue-50 text-blue-800 border-blue-200", short: "S&T" },
  TDMS: { label: "Traction / OHE", badgeClass: "bg-red-50 text-red-800 border-red-200", short: "OHE" },
};

function getStationContext(kmFrom: number, kmTo: number, stations: Station[]): string {
  if (!stations || stations.length === 0) return `km ${kmFrom.toFixed(1)} – ${kmTo.toFixed(1)}`;
  const midKm = (kmFrom + kmTo) / 2;
  
  // Find closest station or bounding stations
  let prevStation = stations[0];
  let nextStation = stations[stations.length - 1];

  for (let i = 0; i < stations.length; i++) {
    if (stations[i].chainage <= midKm) prevStation = stations[i];
    if (stations[i].chainage >= midKm) {
      nextStation = stations[i];
      break;
    }
  }

  if (prevStation.code === nextStation.code) {
    return `${prevStation.name} (${prevStation.code}) Area`;
  }
  return `${prevStation.code} – ${nextStation.code} Section`;
}

export default function BlockScheduleRegistry({ scheduledBlocks, stations, onSwitchToChart }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter]   = useState<"ALL" | "SHADOW" | "TMS" | "SMMS" | "TDMS">("ALL");
  const [sortBy, setSortBy]           = useState<"TIME" | "CHAINAGE" | "RISK" | "DURATION">("TIME");
  const [viewMode, setViewMode]       = useState<"TABLE" | "CARDS">("TABLE");

  // Summary counts
  const totalCount  = scheduledBlocks.length;
  const shadowCount = scheduledBlocks.filter((b) => b.isShadowBlock).length;
  const tmsCount    = scheduledBlocks.filter((b) => b.departments.includes("TMS")).length;
  const smmsCount   = scheduledBlocks.filter((b) => b.departments.includes("SMMS")).length;
  const tdmsCount   = scheduledBlocks.filter((b) => b.departments.includes("TDMS")).length;

  const filtered = useMemo(() => {
    return scheduledBlocks.filter((b) => {
      // Dept filter
      if (deptFilter === "SHADOW" && !b.isShadowBlock) return false;
      if (deptFilter === "TMS" && !b.departments.includes("TMS")) return false;
      if (deptFilter === "SMMS" && !b.departments.includes("SMMS")) return false;
      if (deptFilter === "TDMS" && !b.departments.includes("TDMS")) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesKm = `${b.kmFrom} ${b.kmTo}`.includes(q);
        const matchesDesc = b.description?.toLowerCase().includes(q) ?? false;
        const matchesJust = b.justification?.toLowerCase().includes(q) ?? false;
        const matchesTrack = b.trackId?.toLowerCase().includes(q) ?? false;
        const stationCtx = getStationContext(b.kmFrom, b.kmTo, stations).toLowerCase();
        const matchesStation = stationCtx.includes(q);
        const matchesDept = b.departments.some((d) => d.toLowerCase().includes(q));

        if (!matchesKm && !matchesDesc && !matchesJust && !matchesTrack && !matchesStation && !matchesDept) {
          return false;
        }
      }
      return true;
    });
  }, [scheduledBlocks, deptFilter, searchQuery, stations]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === "TIME") return a.startMin - b.startMin;
      if (sortBy === "CHAINAGE") return a.kmFrom - b.kmFrom;
      if (sortBy === "RISK") return (b.assetRisk ?? 0) - (a.assetRisk ?? 0);
      if (sortBy === "DURATION") return b.durationMinutes - a.durationMinutes;
      return 0;
    });
  }, [filtered, sortBy]);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-800">
      {/* ── Filter & Search Control Bar ──────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        
        {/* Left: Department & Shadow filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setDeptFilter("ALL")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              deptFilter === "ALL"
                ? "bg-[#1a3c6e] text-white border-[#1a3c6e] shadow-xs"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            All Blocks ({totalCount})
          </button>

          <button
            onClick={() => setDeptFilter("SHADOW")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border flex items-center gap-1.5 transition-all ${
              deptFilter === "SHADOW"
                ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
            }`}
          >
            <span>⚡</span>
            <span>Shadow Bundles ({shadowCount})</span>
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          <button
            onClick={() => setDeptFilter("TMS")}
            className={`text-xs font-medium px-2.5 py-1.5 rounded-full border transition-all ${
              deptFilter === "TMS"
                ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
            }`}
          >
            TMS Track ({tmsCount})
          </button>

          <button
            onClick={() => setDeptFilter("SMMS")}
            className={`text-xs font-medium px-2.5 py-1.5 rounded-full border transition-all ${
              deptFilter === "SMMS"
                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                : "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
            }`}
          >
            SMMS S&amp;T ({smmsCount})
          </button>

          <button
            onClick={() => setDeptFilter("TDMS")}
            className={`text-xs font-medium px-2.5 py-1.5 rounded-full border transition-all ${
              deptFilter === "TDMS"
                ? "bg-red-600 text-white border-red-600 shadow-xs"
                : "bg-red-50 text-red-800 border-red-200 hover:bg-red-100"
            }`}
          >
            TDMS OHE ({tdmsCount})
          </button>
        </div>

        {/* Right: Search, Sort & View Mode */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search station, km, reason…"
              className="w-56 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 pl-8 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1a3c6e] focus:bg-white transition-all"
            />
            <svg
              className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span className="text-[11px] font-medium text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 focus:outline-none focus:border-[#1a3c6e]"
            >
              <option value="TIME">Time Window</option>
              <option value="CHAINAGE">Corridor (km)</option>
              <option value="RISK">Asset Risk (High → Low)</option>
              <option value="DURATION">Duration (Long → Short)</option>
            </select>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-slate-50 p-0.5">
            <button
              onClick={() => setViewMode("TABLE")}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                viewMode === "TABLE" ? "bg-white text-[#1a3c6e] shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Table View"
            >
              Table
            </button>
            <button
              onClick={() => setViewMode("CARDS")}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                viewMode === "CARDS" ? "bg-white text-[#1a3c6e] shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Cards View"
            >
              Cards
            </button>
          </div>

          {onSwitchToChart && (
            <button
              onClick={onSwitchToChart}
              className="text-xs font-semibold text-[#1a3c6e] hover:text-blue-800 bg-blue-50/60 hover:bg-blue-50 border border-blue-200 px-2.5 py-1 rounded transition-colors flex items-center gap-1"
            >
              <span>📈</span>
              <span>View on Chart</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Content Area ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-4 sm:p-5">
        {totalCount === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 text-xl font-bold mb-3">
              ⚡
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Block Schedule Computed Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Run the block optimizer from the top action bar to solve the CP-SAT mathematical optimization model and generate the conflict-free schedule.
            </p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500">No scheduled blocks match your filter criteria.</p>
            <button
              onClick={() => { setSearchQuery(""); setDeptFilter("ALL"); }}
              className="mt-2 text-xs text-[#1a3c6e] font-semibold hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : viewMode === "TABLE" ? (
          /* ── Table View ── */
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 w-28">Time Slot</th>
                    <th className="py-3 px-4 w-52">Location / Section</th>
                    <th className="py-3 px-4 w-40">Departments</th>
                    <th className="py-3 px-4 w-32">Block Type</th>
                    <th className="py-3 px-4 w-28">ML Risk</th>
                    <th className="py-3 px-4">Explainable AI (XAI) Justification</th>
                    <th className="py-3 px-4 w-20 text-right">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sorted.map((block, idx) => {
                    const sectionName = getStationContext(block.kmFrom, block.kmTo, stations);
                    const risk = block.assetRisk ?? 0;
                    const riskColor =
                      risk > 75 ? "text-rose-700 bg-rose-50 border-rose-200" :
                      risk > 50 ? "text-amber-700 bg-amber-50 border-amber-200" :
                      "text-emerald-700 bg-emerald-50 border-emerald-200";

                    return (
                      <tr
                        key={idx}
                        className="hover:bg-blue-50/40 transition-colors group"
                      >
                        {/* Time */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900 tabular-nums">
                            {block.startHHMM} – {block.endHHMM}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {block.startMin}m – {block.endMin}m
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#1a3c6e]">
                            km {block.kmFrom.toFixed(1)} – {block.kmTo.toFixed(1)}
                            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-normal border border-slate-200">
                              {block.trackId || "UP"}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[200px]" title={sectionName}>
                            {sectionName}
                          </div>
                        </td>

                        {/* Departments */}
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {block.departments.map((d) => {
                              const info = DEPT_INFO[d] || { label: d, badgeClass: "bg-slate-100 text-slate-700 border-slate-200", short: d };
                              return (
                                <span
                                  key={d}
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${info.badgeClass}`}
                                  title={info.label}
                                >
                                  {info.short}
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        {/* Block Type */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {block.isShadowBlock ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                              <span>⚡</span>
                              <span>Shadow Bundle</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              Single Block
                            </span>
                          )}
                        </td>

                        {/* ML Risk */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded border tabular-nums ${riskColor}`}>
                              {risk.toFixed(1)}%
                            </span>
                          </div>
                        </td>

                        {/* Justification / SHAP */}
                        <td className="py-3 px-4">
                          <div className="text-[11px] text-slate-700 leading-relaxed max-w-xl">
                            {block.justification || block.description || "Routine preventative maintenance window."}
                          </div>
                        </td>

                        {/* Duration */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span className="font-semibold text-slate-800 tabular-nums">
                            {block.durationMinutes}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-0.5">m</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Table Footer */}
            <div className="bg-slate-50/80 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {sorted.length} of {totalCount} scheduled blocks</span>
              <span className="text-[11px] text-slate-400">
                Optimized with CP-SAT solver &amp; ML asset degradation scores
              </span>
            </div>
          </div>
        ) : (
          /* ── Card Grid View ── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((block, idx) => {
              const sectionName = getStationContext(block.kmFrom, block.kmTo, stations);
              const risk = block.assetRisk ?? 0;
              const isHighRisk = risk > 65;

              return (
                <div
                  key={idx}
                  className={`bg-white rounded-xl border p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                    block.isShadowBlock ? "border-rose-200 ring-1 ring-rose-100" : "border-slate-200"
                  }`}
                >
                  <div>
                    {/* Header: Time + Badge */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div>
                        <div className="text-base font-bold text-slate-900 tabular-nums leading-tight">
                          {block.startHHMM} – {block.endHHMM}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          Duration: <span className="font-semibold text-slate-700">{block.durationMinutes} mins</span>
                        </div>
                      </div>

                      {block.isShadowBlock ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          <span>⚡</span>
                          <span>Shadow Bundle</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          Standard
                        </span>
                      )}
                    </div>

                    {/* Section details */}
                    <div className="bg-slate-50/80 rounded-lg p-2.5 mb-3 border border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#1a3c6e]">
                          km {block.kmFrom.toFixed(1)} – {block.kmTo.toFixed(1)}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                          {block.trackId || "UP"} Track
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {sectionName}
                      </div>
                    </div>

                    {/* Departments & Risk */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex flex-wrap gap-1">
                        {block.departments.map((d) => {
                          const info = DEPT_INFO[d] || { label: d, badgeClass: "bg-slate-100 text-slate-700 border-slate-200", short: d };
                          return (
                            <span
                              key={d}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${info.badgeClass}`}
                            >
                              {info.short}
                            </span>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-1 text-right">
                        <span className="text-[10px] text-slate-400 font-medium">Risk:</span>
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${
                          isHighRisk ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}>
                          {risk.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Explanation */}
                    <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2 line-clamp-3" title={block.justification || block.description}>
                      {block.justification || block.description || "Routine maintenance possession."}
                    </p>
                  </div>

                  {/* Card bottom meta */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{block.clusterIds?.length ?? 1} work order{(block.clusterIds?.length ?? 1) > 1 ? "s" : ""}</span>
                    {block.isShadowBlock && (
                      <span className="text-rose-600 font-semibold text-[10px]">
                        Saved +{block.durationMinutes} min corridor time
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
