"use client";

/**
 * StrategicPlannerView — Rolling Monthly Strategic Horizon
 * Implements SIH26027 Dual-Horizon Planner:
 *   "Rolling weekly (tactical) + monthly (strategic) dual-horizon planner, auto-reconciled.
 *    Long-horizon monthly planning enables bulk procurement of materials/labor,
 *    eliminates emergency block overheads, and reconciles into tactical weekly schedules."
 */

import React, { useState } from "react";
import type { WorkOrder } from "@/types";

interface Props {
  workOrders: WorkOrder[];
  onSwitchToTactical: () => void;
  onReconcile: () => void;
  isReconciling: boolean;
}

export default function StrategicPlannerView({
  workOrders,
  onSwitchToTactical,
  onReconcile,
  isReconciling,
}: Props) {
  const [selectedZone, setSelectedZone] = useState<"ALL" | "DLI_PNP" | "PNP_UMB" | "UMB_LDH">("ALL");

  const monthlyQuotas = [
    {
      dept: "TMS",
      title: "Civil Engineering (Track Maintenance)",
      allocatedHours: 120,
      consumedHours: 84,
      pendingHours: 36,
      machines: ["CSM-09 Tamping Machine (3 rks)", "BCM-12 Ballast Cleaner (1 rk)"],
      color: "border-amber-700/60 bg-amber-950/20 text-amber-400",
      barColor: "bg-amber-500",
    },
    {
      dept: "SMMS",
      title: "Signal & Telecom (Interlocking / Relays)",
      allocatedHours: 45,
      consumedHours: 32,
      pendingHours: 13,
      machines: ["Electronic Interlocking (EI) Test Wagon", "Axle Counter Calibration Team"],
      color: "border-blue-700/60 bg-blue-950/20 text-blue-400",
      barColor: "bg-blue-500",
    },
    {
      dept: "TDMS",
      title: "Traction Distribution (25kV OHE)",
      allocatedHours: 60,
      consumedHours: 42,
      pendingHours: 18,
      machines: ["8-Wheeler OHE Inspection Tower Wagon (RU-04)", "Contact Wire Tensioner"],
      color: "border-red-700/60 bg-red-950/20 text-red-400",
      barColor: "bg-red-500",
    },
  ];

  const strategicWeeks = [
    {
      week: "Week 1 (Tactical Operational)",
      dateRange: "Sep 07 – Sep 13",
      focus: "High-density tamping at Ambala Yard (km 197) + OHE Isolator maintenance.",
      status: "RECONCILED",
      statusColor: "text-emerald-400 bg-emerald-950 border-emerald-700",
      shadowBlocks: 3,
      estPossessionHours: 18.5,
    },
    {
      week: "Week 2 (Planned Corridor)",
      dateRange: "Sep 14 – Sep 20",
      focus: "Panipat Jn (km 90) crossover interlocking renewal & turnouts packing.",
      status: "APPROVED",
      statusColor: "text-blue-400 bg-blue-950 border-blue-700",
      shadowBlocks: 2,
      estPossessionHours: 16.0,
    },
    {
      week: "Week 3 (Pre-Monsoon Catch-up)",
      dateRange: "Sep 21 – Sep 27",
      focus: "Deep screening of ballast between Kurukshetra and Ambala Cantt.",
      status: "TENTATIVE",
      statusColor: "text-amber-400 bg-amber-950 border-amber-700",
      shadowBlocks: 4,
      estPossessionHours: 24.0,
    },
    {
      week: "Week 4 (Monthly Wrap-up & Audit)",
      dateRange: "Sep 28 – Oct 04",
      focus: "Track Recording Car (TRC) oscillation monitoring + OHE contact wire audit.",
      status: "PROPOSED",
      statusColor: "text-slate-400 bg-slate-900 border-slate-700",
      shadowBlocks: 2,
      estPossessionHours: 14.5,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0B0F17] p-5 overflow-y-auto space-y-6 font-sans">
      
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg border border-slate-800 bg-[#111827]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-100 font-mono tracking-wide">
              MONTHLY STRATEGIC BLOCK CORRIDOR PLANNER (30-DAY HORIZON)
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
              DUAL-HORIZON RECONCILED
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Macro-possession quota management · Heavy track machine staging · Bulk labor procurement optimization
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onReconcile}
            disabled={isReconciling}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-700 text-white text-xs font-semibold rounded font-mono transition-colors"
          >
            {isReconciling ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Reconciling…
              </>
            ) : (
              <>
                <span>⇄</span> Auto-Reconcile with Week 1 Tactical
              </>
            )}
          </button>
          <button
            onClick={onSwitchToTactical}
            className="px-3 py-1.5 border border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-400 text-xs font-mono rounded transition-colors"
          >
            View Weekly String Chart &rarr;
          </button>
        </div>
      </div>

      {/* Monthly Quota Consumption Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {monthlyQuotas.map((q) => {
          const pct = Math.round((q.consumedHours / q.allocatedHours) * 100);
          return (
            <div key={q.dept} className={`p-4 rounded-lg border ${q.color} space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono uppercase tracking-wider">{q.dept} QUOTA</span>
                <span className="text-xs font-mono font-bold">{pct}% Consumed</span>
              </div>
              <p className="text-xs text-slate-300 font-mono font-semibold">{q.title}</p>
              
              {/* Progress Bar */}
              <div className="w-full h-2 rounded bg-slate-900 overflow-hidden border border-slate-800">
                <div className={`h-full ${q.barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
              </div>

              <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-1">
                <span>Consumed: <strong className="text-slate-200">{q.consumedHours}h</strong></span>
                <span>Remaining: <strong className="text-slate-200">{q.pendingHours}h</strong></span>
                <span>Total: <strong className="text-slate-200">{q.allocatedHours}h</strong></span>
              </div>

              <div className="border-t border-slate-800/80 pt-2 text-[10px] font-mono text-slate-400">
                <span className="text-slate-500 block mb-1">Assigned Machine Consist:</span>
                {q.machines.map((m, idx) => (
                  <div key={idx} className="text-slate-300 truncate">• {m}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Strategic 4-Week Schedule */}
      <div className="p-4 rounded-lg border border-slate-800 bg-[#111827]/70 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">
            Monthly Possession Calendar &amp; Shadow Corridor Batches
          </h3>
          <span className="text-[10px] font-mono text-emerald-400">
            ✓ 11 Multi-Department Bundled Windows (Saved 1,420 mins of isolated track occupation)
          </span>
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          {strategicWeeks.map((wk, idx) => (
            <div key={idx} className="p-3.5 rounded border border-slate-800 bg-slate-950/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-200 font-mono">{wk.week}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${wk.statusColor}`}>
                  {wk.status}
                </span>
              </div>
              <p className="text-[10px] font-mono text-cyan-400">{wk.dateRange}</p>
              <p className="text-[11px] font-mono text-slate-300 leading-snug">{wk.focus}</p>
              <div className="border-t border-slate-800 pt-2 flex justify-between text-[10px] font-mono text-slate-400">
                <span>Shadow Bundles: <strong className="text-emerald-400">{wk.shadowBlocks}</strong></span>
                <span>Hours: <strong className="text-slate-200">{wk.estPossessionHours}h</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quantified Cost Optimization Benefit */}
      <div className="p-4 rounded-lg border border-emerald-800/40 bg-emerald-950/15 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="space-y-1">
          <span className="text-emerald-400 font-bold uppercase tracking-wider">
            Section 7 Blueprint ROI: Strategic Monthly Bulk Procurement
          </span>
          <p className="text-slate-300 text-[11px]">
            Replacing emergent ad-hoc BDMS emergency blocks with auto-reconciled monthly clustering saves an estimated:
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase block">Overtime &amp; Idle Rake Savings</span>
            <span className="text-lg font-bold text-emerald-400">₹42.8 Lakhs / month</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase block">Usable Freight Headroom</span>
            <span className="text-lg font-bold text-amber-400">+14 Freight Slots / week</span>
          </div>
        </div>
      </div>

    </div>
  );
}
