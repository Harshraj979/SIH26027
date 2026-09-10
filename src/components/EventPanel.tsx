"use client";

/**
 * EventPanel — Clean & Minimal Operational Events Manager & Real-Time Injector
 */

import React, { useState } from "react";
import type { OperationalEvent, Train } from "@/types";

export interface EventPayload {
  eventType:            string;
  description:          string;
  severity:             "CRITICAL" | "CAUTION" | "INFO";
  kmFrom?:              number;
  kmTo?:                number;
  delayMinutes:         number;
  affectedTrainNumbers: string[];
}

interface Props {
  events:         OperationalEvent[];
  trains:         Train[];
  onInjectEvent:  (payload: EventPayload) => void;
  isInjecting:    boolean;
}

const EVENT_PRESETS: Array<EventPayload & { label: string; dept: string }> = [
  {
    label:        "Track Circuit Failure at Panipat (SMMS)",
    dept:         "SMMS",
    eventType:    "SIGNAL_FAILURE",
    description:  "Point machine 102A failure at Panipat Jn (km 89.4); automatic signalling suspended.",
    severity:     "CRITICAL",
    kmFrom:       88.0,
    kmTo:         91.0,
    delayMinutes: 35,
    affectedTrainNumbers: ["12005", "12011"],
  },
  {
    label:        "OHE Tripping Kurukshetra – Ambala (TDMS)",
    dept:         "TDMS",
    eventType:    "OHE_BREAKDOWN",
    description:  "25kV catenary contact wire snap near km 178.2 UP track; power block required.",
    severity:     "CRITICAL",
    kmFrom:       175.0,
    kmTo:         182.0,
    delayMinutes: 45,
    affectedTrainNumbers: ["12029", "12497"],
  },
  {
    label:        "Rail Fracture / Emergency Clamp (TMS)",
    dept:         "TMS",
    eventType:    "RAIL_FRACTURE",
    description:  "Severe weld failure reported by gangman at km 234.6; 20 km/h emergency speed restriction.",
    severity:     "CAUTION",
    kmFrom:       233.0,
    kmTo:         236.0,
    delayMinutes: 20,
    affectedTrainNumbers: ["12459"],
  },
];

export default function EventPanel({ events, onInjectEvent, isInjecting }: Props) {
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState<EventPayload>({
    eventType:            "SIGNAL_FAILURE",
    description:          "",
    severity:             "CAUTION",
    kmFrom:               89.0,
    kmTo:                 92.0,
    delayMinutes:         25,
    affectedTrainNumbers: [],
  });

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-full max-w-7xl mx-auto">
      {/* ── Left Column: Event Injection & Presets ─────────────────────────── */}
      <div className="w-full lg:w-96 shrink-0 flex flex-col gap-4">
        
        {/* Preset Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a3c6e]">
                ⚡ Inject Incident / Delay
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Simulate real-time perturbations to test CP-SAT dynamic re-scheduling
              </p>
            </div>
            <button
              onClick={() => setShowCustom(!showCustom)}
              className="text-[11px] font-semibold text-[#1a3c6e] hover:underline"
            >
              {showCustom ? "Presets" : "Custom +"}
            </button>
          </div>

          {!showCustom ? (
            <div className="space-y-2 mt-3">
              {EVENT_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  disabled={isInjecting}
                  onClick={() => onInjectEvent(p)}
                  className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 transition-all disabled:opacity-50 flex flex-col gap-1 group"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800 group-hover:text-amber-900">
                    <span>{p.label}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      +{p.delayMinutes}m
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Incident Type
                </label>
                <select
                  value={custom.eventType}
                  onChange={(e) => setCustom({ ...custom, eventType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#1a3c6e]"
                >
                  <option value="SIGNAL_FAILURE">Signal / Interlocking Failure (SMMS)</option>
                  <option value="OHE_BREAKDOWN">OHE Catenary Breakdown (TDMS)</option>
                  <option value="RAIL_FRACTURE">Rail Fracture / Defect (TMS)</option>
                  <option value="WEATHER">Fog / Severe Weather Restriction</option>
                  <option value="ROLLING_STOCK">Loco / Wagon Defect</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Description
                </label>
                <textarea
                  value={custom.description}
                  onChange={(e) => setCustom({ ...custom, description: e.target.value })}
                  placeholder="e.g., Track circuit glitch near km 120; speed restricted to 30 km/h."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#1a3c6e]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    km From
                  </label>
                  <input
                    type="number"
                    value={custom.kmFrom ?? ""}
                    onChange={(e) => setCustom({ ...custom, kmFrom: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    km To
                  </label>
                  <input
                    type="number"
                    value={custom.kmTo ?? ""}
                    onChange={(e) => setCustom({ ...custom, kmTo: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Delay Minutes
                </label>
                <input
                  type="number"
                  value={custom.delayMinutes}
                  onChange={(e) => setCustom({ ...custom, delayMinutes: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800"
                />
              </div>

              <button
                disabled={isInjecting || !custom.description}
                onClick={() => onInjectEvent(custom)}
                className="w-full py-2 bg-[#1a3c6e] hover:bg-[#14305a] text-white font-semibold rounded-md text-xs transition-colors disabled:bg-slate-300"
              >
                {isInjecting ? "Injecting & Re-solving…" : "⚡ Inject & Re-solve Schedule"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Right Column: Active Operational Events Registry ──────────────── */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a3c6e]">
              Operational Incident Log ({events.length})
            </h3>
            <p className="text-[11px] text-slate-500">
              Live corridor alerts and disruptions from 9_disruption_events.csv &amp; real-time telemetry
            </p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            NDLS – LDH Corridor
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          {events.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs text-center">
              <p>No active operational events or track disruptions reported.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Select a preset on the left to simulate incident resolution.
              </p>
            </div>
          ) : (
            events.map((ev) => {
              const sevBadge =
                ev.severity === "CRITICAL" ? "bg-rose-50 text-rose-700 border-rose-200" :
                ev.severity === "CAUTION" ? "bg-amber-50 text-amber-700 border-amber-200" :
                "bg-blue-50 text-blue-700 border-blue-200";

              return (
                <div key={ev.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${sevBadge}`}>
                          {ev.severity}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {ev.eventType}
                        </span>
                        {ev.kmFrom != null && ev.kmTo != null && (
                          <span className="text-[11px] text-slate-500 font-mono">
                            km {ev.kmFrom.toFixed(1)} – {ev.kmTo.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
                        {ev.description}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      {ev.delayMinutes > 0 ? (
                        <div className="text-xs font-bold text-rose-600">
                          +{ev.delayMinutes} min
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400">No delay</div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {ev.isActive ? "Active" : "Resolved"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
