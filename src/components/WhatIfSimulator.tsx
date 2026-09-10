"use client";

/**
 * WhatIfSimulator — Clean & Minimal Dispatch Controller Scenario Simulator (Light Mode)
 *
 * Enables Section Controllers to evaluate tactical perturbations:
 *  - Shift goods train paths to free up day maintenance slots
 *  - Simulate monsoon multiplier on rail fracture hazards
 *  - Trigger Single-Line Working (SLW) over crossovers
 */

import React, { useState } from "react";
import type { Train } from "@/types";

export interface SimulationParams {
  selectedTrainNumber:    string;
  goodsTrainShiftMinutes: number;
  monsoonActive:          boolean;
  forceSLW:               boolean;
}

interface Props {
  isOpen:             boolean;
  onClose:            () => void;
  trains:             Train[];
  scheduledBlocks?:   any[];
  onApplySimulation:  (params: SimulationParams) => void;
  isSimulating:       boolean;
}

export default function WhatIfSimulator({
  isOpen,
  onClose,
  trains,
  onApplySimulation,
  isSimulating,
}: Props) {
  const [shiftMinutes, setShiftMinutes] = useState(45);
  const [monsoonAlert, setMonsoonAlert] = useState(false);
  const [forceSLW, setForceSLW]         = useState(true);

  if (!isOpen) return null;

  const freightTrains = trains.filter((t) => t.priority >= 3);
  const [selectedTrain, setSelectedTrain] = useState<string>(freightTrains[0]?.number ?? "FR-701");

  const handleSimulate = () => {
    onApplySimulation({
      selectedTrainNumber: selectedTrain,
      goodsTrainShiftMinutes: shiftMinutes,
      monsoonActive: monsoonAlert,
      forceSLW,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 font-bold text-sm shadow-2xs">
              ⚡
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                Section Controller "What-If" Scenario Simulator
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulate Goods Train Re-Paths, Monsoon Alerts, and Single-Line Working (SLW)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors text-base"
          >
            ✕
          </button>
        </div>

        {/* Simulator Controls */}
        <div className="p-6 space-y-4 text-xs bg-[#f8fafc]">
          
          {/* Scenario 1: Goods Train Path Rescheduling */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                1. Reschedule Freight / Goods Train Slot
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Dynamic Slot Shift
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Target Freight Rake
                </label>
                <select
                  value={selectedTrain}
                  onChange={(e) => setSelectedTrain(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-[#1a3c6e]"
                >
                  {freightTrains.map((t) => (
                    <option key={t.number} value={t.number}>
                      {t.number} — {t.name} (P{t.priority})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Reschedule Offset: <span className="text-[#1a3c6e] font-bold">+{shiftMinutes} min</span>
                </label>
                <input
                  type="range"
                  min="15"
                  max="180"
                  step="15"
                  value={shiftMinutes}
                  onChange={(e) => setShiftMinutes(parseInt(e.target.value))}
                  className="w-full accent-[#1a3c6e] cursor-pointer mt-1"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
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
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
              <span className="font-bold text-slate-900 block text-xs">
                2. Monsoon Hazard Multiplier
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Applies +40% fracture hazard multiplier to Engineering Agent track priority function.
              </p>
              <label className="flex items-center gap-2 text-slate-700 pt-2 cursor-pointer text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={monsoonAlert}
                  onChange={(e) => setMonsoonAlert(e.target.checked)}
                  className="rounded border-slate-300 text-[#1a3c6e]"
                />
                <span>Active Monsoon Season</span>
              </label>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
              <span className="font-bold text-slate-900 block text-xs">
                3. Single-Line Working (SLW)
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Route opposing traffic over adjacent track via crossovers with 15-minute headway buffer.
              </p>
              <label className="flex items-center gap-2 text-slate-700 pt-2 cursor-pointer text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={forceSLW}
                  onChange={(e) => setForceSLW(e.target.checked)}
                  className="rounded border-slate-300 text-[#1a3c6e]"
                />
                <span>Enable Crossover Routing</span>
              </label>
            </div>
          </div>

          {/* Impact preview */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed shadow-2xs">
            <span className="font-bold text-[#1a3c6e]">Live Prediction: </span>
            Rescheduling <span className="font-mono font-bold">{selectedTrain}</span> by +{shiftMinutes} min will conflict with 
            maintenance block windows at UMB–RPJ. The Arbitration Agent will automatically negotiate with the Engineering Agent to shift track machine possession by 45 min and route Paschim SF Express via Single-Line Working.
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 text-xs">
          <span className="text-[11px] text-slate-400">
            Real-time constraint re-evaluation in &lt; 3 seconds
          </span>
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={isSimulating}
              onClick={handleSimulate}
              className="px-5 py-1.5 bg-[#1a3c6e] hover:bg-[#14305a] disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2"
            >
              {isSimulating ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Simulating Ripple Effect…</span>
                </>
              ) : (
                <>
                  <span>⚡</span>
                  <span>Run What-If Simulation</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
