"use client";

/**
 * StrategicPlannerView — Rolling Monthly Strategic Horizon (Light Gov Theme)
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
      cardClass: "border-amber-300 bg-white",
      headerColor: "text-amber-800",
      barColor: "bg-amber-500",
    },
    {
      dept: "SMMS",
      title: "Signal & Telecom (Interlocking / Relays)",
      allocatedHours: 45,
      consumedHours: 32,
      pendingHours: 13,
      machines: ["Electronic Interlocking (EI) Test Wagon", "Axle Counter Calibration Team"],
      cardClass: "border-blue-300 bg-white",
      headerColor: "text-blue-800",
      barColor: "bg-blue-600",
    },
    {
      dept: "TDMS",
      title: "Traction Distribution (25kV OHE)",
      allocatedHours: 60,
      consumedHours: 42,
      pendingHours: 18,
      machines: ["8-Wheeler OHE Inspection Tower Wagon (RU-04)", "Contact Wire Tensioner"],
      cardClass: "border-red-300 bg-white",
      headerColor: "text-red-800",
      barColor: "bg-red-600",
    },
  ];

  const strategicWeeks = [
    {
      week: "Week 1 (Tactical Operational)",
      dateRange: "Sep 07 – Sep 13",
      focus: "High-density tamping at Ambala Yard (km 197) + OHE Isolator maintenance.",
      status: "RECONCILED",
      statusColor: "text-emerald-800 bg-emerald-100 border-emerald-300",
      shadowBlocks: 3,
      estPossessionHours: 18.5,
    },
    {
      week: "Week 2 (Planned Corridor)",
      dateRange: "Sep 14 – Sep 20",
      focus: "Panipat Jn (km 90) crossover interlocking renewal & turnouts packing.",
      status: "APPROVED",
      statusColor: "text-blue-800 bg-blue-100 border-blue-300",
      shadowBlocks: 2,
      estPossessionHours: 16.0,
    },
    {
      week: "Week 3 (Pre-Monsoon Catch-up)",
      dateRange: "Sep 21 – Sep 27",
      focus: "Deep screening of ballast between Kurukshetra and Ambala Cantt.",
      status: "TENTATIVE",
      statusColor: "text-amber-800 bg-amber-100 border-amber-300",
      shadowBlocks: 4,
      estPossessionHours: 24.0,
    },
    {
      week: "Week 4 (Monthly Wrap-up & Audit)",
      dateRange: "Sep 28 – Oct 04",
      focus: "Track Recording Car (TRC) oscillation monitoring + OHE contact wire audit.",
      status: "PROPOSED",
      statusColor: "text-gray-700 bg-gray-100 border-gray-300",
      shadowBlocks: 2,
      estPossessionHours: 14.5,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#f4f6f9] p-5 overflow-y-auto space-y-5 font-sans">
      
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg border border-gray-300 bg-white shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1a3c6e] animate-pulse" />
            <h2 className="text-sm font-bold text-[#1a3c6e] font-mono tracking-wide">
              MONTHLY STRATEGIC BLOCK CORRIDOR PLANNER (30-DAY HORIZON)
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-[#1a3c6e] border border-blue-200 font-bold">
              DUAL-HORIZON RECONCILED
            </span>
          </div>
          <p className="text-xs text-gray-500 font-mono mt-1">
            Macro-possession quota management · Heavy track machine staging · Bulk labor procurement optimization
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onReconcile}
            disabled={isReconciling}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a3c6e] hover:bg-[#14305a] disabled:bg-gray-400 text-white text-xs font-semibold rounded font-mono transition-colors cursor-pointer"
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
            className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 hover:border-[#1a3c6e] hover:text-[#1a3c6e] text-xs font-mono rounded transition-colors font-semibold cursor-pointer"
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
            <div key={q.dept} className={`p-4 rounded-lg border ${q.cardClass} shadow-xs space-y-3`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold font-mono uppercase tracking-wider ${q.headerColor}`}>{q.dept} QUOTA</span>
                <span className="text-xs font-mono font-bold text-gray-900">{pct}% Consumed</span>
              </div>
              <p className="text-xs text-gray-800 font-mono font-semibold">{q.title}</p>
              
              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                <div className={`h-full ${q.barColor} transition-all duration-500 rounded-full`} style={{ width: `${pct}%` }} />
              </div>

              <div className="flex justify-between text-[11px] font-mono text-gray-600 pt-1">
                <span>Consumed: <strong className="text-gray-900">{q.consumedHours}h</strong></span>
                <span>Remaining: <strong className="text-gray-900">{q.pendingHours}h</strong></span>
                <span>Total: <strong className="text-gray-900">{q.allocatedHours}h</strong></span>
              </div>

              <div className="border-t border-gray-100 pt-2 text-[10px] font-mono text-gray-500">
                <span className="text-gray-700 font-semibold block mb-1">Assigned Machine Consist:</span>
                {q.machines.map((m, idx) => (
                  <div key={idx} className="text-gray-700 truncate">• {m}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Strategic 4-Week Schedule */}
      <div className="p-4 rounded-lg border border-gray-300 bg-white space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#1a3c6e] font-mono uppercase tracking-wider">
            Monthly Possession Calendar &amp; Shadow Corridor Batches
          </h3>
          <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            ✓ 11 Multi-Department Bundled Windows (Saved 1,420 mins of track occupation)
          </span>
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          {strategicWeeks.map((wk, idx) => (
            <div key={idx} className="p-3.5 rounded-lg border border-gray-200 bg-[#F8FAFC] space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-900 font-mono">{wk.week}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-semibold ${wk.statusColor}`}>
                  {wk.status}
                </span>
              </div>
              <p className="text-[10px] font-mono text-[#1a3c6e] font-bold">{wk.dateRange}</p>
              <p className="text-[11px] font-mono text-gray-700 leading-snug">{wk.focus}</p>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-[10px] font-mono text-gray-600">
                <span>Shadow Bundles: <strong className="text-emerald-700">{wk.shadowBlocks}</strong></span>
                <span>Hours: <strong className="text-gray-900">{wk.estPossessionHours}h</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quantified Cost Optimization Benefit */}
      <div className="p-4 rounded-lg border border-emerald-300 bg-emerald-50 flex flex-wrap items-center justify-between gap-4 font-mono text-xs shadow-xs">
        <div className="space-y-1">
          <span className="text-emerald-900 font-bold uppercase tracking-wider text-xs">
            Section 7 Blueprint ROI: Strategic Monthly Bulk Procurement
          </span>
          <p className="text-emerald-800 text-[11px]">
            Replacing emergent ad-hoc emergency blocks with auto-reconciled monthly clustering saves an estimated:
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] text-gray-500 uppercase block">Overtime &amp; Idle Rake Savings</span>
            <span className="text-lg font-bold text-emerald-800">₹42.8 Lakhs / month</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-gray-500 uppercase block">Usable Freight Headroom</span>
            <span className="text-lg font-bold text-amber-800">+14 Freight Slots / week</span>
          </div>
        </div>
      </div>

    </div>
  );
}
