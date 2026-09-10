"use client";

/**
 * MultiAgentNegotiationModal — Visual Negotiation Cockpit (Light Gov Theme)
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
  TMS:  { name: "Engineering Agent (Civil)", color: "text-amber-800", border: "border-amber-300", bg: "bg-amber-50/70", barColor: "bg-amber-500", icon: "🛤️" },
  SMMS: { name: "S&T Agent (Signalling)",   color: "text-blue-800",  border: "border-blue-300",  bg: "bg-blue-50/70",  barColor: "bg-blue-500",  icon: "🚥" },
  TDMS: { name: "TRD Agent (Traction OHE)", color: "text-red-800",   border: "border-red-300",   bg: "bg-red-50/70",   barColor: "bg-red-500",   icon: "⚡" },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white border border-gray-300 rounded-lg shadow-2xl flex flex-col overflow-hidden font-sans">
        
        {/* Header — Gov Navy */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#1a3c6e] text-white border-b border-blue-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-white/15 border border-white/30 flex items-center justify-center text-white font-bold text-sm">
              AI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wide">
                  MULTI-AGENT ARBITRATION &amp; NEGOTIATION ENGINE
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/80 text-blue-200 border border-blue-400/40">
                  CONTRACT-NET PROTOCOL
                </span>
              </div>
              <p className="text-xs text-blue-200 font-mono mt-0.5">
                Engineering (TMS) ⇄ Signalling (SMMS) ⇄ Traction (TRD) ⇄ Operations (COA)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Monsoon Toggle for simulation */}
            <label className="flex items-center gap-2 text-xs font-mono text-blue-100 cursor-pointer bg-blue-950/60 px-3 py-1.5 rounded border border-blue-400/40 hover:bg-blue-950">
              <input
                type="checkbox"
                checked={monsoonToggle}
                onChange={(e) => {
                  setMonsoonToggle(e.target.checked);
                  onReNegotiate(e.target.checked);
                }}
                className="rounded border-gray-300 text-[#FF9933] focus:ring-0 cursor-pointer"
              />
              <span>🌧️ Monsoon Multiplier</span>
            </label>

            <button
              onClick={onClose}
              className="text-blue-200 hover:text-white text-lg font-mono px-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Department Satisfaction Bar */}
        <div className="grid grid-cols-4 divide-x divide-gray-200 border-b border-gray-200 bg-[#F8FAFC] text-xs font-mono">
          <div className="px-4 py-2.5">
            <div className="text-[10px] text-amber-700 font-bold flex items-center justify-between">
              <span>🛤️ TMS UTILITY</span>
              <span className="text-gray-900 font-bold tabular-nums">{satisfaction.TMS.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${satisfaction.TMS}%` }} />
            </div>
          </div>

          <div className="px-4 py-2.5">
            <div className="text-[10px] text-blue-700 font-bold flex items-center justify-between">
              <span>🚥 SMMS UTILITY</span>
              <span className="text-gray-900 font-bold tabular-nums">{satisfaction.SMMS.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${satisfaction.SMMS}%` }} />
            </div>
          </div>

          <div className="px-4 py-2.5">
            <div className="text-[10px] text-red-700 font-bold flex items-center justify-between">
              <span>⚡ TDMS UTILITY</span>
              <span className="text-gray-900 font-bold tabular-nums">{satisfaction.TDMS.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-red-600 rounded-full" style={{ width: `${satisfaction.TDMS}%` }} />
            </div>
          </div>

          <div className="px-4 py-2.5">
            <div className="text-[10px] text-emerald-700 font-bold flex items-center justify-between">
              <span>⏱️ OPS PUNCTUALITY</span>
              <span className="text-gray-900 font-bold tabular-nums">{satisfaction.OperationsPunctuality.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${satisfaction.OperationsPunctuality}%` }} />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 px-6 bg-white text-xs font-mono">
          <button
            onClick={() => setActiveTab("TRANSCRIPT")}
            className={`py-2.5 px-4 font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "TRANSCRIPT"
                ? "border-[#1a3c6e] text-[#1a3c6e]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            ARBITRATION AUDIT TRAIL
          </button>
          <button
            onClick={() => setActiveTab("BIDS")}
            className={`py-2.5 px-4 font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "BIDS"
                ? "border-[#1a3c6e] text-[#1a3c6e]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            DEPARTMENTAL BIDS ({transcript?.bids?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab("XAI_EXPLANATION")}
            className={`py-2.5 px-4 font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "XAI_EXPLANATION"
                ? "border-[#1a3c6e] text-[#1a3c6e]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            EXPLAINABLE AI JUSTIFICATIONS
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F8FAFC]">
          
          {/* TAB 1: ARBITRATION TRANSCRIPT */}
          {activeTab === "TRANSCRIPT" && (
            <div className="space-y-4 text-xs font-mono">
              {/* Savings Card */}
              <div className="p-4 rounded-lg border border-emerald-300 bg-emerald-50 flex items-center justify-between shadow-xs">
                <div>
                  <div className="text-emerald-900 font-bold text-sm flex items-center gap-1.5">
                    <span>⚡</span> {transcript?.corridorMinutesSaved ?? 150} MINUTES OF CORRIDOR POSSESSION SAVED
                  </div>
                  <p className="text-emerald-800 text-xs mt-1 leading-relaxed">
                    Through Multi-Department Geographic Clustering ("Shadow Blocks"), overlapping demands from Track, Signalling, and Traction OHE are merged into single coordinated closures instead of isolated possessions.
                  </p>
                </div>
                <button
                  disabled={isNegotiating}
                  onClick={() => onReNegotiate(monsoonToggle)}
                  className="px-3.5 py-2 bg-[#1a3c6e] hover:bg-[#14305a] text-white rounded font-semibold text-xs transition-colors shrink-0 disabled:opacity-50 ml-4 cursor-pointer"
                >
                  {isNegotiating ? "Negotiating…" : "Re-Arbitrate"}
                </button>
              </div>

              {/* Justification Trail */}
              <div className="space-y-2.5">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                  Step-by-Step Arbitration Transcript
                </div>

                {transcript?.justifications?.map((just, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg border border-gray-200 bg-white shadow-xs space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span className="font-bold text-[#1a3c6e]">Arbitration Decision #{idx + 1}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed pl-4 border-l-2 border-emerald-500 text-[11px]">
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
                    className={`p-4 rounded-lg border ${badge.border} ${badge.bg} text-xs font-mono space-y-2 shadow-xs`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${badge.color} flex items-center gap-1.5`}>
                        <span>{badge.icon}</span> {badge.name}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-300">
                        Stake: {bid.utilityWeight}
                      </span>
                    </div>

                    <div className="text-gray-900 font-semibold text-[11px]">
                      {bid.description}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-600 bg-white/80 border border-gray-200 p-2 rounded">
                      <div>
                        <span className="text-gray-500 block text-[9px]">CHAINAGE</span>
                        <span className="text-gray-800 font-bold">{bid.kmFrom}–{bid.kmTo} km</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[9px]">DURATION</span>
                        <span className="text-gray-800 font-bold">{bid.durationMinutes} min</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[9px]">URGENCY</span>
                        <span className="text-emerald-700 font-bold">{bid.urgencyScore.toFixed(1)}/100</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-600 leading-relaxed italic bg-white/60 p-2 rounded border border-gray-100">
                      "{bid.justification}"
                    </p>

                    {bid.crossDepsNeeded && bid.crossDepsNeeded.length > 0 && (
                      <div className="text-[10px] text-amber-800 font-semibold pt-1 border-t border-amber-200">
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
            <div className="space-y-3 text-xs font-mono">
              <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/70 space-y-1.5">
                <div className="text-[#1a3c6e] font-bold text-sm">
                  Why Railway Section Controllers Trust This AI:
                </div>
                <p className="text-gray-700 leading-relaxed text-[11px]">
                  Unlike opaque neural networks or static linear programs, every schedule proposal is backed by an operational justification trail. Departmental priorities (Engineering track safety, Signalling fail-safe route testing, and Traction feeder isolation) are preserved as autonomous agent utility functions. The central arbiter transparently documents why each block was granted, clustered, or shifted, allowing human section controllers to review and override with complete accountability.
                </p>
              </div>

              {transcript?.justifications?.map((j, idx) => (
                <div key={idx} className="p-3.5 bg-white border border-gray-200 rounded-lg shadow-xs">
                  <div className="text-[#1a3c6e] font-bold mb-1 text-[11px]">Bundle #{idx + 1} Rationale</div>
                  <p className="text-gray-700 text-[11px] leading-relaxed">{j}</p>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-[#F8FAFC] text-xs font-mono text-gray-500">
          <span>Indian Railways Section Control · Northern Railway (DLI Division)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1a3c6e] hover:bg-[#14305a] text-white rounded text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Dialog
          </button>
        </div>

      </div>
    </div>
  );
}
