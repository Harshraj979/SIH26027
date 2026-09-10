"use client";

/**
 * EventPanel — Operational Perturbations (Light Gov Theme)
 * Allows Section Controller to inject real events that trigger re-optimization.
 */

import React, { useState } from "react";
import type { OperationalEvent } from "@/types";

interface Props {
  events:         OperationalEvent[];
  trains:         { number: string; name: string; priority: number }[];
  onInjectEvent:  (event: EventPayload) => void;
  isInjecting:    boolean;
}

export interface EventPayload {
  eventType:             string;
  description:           string;
  severity:              string;
  kmFrom?:               number;
  kmTo?:                 number;
  delayMinutes:          number;
  affectedTrainNumbers:  string[];
}

const EVENT_PRESETS = [
  {
    label:       "⛅ Dense Fog — NDLS–SNP",
    eventType:   "FOG",
    description: "Dense fog advisory issued. Visibility <200m NDLS to SNP.",
    severity:    "CAUTION",
    kmFrom:      0,   kmTo: 61,
    delayMinutes: 25,
    affectedTrains: ["22439", "12011", "64563"],
  },
  {
    label:       "🔴 Signal Failure — UMB",
    eventType:   "SIGNAL_FAILURE",
    description: "Colour Light Signal SN-301 failure at UMB. T/A granted.",
    severity:    "CRITICAL",
    kmFrom:      194, kmTo: 200,
    delayMinutes: 40,
    affectedTrains: ["12497", "BOXN_01"],
  },
  {
    label:       "⚠ Speed Restriction — PNP–KKDE",
    eventType:   "SPEED_RESTRICTION",
    description: "Caution order: 30 kmph restriction km 90–124 (ballast deficiency).",
    severity:    "CAUTION",
    kmFrom:      90, kmTo: 124,
    delayMinutes: 18,
    affectedTrains: ["12925", "CONCOR_02"],
  },
] as const;

const SEVERITY_COLORS = {
  CRITICAL: "border-red-300 bg-red-50 text-red-900",
  CAUTION:  "border-amber-300 bg-amber-50 text-amber-900",
  INFO:     "border-blue-300 bg-blue-50 text-blue-900",
};

export default function EventPanel({ events, trains, onInjectEvent, isInjecting }: Props) {
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState<EventPayload>({
    eventType:            "DELAY",
    description:          "",
    severity:             "CAUTION",
    kmFrom:               undefined,
    kmTo:                 undefined,
    delayMinutes:         0,
    affectedTrainNumbers: [],
  });

  return (
    <div className="flex flex-col h-full bg-white border border-gray-300 rounded-lg shadow-xs overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-200 bg-[#F8FAFC] flex items-center justify-between">
        <h3 className="text-xs font-bold text-[#1a3c6e] uppercase tracking-wider font-mono">
          ⚡ Live Event Injection
        </h3>
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="text-[10px] font-mono px-2.5 py-1 border border-gray-300 bg-white text-gray-700
                     hover:border-[#1a3c6e] hover:text-[#1a3c6e] rounded transition-colors font-semibold cursor-pointer"
        >
          {showCustom ? "Hide Custom" : "+ Custom Event"}
        </button>
      </div>

      {/* Preset Buttons */}
      <div className="p-3 space-y-2 border-b border-gray-200 bg-white">
        {EVENT_PRESETS.map((preset) => (
          <button
            key={preset.eventType + preset.kmFrom}
            disabled={isInjecting}
            onClick={() =>
              onInjectEvent({
                eventType:            preset.eventType,
                description:          preset.description,
                severity:             preset.severity,
                kmFrom:               preset.kmFrom,
                kmTo:                 preset.kmTo,
                delayMinutes:         preset.delayMinutes,
                affectedTrainNumbers: [...preset.affectedTrains],
              })
            }
            className="w-full text-left text-xs px-3.5 py-2.5 border border-gray-200 bg-[#F8FAFC]
                       hover:border-[#1a3c6e] hover:bg-blue-50/50 rounded-lg transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed font-mono text-gray-900 shadow-xs cursor-pointer"
          >
            <div className="font-bold flex items-center justify-between">
              <span>{preset.label}</span>
              <span className="text-[10px] text-gray-500">+{preset.delayMinutes}m</span>
            </div>
            <p className="text-[11px] text-gray-600 mt-0.5">{preset.description}</p>
          </button>
        ))}
      </div>

      {/* Custom Event Form */}
      {showCustom && (
        <div className="p-3.5 border-b border-gray-200 bg-[#F8FAFC] space-y-2.5 text-xs">
          <input
            placeholder="Description (e.g. Signal failure at Sonipat)"
            value={custom.description}
            onChange={(e) => setCustom({ ...custom, description: e.target.value })}
            className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-gray-900 font-mono text-xs focus:outline-none focus:border-[#1a3c6e]"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="km From (e.g. 60)"
              type="number"
              onChange={(e) => setCustom({ ...custom, kmFrom: parseFloat(e.target.value) })}
              className="bg-white border border-gray-300 rounded px-2.5 py-1.5 text-gray-900 font-mono text-xs focus:outline-none focus:border-[#1a3c6e]"
            />
            <input
              placeholder="km To (e.g. 90)"
              type="number"
              onChange={(e) => setCustom({ ...custom, kmTo: parseFloat(e.target.value) })}
              className="bg-white border border-gray-300 rounded px-2.5 py-1.5 text-gray-900 font-mono text-xs focus:outline-none focus:border-[#1a3c6e]"
            />
          </div>
          <input
            placeholder="Delay (minutes)"
            type="number"
            onChange={(e) => setCustom({ ...custom, delayMinutes: parseInt(e.target.value) })}
            className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-gray-900 font-mono text-xs focus:outline-none focus:border-[#1a3c6e]"
          />
          <button
            disabled={isInjecting || !custom.description}
            onClick={() => onInjectEvent(custom)}
            className="w-full py-2 bg-[#1a3c6e] hover:bg-[#14305a] text-white rounded text-xs
                       font-semibold disabled:opacity-50 transition-colors font-mono cursor-pointer"
          >
            {isInjecting ? "Simulating & Re-Solving…" : "Inject Event & Re-Solve"}
          </button>
        </div>
      )}

      {/* Event Log */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#F8FAFC]">
        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-bold mb-1">
          Recent Operational Events ({events.length})
        </div>
        {events.length === 0 && (
          <div className="p-4 text-center text-gray-400 text-xs font-mono bg-white rounded border border-gray-200">
            No active events on corridor
          </div>
        )}
        {events.map((ev) => (
          <div
            key={ev.id}
            className={`p-3 rounded-lg border text-xs font-mono shadow-xs
              ${SEVERITY_COLORS[ev.severity as keyof typeof SEVERITY_COLORS] ?? SEVERITY_COLORS.INFO}`}
          >
            <div className="font-bold text-[10px] uppercase tracking-wide mb-0.5 flex items-center justify-between">
              <span>{ev.eventType}</span>
              <span className="opacity-70 text-[9px]">{ev.provenance}</span>
            </div>
            <p className="text-[11px] leading-snug">{ev.description}</p>
            {ev.delayMinutes > 0 && (
              <div className="mt-1 text-[10px] font-semibold">+{ev.delayMinutes} min schedule shift</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
