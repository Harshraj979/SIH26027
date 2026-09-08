"use client";

/**
 * KPIGauges — Operational Key Performance Indicators
 * Light-mode Indian Gov portal redesign.
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
}

function Gauge({ label, value, unit, status = "neutral" }: GaugeProps) {
  const valueColor = {
    ok:       "text-green-700",
    warn:     "text-amber-700",
    critical: "text-red-700",
    neutral:  "text-[#1a3c6e]",
  }[status];

  return (
    <div className="flex flex-col items-start px-4 py-2.5 border-r border-gray-200 min-w-[110px]">
      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-0.5">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-bold tabular-nums ${valueColor}`}>
          {value}
        </span>
        {unit && <span className="text-[10px] text-gray-400">{unit}</span>}
      </div>
    </div>
  );
}

export default function KPIGauges({ kpis, solverStats, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center h-full px-6 text-xs text-gray-400 animate-pulse gap-2">
        <span className="w-3 h-3 border-2 border-[#1a3c6e] border-t-transparent rounded-full animate-spin" />
        Computing optimal schedule…
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="flex items-center h-full px-6 text-xs text-gray-400">
        Click <strong className="mx-1 text-[#1a3c6e]">Run Block Optimiser</strong> to compute KPIs
      </div>
    );
  }

  const avgRisk    = kpis.avgRisk ?? 0;
  const riskStatus = avgRisk > 75 ? "critical" : avgRisk > 50 ? "warn" : "ok";
  const solverOk   = solverStats?.status === "OPTIMAL" || solverStats?.status === "FEASIBLE";

  return (
    <div className="flex items-stretch h-14 overflow-x-auto bg-white">
      <Gauge label="Blocks Scheduled"  value={kpis.blocksScheduled}         status={kpis.blocksScheduled > 0 ? "ok" : "neutral"} />
      <Gauge label="Shadow Blocks"     value={kpis.shadowBlocks}             status={kpis.shadowBlocks > 0 ? "warn" : "neutral"} />
      <Gauge label="P1 Trains Protected" value={kpis.p1TrainsProtected}     unit="trains" status="ok" />
      <Gauge label="Trains Delayed"    value={kpis.perturbedTrains ?? 0}     status={(kpis.perturbedTrains ?? 0) > 0 ? "warn" : "ok"} />
      <Gauge label="Avg Asset Risk"    value={avgRisk.toFixed(1)}            unit="%" status={riskStatus} />
      <Gauge label="Work Orders"       value={kpis.totalWorkOrders ?? 0}     status="neutral" />

      {/* Solver Status */}
      <div className="flex flex-col items-start px-4 py-2.5 border-r border-gray-200 min-w-[130px]">
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-0.5">Solver Status</span>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${solverOk ? "bg-green-500 animate-pulse" : "bg-amber-500"}`} />
          <span className={`text-xs font-bold ${solverOk ? "text-green-700" : "text-amber-700"}`}>
            {solverStats?.status ?? "IDLE"}
          </span>
          {solverStats?.wallTimeMs != null && solverStats.wallTimeMs > 0 && (
            <span className="text-[10px] text-gray-400 ml-1">
              ({solverStats.wallTimeMs.toFixed(0)}ms)
            </span>
          )}
        </div>
      </div>

      {/* Live data indicator */}
      <div className="flex items-center px-4 ml-auto gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"/>
        <span className="text-[11px] text-amber-700 font-semibold">SIMULATED</span>
        <span className="text-[11px] text-gray-400 ml-2">
          {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST
        </span>
      </div>
    </div>
  );
}
