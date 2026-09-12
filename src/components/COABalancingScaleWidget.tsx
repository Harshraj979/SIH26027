"use client";

import React, { useState } from "react";
import type { ScheduledBlock } from "@/types";

interface Props {
  scheduledBlocks: ScheduledBlock[];
  onTriggerDisruptionDemo?: () => void;
}

export default function COABalancingScaleWidget({
  scheduledBlocks,
  onTriggerDisruptionDemo,
}: Props) {
  const [selectedOption, setSelectedOption] = useState<number>(2); // Default to Option 3 (Winner)

  const shadowCount = scheduledBlocks.filter((b) => b.isShadowBlock).length;
  const setupMinutesSaved = shadowCount * 20;

  const slotOptions = [
    {
      id: 0,
      title: "Option 1: Daytime Peak Clubbing",
      time: "10:00 AM – 12:00 PM (120 min)",
      impact: "Delays Express Train #12497 by 30 mins & halts oncoming freight",
      penalty: -500,
      penaltyLabel: "-500 (Very Bad)",
      clubbingBonus: 0,
      setupSaved: 20,
      finalScore: -500,
      decision: "REJECTED",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
      reason: "Blind clubbing in morning peak causes cascading traffic jam across entire Delhi division. Mathematical penalty outweighs setup saving.",
      icon: "❌",
    },
    {
      id: 1,
      title: "Option 2: Off-Peak Afternoon Slot",
      time: "04:00 PM – 05:35 PM (95 min)",
      impact: "Delays Freight Train #51220 by 15 mins (Acceptable)",
      penalty: -15,
      penaltyLabel: "-15 (Acceptable)",
      clubbingBonus: 0,
      setupSaved: 0,
      finalScore: -15,
      decision: "BACKUP OPTION",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      reason: "Feasible daytime contingency slot. Only freight is impacted, but does not achieve zero-impact punctuality.",
      icon: "⚠️",
    },
    {
      id: 2,
      title: "Option 3: Dynamic Window Matching (Night Gap)",
      time: "02:15 AM – 04:15 AM (120 min)",
      impact: "Natural Timetable Gap: 0 Passenger & 0 Express Trains Delayed",
      penalty: 0,
      penaltyLabel: "0 (Zero Disruption)",
      clubbingBonus: 100,
      setupSaved: 20,
      finalScore: 100,
      decision: "WINNER (SELECTED)",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/30",
      reason: "Zero train delay cost + Multi-department shadow co-location (+100 Bonus) + 20m setup saved. Track closed ONCE.",
      icon: "🏆",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base">⚖️</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#000075]">
              Mathematical Balancing Scale: Setup Efficiency vs. Cascading Delay Penalty
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#000075] border border-blue-200">
              Scenario 3 Dynamic Window Matching
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            The AI balances <strong>Setup Efficiency (+20 min saved per bundle)</strong> against <strong>Cascading Delay Penalties (Exponential VIP train cost)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
            Total Setup Overhead Saved: <strong>+{setupMinutesSaved} mins</strong> ({shadowCount} Bundles)
          </span>
        </div>
      </div>

      {/* Visual Balance Scale Graphic & Metrics */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
        {/* Left Scale Pan: Setup Efficiency */}
        <div className="bg-emerald-50/50 rounded-xl border border-emerald-200 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>🔧</span> Setup Efficiency Side
            </span>
            <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
              +20 min / Bundle
            </span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            Every block possession requires <strong>20 minutes of fixed track lockdown</strong> (detonator placement, switch clamps, 25kV OHE earthing). Grouping TMS + SMMS + TDMS saves repeated shutdowns.
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs font-semibold text-emerald-900">
            <div className="bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-300">
              ⚡ Clubbing Bonus: <strong>+100 pts</strong>
            </div>
            <div className="bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-300">
              🛡️ Line Closed <strong>ONCE</strong>
            </div>
          </div>
        </div>

        {/* Right Scale Pan: Cascading Delay Penalty */}
        <div className="bg-rose-50/50 rounded-xl border border-rose-200 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>🛑</span> Cascading Delay Penalty Side
            </span>
            <span className="text-xs font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
              Exponential Cost
            </span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            Blind clubbing during peak morning hours delays passenger trains, creating a cascading traffic jam. If Delay Cost &gt; Setup Bonus, the AI <strong>rejects the daytime block</strong> and shifts to night gaps!
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs font-semibold text-rose-900">
            <div className="bg-white/80 px-2.5 py-1 rounded-lg border border-rose-300">
              🚄 P1 Vande Bharat: <strong>Zero Delay Tolerance</strong>
            </div>
            <div className="bg-white/80 px-2.5 py-1 rounded-lg border border-rose-300">
              ⚠️ Peak Curfew: <strong>Enforced</strong>
            </div>
          </div>
        </div>
      </div>

      {/* The 3 Candidate Slot Comparison Cards */}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Candidate Slot Evaluation Matrix (CP-SAT Mathematical Ranking)
          </p>
          <span className="text-[11px] text-slate-400">Click any option to inspect decision logic</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {slotOptions.map((opt) => {
            const isChosen = selectedOption === opt.id;
            const isWinner = opt.decision.includes("WINNER");

            return (
              <div
                key={opt.id}
                onClick={() => setSelectedOption(opt.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                  isWinner
                    ? "bg-emerald-50/30 border-emerald-300 shadow-xs"
                    : isChosen
                    ? "bg-blue-50/30 border-[#000075] shadow-xs"
                    : "bg-slate-50/40 border-slate-200 hover:bg-white"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">{opt.icon}</span>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${opt.badgeColor}`}>
                      {opt.decision}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900">{opt.title}</h4>
                  <p className="text-[11px] font-mono font-semibold text-blue-900 mt-0.5">{opt.time}</p>

                  <div className="mt-3 space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-600">
                      <span>Traffic Impact:</span>
                      <span className="font-semibold text-slate-800 text-right max-w-[150px] truncate">{opt.impact}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Disruption Penalty:</span>
                      <span className={`font-bold tabular-nums ${opt.penalty < 0 ? "text-rose-700" : "text-emerald-700"}`}>
                        {opt.penaltyLabel}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Clubbing Bonus:</span>
                      <span className="font-bold text-emerald-700 tabular-nums">+{opt.clubbingBonus} pts</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold">
                      <span className="text-slate-800">Final Slot Score:</span>
                      <span className={`tabular-nums ${opt.finalScore > 0 ? "text-emerald-700" : opt.finalScore === 0 ? "text-slate-700" : "text-rose-700"}`}>
                        {opt.finalScore > 0 ? `+${opt.finalScore}` : opt.finalScore}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/80 text-[10.5px] text-slate-500 italic leading-relaxed">
                  {opt.reason}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
