"use client";

import React from "react";

export type PortalType = "COA" | "TMS" | "SMMS" | "TDMS";

interface PortalNavigatorProps {
  activePortal: PortalType;
  onSelectPortal: (portal: PortalType) => void;
  counts: {
    TMS: number;
    SMMS: number;
    TDMS: number;
    scheduled: number;
  };
  onDirectToCOA: () => void;
}

const PORTALS = [
  {
    id: "COA" as PortalType,
    name: "COA Central Administrator",
    shortName: "COA Central Brain",
    role: "Control Office Application (Executive Admin)",
    icon: "🎛️",
    badge: "Central Administrator",
    badgeColor: "bg-purple-100 text-purple-900 border-purple-300",
    activeColor: "bg-[#000075] text-white border-blue-900 shadow-sm",
    inactiveColor: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
    description: "Central AI Scheduling & Prioritization Engine • Live Train Timetables • Weekly & Monthly Plans",
  },
  {
    id: "TMS" as PortalType,
    name: "TMS Track Portal",
    shortName: "TMS (Civil P-Way)",
    role: "Track Management System",
    icon: "🛤️",
    badge: "Field Portal",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    activeColor: "bg-amber-700 text-white border-amber-900 shadow-sm",
    inactiveColor: "bg-white text-slate-700 hover:bg-amber-50/50 border-slate-200",
    description: "Civil Track Defects • Rail Fractures & TQI • 60m Rail SSR Rate • LRS KP Addressing",
  },
  {
    id: "SMMS" as PortalType,
    name: "SMMS Signal Portal",
    shortName: "SMMS (S&T)",
    role: "Signal Maintenance Management System",
    icon: "🚥",
    badge: "Field Portal",
    badgeColor: "bg-blue-100 text-blue-900 border-blue-300",
    activeColor: "bg-blue-700 text-white border-blue-900 shadow-sm",
    inactiveColor: "bg-white text-slate-700 hover:bg-blue-50/50 border-slate-200",
    description: "Signal Failures • Point Machine Motors (45m SSR) • Axle Counters & Relay Interlocking",
  },
  {
    id: "TDMS" as PortalType,
    name: "TDMS Traction Portal",
    shortName: "TDMS (25kV OHE)",
    role: "Traction Distribution Management System",
    icon: "⚡",
    badge: "Field Portal",
    badgeColor: "bg-rose-100 text-rose-900 border-rose-300",
    activeColor: "bg-rose-700 text-white border-rose-900 shadow-sm",
    inactiveColor: "bg-white text-slate-700 hover:bg-rose-50/50 border-slate-200",
    description: "25kV OHE Catenary & Insulators (30m SSR) • Power Block (PTW) • Pole Rust Maintenance",
  },
];

export default function PortalNavigator({
  activePortal,
  onSelectPortal,
  counts,
  onDirectToCOA,
}: PortalNavigatorProps) {
  return (
    <div className="bg-white border-b border-slate-200 shadow-2xs shrink-0">
      {/* Top Banner: Architecture Context */}
      <div className="px-4 sm:px-8 py-2 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider text-[10px] bg-[#000075] text-[#ffba00] px-2 py-0.5 rounded">
            UNIFIED 4-PORTAL ARCHITECTURE
          </span>
          <span className="text-slate-600 hidden md:inline">
            Field personnel log from <strong>TMS</strong>, <strong>SMMS</strong>, or <strong>TDMS</strong> $\rightarrow$ Requisitions route directly into <strong>COA Central Administrator</strong>.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Pipeline Synchronized (NDLS–LDH 312 km)
          </span>
          {activePortal !== "COA" && (
            <button
              onClick={onDirectToCOA}
              className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-[#000075] text-[#ffba00] hover:bg-[#00005a] transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <span>🎛️ Direct to COA Central Brain &rarr;</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 4-Portal Switcher Tabs */}
      <div className="px-4 sm:px-8 py-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {PORTALS.map((portal) => {
          const isActive = activePortal === portal.id;
          const count =
            portal.id === "COA"
              ? counts.scheduled
              : counts[portal.id as keyof typeof counts] ?? 0;

          return (
            <button
              key={portal.id}
              onClick={() => onSelectPortal(portal.id)}
              className={`text-left p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                isActive ? portal.activeColor : portal.inactiveColor
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{portal.icon}</span>
                    <span className="text-xs font-black tracking-tight">{portal.shortName}</span>
                  </div>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                      isActive
                        ? "bg-white/20 text-white border-white/30"
                        : portal.badgeColor
                    }`}
                  >
                    {portal.id === "COA" ? "Central Admin" : "Field Portal"}
                  </span>
                </div>
                <p className={`text-[10.5px] line-clamp-1 ${isActive ? "text-white/80" : "text-slate-500"}`}>
                  {portal.description}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-current/10 flex items-center justify-between text-[11px]">
                <span className={`font-semibold ${isActive ? "text-white/90" : "text-slate-600"}`}>
                  {portal.id === "COA" ? "Approved Possessions:" : "Active Demands:"}
                </span>
                <span
                  className={`font-black px-2 py-0.2 rounded-full tabular-nums ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {count} {portal.id === "COA" ? "Slots" : "Defects"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
