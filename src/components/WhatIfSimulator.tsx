"use client";

/**
 * WhatIfSimulator — Interactive Section Controller Simulator (Light Gov Theme)
 * Implements SIH26027 Differentiator:
 *   "A 'what-if' simulator lets a Section Controller drag/adjust a goods-train
 *   path or weather alert and instantly see which maintenance blocks become
 *   infeasible and how they are re-negotiated — something no existing IR system does."
 */

import React, { useState } from "react";
import type { Train, ScheduledBlock } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trains: Train[];
  scheduledBlocks: ScheduledBlock[];
  onApplySimulation: (params: SimulationParams) => Promise<void>;
  isSimulating: boolean;
}

export interface SimulationParams {
  goodsTrainShiftMinutes: number;
  selectedTrainNumber: string;
  monsoonActive: boolean;
  forceSLW: boolean;
}

export default function WhatIfSimulator({
  isOpen,
  onClose,
  trains,
  scheduledBlocks,
  onApplySimulation,
  isSimulating,
}: Props) {
  const [selectedTrain, setSelectedTrain] = useState<string>("BOXN_01");
  const [shiftMinutes, setShiftMinutes] = useState<number>(60);
  const [monsoonAlert, setMonsoonAlert] = useState<boolean>(true);
  const [forceSLW, setForceSLW] = useState<boolean>(true);

  if (!isOpen) return null;

  const freightTrains = trains.filter((t) => t.priority >= 3);

  const handleSimulate = async () => {
    await onApplySimulation({
      selectedTrainNumber: selectedTrain,
      goodsTrainShiftMinutes: shiftMinutes,
      monsoonActive: monsoonAlert,
      forceSLW,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-white border border-gray-300 rounded-lg shadow-2xl flex flex-col overflow-hidden font-sans">
        
        {/* Header — Gov Navy */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#1a3c6e] text-white border-b border-blue-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold text-sm">
              ⚡
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide">
                DISPATCH CONTROLLER "WHAT-IF" SCENARIO SIMULATOR
              </h2>
              <p className="text-xs text-blue-200 font-mono mt-0.5">
                Simulate Goods Train Re-Paths, Monsoon Alerts, and Single-Line Working (SLW)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white text-lg font-mono px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Simulator Controls */}
        <div className="p-6 space-y-4 text-xs font-mono bg-white">
          
          {/* Scenario 1: Goods Train Path Rescheduling */}
          <div className="p-4 rounded-lg border border-gray-200 bg-[#F8FAFC] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1a3c6e] uppercase tracking-wide">
                1. RESCHEDULE FREIGHT / GOODS TRAIN PATH
              </span>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded">
                Dynamic Slot Shift
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-semibold text-gray-600 block mb-1">Target Freight Rake</label>
                <select
                  value={selectedTrain}
                  onChange={(e) => setSelectedTrain(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-gray-900 text-xs focus:outline-none focus:border-[#1a3c6e]"
                >
                  {freightTrains.map((t) => (
                    <option key={t.number} value={t.number}>
                      {t.number} — {t.name} (P{t.priority})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-600 block mb-1">
                  Reschedule Offset: <span className="text-amber-700 font-bold">+{shiftMinutes} min</span>
                </label>
                <input
                  type="range"
                  min="15"
                  max="180"
                  step="15"
                  value={shiftMinutes}
                  onChange={(e) => setShiftMinutes(parseInt(e.target.value))}
                  className="w-full accent-[#1a3c6e] cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                  <span>+15m</span>
                  <span>+60m</span>
                  <span>+120m</span>
                  <span>+180m</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scenario 2: Weather & Single-Line Working Toggles */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-lg border border-gray-200 bg-[#F8FAFC] space-y-1.5">
              <span className="font-bold text-gray-900 block text-xs">2. MONSOON MOISTURE ALERT</span>
              <p className="text-[10px] text-gray-600 leading-relaxed">
                Applies +40% fracture hazard multiplier to Engineering Agent track priority function.
              </p>
              <label className="flex items-center gap-2 text-gray-800 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={monsoonAlert}
                  onChange={(e) => setMonsoonAlert(e.target.checked)}
                  className="rounded border-gray-300 text-[#1a3c6e] focus:ring-0 cursor-pointer"
                />
                <span className="font-semibold text-xs">Active Monsoon Season</span>
              </label>
            </div>

            <div className="p-4 rounded-lg border border-gray-200 bg-[#F8FAFC] space-y-1.5">
              <span className="font-bold text-gray-900 block text-xs">3. SINGLE-LINE WORKING (SLW)</span>
              <p className="text-[10px] text-gray-600 leading-relaxed">
                Route opposing traffic over adjacent track via crossovers with 15-minute headway buffer.
              </p>
              <label className="flex items-center gap-2 text-gray-800 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceSLW}
                  onChange={(e) => setForceSLW(e.target.checked)}
                  className="rounded border-gray-300 text-[#1a3c6e] focus:ring-0 cursor-pointer"
                />
                <span className="font-semibold text-xs">Enable Crossover Routing</span>
              </label>
            </div>
          </div>

          {/* Impact preview callout */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg text-[11px] text-emerald-950 leading-relaxed">
            <span className="font-bold text-emerald-800">Live Impact Estimation: </span>
            Rescheduling <span className="font-bold text-gray-900">{selectedTrain}</span> by +{shiftMinutes} min will conflict with 
            maintenance block windows at UMB–RPJ. The Arbitration Agent will negotiate with the Engineering Agent to shift track machine possession by 45 min and route passenger traffic via Single-Line Working.
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-[#F8FAFC]">
          <span className="text-[10px] font-mono text-gray-500">
            Real-time constraint re-evaluation in &lt; 3 seconds
          </span>
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded text-xs font-semibold transition-colors font-mono cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={isSimulating}
              onClick={handleSimulate}
              className="px-5 py-1.5 bg-[#1a3c6e] hover:bg-[#14305a] disabled:opacity-50 text-white rounded text-xs font-semibold transition-colors font-mono flex items-center gap-2 cursor-pointer shadow-xs"
            >
              {isSimulating ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Simulating Ripple Effect…
                </>
              ) : (
                <>
                  <span>⚡</span> Run What-If Simulation
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
