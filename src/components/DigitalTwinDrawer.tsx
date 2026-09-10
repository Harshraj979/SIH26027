"use client";

/**
 * DigitalTwinDrawer — Visual Corridor Knowledge Graph (Light Gov Theme)
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white border-l border-gray-300 h-full flex flex-col shadow-2xl font-sans">
        
        {/* Header — Gov Navy */}
        <div className="p-4 bg-[#1a3c6e] text-white border-b border-blue-900 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-sm font-bold tracking-wide">
                CORRIDOR DIGITAL TWIN KNOWLEDGE GRAPH
              </h2>
            </div>
            <p className="text-xs text-blue-200 font-mono mt-0.5">
              Northern Railway Mainline · New Delhi (0 km) to Ludhiana Jn (312 km)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white text-lg font-mono px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 px-4 py-2.5 border-b border-gray-200 bg-[#F8FAFC] text-xs font-mono overflow-x-auto">
          {["ALL", "CROSSOVER", "OHE_FEEDER", "SIGNAL"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                filterType === type
                  ? "bg-[#1a3c6e] text-white font-bold shadow-xs"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Corridor Topological Strip */}
        <div className="px-5 py-3 border-b border-gray-200 bg-white">
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2 font-semibold">
            Topology Chainage Bar (312 km)
          </div>
          <div className="relative h-7 bg-[#F1F5F9] rounded border border-gray-300 flex items-center px-1">
            {stations.map((s) => {
              const pct = (s.chainage / 312) * 94;
              return (
                <div
                  key={s.code}
                  title={`${s.name} (${s.chainage} km)`}
                  className="absolute flex flex-col items-center group cursor-pointer"
                  style={{ left: `${pct}%` }}
                >
                  <div className="w-1.5 h-3.5 bg-emerald-600 rounded-xs" />
                  <span className="text-[8px] font-mono text-gray-600 font-bold -mt-0.5">
                    {s.code}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Asset Cards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-bold">
            Geo-Tagged Infrastructure Nodes ({filteredAssets.length})
          </div>

          {filteredAssets.map((asset) => {
            const isCrossover = asset.assetType === "CROSSOVER";
            const isOHE       = asset.assetType === "OHE_FEEDER";
            const isSignal    = asset.assetType === "SIGNAL";

            return (
              <div
                key={asset.assetCode}
                className="p-3.5 rounded-lg border border-gray-200 bg-white hover:border-[#1a3c6e] transition-colors text-xs font-mono space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">
                      {isCrossover ? "🔀" : isOHE ? "⚡" : isSignal ? "🚥" : "📦"}
                    </span>
                    <span className="font-bold text-gray-900">{asset.name}</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-300">
                    {asset.assetCode}
                  </span>
                </div>

                <div className="flex gap-4 text-[10px] text-gray-600 pt-0.5">
                  <span>CHAINAGE: <strong className="text-gray-900">{asset.kmFrom.toFixed(1)}–{asset.kmTo.toFixed(1)} km</strong></span>
                  <span>TRACK: <strong className="text-gray-900">{asset.trackId}</strong></span>
                  <span>STATUS: <strong className="text-emerald-700">{asset.status}</strong></span>
                </div>

                {/* Dependencies */}
                {asset.dependencies && asset.dependencies.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100 space-y-1.5">
                    <span className="text-[9px] text-amber-800 uppercase font-bold block">
                      Cross-Asset Interlock Rules:
                    </span>
                    {asset.dependencies.map((dep, idx) => (
                      <div
                        key={idx}
                        className="text-[10px] text-gray-700 pl-2.5 border-l-2 border-amber-500 bg-amber-50/50 py-1 pr-1.5 rounded-r leading-relaxed"
                      >
                        <span className="font-bold text-gray-900">{dep.type}: </span>
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
        <div className="p-3.5 border-t border-gray-200 bg-white text-xs font-mono flex items-center justify-between text-gray-500">
          <span>Digital Twin Core · SIH26027</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1a3c6e] hover:bg-[#14305a] text-white rounded text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
}
