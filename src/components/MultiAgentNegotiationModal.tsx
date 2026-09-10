"use client";

/**
 * MultiAgentNegotiationModal — Clean & Minimal Multi-Agent Arbitration Engine (Light Mode)
 *
 * Implements Contract-Net Protocol & Explainable AI (XAI) arbitration:
 *  - TMS (Engineering / P.Way)
 *  - SMMS (Signalling & Telecom)
 *  - TDMS (Traction Distribution / OHE)
 *  - Central Arbitration Agent (Disruption & Shadow Bundling)
 */

import React, { useState } from "react";
import type { ArbitrationTranscript } from "@/types";

interface Props {
  isOpen:                boolean;
  onClose:               () => void;
  transcript:            ArbitrationTranscript | null;
  onReNegotiate:         (monsoonMultiplier: boolean) => void;
  isNegotiating:         boolean;
}

const AGENT_BADGES = {
  TMS:  { name: "TMS Track Agent",        color: "text-amber-800", bg: "bg-amber-50", border: "border-amber-200", icon: "🛤️" },
  SMMS: { name: "SMMS Signal Agent",      color: "text-blue-800",  bg: "bg-blue-50",  border: "border-blue-200",  icon: "🚥" },
  TDMS: { name: "TDMS Traction Agent",    color: "text-rose-800",  bg: "bg-rose-50",  border: "border-rose-200",  icon: "⚡" },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-[#1a3c6e] font-bold text-sm shadow-2xs">
              AI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                  Multi-Agent Arbitration &amp; Negotiation Engine
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Contract-Net Protocol
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Engineering (TMS) ⇄ Signalling (SMMS) ⇄ Traction (TDMS) ⇄ Operations (COA)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Monsoon Toggle for simulation */}
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 shadow-2xs">
              <input
                type="checkbox"
                checked={monsoonToggle}
                onChange={(e) => {
                  setMonsoonToggle(e.target.checked);
                  onReNegotiate(e.target.checked);
                }}
                className="rounded border-slate-300 text-[#1a3c6e] focus:ring-0"
              />
              <span className="font-medium">🌧️ Monsoon Multiplier</span>
            </label>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors text-base"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Department Satisfaction Bar */}
        <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-200 bg-slate-50/70 text-xs">
          <div className="px-4 py-2.5">
            <div className="text-[10px] text-amber-800 font-bold flex items-center justify-between uppercase">
              <span>🛤️ TMS Utility</span>
              <span className="text-slate-800 tabular-nums">{satisfaction.TMS.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${satisfaction.TMS}%` }} />
            </div>
          </div>

          <div className="px-4 py-2.5">
            <div className="text-[10px] text-blue-800 font-bold flex items-center justify-between uppercase">
              <span>🚥 SMMS Utility</span>
              <span className="text-slate-800 tabular-nums">{satisfaction.SMMS.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${satisfaction.SMMS}%` }} />
            </div>
          </div>

          <div className="px-4 py-2.5">
            <div className="text-[10px] text-rose-800 font-bold flex items-center justify-between uppercase">
              <span>⚡ TDMS Utility</span>
              <span className="text-slate-800 tabular-nums">{satisfaction.TDMS.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full" style={{ width: `${satisfaction.TDMS}%` }} />
            </div>
          </div>

          <div className="px-4 py-2.5">
            <div className="text-[10px] text-emerald-800 font-bold flex items-center justify-between uppercase">
              <span>⏱️ Punctuality</span>
              <span className="text-slate-800 tabular-nums">{satisfaction.OperationsPunctuality.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${satisfaction.OperationsPunctuality}%` }} />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white text-xs">
          <button
            onClick={() => setActiveTab("TRANSCRIPT")}
            className={`py-2.5 px-4 font-semibold border-b-2 transition-colors ${
              activeTab === "TRANSCRIPT"
                ? "border-[#1a3c6e] text-[#1a3c6e]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Arbitration Audit Trail
          </button>
          <button
            onClick={() => setActiveTab("BIDS")}
            className={`py-2.5 px-4 font-semibold border-b-2 transition-colors ${
              activeTab === "BIDS"
                ? "border-[#1a3c6e] text-[#1a3c6e]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Departmental Bids ({transcript?.bids?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab("XAI_EXPLANATION")}
            className={`py-2.5 px-4 font-semibold border-b-2 transition-colors ${
              activeTab === "XAI_EXPLANATION"
                ? "border-[#1a3c6e] text-[#1a3c6e]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Explainable AI (XAI) Justifications
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f8fafc]">
          
          {/* TAB 1: ARBITRATION TRANSCRIPT */}
          {activeTab === "TRANSCRIPT" && (
            <div className="space-y-4 text-xs">
              {/* Savings Card */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 flex items-center justify-between">
                <div>
                  <div className="text-emerald-800 font-bold text-sm flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>{transcript?.corridorMinutesSaved ?? 8616} MINUTES OF CORRIDOR POSSESSION SAVED</span>
                  </div>
                  <p className="text-slate-600 text-xs mt-1 max-w-2xl leading-relaxed">
                    Through multi-department geographic bundling ("Shadow Blocks"), overlapping demands from Civil Track, Signalling, and Traction OHE are merged into coordinated possession windows, avoiding repetitive track closures.
                  </p>
                </div>
                <button
                  disabled={isNegotiating}
                  onClick={() => onReNegotiate(monsoonToggle)}
                  className="px-3.5 py-2 bg-[#1a3c6e] hover:bg-[#14305a] text-white rounded-lg font-semibold text-xs transition-colors shrink-0 disabled:bg-slate-300"
                >
                  {isNegotiating ? "Negotiating…" : "Re-Arbitrate"}
                </button>
              </div>

              {/* Justification Trail */}
              <div className="space-y-2.5">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Step-by-Step Arbitration Transcript
                </div>

                {transcript?.justifications?.map((just, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-bold text-slate-900">Decision #{idx + 1}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed pl-4 border-l-2 border-slate-200 text-xs">
                      {just}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: DEPARTMENTAL BIDS */}
          {activeTab === "BIDS" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {transcript?.bids?.map((bid, i) => {
                const badge = AGENT_BADGES[bid.department as keyof typeof AGENT_BADGES] ?? AGENT_BADGES.TMS;
                return (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border ${badge.border} bg-white shadow-2xs space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${badge.color} flex items-center gap-1.5 text-xs`}>
                        <span>{badge.icon}</span> {badge.name}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Stake: {bid.utilityWeight}
                      </span>
                    </div>

                    <div className="text-slate-900 font-semibold text-xs">
                      {bid.description}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-slate-400 block font-medium">CHAINAGE</span>
                        <span className="text-slate-800 font-bold">{bid.kmFrom}–{bid.kmTo} km</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">DURATION</span>
                        <span className="text-slate-800 font-bold">{bid.durationMinutes} min</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">URGENCY</span>
                        <span className="text-emerald-700 font-bold">{bid.urgencyScore.toFixed(1)}/100</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed italic">
                      "{bid.justification}"
                    </p>

                    {bid.crossDepsNeeded && bid.crossDepsNeeded.length > 0 && (
                      <div className="text-[10px] text-amber-800 pt-1 border-t border-slate-100 font-semibold">
                        ⚡ Cross-Dependency: {bid.crossDepsNeeded.join(", ")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: XAI EXPLANATIONS */}
          {activeTab === "XAI_EXPLANATION" && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
                <div className="text-slate-900 font-bold text-sm">
                  Why Railway Section Controllers Trust This AI:
                </div>
                <p className="text-slate-600 leading-relaxed text-xs">
                  Unlike black-box neural networks or static linear programs, every schedule proposal is backed by an operational justification trail. Departmental priorities (Engineering track safety, Signalling fail-safe route testing, and Traction feeder isolation) are preserved as autonomous agent utility functions. The central arbiter transparently documents why each block was granted, clustered, or shifted, allowing human section controllers to review and override with complete accountability.
                </p>
              </div>

              {transcript?.justifications?.map((j, idx) => (
                <div key={idx} className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <div className="text-[#1a3c6e] font-bold text-xs mb-1">Bundle #{idx + 1} Rationale</div>
                  <p className="text-slate-700 text-xs leading-relaxed">{j}</p>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
          <span>Indian Railways Section Control · Northern Railway (Delhi Division)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1a3c6e] hover:bg-[#14305a] text-white font-semibold rounded-lg transition-colors"
          >
            Close Dialog
          </button>
        </div>

      </div>
    </div>
  );
}
