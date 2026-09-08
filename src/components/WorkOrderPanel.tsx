"use client";

/**
 * WorkOrderPanel — Multi-Departmental Maintenance Demand Manager
 * Light-mode Indian Gov portal redesign.
 */

import React, { useState } from "react";
import type { WorkOrder } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { ROLE_PERMISSIONS } from "@/types/auth";

interface Props {
  workOrders:       WorkOrder[];
  onAddWorkOrder:   (wo: Partial<WorkOrder>) => void;
  onCancelWorkOrder:(id: string) => void;
}

const DEPT_CONFIG = {
  TMS:  { label: "Civil / P.Way",     badgeClass: "bg-amber-100 text-amber-800 border-amber-300" },
  SMMS: { label: "Signalling & S&T",  badgeClass: "bg-blue-100 text-blue-800 border-blue-300" },
  TDMS: { label: "Traction / OHE",    badgeClass: "bg-red-100 text-red-800 border-red-300" },
} as const;

const STATUS_CLASSES: Record<string, string> = {
  PENDING:   "badge-warn",
  SCHEDULED: "badge-ok",
  COMPLETED: "badge-neutral",
  CANCELLED: "badge-err",
};

function RiskBar({ risk }: { risk: number | null | undefined }) {
  const r    = risk ?? 0;
  const pct  = Math.min(100, Math.max(0, r));
  const color = pct > 75 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-green-500";
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] tabular-nums font-semibold ${pct > 75 ? "text-red-600" : pct > 50 ? "text-amber-600" : "text-green-700"}`}>
        {r.toFixed(0)}
      </span>
    </div>
  );
}

export default function WorkOrderPanel({ workOrders, onAddWorkOrder, onCancelWorkOrder }: Props) {
  const { user } = useAuth();
  const perms    = user ? ROLE_PERMISSIONS[user.role] : ROLE_PERMISSIONS.OBSERVER;

  const [activeTab, setActiveTab] = useState<"TMS" | "SMMS" | "TDMS" | "ALL">("ALL");
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({
    department: "TMS", description: "", kmFrom: "", kmTo: "",
    durationMinutes: "120", overdueDays: "0", cumulativeGmt: "0", tqiScore: "70", trackId: "UP",
  });

  const filtered = activeTab === "ALL" ? workOrders : workOrders.filter((w) => w.department === activeTab);
  const grouped  = {
    TMS:  workOrders.filter((w) => w.department === "TMS"),
    SMMS: workOrders.filter((w) => w.department === "SMMS"),
    TDMS: workOrders.filter((w) => w.department === "TDMS"),
  };

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
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-[#1a3c6e] uppercase tracking-wider">Maintenance Work Orders</h2>
          <p className="text-xs text-gray-500 mt-0.5">Civil (P.Way) · Signalling · Traction/OHE</p>
        </div>
        {perms.canCreateWorkOrder && (
          <button
            id="btn-new-workorder"
            onClick={() => setShowForm(!showForm)}
            className="gov-btn-primary text-xs py-1.5 px-3"
          >
            + New Work Order
          </button>
        )}
      </div>

      {/* Department summary tabs */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {([
          { id: "ALL",  label: "All Depts",         count: workOrders.length, cls: "bg-[#eef2f9] border-[#1a3c6e] text-[#1a3c6e]" },
          { id: "TMS",  label: DEPT_CONFIG.TMS.label,  count: grouped.TMS.length,  cls: DEPT_CONFIG.TMS.badgeClass },
          { id: "SMMS", label: DEPT_CONFIG.SMMS.label, count: grouped.SMMS.length, cls: DEPT_CONFIG.SMMS.badgeClass },
          { id: "TDMS", label: DEPT_CONFIG.TDMS.label, count: grouped.TDMS.length, cls: DEPT_CONFIG.TDMS.badgeClass },
        ] as { id: string; label: string; count: number; cls: string }[]).map(({ id, label, count }) => (
          <button
            key={id}
            id={`wo-tab-${id.toLowerCase()}`}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className={`border rounded p-2 text-center text-xs transition-all ${
              activeTab === id
                ? "border-[#1a3c6e] bg-[#eef2f9] shadow-sm"
                : "border-gray-200 bg-white hover:border-[#1a3c6e]"
            }`}
          >
            <div className="text-lg font-bold text-[#1a3c6e]">{count}</div>
            <div className="font-semibold text-gray-700">{id}</div>
            <div className="text-gray-400 text-[10px]">{label}</div>
          </button>
        ))}
      </div>

      {/* New Work Order Form */}
      {showForm && perms.canCreateWorkOrder && (
        <form onSubmit={handleSubmit} className="gov-card p-4 mb-4 space-y-3 text-sm">
          <h3 className="text-xs font-bold text-[#1a3c6e] uppercase tracking-wider border-b border-gray-200 pb-2 mb-3">
            New Maintenance Demand
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
              <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="gov-input">
                <option value="TMS">TMS — Civil / P.Way</option>
                <option value="SMMS">SMMS — Signalling &amp; S&amp;T</option>
                <option value="TDMS">TDMS — Traction / OHE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Track</label>
              <select value={form.trackId} onChange={(e) => setForm({ ...form, trackId: e.target.value })} className="gov-input">
                <option value="UP">UP Line</option>
                <option value="DN">DN Line</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description of Work</label>
            <input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="gov-input" placeholder="e.g. Ballast tamping at km 100–130" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">From (km)</label>
              <input required type="number" step="0.1" value={form.kmFrom}
                onChange={(e) => setForm({ ...form, kmFrom: e.target.value })} className="gov-input" placeholder="0.0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">To (km)</label>
              <input required type="number" step="0.1" value={form.kmTo}
                onChange={(e) => setForm({ ...form, kmTo: e.target.value })} className="gov-input" placeholder="312.0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Duration (min)</label>
              <input required type="number" value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} className="gov-input" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Overdue Days</label>
              <input type="number" value={form.overdueDays}
                onChange={(e) => setForm({ ...form, overdueDays: e.target.value })} className="gov-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">GMT Tonnage</label>
              <input type="number" step="0.1" value={form.cumulativeGmt}
                onChange={(e) => setForm({ ...form, cumulativeGmt: e.target.value })} className="gov-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">TQI Score (0–100)</label>
              <input type="number" step="0.1" min="0" max="100" value={form.tqiScore}
                onChange={(e) => setForm({ ...form, tqiScore: e.target.value })} className="gov-input" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="gov-btn-primary text-xs py-2 flex-1">Submit Work Order</button>
            <button type="button" onClick={() => setShowForm(false)} className="gov-btn-secondary text-xs py-2 px-4">Cancel</button>
          </div>
        </form>
      )}

      {/* Work Order list */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm gov-card">
          No work orders{activeTab !== "ALL" ? ` for ${activeTab}` : ""} at this time.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((wo) => {
            const dept = wo.department as keyof typeof DEPT_CONFIG;
            const cfg  = DEPT_CONFIG[dept] ?? DEPT_CONFIG.TMS;
            return (
              <div key={wo.id} className="gov-card p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${cfg.badgeClass}`}>
                      {wo.department}
                    </span>
                    <span className="text-[10px] text-gray-500">{cfg.label}</span>
                  </div>
                  <span className={STATUS_CLASSES[wo.status] ?? STATUS_CLASSES.PENDING}>
                    {wo.status}
                  </span>
                </div>

                <p className="text-sm text-gray-800 mb-2 leading-snug">{wo.description}</p>

                <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                  <div><span className="font-medium">Section:</span> km {wo.kmFrom}–{wo.kmTo}</div>
                  <div><span className="font-medium">Duration:</span> {wo.durationMinutes} min</div>
                  <div><span className="font-medium">TQI Score:</span> {wo.tqiScore.toFixed(0)}</div>
                </div>

                {wo.assetRisk != null && (
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                      <span>Asset Risk Score</span>
                      <span>Penalty Weight: {wo.penaltyWeight}</span>
                    </div>
                    <RiskBar risk={wo.assetRisk} />
                  </div>
                )}

                {wo.isShadowBlock && (
                  <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 flex items-center gap-1">
                    ◆ Shadow Block — Multi-department merged window
                  </div>
                )}

                {wo.status === "PENDING" && perms.canCancelWorkOrder && (
                  <button
                    onClick={() => onCancelWorkOrder(wo.id)}
                    className="mt-2 text-[11px] text-red-600 hover:underline"
                  >
                    Cancel Work Order
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
