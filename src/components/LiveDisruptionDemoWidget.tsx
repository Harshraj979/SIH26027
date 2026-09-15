"use client";

/**
 * LiveDisruptionDemoWidget — Operational Contingency & Disruption Simulator
 * Allows operational staff and evaluators to inject unplanned corridor events
 * and observe real-time schedule re-optimization with headway preservation.
 */

import React, { useState } from "react";

interface Props {
  onTriggerDisruption: (type: "RAIL_FRACTURE" | "FOG_DELAY" | "RESET") => Promise<void>;
  isOptimizing: boolean;
}

export default function LiveDisruptionDemoWidget({
  onTriggerDisruption,
  isOptimizing,
}: Props) {
  const [activeScenario, setActiveScenario] = useState<"NONE" | "FRACTURE" | "FOG">("NONE");
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);

  const handleRunScenario = async (type: "RAIL_FRACTURE" | "FOG_DELAY" | "RESET") => {
    if (isOptimizing) return;

    if (type === "RAIL_FRACTURE") {
      setActiveScenario("FRACTURE");
      setSimulationStatus("Critical Rail Fracture logged at KM 14.2 (UP FAST). Emergency possession assigned with Single Line Working (SLW) crossover bypass.");
    } else if (type === "FOG_DELAY") {
      setActiveScenario("FOG");
      setSimulationStatus("35-minute weather arrival delay simulated on Kalka Shatabdi #12011 at Panipat Jn. Dynamic safety headways maintained.");
    } else {
      setActiveScenario("NONE");
      setSimulationStatus("Nominal corridor timetable and maintenance possession baseline restored.");
    }

    await onTriggerDisruption(type);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Context & Description */}
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Contingency Management Console
            </span>
            <span className="text-xs text-slate-500">• Section Controller Test Mode</span>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            Corridor Disruption &amp; Dynamic Re-Dispatch Simulator
          </h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Test how the scheduling engine responds to sudden track failures or rolling stock delays. The solver isolates the affected line, safely bypasses traffic via adjacent tracks, and reschedules lower-priority possessions.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          
          {/* Scenario 1: Rail Fracture */}
          <button
            type="button"
            disabled={isOptimizing}
            onClick={() => handleRunScenario("RAIL_FRACTURE")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all border cursor-pointer text-left ${
              activeScenario === "FRACTURE"
                ? "bg-rose-700 text-white border-rose-800 ring-2 ring-rose-300"
                : "bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-200"
            }`}
          >
            <span className="block font-bold">Rail Fracture Simulation</span>
            <span className="text-[10px] block opacity-80">KM 14.2 UP FAST • Urgent Possession</span>
          </button>

          {/* Scenario 2: Fog Delay */}
          <button
            type="button"
            disabled={isOptimizing}
            onClick={() => handleRunScenario("FOG_DELAY")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all border cursor-pointer text-left ${
              activeScenario === "FOG"
                ? "bg-amber-700 text-white border-amber-800 ring-2 ring-amber-300"
                : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200"
            }`}
          >
            <span className="block font-bold">Weather Delay Simulation</span>
            <span className="text-[10px] block opacity-80">+35 min #12011 Shatabdi • Buffer Test</span>
          </button>

          {/* Reset Button */}
          {activeScenario !== "NONE" && (
            <button
              type="button"
              disabled={isOptimizing}
              onClick={() => handleRunScenario("RESET")}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-all cursor-pointer"
            >
              Reset to Baseline
            </button>
          )}

        </div>

      </div>

      {/* Solving State Indicator */}
      {isOptimizing && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2.5 text-xs text-slate-700">
          <span className="w-3.5 h-3.5 border-2 border-[#000075] border-t-transparent rounded-full animate-spin" />
          <span className="font-semibold text-[#000075]">Re-computing timetable:</span>
          <span>Resolving spatial track conflicts and timetable headways…</span>
        </div>
      )}

      {/* Active Scenario Summary */}
      {!isOptimizing && activeScenario !== "NONE" && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
            <span>{simulationStatus}</span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded shrink-0">
            Re-Dispatch Solution Active
          </span>
        </div>
      )}

    </div>
  );
}
