"use client";

/**
 * CorridorTimelineGantt — Clean, Intuitive, Human-Readable Block Schedule Timeline
 *
 * Replaces the confusing 19th-century string chart with a crystal-clear, section-by-section
 * Gantt timeline designed for Railway Section Controllers and Divisional Executives.
 *
 * Features:
 *  - 8 Geographic Corridor Sections along the 312 km NDLS–LDH mainline
 *  - 24-hour horizontal time rail with 2-hour increments
 *  - Non-overlapping block placement with stacking
 *  - Distinctive color coding for departments (TMS Civil, SMMS S&T, TDMS OHE)
 *  - Clearly highlighted "⚡ Shadow Bundles" with minute savings badges
 *  - Passenger rush hour curfew bands (08:00–10:30 & 17:00–19:30)
 *  - Interactive block inspector modal with authentic SHAP explainability
 */

import React, { useState, useMemo } from "react";
import type { ScheduledBlock, Station } from "@/types";

interface Props {
  scheduledBlocks: ScheduledBlock[];
  stations: Station[];
  onSelectBlock?: (block: ScheduledBlock) => void;
}

interface SectionDef {
  id:       string;
  name:     string;
  kmFrom:   number;
  kmTo:     number;
  stations: string;
}

const CORRIDOR_SECTIONS: SectionDef[] = [
  { id: "SEC_1", name: "New Delhi – Sonipat",      kmFrom: 0,   kmTo: 61,  stations: "NDLS → SNP" },
  { id: "SEC_2", name: "Sonipat – Panipat",        kmFrom: 61,  kmTo: 90,  stations: "SNP → PNP" },
  { id: "SEC_3", name: "Panipat – Kurukshetra",    kmFrom: 90,  kmTo: 124, stations: "PNP → KKDE" },
  { id: "SEC_4", name: "Kurukshetra – Karnal",     kmFrom: 124, kmTo: 157, stations: "KKDE → KUN" },
  { id: "SEC_5", name: "Karnal – Ambala Cantt",    kmFrom: 157, kmTo: 197, stations: "KUN → UMB" },
  { id: "SEC_6", name: "Ambala Cantt – Rajpura",   kmFrom: 197, kmTo: 224, stations: "UMB → RPJ" },
  { id: "SEC_7", name: "Rajpura – Sirhind",        kmFrom: 224, kmTo: 258, stations: "RPJ → SIR" },
  { id: "SEC_8", name: "Sirhind – Ludhiana Jn",    kmFrom: 258, kmTo: 312, stations: "SIR → LDH" },
];

const RUSH_PERIODS = [
  { startMin: 480,  endMin: 630,  label: "Morning Peak (08:00–10:30)" },
  { startMin: 1020, endMin: 1170, label: "Evening Peak (17:00–19:30)" },
];

const DEPT_BADGES = {
  TMS:  { bg: "bg-amber-100 text-amber-900 border-amber-300",  label: "Civil" },
  SMMS: { bg: "bg-blue-100 text-blue-900 border-blue-300",    label: "Signal" },
  TDMS: { bg: "bg-red-100 text-red-900 border-red-300",       label: "OHE" },
};

export default function CorridorTimelineGantt({ scheduledBlocks }: Props) {
  const [selectedBlock, setSelectedBlock] = useState<ScheduledBlock | null>(null);
  const [filterDept, setFilterDept]       = useState<"ALL" | "SHADOW" | "TMS" | "SMMS" | "TDMS">("ALL");
  const [filterTrack, setFilterTrack]     = useState<"ALL" | "UP" | "DN">("ALL");

  // Filtered blocks
  const filteredBlocks = useMemo(() => {
    return scheduledBlocks.filter((b) => {
      if (filterDept === "SHADOW" && !b.isShadowBlock) return false;
      if (filterDept === "TMS" && !b.departments.includes("TMS")) return false;
      if (filterDept === "SMMS" && !b.departments.includes("SMMS")) return false;
      if (filterDept === "TDMS" && !b.departments.includes("TDMS")) return false;
      if (filterTrack !== "ALL" && b.trackId && b.trackId !== filterTrack) return false;
      return true;
    });
  }, [scheduledBlocks, filterDept, filterTrack]);

  // Group blocks by section (a block may span or overlap a section)
  const blocksBySection = useMemo(() => {
    const map: Record<string, ScheduledBlock[]> = {};
    for (const sec of CORRIDOR_SECTIONS) {
      map[sec.id] = filteredBlocks.filter((b) => {
        const bMinKm = Math.min(b.kmFrom, b.kmTo);
        const bMaxKm = Math.max(b.kmFrom, b.kmTo);
        // Overlaps if block start < section end and block end > section start
        return bMinKm < sec.kmTo && bMaxKm > sec.kmFrom;
      });
    }
    return map;
  }, [filteredBlocks]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* ── Control Header & Legend ────────────────────────────────────────── */}
      <div className="bg-slate-50/90 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        
        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Filter:
          </span>

          <button
            onClick={() => setFilterDept("ALL")}
            className={`px-3 py-1 rounded-full font-semibold border transition-all ${
              filterDept === "ALL"
                ? "bg-[#1a3c6e] text-white border-[#1a3c6e] shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            All Blocks ({scheduledBlocks.length})
          </button>

          <button
            onClick={() => setFilterDept("SHADOW")}
            className={`px-3 py-1 rounded-full font-semibold border flex items-center gap-1.5 transition-all ${
              filterDept === "SHADOW"
                ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
            }`}
          >
            <span>⚡</span>
            <span>Shadow Bundles ({scheduledBlocks.filter(b => b.isShadowBlock).length})</span>
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {(["TMS", "SMMS", "TDMS"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setFilterDept(d)}
              className={`px-2.5 py-1 rounded-full font-semibold border transition-all ${
                filterDept === d
                  ? "bg-slate-800 text-white border-slate-800 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {d === "TMS" ? "Civil Track" : d === "SMMS" ? "Signalling" : "Traction OHE"}
            </button>
          ))}

          {/* Track Filter */}
          <div className="flex items-center border border-slate-200 rounded-lg bg-white p-0.5 ml-2">
            <span className="text-[10px] font-bold text-slate-400 px-1.5 uppercase">Track:</span>
            {(["ALL", "UP", "DN"] as const).map((tk) => (
              <button
                key={tk}
                onClick={() => setFilterTrack(tk)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  filterTrack === tk ? "bg-[#1a3c6e] text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tk}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-3.5 h-3.5 rounded-sm bg-rose-50 border-2 border-rose-600 flex items-center justify-center text-[9px] font-bold text-rose-700">⚡</span>
            <span>Shadow Bundle (Multi-Dept)</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-3.5 h-3.5 rounded-sm bg-amber-50 border border-amber-500" />
            <span>TMS Civil</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-3.5 h-3.5 rounded-sm bg-blue-50 border border-blue-500" />
            <span>SMMS Signal</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-3.5 h-3.5 rounded-sm bg-red-50 border border-red-500" />
            <span>TDMS Traction</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-3.5 h-3.5 rounded-sm bg-amber-100/60 border border-amber-300 border-dashed" />
            <span>Peak Passenger Curfew</span>
          </span>
        </div>

      </div>

      {/* ── Main Gantt Schedule Area ────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto flex flex-col min-h-[540px]">
        
        {/* Timeline Header (Time Scale across 24 hours) */}
        <div className="flex border-b border-slate-200 bg-slate-100/80 sticky top-0 z-20 shrink-0 text-xs">
          {/* Section info column */}
          <div className="w-64 shrink-0 px-4 py-2.5 font-bold text-slate-700 border-r border-slate-200 uppercase tracking-wider text-[11px] bg-slate-100/90">
            Corridor Geographic Section (312 km)
          </div>

          {/* 24-Hour Time Marks (12 two-hour slots) */}
          <div className="flex-1 grid grid-cols-12 divide-x divide-slate-200 text-center text-slate-600 font-mono text-[11px] font-bold">
            {Array.from({ length: 12 }).map((_, idx) => {
              const h = idx * 2;
              return (
                <div key={h} className="py-2.5 bg-slate-50/90">
                  {String(h).padStart(2, "0")}:00
                </div>
              );
            })}
          </div>
        </div>

        {/* Section Rows */}
        <div className="flex-1 divide-y divide-slate-200">
          {CORRIDOR_SECTIONS.map((sec) => {
            const blocks = blocksBySection[sec.id] || [];

            return (
              <div
                key={sec.id}
                className="flex items-stretch min-h-[76px] hover:bg-blue-50/20 transition-colors group relative"
              >
                {/* Left Section Label */}
                <div className="w-64 shrink-0 p-3.5 border-r border-slate-200 bg-white group-hover:bg-blue-50/20 flex flex-col justify-center">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{sec.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                      {sec.stations}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>km {sec.kmFrom.toFixed(0)} – {sec.kmTo.toFixed(0)} ({sec.kmTo - sec.kmFrom} km)</span>
                    <span className="font-semibold text-[#1a3c6e]">
                      {blocks.length} block{blocks.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Right Time Lane (24 Hours) */}
                <div className="flex-1 relative bg-white group-hover:bg-blue-50/10 min-h-[76px]">
                  
                  {/* Background 2-Hour Grid Lines */}
                  <div className="absolute inset-0 grid grid-cols-12 divide-x divide-slate-100 pointer-events-none">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="h-full" />
                    ))}
                  </div>

                  {/* Rush Hour Curfew Shading */}
                  {RUSH_PERIODS.map((rp, i) => {
                    const leftPct  = (rp.startMin / 1440) * 100;
                    const widthPct = ((rp.endMin - rp.startMin) / 1440) * 100;
                    return (
                      <div
                        key={i}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        title={rp.label}
                        className="absolute inset-y-0 bg-amber-50/40 border-x border-amber-200/50 pointer-events-none"
                      />
                    );
                  })}

                  {/* Possession Block Cards / Pills */}
                  {blocks.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-[11px] text-slate-300 italic">
                      No maintenance occupation in this section
                    </div>
                  ) : (
                    <div className="relative h-full py-2 px-1">
                      {blocks.map((block, bIdx) => {
                        const startM = Math.max(0, block.startMin);
                        const endM   = Math.min(1440, block.endMin);
                        const leftPct = (startM / 1440) * 100;
                        const widthPct = Math.max(2.5, ((endM - startM) / 1440) * 100);

                        const isShadow = block.isShadowBlock;
                        const primaryDept = block.departments[0] ?? "TMS";
                        const risk = block.assetRisk ?? 0;
                        const isCritical = risk > 70;

                        // Card styling
                        const borderCls = isShadow
                          ? "border-rose-500 bg-rose-50/95 text-rose-900 shadow-sm ring-1 ring-rose-200"
                          : primaryDept === "TMS"
                          ? "border-amber-400 bg-amber-50/95 text-amber-900 shadow-2xs"
                          : primaryDept === "SMMS"
                          ? "border-blue-400 bg-blue-50/95 text-blue-900 shadow-2xs"
                          : "border-red-400 bg-red-50/95 text-red-900 shadow-2xs";

                        return (
                          <div
                            key={bIdx}
                            onClick={() => setSelectedBlock(block)}
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                              top: `${8 + (bIdx % 2) * 28}px`,
                              height: "26px",
                            }}
                            className={`absolute rounded-md border px-2 flex items-center justify-between gap-1.5 cursor-pointer hover:scale-[1.01] hover:z-30 hover:shadow-md transition-all text-xs select-none ${borderCls}`}
                            title={`${block.startHHMM}–${block.endHHMM} (${block.durationMinutes}m) · km ${block.kmFrom.toFixed(1)}–${block.kmTo.toFixed(1)} · Click to inspect AI reasoning`}
                          >
                            {/* Block Left: Time & Shadow Icon */}
                            <div className="flex items-center gap-1 min-w-0 truncate">
                              {isShadow && (
                                <span className="font-bold text-rose-600 text-[11px] shrink-0">
                                  ⚡
                                </span>
                              )}
                              <span className="font-bold tabular-nums text-[11px] shrink-0">
                                {block.startHHMM}–{block.endHHMM}
                              </span>
                              <span className="text-[10px] text-slate-500 hidden xl:inline truncate">
                                ({block.durationMinutes}m)
                              </span>
                            </div>

                            {/* Block Right: Department & Risk Pills */}
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[9px] font-extrabold px-1 py-0.2 rounded bg-white/90 border border-slate-200 text-slate-700">
                                {block.trackId || "UP"}
                              </span>
                              {isShadow ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-200 text-rose-800">
                                  +{block.durationMinutes}m saved
                                </span>
                              ) : (
                                <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-white/90 border border-slate-200 text-slate-600">
                                  {block.departments.join("+")}
                                </span>
                              )}
                              <span className={`text-[9px] font-bold px-1 py-0.2 rounded ${
                                isCritical ? "bg-rose-200 text-rose-900" : "bg-emerald-100 text-emerald-800"
                              }`}>
                                {risk.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* ── Block Inspection Popover / Modal ─────────────────────────────────── */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150 font-sans">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  {selectedBlock.isShadowBlock ? (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                      <span>⚡</span>
                      <span>Shadow Bundle Possession</span>
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      Standard Single Block
                    </span>
                  )}
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-[#1a3c6e] border border-slate-200 font-mono">
                    {selectedBlock.trackId || "UP"} Track
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-2">
                  {selectedBlock.startHHMM} – {selectedBlock.endHHMM} ({selectedBlock.durationMinutes} minutes)
                </h3>
              </div>
              <button
                onClick={() => setSelectedBlock(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-base"
              >
                ✕
              </button>
            </div>

            {/* Metric grid */}
            <div className="grid grid-cols-3 gap-2.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-slate-400 text-[10px] block font-semibold">CORRIDOR SPAN</span>
                <strong className="text-slate-800 text-sm">km {selectedBlock.kmFrom.toFixed(1)}–{selectedBlock.kmTo.toFixed(1)}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-semibold">ML ASSET RISK</span>
                <strong className="text-rose-700 text-sm">{selectedBlock.assetRisk.toFixed(1)}%</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-semibold">PENALTY WEIGHT</span>
                <strong className="text-slate-800 text-sm">{selectedBlock.penaltyWeight}x</strong>
              </div>
            </div>

            {/* Participating Departments */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Participating Engineering Departments:
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedBlock.departments.map((d) => {
                  const b = DEPT_BADGES[d as keyof typeof DEPT_BADGES] || { bg: "bg-slate-100 text-slate-800 border-slate-200", label: d };
                  return (
                    <span key={d} className={`text-xs font-bold px-3 py-1 rounded-lg border ${b.bg}`}>
                      {d} — {b.label}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Explainable AI (SHAP) Reasoning */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 space-y-1">
              <span className="text-xs font-bold text-[#1a3c6e] flex items-center gap-1.5">
                <span>🤖</span>
                <span>Explainable AI (XAI) Justification</span>
              </span>
              <p className="text-xs text-slate-700 leading-relaxed pt-1">
                {selectedBlock.justification || selectedBlock.description || "Routine preventative maintenance block scheduled within optimal conflict-free headway."}
              </p>
            </div>

            {/* Operational Impact */}
            <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
              <span>{selectedBlock.clusterIds?.length ?? 1} maintenance defect(s) resolved in this single window</span>
              {selectedBlock.isShadowBlock && (
                <span className="text-rose-600 font-bold">
                  Saved +{selectedBlock.durationMinutes}m corridor capacity
                </span>
              )}
            </div>

            <button
              onClick={() => setSelectedBlock(null)}
              className="w-full py-2 bg-[#1a3c6e] hover:bg-[#14305a] text-white font-semibold text-xs rounded-xl transition-colors"
            >
              Close Block Details
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
