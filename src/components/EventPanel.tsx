"use client";

/**
 * EventPanel — Operational Perturbations (Fog, Signal Failure, Delay)
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
  CRITICAL: "border-red-700 bg-red-950/40 text-red-400",
  CAUTION:  "border-amber-700 bg-amber-950/40 text-amber-400",
  INFO:     "border-blue-700 bg-blue-950/40 text-blue-400",
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
    <div className="flex flex-col h-full bg-[#0B0F17] border-t border-slate-800">
      <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          ⚡ Live Event Injection
        </h3>
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="text-[10px] font-mono px-2 py-1 border border-slate-700 text-slate-400
                     hover:border-amber-700 hover:text-amber-400 rounded transition-colors"
        >
          Custom
        </button>
      </div>

      {/* Preset Buttons */}
      <div className="px-3 py-2 space-y-2 border-b border-slate-800">
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
            className="w-full text-left text-xs px-3 py-2 border border-slate-700 bg-slate-900/60
                       hover:border-amber-700 hover:bg-amber-950/20 rounded transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed font-mono"
          >
            {isInjecting ? "⏳ Solving…" : preset.label}
          </button>
        ))}
      </div>

      {/* Custom Event Form */}
      {showCustom && (
        <div className="px-3 py-2 border-b border-slate-800 space-y-2 text-xs">
          <input
            placeholder="Description"
            value={custom.description}
            onChange={(e) => setCustom({ ...custom, description: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 font-mono text-xs"
          />
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="km From" type="number"
              onChange={(e) => setCustom({ ...custom, kmFrom: parseFloat(e.target.value) })}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 font-mono text-xs"
            />
            <input placeholder="km To" type="number"
              onChange={(e) => setCustom({ ...custom, kmTo: parseFloat(e.target.value) })}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 font-mono text-xs"
            />
          </div>
          <input placeholder="Delay (minutes)" type="number"
            onChange={(e) => setCustom({ ...custom, delayMinutes: parseInt(e.target.value) })}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 font-mono text-xs"
          />
          <button
            disabled={isInjecting || !custom.description}
            onClick={() => onInjectEvent(custom)}
            className="w-full py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded text-xs
                       font-semibold disabled:opacity-50 transition-colors"
          >
            Inject & Re-Solve
          </button>
        </div>
      )}

      {/* Event Log */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2 text-[9px] font-mono text-slate-600 uppercase tracking-widest border-b border-slate-800">
          Recent Events
        </div>
        {events.length === 0 && (
          <div className="p-4 text-center text-slate-600 text-xs font-mono">No active events</div>
        )}
        {events.map((ev) => (
          <div
            key={ev.id}
            className={`mx-3 my-2 px-3 py-2 rounded border text-xs font-mono
              ${SEVERITY_COLORS[ev.severity as keyof typeof SEVERITY_COLORS] ?? SEVERITY_COLORS.INFO}`}
          >
            <div className="font-bold text-[10px] uppercase tracking-wide mb-0.5">
              {ev.eventType}
              <span className="ml-2 opacity-60">{ev.provenance}</span>
            </div>
            <p className="text-[11px] leading-snug opacity-90">{ev.description}</p>
            {ev.delayMinutes > 0 && (
              <div className="mt-1 text-[10px] opacity-70">+{ev.delayMinutes}m delay</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
