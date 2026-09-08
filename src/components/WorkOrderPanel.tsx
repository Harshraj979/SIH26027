"use client";

/**
 * WorkOrderPanel — Multi-Departmental Maintenance Demand Manager
 * Shows TMS / SMMS / TDMS work orders with ML risk scores,
 * status badges, and a form to submit new work orders.
 */

import React, { useState } from "react";
import type { WorkOrder } from "@/types";

interface Props {
  workOrders: WorkOrder[];
  onAddWorkOrder: (wo: Partial<WorkOrder>) => void;
  onCancelWorkOrder: (id: string) => void;
}

const DEPT_CONFIG = {
  TMS:  { label: "Civil Track",      color: "text-amber-400", border: "border-amber-800/50", bg: "bg-amber-950/30" },
  SMMS: { label: "Signalling",       color: "text-blue-400",  border: "border-blue-800/50",  bg: "bg-blue-950/30" },
  TDMS: { label: "Traction/OHE",     color: "text-red-400",   border: "border-red-800/50",   bg: "bg-red-950/30" },
} as const;

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "bg-amber-900/40 text-amber-400 border-amber-700/50",
  SCHEDULED: "bg-emerald-900/40 text-emerald-400 border-emerald-700/50",
  COMPLETED: "bg-slate-700/40 text-slate-400 border-slate-600/50",
  CANCELLED: "bg-red-900/40 text-red-400 border-red-700/50",
};

function RiskBar({ risk }: { risk: number | null | undefined }) {
  const r    = risk ?? 0;
  const pct  = Math.min(100, Math.max(0, r));
  const color = pct > 75 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`font-mono text-[10px] tabular-nums ${
        pct > 75 ? "text-red-400" : pct > 50 ? "text-amber-400" : "text-emerald-400"
      }`}>
        {r.toFixed(0)}
      </span>
    </div>
  );
}

export default function WorkOrderPanel({ workOrders, onAddWorkOrder, onCancelWorkOrder }: Props) {
  const [activeTab, setActiveTab] = useState<"TMS" | "SMMS" | "TDMS" | "ALL">("ALL");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    department:      "TMS",
    description:     "",
    kmFrom:          "",
    kmTo:            "",
    durationMinutes: "120",
    overdueDays:     "0",
    cumulativeGmt:   "0",
    tqiScore:        "70",
    trackId:         "UP",
  });

  const filtered = activeTab === "ALL"
    ? workOrders
    : workOrders.filter((wo) => wo.department === activeTab);

  const grouped = {
    TMS:  workOrders.filter((w) => w.department === "TMS"),
    SMMS: workOrders.filter((w) => w.department === "SMMS"),
    TDMS: workOrders.filter((w) => w.department === "TDMS"),
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddWorkOrder({
      department:       form.department as "TMS" | "SMMS" | "TDMS",
      description:      form.description,
      kmFrom:           parseFloat(form.kmFrom),
      kmTo:             parseFloat(form.kmTo),
      durationMinutes:  parseInt(form.durationMinutes),
      overdueDays:      parseInt(form.overdueDays),
      cumulativeGmt:    parseFloat(form.cumulativeGmt),
      tqiScore:         parseFloat(form.tqiScore),
      trackId:          form.trackId,
    });
    setShowForm(false);
    setForm({ ...form, description: "", kmFrom: "", kmTo: "" });
  };

  return (
    <div className="flex flex-col h-full bg-[#111827] border-l border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div>
          <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-widest">Work Orders</h2>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">TMS · SMMS · TDMS</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs px-2 py-1 border border-slate-700 text-slate-300 hover:border-emerald-700
                     hover:text-emerald-400 rounded transition-colors font-mono"
        >
          + NEW
        </button>
      </div>

      {/* Department Summary Counts */}
      <div className="grid grid-cols-3 divide-x divide-slate-800 border-b border-slate-800">
        {(["TMS", "SMMS", "TDMS"] as const).map((d) => {
          const cfg = DEPT_CONFIG[d];
          return (
            <button
              key={d}
              onClick={() => setActiveTab(activeTab === d ? "ALL" : d)}
              className={`px-2 py-2 text-center transition-colors ${
                activeTab === d ? cfg.bg : "hover:bg-slate-800/50"
              }`}
            >
              <div className={`text-xs font-mono font-semibold ${cfg.color}`}>{d}</div>
              <div className="text-lg font-mono font-bold text-slate-200">
                {grouped[d].length}
              </div>
              <div className="text-[9px] text-slate-500">{cfg.label}</div>
            </button>
          );
        })}
      </div>

      {/* New Work Order Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border-b border-slate-800 bg-[#0B0F17] px-4 py-3 space-y-2 text-xs">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">New Maintenance Demand</div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 mb-1 block">Department</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 font-mono text-xs"
              >
                <option value="TMS">TMS — Civil Track</option>
                <option value="SMMS">SMMS — Signalling</option>
                <option value="TDMS">TDMS — Traction OHE</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 mb-1 block">Track</label>
              <select
                value={form.trackId}
                onChange={(e) => setForm({ ...form, trackId: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 font-mono text-xs"
              >
                <option value="UP">UP Line</option>
                <option value="DN">DN Line</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 mb-1 block">Description</label>
            <input
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 font-mono text-xs"
              placeholder="e.g. Ballast Tamping km 100–130"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 mb-1 block">From (km)</label>
              <input required type="number" step="0.1"
                value={form.kmFrom} onChange={(e) => setForm({ ...form, kmFrom: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 font-mono text-xs"
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 mb-1 block">To (km)</label>
              <input required type="number" step="0.1"
                value={form.kmTo} onChange={(e) => setForm({ ...form, kmTo: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 font-mono text-xs"
                placeholder="312.0"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 mb-1 block">Duration (min)</label>
              <input required type="number"
                value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 mb-1 block">Overdue Days</label>
              <input type="number" value={form.overdueDays}
                onChange={(e) => setForm({ ...form, overdueDays: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 mb-1 block">GMT Tonnage</label>
              <input type="number" step="0.1" value={form.cumulativeGmt}
                onChange={(e) => setForm({ ...form, cumulativeGmt: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 mb-1 block">TQI Score</label>
              <input type="number" step="0.1" min="0" max="100" value={form.tqiScore}
                onChange={(e) => setForm({ ...form, tqiScore: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit"
              className="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold transition-colors">
              Submit Work Order
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-3 py-1.5 border border-slate-700 text-slate-400 hover:text-slate-200 rounded text-xs transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Work Order List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="p-6 text-center text-slate-600 text-xs font-mono">
            No work orders{activeTab !== "ALL" ? ` for ${activeTab}` : ""}
          </div>
        )}

        {filtered.map((wo) => {
          const dept = wo.department as keyof typeof DEPT_CONFIG;
          const cfg  = DEPT_CONFIG[dept] ?? DEPT_CONFIG.TMS;

          return (
            <div
              key={wo.id}
              className={`px-4 py-3 border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors ${cfg.bg}`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className={`text-[9px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${cfg.color} ${cfg.border} border`}>
                  {wo.department}
                </div>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${STATUS_COLORS[wo.status] ?? STATUS_COLORS.PENDING}`}>
                  {wo.status}
                </span>
              </div>

              {/* Description */}
              <p className="text-[11px] text-slate-300 leading-snug mt-1">{wo.description}</p>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 mt-2 text-[10px] font-mono">
                <div>
                  <span className="text-slate-600">KM</span>
                  <div className="text-slate-300 tabular-nums">{wo.kmFrom}–{wo.kmTo}</div>
                </div>
                <div>
                  <span className="text-slate-600">DUR</span>
                  <div className="text-slate-300 tabular-nums">{wo.durationMinutes}m</div>
                </div>
                <div>
                  <span className="text-slate-600">TQI</span>
                  <div className="text-slate-300 tabular-nums">{wo.tqiScore.toFixed(0)}</div>
                </div>
              </div>

              {/* Risk Bar */}
              {wo.assetRisk != null && (
                <div className="mt-1.5">
                  <div className="flex justify-between text-[9px] font-mono text-slate-600 mb-0.5">
                    <span>ASSET RISK</span>
                    <span>PWt: {wo.penaltyWeight}</span>
                  </div>
                  <RiskBar risk={wo.assetRisk} />
                </div>
              )}

              {/* Shadow block indicator */}
              {wo.isShadowBlock && (
                <div className="mt-1.5 text-[10px] font-mono text-red-400 flex items-center gap-1">
                  <span>◆</span> SHADOW BLOCK — Multi-dept merged
                </div>
              )}

              {/* Cancel button */}
              {wo.status === "PENDING" && (
                <button
                  onClick={() => onCancelWorkOrder(wo.id)}
                  className="mt-2 text-[10px] font-mono text-slate-600 hover:text-red-400 transition-colors"
                >
                  Cancel WO
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
