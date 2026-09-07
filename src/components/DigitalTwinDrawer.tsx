"use client";

/**
 * DigitalTwinDrawer — Visual Corridor Knowledge Graph
 * Displays geo-tagged corridor assets (Tracks, Signals, OHE Feeders, Crossovers)
 * and physical/electrical cross-asset dependencies along NDLS–LDH (312 km).
 */

import React, { useState } from "react";
import type { DigitalTwinAssetData, Station } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  stations: Station[];
  assets: DigitalTwinAssetData[];
}

export default function DigitalTwinDrawer({
  isOpen,
  onClose,
  stations,
  assets,
}: Props) {
  const [filterType, setFilterType] = useState<string>("ALL");

  if (!isOpen) return null;

  const filteredAssets = filterType === "ALL"
    ? assets
    : assets.filter((a) => a.assetType === filterType);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-[#0B0F17] border-l border-slate-700 h-full flex flex-col shadow-2xl font-sans">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-[#111827] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-sm font-bold text-slate-100 tracking-wide">
                CORRIDOR DIGITAL TWIN KNOWLEDGE GRAPH
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Northern Railway Mainline · New Delhi (0 km) to Ludhiana Jn (312 km)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg font-mono px-2"
          >
            ✕
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 px-5 py-3 border-b border-slate-800 bg-[#0B0F17] text-xs font-mono overflow-x-auto">
          {["ALL", "CROSSOVER", "OHE_FEEDER", "SIGNAL"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded text-[11px] transition-colors ${
                filterType === type
                  ? "bg-slate-700 text-emerald-400 font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Corridor Topological Strip */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/80">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">
            Topology Chainage Bar (312 km)
          </div>
          <div className="relative h-6 bg-slate-900 rounded border border-slate-800 flex items-center px-1">
            {stations.map((s) => {
              const pct = (s.chainage / 312) * 96;
              return (
                <div
                  key={s.code}
                  title={`${s.name} (${s.chainage} km)`}
                  className="absolute flex flex-col items-center group cursor-pointer"
                  style={{ left: `${pct}%` }}
                >
                  <div className="w-1.5 h-3 bg-emerald-500 rounded-sm" />
                  <span className="text-[8px] font-mono text-slate-400 -mt-0.5">
                    {s.code}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Asset Cards */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            Geo-Tagged Infrastructure Nodes ({filteredAssets.length})
          </div>

          {filteredAssets.map((asset) => {
            const isCrossover = asset.assetType === "CROSSOVER";
            const isOHE = asset.assetType === "OHE_FEEDER";
            const isSignal = asset.assetType === "SIGNAL";

            return (
              <div
                key={asset.assetCode}
                className="p-3.5 rounded border border-slate-800 bg-slate-900/50 hover:bg-slate-900 transition-colors text-xs font-mono space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {isCrossover ? "🔀" : isOHE ? "⚡" : isSignal ? "🚥" : "📦"}
                    </span>
                    <span className="font-bold text-slate-200">{asset.name}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {asset.assetCode}
                  </span>
                </div>

                <div className="flex gap-4 text-[10px] text-slate-400 pt-0.5">
                  <span>CHAINAGE: <strong className="text-slate-200">{asset.kmFrom.toFixed(1)}–{asset.kmTo.toFixed(1)} km</strong></span>
                  <span>TRACK: <strong className="text-slate-200">{asset.trackId}</strong></span>
                  <span>STATUS: <strong className="text-emerald-400">{asset.status}</strong></span>
                </div>

                {/* Dependencies */}
                {asset.dependencies && asset.dependencies.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1">
                    <span className="text-[9px] text-amber-400/90 uppercase font-semibold block">
                      Cross-Asset Interlock Rules:
                    </span>
                    {asset.dependencies.map((dep, idx) => (
                      <div
                        key={idx}
                        className="text-[10px] text-slate-400 pl-2 border-l-2 border-amber-500/50 leading-snug"
                      >
                        <span className="text-slate-300 font-semibold">{dep.type}: </span>
                        {dep.description}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#111827] text-xs font-mono flex items-center justify-between text-slate-500">
          <span>Digital Twin Core · SIH26027</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
}
