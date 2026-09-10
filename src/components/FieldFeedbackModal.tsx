"use client";

/**
 * FieldFeedbackModal — Field Engineer Execution Feedback Loop (Light Gov Theme)
 * Implements SIH26027 Closed-Loop Feedback:
 *   "Mobile-first PWA view for section engineers to log real-time actual
 *   start/end times and overrun reasons, retraining priority & duration models."
 */

import React, { useState } from "react";
import type { ScheduledBlock } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  scheduledBlocks: ScheduledBlock[];
  onLogExecution: (data: ExecutionPayload) => Promise<void>;
  isSubmitting: boolean;
}

export interface ExecutionPayload {
  blockDescription: string;
  plannedStartMin: number;
  plannedEndMin: number;
  actualStartMin: number;
  actualEndMin: number;
  overrunReason: string;
  notes: string;
  loggedByEngineer: string;
}

export default function FieldFeedbackModal({
  isOpen,
  onClose,
  scheduledBlocks,
  onLogExecution,
  isSubmitting,
}: Props) {
  const [selectedBlockIdx, setSelectedBlockIdx] = useState<number>(0);
  const [actualStartHHMM, setActualStartHHMM] = useState<string>("00:10");
  const [actualEndHHMM, setActualEndHHMM] = useState<string>("03:25");
  const [overrunReason, setOverrunReason] = useState<string>("WEATHER_MONSOON");
  const [engineerId, setEngineerId] = useState<string>("SSE/P-Way/Ambala");
  const [notes, setNotes] = useState<string>("Track tamper machine delayed 15m due to heavy rain at UMB yard.");

  if (!isOpen) return null;

  const currentBlock = scheduledBlocks[selectedBlockIdx] ?? {
    description: "Maintenance Block",
    startMin: 0,
    endMin: 180,
    startHHMM: "00:00",
    endHHMM: "03:00",
    departments: ["TMS"],
    kmFrom: 197,
    kmTo: 224,
  };

  const toMin = (hhmm: string): number => {
    const [h, m] = hhmm.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogExecution({
      blockDescription: currentBlock.description,
      plannedStartMin: currentBlock.startMin,
      plannedEndMin: currentBlock.endMin,
      actualStartMin: toMin(actualStartHHMM),
      actualEndMin: toMin(actualEndHHMM),
      overrunReason,
      notes,
      loggedByEngineer: engineerId,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white border border-gray-300 rounded-lg shadow-2xl flex flex-col overflow-hidden font-sans">
        
        {/* Header — Gov Navy */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#1a3c6e] text-white border-b border-blue-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-white/15 border border-white/30 flex items-center justify-center text-white font-bold text-sm">
              📱
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide">
                FIELD EXECUTION FEEDBACK LOOP
              </h2>
              <p className="text-xs text-blue-200 font-mono mt-0.5">
                Section Engineer Track-Side Log · Retrains Duration Predictions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white text-lg font-mono px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-mono bg-white">
          
          <div>
            <label className="text-[10px] font-semibold text-gray-700 block mb-1">Target Maintenance Block</label>
            <select
              value={selectedBlockIdx}
              onChange={(e) => setSelectedBlockIdx(parseInt(e.target.value))}
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 text-xs focus:outline-none focus:border-[#1a3c6e]"
            >
              {scheduledBlocks.map((b, i) => (
                <option key={i} value={i}>
                  [{b.departments.join("+")}] {b.startHHMM}–{b.endHHMM} ({b.kmFrom}–{b.kmTo} km)
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
            <div className="text-[10px] text-gray-500 mb-0.5 font-semibold">Planned Possession Window:</div>
            <div className="text-[#1a3c6e] font-bold text-sm">
              {currentBlock.startHHMM} to {currentBlock.endHHMM} ({currentBlock.durationMinutes ?? 180} min)
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-gray-700 block mb-1">Actual Block Applied (HH:MM)</label>
              <input
                type="text"
                required
                value={actualStartHHMM}
                onChange={(e) => setActualStartHHMM(e.target.value)}
                placeholder="00:10"
                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 text-xs focus:outline-none focus:border-[#1a3c6e]"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-700 block mb-1">Actual Block Cleared (HH:MM)</label>
              <input
                type="text"
                required
                value={actualEndHHMM}
                onChange={(e) => setActualEndHHMM(e.target.value)}
                placeholder="03:25"
                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 text-xs focus:outline-none focus:border-[#1a3c6e]"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-gray-700 block mb-1">Overrun Root Cause</label>
            <select
              value={overrunReason}
              onChange={(e) => setOverrunReason(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 text-xs focus:outline-none focus:border-[#1a3c6e]"
            >
              <option value="NONE">No Overrun (Cleared On Time)</option>
              <option value="WEATHER_MONSOON">Weather / Heavy Rain / Monsoon Alert</option>
              <option value="MACHINERY_FAILURE">Track Tamper / OHE Tower Wagon Breakdown</option>
              <option value="DISPATCH_HOLD">Traffic Hold (Passenger Train Clearance)</option>
              <option value="CREW_DELAY">Gang &amp; Machine Crew Possession Delay</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-gray-700 block mb-1">Logging Officer / Section</label>
            <input
              type="text"
              value={engineerId}
              onChange={(e) => setEngineerId(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 text-xs focus:outline-none focus:border-[#1a3c6e]"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-gray-700 block mb-1">Site Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 text-xs focus:outline-none focus:border-[#1a3c6e]"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded text-xs transition-colors font-mono cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-1.5 bg-[#1a3c6e] hover:bg-[#14305a] disabled:opacity-50 text-white rounded text-xs font-semibold transition-colors font-mono cursor-pointer"
            >
              {isSubmitting ? "Logging…" : "Submit Execution Feedback"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
