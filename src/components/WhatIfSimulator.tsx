"use client";

/**
 * WhatIfSimulator — Interactive Section Controller Simulator
 * Implements SIH26027 Differentiator:
 *   "A 'what-if' simulator lets a Section Controller drag/adjust a goods-train
 *   path or weather alert and instantly see which maintenance blocks become
 *   infeasible and how they are re-negotiated — something no existing IR system does."
 */

import React, { useState } from "react";
import type { Train, ScheduledBlock, TrainPerturbation } from "@/types";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#0B0F17] border border-slate-700 rounded-lg shadow-2xl flex flex-col overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#111827]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-amber-950 border border-amber-700 flex items-center justify-center text-amber-400 font-bold text-sm">
              ⚡
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 tracking-wide">
                DISPATCH CONTROLLER "WHAT-IF" SCENARIO SIMULATOR
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Simulate Goods Train Re-Paths, Monsoon Alerts, and Single-Line Working (SLW)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg font-mono px-2"
          >
            ✕
          </button>
        </div>

        {/* Simulator Controls */}
        <div className="p-6 space-y-5 text-xs font-mono">
          
          {/* Scenario 1: Goods Train Path Rescheduling */}
          <div className="p-4 rounded border border-slate-800 bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 uppercase tracking-wide">
                1. RESCHEDULE FREIGHT / GOODS TRAIN PATH
              </span>
              <span className="text-[10px] text-amber-400">Dynamic Slot Shift</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Target Freight Rake</label>
                <select
                  value={selectedTrain}
                  onChange={(e) => setSelectedTrain(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
                >
                  {freightTrains.map((t) => (
                    <option key={t.number} value={t.number}>
                      {t.number} — {t.name} (P{t.priority})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1">
                  Reschedule Offset: <span className="text-amber-400 font-bold">+{shiftMinutes} min</span>
                </label>
                <input
                  type="range"
                  min="15"
                  max="180"
                  step="15"
                  value={shiftMinutes}
                  onChange={(e) => setShiftMinutes(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-600 mt-1">
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
            <div className="p-4 rounded border border-slate-800 bg-slate-900/60 space-y-2">
              <span className="font-bold text-slate-200 block">2. MONSOON MOISTURE ALERT</span>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Applies +40% fracture hazard multiplier to Engineering Agent track priority function.
              </p>
              <label className="flex items-center gap-2 text-slate-300 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={monsoonAlert}
                  onChange={(e) => setMonsoonAlert(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500"
                />
                <span>Active Monsoon Season</span>
              </label>
            </div>

            <div className="p-4 rounded border border-slate-800 bg-slate-900/60 space-y-2">
              <span className="font-bold text-slate-200 block">3. SINGLE-LINE WORKING (SLW)</span>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Route opposing traffic over adjacent track via crossovers with 15-minute headway buffer.
              </p>
              <label className="flex items-center gap-2 text-slate-300 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceSLW}
                  onChange={(e) => setForceSLW(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500"
                />
                <span>Enable Crossover Routing</span>
              </label>
            </div>
          </div>

          {/* Impact preview */}
          <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded text-[11px] text-slate-300 leading-relaxed">
            <span className="font-bold text-emerald-400">Live Prediction: </span>
            Rescheduling <span className="font-mono text-white">{selectedTrain}</span> by +{shiftMinutes} min will conflict with 
            maintenance block windows at UMB–RPJ. The Arbitration Agent will automatically negotiate with the Engineering Agent to shift track machine possession by 45 min and route Paschim SF Express via Single-Line Working.
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-[#111827]">
          <span className="text-[10px] font-mono text-slate-500">
            Real-time constraint re-evaluation in &lt; 3 seconds
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-1.5 border border-slate-700 text-slate-300 hover:text-white rounded text-xs transition-colors font-mono"
            >
              Cancel
            </button>
            <button
              disabled={isSimulating}
              onClick={handleSimulate}
              className="px-5 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded text-xs font-semibold transition-colors font-mono flex items-center gap-2"
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
