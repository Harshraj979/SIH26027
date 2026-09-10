"use client";

/**
 * DigitalTwinDrawer — Clean & Minimal Corridor Knowledge Graph (Light Mode)
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
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-xl bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl font-sans animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                Corridor Digital Twin Knowledge Graph
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Northern Railway Mainline · New Delhi (0 km) to Ludhiana Jn (312 km)
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors text-base"
          >
            ✕
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 px-5 py-3 border-b border-slate-200 bg-white text-xs overflow-x-auto">
          {["ALL", "CROSSOVER", "OHE_FEEDER", "SIGNAL"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                filterType === type
                  ? "bg-[#1a3c6e] text-white border-[#1a3c6e] shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {type === "ALL" ? "All Assets" : type.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Corridor Topological Strip */}
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Topology Chainage Bar (312 km Mainline)
          </div>
          <div className="relative h-7 bg-white rounded-lg border border-slate-200 flex items-center px-1 shadow-2xs">
            {stations.map((s) => {
              const pct = (s.chainage / 312) * 96;
              return (
                <div
                  key={s.code}
                  title={`${s.name} (${s.chainage} km)`}
                  className="absolute flex flex-col items-center group cursor-pointer"
                  style={{ left: `${pct}%` }}
                >
                  <div className="w-1.5 h-3 bg-[#1a3c6e] rounded-xs group-hover:bg-blue-600 transition-colors" />
                  <span className="text-[8px] font-mono text-slate-500 -mt-0.5 font-bold">
                    {s.code}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Asset Cards */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#f8fafc]">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Geo-Tagged Infrastructure Nodes ({filteredAssets.length})
          </div>

          {filteredAssets.map((asset) => {
            const isCrossover = asset.assetType === "CROSSOVER";
            const isOHE = asset.assetType === "OHE_FEEDER";
            const isSignal = asset.assetType === "SIGNAL";

            return (
              <div
                key={asset.assetCode}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">
                      {isCrossover ? "🔀" : isOHE ? "⚡" : isSignal ? "🚥" : "📦"}
                    </span>
                    <span className="font-bold text-slate-900">{asset.name}</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {asset.assetCode}
                  </span>
                </div>

                <div className="flex gap-4 text-[11px] text-slate-500 pt-0.5">
                  <span>Chainage: <strong className="text-slate-800">km {asset.kmFrom.toFixed(1)}–{asset.kmTo.toFixed(1)}</strong></span>
                  <span>Track: <strong className="text-slate-800">{asset.trackId}</strong></span>
                  <span>Status: <strong className="text-emerald-700 font-semibold">{asset.status}</strong></span>
                </div>

                {/* Dependencies */}
                {asset.dependencies && asset.dependencies.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] text-amber-800 uppercase font-bold tracking-wider block">
                      Cross-Asset Interlock Rules:
                    </span>
                    {asset.dependencies.map((dep, idx) => (
                      <div
                        key={idx}
                        className="text-[11px] text-slate-600 pl-2.5 border-l-2 border-amber-400 leading-snug"
                      >
                        <span className="text-slate-800 font-semibold">{dep.type}: </span>
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
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs flex items-center justify-between text-slate-500">
          <span>Digital Twin Graph Model · SIH26027</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1a3c6e] hover:bg-[#14305a] text-white font-semibold rounded-lg transition-colors"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
}
