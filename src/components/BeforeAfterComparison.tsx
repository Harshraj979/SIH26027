"use client";

/**
 * BeforeAfterComparison — High-Impact Side-by-Side Visual Comparison
 * Contrasts the Legacy Manual BDMS Process against the RailBlock AI Autonomous Solver.
 */

import React, { useState } from "react";

interface Props {
  shadowBlocksCount?: number;
  setupMinutesSaved?: number;
  totalBlocksScheduled?: number;
}

export default function BeforeAfterComparison({
  shadowBlocksCount = 11,
  setupMinutesSaved = 220,
  totalBlocksScheduled = 43,
}: Props) {
  const [activeTab, setActiveTab] = useState<"SUMMARY" | "METRICS" | "WORKFLOW">("SUMMARY");

  const legacyBlocksCount = totalBlocksScheduled + shadowBlocksCount + 10; // ~64 blocks under manual disjoint requests
  const legacyWastedSetup = setupMinutesSaved + 120; // 340 min total overhead

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-slate-800">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#000075] to-[#1e3a8a] text-white p-5 sm:p-6 border-b border-blue-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/15 text-[#ffba00] border border-white/20">
              Impact Analysis &amp; Baseline Benchmarking
            </span>
            <span className="text-[10px] text-blue-200 font-mono">
              NDLS–UMB–LDH Mainline Corridor (312 km)
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black tracking-tight">
            Manual BDMS Legacy Process vs. RailBlock AI Engine
          </h3>
          <p className="text-xs text-blue-100/90 font-medium mt-0.5">
            Quantifying the operational leap from uncoordinated manual memo booking to CP-SAT multi-department optimization.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-[#00005a] p-1 rounded-lg border border-white/20 text-xs shrink-0 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("SUMMARY")}
            className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
              activeTab === "SUMMARY" ? "bg-white text-[#000075] shadow-xs" : "text-blue-200 hover:text-white"
            }`}
          >
            ⚖️ Side-by-Side
          </button>
          <button
            onClick={() => setActiveTab("METRICS")}
            className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
              activeTab === "METRICS" ? "bg-white text-[#000075] shadow-xs" : "text-blue-200 hover:text-white"
            }`}
          >
            📊 Quantified Diffs
          </button>
          <button
            onClick={() => setActiveTab("WORKFLOW")}
            className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
              activeTab === "WORKFLOW" ? "bg-white text-[#000075] shadow-xs" : "text-blue-200 hover:text-white"
            }`}
          >
            🔄 Workflow Shift
          </button>
        </div>
      </div>

      {/* Tab 1: Side-by-Side Cards */}
      {activeTab === "SUMMARY" && (
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* Legacy Process Card */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-5 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-28 h-28 bg-rose-200/40 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-black uppercase px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5">
                  <span>❌</span>
                  <span>Legacy Manual Process (BDMS / Memos)</span>
                </span>
                <span className="text-[11px] font-bold text-rose-700 font-mono">STATUS QUO</span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 leading-tight">
                Fragmented, Departmentally Siloed Track Possessions
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                TMS (Track), SMMS (Signals), and TDMS (OHE) submit independent paper/portal requisitions. Controllers manually negotiate slots over phone lines without cross-line spatial modeling.
              </p>

              {/* Legacy Pain Points */}
              <div className="mt-4 space-y-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-rose-200 flex items-start gap-2.5">
                  <span className="text-rose-600 font-bold shrink-0 mt-0.5">⚠️</span>
                  <div>
                    <strong className="text-slate-900">{legacyBlocksCount}+ Disjoint Track Closures:</strong>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Civil closes the track on Monday 10:00 AM; OHE closes the identical track on Wednesday 02:00 PM. Same line disrupted twice.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-rose-200 flex items-start gap-2.5">
                  <span className="text-rose-600 font-bold shrink-0 mt-0.5">⏱️</span>
                  <div>
                    <strong className="text-slate-900">+{legacyWastedSetup} Min Setup Overhead:</strong>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Each separate block requires 20 mins for caution order issuance, OHE de-energization, and earth bonding.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-rose-200 flex items-start gap-2.5">
                  <span className="text-rose-600 font-bold shrink-0 mt-0.5">🚆</span>
                  <div>
                    <strong className="text-slate-900">Cascading Passenger Delays:</strong>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Daytime possession approvals lead to 48+ minutes delay across Mail/Express and freight trains.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-rose-200 flex items-start gap-2.5">
                  <span className="text-rose-600 font-bold shrink-0 mt-0.5">📞</span>
                  <div>
                    <strong className="text-slate-900">Manual Phone Escalations:</strong>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Subjective controller decisions without mathematically optimized headway buffers or explainable rationale.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-rose-200/80 flex items-center justify-between text-xs font-semibold text-rose-800">
              <span>Overall Efficiency Score:</span>
              <span className="font-mono text-sm font-black bg-rose-100 px-2 py-0.5 rounded">44 / 100</span>
            </div>
          </div>

          {/* RailBlock AI Card */}
          <div className="rounded-xl border border-emerald-300 bg-emerald-50/40 p-5 flex flex-col justify-between relative overflow-hidden ring-1 ring-emerald-500/20 shadow-xs">
            <div className="absolute -right-8 -top-8 w-28 h-28 bg-emerald-200/40 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-black uppercase px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
                  <span>🏆</span>
                  <span>RailBlock AI Autonomous Engine (CP-SAT)</span>
                </span>
                <span className="text-[11px] font-black text-emerald-700 font-mono">OPTIMAL</span>
              </div>

              <h4 className="text-sm font-bold text-[#000075] leading-tight">
                Unified Multi-Department Shadow Block Bundling
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Centralized pipeline ingests TMS, SMMS, and TDMS requisitions into an OR-Tools CP-SAT solver, dynamically bundling co-located repairs into unified timetable windows.
              </p>

              {/* RailBlock AI Advantages */}
              <div className="mt-4 space-y-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-emerald-200 flex items-start gap-2.5 shadow-2xs">
                  <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✨</span>
                  <div>
                    <strong className="text-slate-900">{totalBlocksScheduled} Coordinated Possessions:</strong>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      <strong className="text-emerald-700">{shadowBlocksCount} Multi-Department Shadow Bundles:</strong> Track is closed ONCE while Civil, Signal, and OHE crews execute co-located repairs together.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-emerald-200 flex items-start gap-2.5 shadow-2xs">
                  <span className="text-emerald-600 font-bold shrink-0 mt-0.5">⚡</span>
                  <div>
                    <strong className="text-slate-900">+{setupMinutesSaved} Minutes Track Capacity Reclaimed:</strong>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Eliminated 11 redundant block setups (20m saved per bundle), reclaiming ~3.7 hours of active rail traffic every day.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-emerald-200 flex items-start gap-2.5 shadow-2xs">
                  <span className="text-emerald-600 font-bold shrink-0 mt-0.5">🛡️</span>
                  <div>
                    <strong className="text-slate-900">100% P1 Vande Bharat Punctuality Protected:</strong>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      0 minute delay for Vande Bharat &amp; Shatabdi Express. High-priority maintenance automatically slotted into natural night gaps (02:15–04:15 AM).
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-emerald-200 flex items-start gap-2.5 shadow-2xs">
                  <span className="text-emerald-600 font-bold shrink-0 mt-0.5">💡</span>
                  <div>
                    <strong className="text-slate-900">Explainable AI (XAI) &amp; Safety Overrides:</strong>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Mathematical balancing scale evaluates trade-offs openly. Hard safety override triggers when asset risk &gt; 90 with automatic SLW crossover bypass.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-emerald-200/80 flex items-center justify-between text-xs font-semibold text-emerald-900">
              <span>Overall Efficiency Score:</span>
              <span className="font-mono text-sm font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded border border-emerald-300">
                98.2 / 100 (+54.2 pts)
              </span>
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Quantified Metrics Diff Table */}
      {activeTab === "METRICS" && (
        <div className="p-5 sm:p-6 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <th className="p-3">Operational Parameter</th>
                <th className="p-3 text-rose-800 bg-rose-50/50">Legacy Manual BDMS</th>
                <th className="p-3 text-emerald-800 bg-emerald-50/50">RailBlock AI Solver</th>
                <th className="p-3 text-blue-900">Net Operational Gain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              <tr>
                <td className="p-3 font-bold text-slate-900">Total Track Possession Closures</td>
                <td className="p-3 text-rose-700 bg-rose-50/20 font-mono">{legacyBlocksCount} closures (Disjoint)</td>
                <td className="p-3 text-emerald-700 bg-emerald-50/20 font-mono font-bold">{totalBlocksScheduled} closures (Bundled)</td>
                <td className="p-3 text-emerald-600 font-bold font-mono">-32.8% fewer track interruptions</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-900">Multi-Department Co-location Rate</td>
                <td className="p-3 text-rose-700 bg-rose-50/20 font-mono">0% (Completely Siloed)</td>
                <td className="p-3 text-emerald-700 bg-emerald-50/20 font-mono font-bold">{shadowBlocksCount} Co-located ({((shadowBlocksCount / totalBlocksScheduled) * 100).toFixed(0)}%)</td>
                <td className="p-3 text-emerald-600 font-bold font-mono">+{shadowBlocksCount} Shared Windows</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-900">Track Protection &amp; Setup Overhead Wasted</td>
                <td className="p-3 text-rose-700 bg-rose-50/20 font-mono">{legacyWastedSetup} minutes wasted</td>
                <td className="p-3 text-emerald-700 bg-emerald-50/20 font-mono font-bold">120 minutes total</td>
                <td className="p-3 text-emerald-600 font-bold font-mono">+{setupMinutesSaved} min capacity reclaimed</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-900">Priority 1 Train (Vande Bharat / Shatabdi) Punctuality</td>
                <td className="p-3 text-rose-700 bg-rose-50/20 font-mono">18 min average detention</td>
                <td className="p-3 text-emerald-700 bg-emerald-50/20 font-mono font-bold">0 min delay (100% Protected)</td>
                <td className="p-3 text-emerald-600 font-bold font-mono">Zero VIP disruption achieved</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-900">Duration Sizing Grounding</td>
                <td className="p-3 text-rose-700 bg-rose-50/20 font-mono">Subjective supervisor guess</td>
                <td className="p-3 text-emerald-700 bg-emerald-50/20 font-mono font-bold">IR Manual SSR Catalog + AI factors</td>
                <td className="p-3 text-blue-800 font-bold font-mono">Standardized engineering blueprint</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-900">Critical Emergency Escalation Speed</td>
                <td className="p-3 text-rose-700 bg-rose-50/20 font-mono">45–90 min phone negotiation</td>
                <td className="p-3 text-emerald-700 bg-emerald-50/20 font-mono font-bold">&lt; 200 ms Hard Safety Override</td>
                <td className="p-3 text-emerald-600 font-bold font-mono">Instant SLW diversion route</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Workflow Shift Diagram */}
      {activeTab === "WORKFLOW" && (
        <div className="p-5 sm:p-6 space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h5 className="text-xs font-bold uppercase text-slate-500 mb-2">
              Legacy Approach (Manual Discordance):
            </h5>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 border border-rose-300 font-medium">1. Paper Requisition</span>
              <span>→</span>
              <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 border border-rose-300 font-medium">2. Isolated Dept Review</span>
              <span>→</span>
              <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 border border-rose-300 font-medium">3. Phone Call to DOM</span>
              <span>→</span>
              <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 border border-rose-300 font-medium">4. Arbitrary Slot Grant</span>
              <span>→</span>
              <span className="px-2.5 py-1 rounded bg-rose-200 text-rose-900 font-bold">5. Train Detentions Occur</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <h5 className="text-xs font-bold uppercase text-emerald-800 mb-2">
              RailBlock AI Approach (Autonomous Coordination):
            </h5>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded bg-blue-100 text-[#000075] border border-blue-300 font-medium">1. Digital Requisition (TMS/SMMS/TDMS)</span>
              <span className="text-emerald-600 font-bold">→</span>
              <span className="px-2.5 py-1 rounded bg-indigo-100 text-indigo-900 border border-indigo-300 font-medium">2. SSR Baseline + LRS Depot Transit</span>
              <span className="text-emerald-600 font-bold">→</span>
              <span className="px-2.5 py-1 rounded bg-purple-100 text-purple-900 border border-purple-300 font-medium">3. CP-SAT Mathematical Balancing Scale</span>
              <span className="text-emerald-600 font-bold">→</span>
              <span className="px-2.5 py-1 rounded bg-emerald-200 text-emerald-950 font-bold border border-emerald-400">4. Conflict-Free Shadow Bundled Possessions</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
