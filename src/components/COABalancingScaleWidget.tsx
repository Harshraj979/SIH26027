"use client";

import React, { useState } from "react";
import type { ScheduledBlock } from "@/types";

interface Props {
  scheduledBlocks: ScheduledBlock[];
  onTriggerDisruptionDemo?: () => void;
}

export default function COABalancingScaleWidget({
  scheduledBlocks,
}: Props) {
  const [selectedOption, setSelectedOption] = useState<number>(2); // Default to Option 3 (Selected)

  const shadowCount = scheduledBlocks.filter((b) => b.isShadowBlock).length;
  const setupMinutesSaved = shadowCount * 20;

  const slotOptions = [
    {
      id: 0,
      title: "Window 1: Morning Peak Possession",
      time: "10:00 – 12:00 (120 min)",
      impact: "Delays Express #12497 by 30 min and halts down-line freight",
      penaltyLabel: "High Disruption Cost (-500)",
      clubbingBonus: "0 pts",
      setupSaved: "20 min",
      decision: "REJECTED",
      badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
      reason: "Peak morning traffic window causes cascading delays on New Delhi suburban and intercity passenger movements. Delay penalties exceed setup savings.",
    },
    {
      id: 1,
      title: "Window 2: Afternoon Off-Peak Window",
      time: "16:00 – 17:35 (95 min)",
      impact: "Re-routes Goods Train #51220 via loop (+15 min)",
      penaltyLabel: "Acceptable Delay (-15)",
      clubbingBonus: "0 pts",
      setupSaved: "0 min",
      decision: "FEASIBLE CONTINGENCY",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
      reason: "Feasible secondary slot during off-peak passenger lull. Minor freight re-routing is required, but timetable punctuality is largely preserved.",
    },
    {
      id: 2,
      title: "Window 3: Synchronized Night Window",
      time: "02:15 – 04:15 (120 min)",
      impact: "Natural Timetable Gap: 0 Passenger & 0 Express Services Affected",
      penaltyLabel: "Zero Delay Cost (0)",
      clubbingBonus: "+100 pts",
      setupSaved: "20 min",
      decision: "ASSIGNED (OPTIMAL)",
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold",
      reason: "Aligns with natural traffic lull. Co-locates Track (TMS) and S&T (SMMS) into a single 20-minute track isolation, saving line closure overhead with zero passenger delays.",
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Possession Window Evaluation &amp; Trade-Off Matrix
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            How candidate time windows are evaluated: balancing joint-possession setup efficiency against passenger delay impact.
          </p>
        </div>

        <div className="text-xs font-medium text-slate-700 bg-white px-3 py-1 rounded border border-slate-200">
          Joint Possessions Active: <strong className="text-blue-900">{shadowCount}</strong> (+{setupMinutesSaved} min overhead saved)
        </div>
      </div>

      {/* Trade-Off Balance Overview */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100 bg-slate-50/40">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Setup Co-Location Efficiency
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              +20 min saved / bundle
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Each track possession requires 20 minutes of isolation overhead (switch clamping, OHE de-energisation, and flag protection). Synchronising Track, Signal, and OHE works into one window avoids repeated closures.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Timetable Punctuality Protection
            </span>
            <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
              Priority 1 Strict Buffer
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Possessions during passenger peaks create ripple delays across the division. Candidate windows with high train impact penalties are automatically discarded in favour of natural timetable gaps.
          </p>
        </div>
      </div>

      {/* Candidate Slots Table / Cards */}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-700">
            Evaluated Possession Candidates
          </p>
          <span className="text-[11px] text-slate-400">Select any candidate to review evaluation rationale</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {slotOptions.map((opt) => {
            const isSelected = selectedOption === opt.id;
            const isAssigned = opt.decision.includes("ASSIGNED");

            return (
              <div
                key={opt.id}
                onClick={() => setSelectedOption(opt.id)}
                className={`p-4 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                  isAssigned
                    ? "bg-emerald-50/20 border-emerald-300 ring-1 ring-emerald-200"
                    : isSelected
                    ? "bg-slate-50 border-[#000075]"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">{opt.title}</span>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${opt.badgeColor}`}>
                      {opt.decision}
                    </span>
                  </div>

                  <p className="text-xs font-mono font-semibold text-blue-900">{opt.time}</p>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Traffic Impact:</span>
                      <span className="font-medium text-slate-800 text-right max-w-[150px] truncate">{opt.impact}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Delay Penalty:</span>
                      <span className="font-semibold text-slate-800">{opt.penaltyLabel}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Co-Location Saving:</span>
                      <span className="font-semibold text-slate-800">{opt.setupSaved}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600 leading-relaxed">
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
