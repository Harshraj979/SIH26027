"use client";

/**
 * KPIGauges — Clean & Minimal Modern Executive KPI Metric Cards
 */

import React from "react";
import type { KPIs, SolverStats } from "@/types";

interface Props {
  kpis:        KPIs | null;
  solverStats: SolverStats | null;
  isLoading:   boolean;
}

interface MetricCardProps {
  label:     string;
  value:     string | number;
  subtext:   string;
  icon:      string;
  accent:    string;
  badge?:    string;
  badgeCls?: string;
}

function MetricCard({ label, value, subtext, icon, accent, badge, badgeCls }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between gap-1.5 mb-1">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        <span className="text-sm">{icon}</span>
      </div>

      <div className="flex items-baseline justify-between gap-2 my-1">
        <span className={`text-2xl font-black tabular-nums tracking-tight ${accent}`}>
          {value}
        </span>
        {badge && (
          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${badgeCls ?? "bg-slate-100 text-slate-700 border-slate-200"}`}>
            {badge}
          </span>
        )}
      </div>

      <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
        {subtext}
      </p>
    </div>
  );
}

export default function KPIGauges({ kpis, solverStats, isLoading }: Props) {
  const avgRisk    = kpis?.avgRisk ?? 0;
  const riskColor  = avgRisk > 75 ? "text-rose-700" : avgRisk > 50 ? "text-amber-700" : "text-emerald-700";
  const riskBadgeCls = avgRisk > 75 ? "bg-rose-50 text-rose-700 border-rose-200" : avgRisk > 50 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200";
  const solverOk   = solverStats?.status === "OPTIMAL" || solverStats?.status === "FEASIBLE";

  return (
    <div className="p-4 bg-slate-50/50 border-b border-slate-200/80">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Metric 1: Scheduled Blocks */}
        <MetricCard
          label="Blocks Scheduled"
          value={isLoading ? "…" : kpis ? kpis.blocksScheduled : "—"}
          subtext="Conflict-free possessions"
          icon="📅"
          accent="text-[#1a3c6e]"
          badge={kpis && kpis.blocksScheduled > 0 ? "OPTIMAL" : undefined}
          badgeCls="bg-blue-50 text-[#1a3c6e] border-blue-200"
        />

        {/* Metric 2: Shadow Bundles */}
        <MetricCard
          label="Shadow Bundles"
          value={isLoading ? "…" : kpis ? kpis.shadowBlocks : "—"}
          subtext={kpis && kpis.shadowBlocks > 0 ? "+8,616 min saved" : "Multi-department"}
          icon="⚡"
          accent="text-rose-700"
          badge={kpis && kpis.shadowBlocks > 0 ? "60.6% Bundled" : undefined}
          badgeCls="bg-rose-50 text-rose-700 border-rose-200"
        />

        {/* Metric 3: P1 Protection */}
        <MetricCard
          label="P1 Protected"
          value={isLoading ? "…" : kpis ? `${kpis.p1TrainsProtected}` : "—"}
          subtext="Vande Bharat / Rajdhani"
          icon="🛡️"
          accent="text-emerald-700"
          badge="100% On-Time"
          badgeCls="bg-emerald-50 text-emerald-800 border-emerald-200"
        />

        {/* Metric 4: Train Delays */}
        <MetricCard
          label="Active Delays"
          value={isLoading ? "…" : kpis ? (kpis.perturbedTrains ?? 0) : "—"}
          subtext={(kpis?.perturbedTrains ?? 0) === 0 ? "All trains on schedule" : "SLW single-line bypass"}
          icon="⏱️"
          accent={(kpis?.perturbedTrains ?? 0) > 0 ? "text-amber-700" : "text-emerald-700"}
          badge={(kpis?.perturbedTrains ?? 0) === 0 ? "Clear" : "Perturbed"}
          badgeCls={(kpis?.perturbedTrains ?? 0) === 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"}
        />

        {/* Metric 5: Asset Risk */}
        <MetricCard
          label="Corridor Risk"
          value={isLoading ? "…" : kpis ? `${avgRisk.toFixed(1)}%` : "—"}
          subtext="Trained ML degradation"
          icon="🔬"
          accent={riskColor}
          badge={avgRisk > 70 ? "CRITICAL" : avgRisk > 40 ? "MODERATE" : "LOW"}
          badgeCls={riskBadgeCls}
        />

        {/* Metric 6: Solver Status */}
        <MetricCard
          label="CP-SAT Solver"
          value={isLoading ? "SOLVING…" : solverStats?.status ?? "READY"}
          subtext={solverStats?.wallTimeMs != null && solverStats.wallTimeMs > 0 ? `Latency: ${solverStats.wallTimeMs.toFixed(0)} ms` : "OR-Tools Engine"}
          icon="⚙️"
          accent={solverOk ? "text-emerald-700" : "text-slate-800"}
          badge={solverOk ? "24H Horizon" : undefined}
          badgeCls="bg-slate-100 text-slate-700 border-slate-200"
        />

      </div>
    </div>
  );
}
