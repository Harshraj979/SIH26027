"use client";

/**
 * FieldFeedbackModal — Field Engineer Execution Feedback Loop
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0B0F17] border border-slate-700 rounded-lg shadow-2xl flex flex-col overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#111827]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-950 border border-blue-700 flex items-center justify-center text-blue-400 font-bold text-sm">
              📱
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 tracking-wide">
                FIELD EXECUTION FEEDBACK LOOP
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Section Engineer Track-Side Log · Retrains Duration Predictions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg font-mono px-2"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-mono">
          
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">Target Maintenance Block</label>
            <select
              value={selectedBlockIdx}
              onChange={(e) => setSelectedBlockIdx(parseInt(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
            >
              {scheduledBlocks.map((b, i) => (
                <option key={i} value={i}>
                  [{b.departments.join("+")}] {b.startHHMM}–{b.endHHMM} ({b.kmFrom}–{b.kmTo} km)
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded">
            <div className="text-[10px] text-slate-500 mb-1">Planned Window:</div>
            <div className="text-slate-300 font-bold">
              {currentBlock.startHHMM} to {currentBlock.endHHMM} ({currentBlock.durationMinutes ?? 180} min)
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">Actual Block Applied (HH:MM)</label>
              <input
                type="text"
                required
                value={actualStartHHMM}
                onChange={(e) => setActualStartHHMM(e.target.value)}
                placeholder="00:10"
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">Actual Block Cleared (HH:MM)</label>
              <input
                type="text"
                required
                value={actualEndHHMM}
                onChange={(e) => setActualEndHHMM(e.target.value)}
                placeholder="03:25"
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 block mb-1">Overrun Root Cause</label>
            <select
              value={overrunReason}
              onChange={(e) => setOverrunReason(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
            >
              <option value="NONE">No Overrun (Cleared On Time)</option>
              <option value="WEATHER_MONSOON">Weather / Heavy Rain / Monsoon Alert</option>
              <option value="MACHINERY_FAILURE">Track Tamper / OHE Tower Wagon Breakdown</option>
              <option value="DISPATCH_HOLD">Traffic Hold (Passenger Train Clearance)</option>
              <option value="CREW_DELAY">Gang & Machine Crew Possession Delay</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 block mb-1">Logging Officer / Section</label>
            <input
              type="text"
              value={engineerId}
              onChange={(e) => setEngineerId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-500 block mb-1">Site Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-slate-700 text-slate-400 hover:text-slate-200 rounded text-xs transition-colors font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-1.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white rounded text-xs font-semibold transition-colors font-mono"
            >
              {isSubmitting ? "Logging…" : "Submit Execution Feedback"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
