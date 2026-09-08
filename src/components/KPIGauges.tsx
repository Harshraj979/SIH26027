"use client";

/**
 * KPIGauges — Operational Key Performance Indicators
 * Live metrics bar across the top of the Section Controller Cockpit.
 */

import React from "react";
import type { KPIs, SolverStats } from "@/types";

interface Props {
  kpis:        KPIs | null;
  solverStats: SolverStats | null;
  isLoading:   boolean;
}

interface GaugeProps {
  label:   string;
  value:   string | number;
  unit?:   string;
  status?: "ok" | "warn" | "critical" | "neutral";
  mono?:   boolean;
}

function Gauge({ label, value, unit, status = "neutral", mono = true }: GaugeProps) {
  const valueColor = {
    ok:       "text-emerald-400",
    warn:     "text-amber-400",
    critical: "text-red-400",
    neutral:  "text-slate-200",
  }[status];

  return (
    <div className="flex flex-col items-start px-4 py-2.5 border-r border-slate-800 min-w-[100px]">
      <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-bold tabular-nums ${mono ? "font-mono" : ""} ${valueColor}`}>
          {value}
        </span>
        {unit && <span className="text-[10px] text-slate-500 font-mono">{unit}</span>}
      </div>
    </div>
  );
}

export default function KPIGauges({ kpis, solverStats, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center h-full px-6 text-xs font-mono text-slate-600 animate-pulse">
        ◌ Computing…
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="flex items-center h-full px-6 text-xs font-mono text-slate-600">
        Run optimizer to populate KPIs
      </div>
    );
  }

  const avgRisk    = kpis.avgRisk ?? 0;
  const riskStatus = avgRisk > 75 ? "critical" : avgRisk > 50 ? "warn" : "ok";
  const solverOk   = solverStats?.status === "OPTIMAL" || solverStats?.status === "FEASIBLE";

  return (
    <div className="flex items-stretch h-full overflow-x-auto">
      <Gauge
        label="Blocks Scheduled"
        value={kpis.blocksScheduled}
        status={kpis.blocksScheduled > 0 ? "ok" : "neutral"}
      />
      <Gauge
        label="Shadow Blocks"
        value={kpis.shadowBlocks}
        status={kpis.shadowBlocks > 0 ? "warn" : "neutral"}
      />
      <Gauge
        label="P1 Protected"
        value={kpis.p1TrainsProtected}
        unit="trains"
        status="ok"
      />
      <Gauge
        label="Trains Delayed"
        value={kpis.perturbedTrains ?? 0}
        status={(kpis.perturbedTrains ?? 0) > 0 ? "warn" : "ok"}
      />
      <Gauge
        label="Avg Asset Risk"
        value={avgRisk.toFixed(1)}
        unit="%"
        status={riskStatus}
      />
      <Gauge
        label="Work Orders"
        value={kpis.totalWorkOrders ?? 0}
        status="neutral"
      />

      {/* Solver Status */}
      <div className="flex flex-col items-start px-4 py-2.5 border-r border-slate-800 min-w-[120px]">
        <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Solver</span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`w-2 h-2 rounded-full ${
            solverOk ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
          }`} />
          <span className={`text-xs font-mono font-bold ${
            solverOk ? "text-emerald-400" : "text-amber-400"
          }`}>
            {solverStats?.status ?? "IDLE"}
          </span>
        </div>
        {solverStats?.wallTimeMs != null && solverStats.wallTimeMs > 0 && (
          <span className="text-[10px] font-mono text-slate-600 mt-0.5">
            {solverStats.wallTimeMs.toFixed(0)}ms
          </span>
        )}
      </div>

      {/* Conflict Count */}
      {solverStats?.conflicts != null && (
        <div className="flex flex-col items-start px-4 py-2.5 border-r border-slate-800 min-w-[100px]">
          <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">CP Conflicts</span>
          <span className="text-xl font-bold font-mono tabular-nums text-slate-400">
            {solverStats.conflicts.toLocaleString()}
          </span>
        </div>
      )}

      {/* Live status badge */}
      <div className="flex items-center px-4 ml-auto">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          LIVE · {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST
        </div>
      </div>
    </div>
  );
}
