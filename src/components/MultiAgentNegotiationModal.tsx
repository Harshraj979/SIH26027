"use client";

/**
 * MultiAgentNegotiationModal — Visual Negotiation Cockpit
 * Displays the 4 autonomous department agents (Engg, S&T, TRD, Operations),
 * their live bidding stakes, cross-dependency claims, and the Arbitration
 * Agent's Explainable AI (XAI) natural language justification trail.
 */

import React, { useState } from "react";
import type { ArbitrationTranscript, DepartmentBid } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transcript: ArbitrationTranscript | null;
  onReNegotiate: (monsoonActive: boolean) => void;
  isNegotiating: boolean;
}

const AGENT_BADGES = {
  TMS:  { name: "Engineering Agent (Civil)", color: "text-amber-400", border: "border-amber-700/60", bg: "bg-amber-950/30", icon: "🛤️" },
  SMMS: { name: "S&T Agent (Signalling)",   color: "text-blue-400",  border: "border-blue-700/60",  bg: "bg-blue-950/30",  icon: "🚥" },
  TDMS: { name: "TRD Agent (Traction OHE)", color: "text-red-400",   border: "border-red-700/60",   bg: "bg-red-950/30",   icon: "⚡" },
};

export default function MultiAgentNegotiationModal({
  isOpen,
  onClose,
  transcript,
  onReNegotiate,
  isNegotiating,
}: Props) {
  const [monsoonToggle, setMonsoonToggle] = useState(false);
  const [activeTab, setActiveTab] = useState<"TRANSCRIPT" | "BIDS" | "XAI_EXPLANATION">("TRANSCRIPT");

  if (!isOpen) return null;

  const satisfaction = transcript?.departmentalSatisfaction ?? {
    TMS: 82,
    SMMS: 78,
    TDMS: 88,
    OperationsPunctuality: 98.5,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#0B0F17] border border-slate-700 rounded-lg shadow-2xl flex flex-col overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#111827]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400 font-bold text-sm">
              AI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100 tracking-wide">
                  MULTI-AGENT ARBITRATION & NEGOTIATION ENGINE
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-400 border border-emerald-700/50">
                  CONTRACT-NET PROTOCOL
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Engineering (TMS) ⇄ Signalling (SMMS) ⇄ Traction (TRD) ⇄ Operations (COA)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Monsoon Toggle for simulation */}
            <label className="flex items-center gap-2 text-xs font-mono text-slate-400 cursor-pointer bg-slate-900 px-3 py-1.5 rounded border border-slate-800 hover:border-slate-700">
              <input
                type="checkbox"
                checked={monsoonToggle}
                onChange={(e) => {
                  setMonsoonToggle(e.target.checked);
                  onReNegotiate(e.target.checked);
                }}
                className="rounded border-slate-700 text-emerald-500 focus:ring-0"
              />
              <span>🌧️ Monsoon Multiplier</span>
            </label>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 text-lg font-mono px-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Department Satisfaction Bar */}
        <div className="grid grid-cols-4 divide-x divide-slate-800 border-b border-slate-800 bg-[#0B0F17]/80 text-xs font-mono">
          <div className="px-4 py-2.5">
            <div className="text-[10px] text-amber-500 font-semibold flex items-center justify-between">
              <span>🛤️ TMS UTILITY</span>
              <span className="text-slate-300 tabular-nums">{satisfaction.TMS.toFixed(0)}%</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-amber-500" style={{ width: `${satisfaction.TMS}%` }} />
            </div>
          </div>

          <div className="px-4 py-2.5">
            <div className="text-[10px] text-blue-500 font-semibold flex items-center justify-between">
              <span>🚥 SMMS UTILITY</span>
              <span className="text-slate-300 tabular-nums">{satisfaction.SMMS.toFixed(0)}%</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${satisfaction.SMMS}%` }} />
            </div>
          </div>

          <div className="px-4 py-2.5">
            <div className="text-[10px] text-red-500 font-semibold flex items-center justify-between">
              <span>⚡ TDMS UTILITY</span>
              <span className="text-slate-300 tabular-nums">{satisfaction.TDMS.toFixed(0)}%</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-red-500" style={{ width: `${satisfaction.TDMS}%` }} />
            </div>
          </div>

          <div className="px-4 py-2.5">
            <div className="text-[10px] text-emerald-500 font-semibold flex items-center justify-between">
              <span>⏱️ OPS PUNCTUALITY</span>
              <span className="text-slate-300 tabular-nums">{satisfaction.OperationsPunctuality.toFixed(1)}%</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${satisfaction.OperationsPunctuality}%` }} />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-6 bg-[#111827] text-xs font-mono">
          <button
            onClick={() => setActiveTab("TRANSCRIPT")}
            className={`py-2.5 px-4 font-semibold border-b-2 transition-colors ${
              activeTab === "TRANSCRIPT"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            ARBITRATION AUDIT TRAIL
          </button>
          <button
            onClick={() => setActiveTab("BIDS")}
            className={`py-2.5 px-4 font-semibold border-b-2 transition-colors ${
              activeTab === "BIDS"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            DEPARTMENTAL BIDS ({transcript?.bids?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab("XAI_EXPLANATION")}
            className={`py-2.5 px-4 font-semibold border-b-2 transition-colors ${
              activeTab === "XAI_EXPLANATION"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            EXPLAINABLE AI JUSTIFICATIONS
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* TAB 1: ARBITRATION TRANSCRIPT */}
          {activeTab === "TRANSCRIPT" && (
            <div className="space-y-4 text-xs font-mono">
              {/* Savings Card */}
              <div className="p-4 rounded border border-emerald-800/60 bg-emerald-950/20 flex items-center justify-between">
                <div>
                  <div className="text-emerald-400 font-bold text-sm">
                    ⚡ {transcript?.corridorMinutesSaved ?? 150} MINUTES OF CORRIDOR POSSESSION SAVED
                  </div>
                  <p className="text-slate-400 text-xs mt-1">
                    Through Multi-Department Geographic Clustering ("Shadow Blocks"), overlapping demands from Track, Signalling, and Traction OHE are merged into single coordinated closures instead of isolated possessions.
                  </p>
                </div>
                <button
                  disabled={isNegotiating}
                  onClick={() => onReNegotiate(monsoonToggle)}
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-semibold text-xs transition-colors shrink-0 disabled:opacity-50"
                >
                  {isNegotiating ? "Negotiating…" : "Re-Arbitrate"}
                </button>
              </div>

              {/* Justification Trail */}
              <div className="space-y-3">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                  Step-by-Step Arbitration Transcript
                </div>

                {transcript?.justifications?.map((just, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded border border-slate-800 bg-slate-900/60 space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-bold text-slate-200">Decision #{idx + 1}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed pl-4 border-l border-slate-700 text-[11px]">
                      {just}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: DEPARTMENTAL BIDS */}
          {activeTab === "BIDS" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {transcript?.bids?.map((bid, i) => {
                const badge = AGENT_BADGES[bid.department] ?? AGENT_BADGES.TMS;
                return (
                  <div
                    key={i}
                    className={`p-4 rounded border ${badge.border} ${badge.bg} text-xs font-mono space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${badge.color} flex items-center gap-1.5`}>
                        <span>{badge.icon}</span> {badge.name}
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        Stake: {bid.utilityWeight}
                      </span>
                    </div>

                    <div className="text-slate-200 font-semibold text-[11px]">
                      {bid.description}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 bg-slate-900/80 p-2 rounded">
                      <div>
                        <span className="text-slate-600 block">CHAINAGE</span>
                        <span className="text-slate-300">{bid.kmFrom}–{bid.kmTo} km</span>
                      </div>
                      <div>
                        <span className="text-slate-600 block">DURATION</span>
                        <span className="text-slate-300">{bid.durationMinutes} min</span>
                      </div>
                      <div>
                        <span className="text-slate-600 block">URGENCY</span>
                        <span className="text-emerald-400">{bid.urgencyScore.toFixed(1)}/100</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-relaxed italic">
                      "{bid.justification}"
                    </p>

                    {bid.crossDepsNeeded && bid.crossDepsNeeded.length > 0 && (
                      <div className="text-[10px] text-amber-400 pt-1 border-t border-slate-800">
                        ⚡ Cross-Dependency Flagged: {bid.crossDepsNeeded.join(", ")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: XAI EXPLANATIONS */}
          {activeTab === "XAI_EXPLANATION" && (
            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 rounded border border-slate-800 bg-slate-900/50 space-y-2">
                <div className="text-slate-200 font-bold text-sm">
                  Why Railway Section Controllers Trust This AI:
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Unlike black-box neural networks or static linear programs, every schedule proposal is backed by an operational justification trail. Departmental priorities (Engineering track safety, Signalling fail-safe route testing, and Traction feeder isolation) are preserved as autonomous agent utility functions. The central arbiter transparently documents why each block was granted, clustered, or shifted, allowing human section controllers to review and override with complete accountability.
                </p>
              </div>

              {transcript?.justifications?.map((j, idx) => (
                <div key={idx} className="p-3 bg-slate-900/30 border border-slate-800 rounded">
                  <div className="text-emerald-400 font-bold mb-1">Bundle #{idx + 1} Rationale</div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{j}</p>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-[#111827] text-xs font-mono text-slate-500">
          <span>Indian Railways Section Control · Northern Railway (DLI Division)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
          >
            Close Dialog
          </button>
        </div>

      </div>
    </div>
  );
}
