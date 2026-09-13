"use client";

/**
 * CorridorSchematicMap — Spatial Corridor Map View (312 km NDLS–UMB–LDH)
 * Horizontal multi-track schematic showing stations, depots, track lines,
 * and scheduled maintenance block possessions plotted to scale.
 */

import React, { useState } from "react";
import type { ScheduledBlock, Station } from "@/types";

interface Props {
  scheduledBlocks: ScheduledBlock[];
  stations: Station[];
  onSelectBlock?: (block: ScheduledBlock) => void;
  onOpenWhyThisSlot?: (block: ScheduledBlock) => void;
}

const TRACK_LINES = [
  { id: "UP_FAST", name: "UP Fast Mainline (Vande Bharat / Mail SF)", color: "#0284c7" },
  { id: "DN_FAST", name: "DN Fast Mainline (Vande Bharat / Mail SF)", color: "#0369a1" },
  { id: "UP_SLOW", name: "UP Slow Line (MEMU / Freight Consists)", color: "#059669" },
  { id: "DN_SLOW", name: "DN Slow Line (MEMU / Freight Consists)", color: "#047857" },
];

const DEPOTS = [
  { name: "New Delhi Yard Depot", km: 0.0 },
  { name: "Panipat Jn Depot", km: 90.0 },
  { name: "Ambala Cantt Depot", km: 197.0 },
  { name: "Ludhiana Jn Yard", km: 312.0 },
];

export default function CorridorSchematicMap({
  scheduledBlocks,
  stations,
  onSelectBlock,
  onOpenWhyThisSlot,
}: Props) {
  const [selectedTrack, setSelectedTrack] = useState<string>("ALL");
  const [activeBlock, setActiveBlock] = useState<ScheduledBlock | null>(null);

  const totalKm = 312.0;

  // Use corridor stations or fallback defaults
  const displayStations = stations.length > 0 ? stations : [
    { id: "1", code: "NDLS", name: "New Delhi", chainage: 0.0 },
    { id: "2", code: "SNP",  name: "Sonipat", chainage: 61.0 },
    { id: "3", code: "PNP",  name: "Panipat Jn", chainage: 90.0 },
    { id: "4", code: "KKDE", name: "Karnal", chainage: 124.0 },
    { id: "5", code: "KUN",  name: "Kurukshetra", chainage: 157.0 },
    { id: "6", code: "UMB",  name: "Ambala Cantt", chainage: 197.0 },
    { id: "7", code: "RPJ",  name: "Rajpura", chainage: 224.0 },
    { id: "8", code: "SIR",  name: "Sirhind", chainage: 258.0 },
    { id: "9", code: "LDH",  name: "Ludhiana Jn", chainage: 312.0 },
  ];

  const getKmPercent = (km: number) => {
    return Math.max(0, Math.min(100, (km / totalKm) * 100));
  };

  const filteredBlocks = scheduledBlocks.filter((b) => {
    if (selectedTrack === "ALL") return true;
    return b.trackId === selectedTrack || b.lineId === selectedTrack;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-slate-800 flex flex-col">
      
      {/* Header Bar */}
      <div className="p-4 sm:p-5 bg-[#000075] text-white border-b border-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/15 text-[#ffba00] border border-white/20">
              Spatial Linear Referencing (LRS)
            </span>
            <span className="text-[10px] text-blue-200 font-mono">
              312.0 km Quadruple-Track Schematic
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-black tracking-tight">
            NDLS – UMB – LDH Corridor Schematic Map
          </h3>
          <p className="text-xs text-blue-100/80 font-medium">
            Visual distribution of scheduled maintenance blocks across all 4 mainline and loop tracks.
          </p>
        </div>

        {/* Track Line Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#00005a] p-1 rounded-lg border border-white/20 text-xs">
          <button
            onClick={() => setSelectedTrack("ALL")}
            className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
              selectedTrack === "ALL" ? "bg-white text-[#000075]" : "text-blue-200 hover:text-white"
            }`}
          >
            All Tracks ({scheduledBlocks.length})
          </button>
          {TRACK_LINES.map((track) => (
            <button
              key={track.id}
              onClick={() => setSelectedTrack(track.id)}
              className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
                selectedTrack === track.id ? "bg-white text-[#000075] font-bold" : "text-blue-200 hover:text-white"
              }`}
            >
              {track.id.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Legend & Summary Strip */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-bold uppercase text-slate-500">Department Legends:</span>
          <span className="flex items-center gap-1 text-[11.5px] font-medium text-amber-900">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>TMS (Civil Track)</span>
          </span>
          <span className="flex items-center gap-1 text-[11.5px] font-medium text-blue-900">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>SMMS (Signals &amp; Telecom)</span>
          </span>
          <span className="flex items-center gap-1 text-[11.5px] font-medium text-rose-900">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            <span>TDMS (25kV OHE)</span>
          </span>
          <span className="flex items-center gap-1 text-[11.5px] font-bold text-purple-900">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 ring-2 ring-purple-300 animate-pulse" />
            <span>Multi-Dept Shadow Bundle</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-500 text-[11px]">
          <span>🏢 Depot Location</span>
          <span>•</span>
          <span>🚉 Key Station Junction</span>
        </div>
      </div>

      {/* Interactive Schematic Canvas */}
      <div className="p-5 sm:p-6 overflow-x-auto min-w-[760px]">
        
        {/* Top Chainage Axis & Stations */}
        <div className="relative h-14 border-b border-slate-300 mb-6">
          {displayStations.map((stn) => {
            const leftPct = getKmPercent(stn.chainage);
            return (
              <div
                key={stn.code}
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center select-none"
                style={{ left: `${leftPct}%` }}
              >
                <span className="text-[11px] font-black text-slate-800 tracking-tight">
                  {stn.code}
                </span>
                <span className="text-[9.5px] text-slate-500 font-mono">
                  {stn.chainage.toFixed(0)} km
                </span>
                <div className="w-2 h-2 rounded-full bg-[#000075] border-2 border-white shadow-xs mt-1" />
                <div className="w-px h-3 bg-slate-300" />
              </div>
            );
          })}
        </div>

        {/* 4 Track Lines Rendering */}
        <div className="space-y-4">
          {TRACK_LINES.map((track) => {
            const trackBlocks = scheduledBlocks.filter(
              (b) => b.trackId === track.id || b.lineId === track.id || (!b.trackId && track.id === "UP_FAST")
            );

            return (
              <div key={track.id} className="relative">
                {/* Track Label */}
                <div className="flex items-center justify-between text-[11px] mb-1 font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: track.color }} />
                    <span>{track.name}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {trackBlocks.length} possessions scheduled
                  </span>
                </div>

                {/* Track Railway Line (Double Steel Rail Visual) */}
                <div className="relative h-10 bg-slate-100 rounded-lg border border-slate-300 overflow-hidden flex items-center px-1">
                  
                  {/* Tie / Sleeper Hatch pattern */}
                  <div 
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage: "repeating-linear-gradient(90deg, #64748b, #64748b 2px, transparent 2px, transparent 12px)",
                    }}
                  />
                  {/* Steel Rail lines */}
                  <div className="absolute top-2 left-0 right-0 h-0.5 bg-slate-400" />
                  <div className="absolute bottom-2 left-0 right-0 h-0.5 bg-slate-400" />

                  {/* Plotted Maintenance Possessions */}
                  {trackBlocks.map((block, idx) => {
                    const blockKey = block.id || block.clusterIds?.join("-") || `block-${track.id}-${idx}`;
                    const startPct = getKmPercent(block.kmFrom);
                    const endPct = getKmPercent(block.kmTo);
                    const widthPct = Math.max(3.5, endPct - startPct);

                    const isShadow = block.isShadowBlock;
                    const isTMS = block.departments.includes("TMS");
                    const isSMMS = block.departments.includes("SMMS");
                    const isTDMS = block.departments.includes("TDMS");

                    const bgColor = isShadow
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-800"
                      : isTMS
                      ? "bg-amber-500 text-white border-amber-700"
                      : isSMMS
                      ? "bg-blue-600 text-white border-blue-800"
                      : "bg-rose-600 text-white border-rose-800";

                    const isSelected = activeBlock ? (activeBlock.id === block.id || activeBlock.startMin === block.startMin && activeBlock.kmFrom === block.kmFrom) : false;

                    return (
                      <button
                        key={blockKey}
                        type="button"
                        onClick={() => {
                          setActiveBlock(block);
                          if (onSelectBlock) onSelectBlock(block);
                        }}
                        style={{
                          left: `${startPct}%`,
                          width: `${widthPct}%`,
                        }}
                        className={`absolute z-10 h-7 rounded-md border text-[10px] font-black tracking-tight shadow-sm flex items-center justify-center cursor-pointer transition-all hover:scale-105 hover:z-20 ${bgColor} ${
                          isSelected ? "ring-3 ring-[#ffba00] ring-offset-1 z-30" : ""
                        }`}
                        title={`${block.description} (${block.startHHMM}–${block.endHHMM}) km ${block.kmFrom.toFixed(1)}–${block.kmTo.toFixed(1)}`}
                      >
                        <span className="truncate px-1">
                          {isShadow ? "⚡ SHARED" : block.departments.join("+")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Depots Marker Strip */}
        <div className="relative h-10 mt-5 pt-2 border-t border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Support Depots along Corridor:
          </span>
          {DEPOTS.map((depot) => {
            const leftPct = getKmPercent(depot.km);
            return (
              <div
                key={depot.name}
                className="absolute top-4 -translate-x-1/2 flex items-center gap-1 text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 shadow-2xs"
                style={{ left: `${leftPct}%` }}
              >
                <span>🏢</span>
                <span className="whitespace-nowrap">{depot.name}</span>
              </div>
            );
          })}
        </div>

      </div>

      {/* Selected Block Quick Inspector Card */}
      {activeBlock && (
        <div className="p-4 sm:p-5 bg-blue-50/70 border-t border-blue-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                activeBlock.isShadowBlock ? "bg-purple-100 text-purple-900 border border-purple-300" : "bg-blue-100 text-blue-900 border border-blue-300"
              }`}>
                {activeBlock.isShadowBlock ? "⚡ Co-located Shadow Bundle" : activeBlock.departments.join(" + ")}
              </span>
              <span className="text-xs font-mono font-bold text-slate-900">
                {activeBlock.startHHMM} – {activeBlock.endHHMM} ({activeBlock.durationMinutes} min)
              </span>
              <span className="text-xs text-slate-500">
                • Track Line: <strong>{activeBlock.lineId || activeBlock.trackId}</strong>
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {activeBlock.description}
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Chainage: <strong>KM {activeBlock.kmFrom.toFixed(1)} – {activeBlock.kmTo.toFixed(1)}</strong>
              {activeBlock.setupSavedMin ? ` • Reclaimed Setup: +${activeBlock.setupSavedMin} min saved` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenWhyThisSlot && (
              <button
                type="button"
                onClick={() => onOpenWhyThisSlot(activeBlock)}
                className="px-3.5 py-2 rounded-lg bg-[#000075] hover:bg-blue-900 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>💡</span>
                <span>Why This Slot? / Explain AI</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveBlock(null)}
              className="px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-300 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
