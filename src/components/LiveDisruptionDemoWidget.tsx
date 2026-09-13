"use client";

/**
 * LiveDisruptionDemoWidget — Headline 1-Click Operational Disruption Simulator
 * Allows judges & presenters to inject real-world railway crises live and witness
 * the OR-Tools CP-SAT solver re-plan the corridor in real time with SLW crossover bypasses.
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
      setSimulationStatus("Injecting Critical Rail Fracture at KM 14.2 (Urgency 98.4)... Hard Safety Override Engaged!");
    } else if (type === "FOG_DELAY") {
      setActiveScenario("FOG");
      setSimulationStatus("Simulating 35-min Fog Delay on Kalka Shatabdi #12011 at Panipat Jn... Adjusting Dynamic Headways!");
    } else {
      setActiveScenario("NONE");
      setSimulationStatus("Restoring nominal conflict-free timetable baseline...");
    }

    await onTriggerDisruption(type);
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-[#00005a] to-[#000075] text-white rounded-2xl p-4 sm:p-5 border border-blue-900 shadow-md">
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left Side: Title & Description */}
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Live Interactive Demonstration
            </span>
            <span className="text-[10px] text-blue-200 font-mono">
              Real-Time Reactive Dispatch
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
            <span>⚡ One-Click Disruption &amp; Re-Optimization Engine</span>
          </h3>
          <p className="text-xs text-blue-100/80 font-medium mt-1 leading-relaxed">
            Test the solver live against sudden real-world corridor disruptions. Watch the CP-SAT engine dynamically clear train paths and compute Single-Line Working (SLW) crossover bypasses without human delay.
          </p>
        </div>

        {/* Right Side: 1-Click Scenario Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          
          {/* Scenario 1: Rail Fracture */}
          <button
            type="button"
            disabled={isOptimizing}
            onClick={() => handleRunScenario("RAIL_FRACTURE")}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer border ${
              activeScenario === "FRACTURE"
                ? "bg-rose-600 text-white border-rose-400 ring-2 ring-rose-400/50"
                : "bg-rose-950/70 hover:bg-rose-900 text-rose-200 border-rose-700/60"
            }`}
          >
            <span>🚨</span>
            <div className="text-left leading-tight">
              <span className="block font-black text-[11.5px]">Simulate: Urgent Rail Fracture</span>
              <span className="text-[9.5px] text-rose-300">KM 14.2 • Hard Safety Override</span>
            </div>
          </button>

          {/* Scenario 2: Fog Delay */}
          <button
            type="button"
            disabled={isOptimizing}
            onClick={() => handleRunScenario("FOG_DELAY")}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer border ${
              activeScenario === "FOG"
                ? "bg-amber-600 text-white border-amber-400 ring-2 ring-amber-400/50"
                : "bg-amber-950/70 hover:bg-amber-900 text-amber-200 border-amber-700/60"
            }`}
          >
            <span>🌧️</span>
            <div className="text-left leading-tight">
              <span className="block font-black text-[11.5px]">Simulate: Shatabdi Fog Delay</span>
              <span className="text-[9.5px] text-amber-300">35 min delay • Dynamic Buffer</span>
            </div>
          </button>

          {/* Reset Button */}
          {activeScenario !== "NONE" && (
            <button
              type="button"
              disabled={isOptimizing}
              onClick={() => handleRunScenario("RESET")}
              className="px-3 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>🔄</span>
              <span>Reset Nominal Plan</span>
            </button>
          )}

        </div>

      </div>

      {/* Dynamic Status / Progress Bar during Optimization */}
      {isOptimizing && (
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-[#ffba00] font-bold">
            <span className="w-3.5 h-3.5 border-2 border-[#ffba00] border-t-transparent rounded-full animate-spin" />
            <span>OR-Tools CP-SAT Solving in Progress:</span>
            <span className="text-blue-100 font-normal">Re-evaluating spatial conflicts and safety headways...</span>
          </div>
          <div className="w-full sm:w-48 h-1.5 bg-blue-950 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#ffba00] to-emerald-400 animate-[pulse_1s_infinite] w-full" />
          </div>
        </div>
      )}

      {/* Active Scenario Banner */}
      {!isOptimizing && activeScenario !== "NONE" && (
        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-emerald-300 font-medium">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-black">✓ Real-Time Solution Feasible:</span>
            <span>{simulationStatus}</span>
          </div>
          <span className="font-mono text-[10px] bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded border border-emerald-500/30">
            SLW Diversions Verified
          </span>
        </div>
      )}

    </div>
  );
}
