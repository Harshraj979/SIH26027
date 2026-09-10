"use client";

/**
 * WorkOrderPanel — Clean & Minimal Maintenance Demand Manager (Light Mode)
 */

import React, { useState, useMemo } from "react";
import type { WorkOrder } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { ROLE_PERMISSIONS } from "@/types/auth";

interface Props {
  workOrders:        WorkOrder[];
  onAddWorkOrder:    (wo: Partial<WorkOrder>) => void;
  onCancelWorkOrder: (id: string) => void;
}

const DEPT_CONFIG = {
  TMS:  { label: "Civil / Track",    badgeClass: "bg-amber-50 text-amber-800 border-amber-200", icon: "🛤️" },
  SMMS: { label: "Signal & Telecom", badgeClass: "bg-blue-50 text-blue-800 border-blue-200",   icon: "🚥" },
  TDMS: { label: "Traction / OHE",   badgeClass: "bg-rose-50 text-rose-800 border-rose-200",   icon: "⚡" },
} as const;

function RiskBar({ risk }: { risk: number | null | undefined }) {
  const r     = risk ?? 0;
  const pct   = Math.min(100, Math.max(0, r));
  const color = pct > 75 ? "bg-rose-500" : pct > 50 ? "bg-amber-500" : "bg-emerald-500";
  const textColor = pct > 75 ? "text-rose-700" : pct > 50 ? "text-amber-700" : "text-emerald-700";

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[11px] tabular-nums font-bold ${textColor}`}>
        {r.toFixed(0)}%
      </span>
    </div>
  );
}

export default function WorkOrderPanel({ workOrders, onAddWorkOrder, onCancelWorkOrder }: Props) {
  const { user } = useAuth();
  const perms    = user ? ROLE_PERMISSIONS[user.role] : ROLE_PERMISSIONS.OBSERVER;

  const [activeTab, setActiveTab]     = useState<"ALL" | "TMS" | "SMMS" | "TDMS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState({
    department: "TMS", description: "", kmFrom: "", kmTo: "",
    durationMinutes: "120", overdueDays: "0", cumulativeGmt: "0", tqiScore: "70", trackId: "UP",
  });

  const grouped = useMemo(() => ({
    TMS:  workOrders.filter((w) => w.department === "TMS"),
    SMMS: workOrders.filter((w) => w.department === "SMMS"),
    TDMS: workOrders.filter((w) => w.department === "TDMS"),
  }), [workOrders]);

  const filtered = useMemo(() => {
    return workOrders.filter((w) => {
      if (activeTab !== "ALL" && w.department !== activeTab) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = w.description?.toLowerCase().includes(q) ?? false;
        const matchKm   = `${w.kmFrom} ${w.kmTo}`.includes(q);
        const matchDept = w.department?.toLowerCase().includes(q) ?? false;
        if (!matchDesc && !matchKm && !matchDept) return false;
      }
      return true;
    });
  }, [workOrders, activeTab, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddWorkOrder({
      department:      form.department as "TMS" | "SMMS" | "TDMS",
      description:     form.description,
      kmFrom:          parseFloat(form.kmFrom),
      kmTo:            parseFloat(form.kmTo),
      durationMinutes: parseInt(form.durationMinutes),
      overdueDays:     parseInt(form.overdueDays),
      cumulativeGmt:   parseFloat(form.cumulativeGmt),
      tqiScore:        parseFloat(form.tqiScore),
      trackId:         form.trackId,
    });
    setShowForm(false);
    setForm({ ...form, description: "", kmFrom: "", kmTo: "" });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* ── Top Bar: Title & Search ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Maintenance Demands &amp; Defect Registry ({workOrders.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized from track geometry recording cars (TRC), OHE tower wagons, and electronic interlocking logs
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search defect, km, dept…"
              className="w-56 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 pl-8 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1a3c6e] focus:bg-white transition-all"
            />
            <svg
              className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {perms.canCreateWorkOrder && (
            <button
              id="btn-new-workorder"
              onClick={() => setShowForm(!showForm)}
              className="bg-[#1a3c6e] hover:bg-[#14305a] text-white text-xs font-semibold py-1.5 px-3.5 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <span>+</span>
              <span>New Work Order</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Department Filter Pills ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: "ALL",  label: "All Departments", count: workOrders.length,  icon: "📋" },
          { id: "TMS",  label: "Civil / P.Way",     count: grouped.TMS.length,   icon: "🛤️" },
          { id: "SMMS", label: "Signalling & S&T",  count: grouped.SMMS.length,  icon: "🚥" },
          { id: "TDMS", label: "Traction / OHE",    count: grouped.TDMS.length,  icon: "⚡" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isActive
                  ? "bg-white border-[#1a3c6e] shadow-xs ring-1 ring-[#1a3c6e]/20"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base">{tab.icon}</span>
                <span className="text-lg font-black tabular-nums text-slate-900">{tab.count}</span>
              </div>
              <p className="text-xs font-bold text-slate-800 mt-1">{tab.id === "ALL" ? "All Defects" : tab.id}</p>
              <p className="text-[11px] text-slate-400 truncate">{tab.label}</p>
            </button>
          );
        })}
      </div>

      {/* ── New Work Order Form ─────────────────────────────────────────────── */}
      {showForm && perms.canCreateWorkOrder && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-[#1a3c6e] uppercase tracking-wider">
              Submit New Maintenance Demand
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Department</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
              >
                <option value="TMS">TMS — Civil / P.Way</option>
                <option value="SMMS">SMMS — Signalling &amp; Telecom</option>
                <option value="TDMS">TDMS — Traction / OHE</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Track</label>
              <select
                value={form.trackId}
                onChange={(e) => setForm({ ...form, trackId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
              >
                <option value="UP">UP Line (Towards Ludhiana)</option>
                <option value="DN">DN Line (Towards Delhi)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Description of Work</label>
            <input
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 placeholder-slate-400"
              placeholder="e.g. Continuous Action Tamping machine deployment at Panipat Jn"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">From (km)</label>
              <input
                required
                type="number"
                step="0.1"
                value={form.kmFrom}
                onChange={(e) => setForm({ ...form, kmFrom: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">To (km)</label>
              <input
                required
                type="number"
                step="0.1"
                value={form.kmTo}
                onChange={(e) => setForm({ ...form, kmTo: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                placeholder="312.0"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Duration (min)</label>
              <input
                required
                type="number"
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Overdue Days</label>
              <input
                type="number"
                value={form.overdueDays}
                onChange={(e) => setForm({ ...form, overdueDays: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">GMT Tonnage</label>
              <input
                type="number"
                step="0.1"
                value={form.cumulativeGmt}
                onChange={(e) => setForm({ ...form, cumulativeGmt: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">TQI Score (0–100)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={form.tqiScore}
                onChange={(e) => setForm({ ...form, tqiScore: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
              />
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              className="bg-[#1a3c6e] hover:bg-[#14305a] text-white font-semibold py-2 px-5 rounded-lg text-xs transition-colors"
            >
              Submit Work Order
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold py-2 px-4 rounded-lg text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Work Order Card Grid ────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          No work orders found matching your filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((wo) => {
            const dept = wo.department as keyof typeof DEPT_CONFIG;
            const cfg  = DEPT_CONFIG[dept] ?? DEPT_CONFIG.TMS;

            return (
              <div
                key={wo.id}
                className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cfg.badgeClass}`}>
                        {wo.department}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">{cfg.label}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      wo.status === "SCHEDULED" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                      wo.status === "PENDING" ? "bg-amber-50 text-amber-800 border-amber-200" :
                      "bg-slate-100 text-slate-700 border-slate-200"
                    }`}>
                      {wo.status}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-800 leading-snug mb-3">
                    {wo.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] text-slate-600 mb-3">
                    <div>
                      <span className="text-slate-400 block text-[10px]">SPAN</span>
                      <strong className="text-slate-800">km {wo.kmFrom.toFixed(1)}–{wo.kmTo.toFixed(1)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">DURATION</span>
                      <strong className="text-slate-800">{wo.durationMinutes}m</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">TRACK</span>
                      <strong className="text-slate-800">{wo.trackId || "UP"}</strong>
                    </div>
                  </div>

                  {wo.assetRisk != null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Trained ML Degradation Risk</span>
                        <span>Penalty: {wo.penaltyWeight}x</span>
                      </div>
                      <RiskBar risk={wo.assetRisk} />
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  {wo.isShadowBlock ? (
                    <span className="text-rose-600 font-bold text-[10px] flex items-center gap-1">
                      <span>⚡</span>
                      <span>Bundled Shadow Block</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[10px]">Single possession</span>
                  )}

                  {wo.status === "PENDING" && perms.canCancelWorkOrder && (
                    <button
                      onClick={() => onCancelWorkOrder(wo.id)}
                      className="text-[11px] font-semibold text-rose-600 hover:underline"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
