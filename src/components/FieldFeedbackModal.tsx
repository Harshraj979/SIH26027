"use client";

/**
 * FieldFeedbackModal — Clean & Minimal Field Execution Feedback Loop (Light Mode)
 *
 * Implements Section 8:
 *  - Closes the loop between planned vs. actual block execution
 *  - Feeds field discrepancy data back to retrain duration models
 */

import React, { useState } from "react";
import type { ScheduledBlock } from "@/types";

export interface ExecutionPayload {
  clusterId:        string;
  actualStartMin:   number;
  actualEndMin:     number;
  overrunReason:    string;
  notes:            string;
  loggedByEngineer: string;
}

interface Props {
  isOpen:            boolean;
  onClose:           () => void;
  scheduledBlocks:   ScheduledBlock[];
  onLogExecution?:   (payload: ExecutionPayload) => void;
  onSubmitFeedback?: (payload: ExecutionPayload) => void;
  isSubmitting:      boolean;
}

export default function FieldFeedbackModal({
  isOpen,
  onClose,
  scheduledBlocks,
  onLogExecution,
  onSubmitFeedback,
  isSubmitting,
}: Props) {
  const [selectedBlockIdx, setSelectedBlockIdx] = useState<number>(0);
  const [actualStartHHMM, setActualStartHHMM]   = useState("00:15");
  const [actualEndHHMM, setActualEndHHMM]       = useState("03:30");
  const [overrunReason, setOverrunReason]       = useState("WEATHER_MONSOON");
  const [notes, setNotes]                       = useState("Pre-monsoon ballast packing completed. Slight 15m delay due to gang assembly.");
  const [engineerId, setEngineerId]             = useState("SSE/P.Way/UMB-04");

  if (!isOpen) return null;

  const currentBlock = scheduledBlocks[selectedBlockIdx] ?? {
    clusterIds: ["ORD-DEFAULT"],
    departments: ["TMS"],
    startHHMM: "00:00",
    endHHMM: "03:00",
    kmFrom: 120,
    kmTo: 125,
    durationMinutes: 180,
  };

  const toMin = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fn = onLogExecution ?? onSubmitFeedback;
    if (fn) {
      fn({
        clusterId: currentBlock.clusterIds?.[0] ?? "ORD-1",
        actualStartMin: toMin(actualStartHHMM),
        actualEndMin: toMin(actualEndHHMM),
        overrunReason,
        notes,
        loggedByEngineer: engineerId,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-[#1a3c6e] font-bold text-sm shadow-2xs">
              📱
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                Field Execution Feedback Loop
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Section Engineer Track-Side Log · Retrains Duration Predictions
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs bg-[#f8fafc]">
          
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Target Maintenance Block
            </label>
            <select
              value={selectedBlockIdx}
              onChange={(e) => setSelectedBlockIdx(parseInt(e.target.value))}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs focus:outline-none focus:border-[#1a3c6e]"
            >
              {scheduledBlocks.map((b, i) => (
                <option key={i} value={i}>
                  [{b.departments.join("+")}] {b.startHHMM}–{b.endHHMM} ({b.kmFrom}–{b.kmTo} km)
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
              Planned Window:
            </div>
            <div className="text-slate-800 font-bold text-xs">
              {currentBlock.startHHMM} to {currentBlock.endHHMM} ({currentBlock.durationMinutes ?? 180} min)
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Actual Block Applied (HH:MM)
              </label>
              <input
                type="text"
                required
                value={actualStartHHMM}
                onChange={(e) => setActualStartHHMM(e.target.value)}
                placeholder="00:10"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-[#1a3c6e]"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Actual Block Cleared (HH:MM)
              </label>
              <input
                type="text"
                required
                value={actualEndHHMM}
                onChange={(e) => setActualEndHHMM(e.target.value)}
                placeholder="03:25"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-[#1a3c6e]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Overrun Root Cause
            </label>
            <select
              value={overrunReason}
              onChange={(e) => setOverrunReason(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-[#1a3c6e]"
            >
              <option value="NONE">No Overrun (Cleared On Time)</option>
              <option value="WEATHER_MONSOON">Weather / Heavy Rain / Monsoon Alert</option>
              <option value="MACHINERY_FAILURE">Track Tamper / OHE Tower Wagon Breakdown</option>
              <option value="DISPATCH_HOLD">Traffic Hold (Passenger Train Clearance)</option>
              <option value="CREW_DELAY">Gang &amp; Machine Crew Possession Delay</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Logging Officer / Section
            </label>
            <input
              type="text"
              value={engineerId}
              onChange={(e) => setEngineerId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-[#1a3c6e]"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Site Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-[#1a3c6e]"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-1.5 bg-[#1a3c6e] hover:bg-[#14305a] disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              {isSubmitting ? "Logging…" : "Submit Execution Feedback"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
