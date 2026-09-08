"use client";

/**
 * RailBlock AI — Section Controller Cockpit
 * Main application page. Layout:
 *   ┌─────────────────────────────────────┬──────────────────────┐
 *   │ KPI Gauges (full width header)      │                      │
 *   ├──────────────────────────┬──────────┤   Work Order Panel   │
 *   │ Master String Chart (80%)│ Events   │   (right rail, 20%)  │
 *   │                          │ Panel    │                      │
 *   └──────────────────────────┴──────────┴──────────────────────┘
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import WorkOrderPanel from "@/components/WorkOrderPanel";
import KPIGauges from "@/components/KPIGauges";
import EventPanel, { EventPayload } from "@/components/EventPanel";
import type {
  CorridorData, OptimizeResponse, WorkOrder,
  ScheduledBlock, TrainPerturbation, KPIs, SolverStats,
} from "@/types";

import MasterStringChart from "@/components/MasterStringChart";

type Horizon = "SHIFT" | "DAILY" | "WEEKLY" | "MONTHLY";

const HORIZON_LABELS: Record<Horizon, string> = {
  SHIFT:   "Day Shift",
  DAILY:   "Daily",
  WEEKLY:  "Weekly",
  MONTHLY: "Monthly",
};

export default function CockpitPage() {
  // ── State ────────────────────────────────────────────────────────────────
  const [corridorData, setCorridorData] = useState<CorridorData | null>(null);
  const [scheduledBlocks, setScheduledBlocks] = useState<ScheduledBlock[]>([]);
  const [perturbations, setPerturbations]     = useState<TrainPerturbation[]>([]);
  const [kpis, setKpis]                       = useState<KPIs | null>(null);
  const [solverStats, setSolverStats]         = useState<SolverStats | null>(null);
  const [horizon, setHorizon]                 = useState<Horizon>("DAILY");
  const [isOptimizing, setIsOptimizing]       = useState(false);
  const [isInjecting, setIsInjecting]         = useState(false);
  const [isLoading, setIsLoading]             = useState(true);
  const [loadError, setLoadError]             = useState<string | null>(null);
  const [toast, setToast]                     = useState<{ msg: string; type: "ok" | "warn" | "err" } | null>(null);
  const toastTimer                             = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Toast helper ─────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string, type: "ok" | "warn" | "err" = "ok") => {
    setToast({ msg, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Load corridor data ────────────────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    fetch("/api/corridor")
      .then((r) => {
        if (!r.ok) throw new Error(`Corridor API error: ${r.status}`);
        return r.json();
      })
      .then((data: CorridorData) => {
        setCorridorData(data);
        setIsLoading(false);
      })
      .catch((e) => {
        setLoadError(e.message);
        setIsLoading(false);
      });
  }, []);

  // ── Optimize handler ──────────────────────────────────────────────────────
  const handleOptimize = useCallback(async () => {
    if (isOptimizing) return;
    setIsOptimizing(true);
    try {
      const date = new Date().toISOString().split("T")[0];
      const res  = await fetch("/api/optimize", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ date }),
      });
      const data: OptimizeResponse = await res.json();

      if (data.error) {
        showToast(`Solver error: ${data.error}`, "err");
      } else {
        setScheduledBlocks(data.scheduledBlocks ?? []);
        setPerturbations(data.trainPerturbations ?? []);
        setKpis(data.kpis);
        setSolverStats(data.solverStats);

        // Refresh work orders list to see updated statuses
        const cd = await fetch("/api/corridor").then((r) => r.json()) as CorridorData;
        setCorridorData(cd);

        const { status, wallTimeMs } = data.solverStats;
        showToast(
          `${status} — ${data.kpis.blocksScheduled} blocks in ${wallTimeMs?.toFixed(0)}ms`,
          status === "OPTIMAL" || status === "FEASIBLE" ? "ok" : "warn"
        );
      }
    } catch (e) {
      showToast(`Network error: ${String(e)}`, "err");
    } finally {
      setIsOptimizing(false);
    }
  }, [isOptimizing, showToast]);

  // ── Event injection ───────────────────────────────────────────────────────
  const handleInjectEvent = useCallback(async (payload: EventPayload) => {
    if (isInjecting) return;
    setIsInjecting(true);
    try {
      const res  = await fetch("/api/events", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.solverResult) {
        setScheduledBlocks(data.solverResult.scheduledBlocks ?? []);
        setPerturbations(data.solverResult.trainPerturbations ?? []);
        setKpis(data.solverResult.kpis);
        setSolverStats(data.solverResult.solverStats);
        // Refresh corridor data
        const cd = await fetch("/api/corridor").then((r) => r.json()) as CorridorData;
        setCorridorData(cd);
        showToast(`Event logged & re-solved: ${data.solverResult.solverStats.status}`, "warn");
      }
    } catch (e) {
      showToast(`Event error: ${String(e)}`, "err");
    } finally {
      setIsInjecting(false);
    }
  }, [isInjecting, showToast]);

  // ── Add work order ────────────────────────────────────────────────────────
  const handleAddWorkOrder = useCallback(async (wo: Partial<WorkOrder>) => {
    try {
      const res = await fetch("/api/workorders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          ...wo,
          requestedDate: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const cd = await fetch("/api/corridor").then((r) => r.json()) as CorridorData;
      setCorridorData(cd);
      showToast("Work order created", "ok");
    } catch (e) {
      showToast(`WO error: ${String(e)}`, "err");
    }
  }, [showToast]);

  // ── Cancel work order ─────────────────────────────────────────────────────
  const handleCancelWorkOrder = useCallback(async (id: string) => {
    try {
      await fetch(`/api/workorders?id=${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: "CANCELLED" }),
      });
      const cd = await fetch("/api/corridor").then((r) => r.json()) as CorridorData;
      setCorridorData(cd);
      showToast("Work order cancelled", "warn");
    } catch (e) {
      showToast(`Error: ${String(e)}`, "err");
    }
  }, [showToast]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0B0F17]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm font-mono">Initialising RailBlock AI…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0B0F17]">
        <div className="max-w-md text-center space-y-3 p-8">
          <div className="text-red-400 text-4xl">⚠</div>
          <h1 className="text-slate-200 font-semibold">Database not ready</h1>
          <p className="text-slate-500 text-sm font-mono">{loadError}</p>
          <div className="bg-slate-900 rounded p-3 text-left text-xs font-mono text-slate-400 space-y-1">
            <p>Run these commands to seed the database:</p>
            <p className="text-emerald-400">npx prisma migrate dev --name init</p>
            <p className="text-emerald-400">npx tsx prisma/seed.ts</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-slate-700 text-slate-300 rounded hover:border-emerald-700 hover:text-emerald-400 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stations    = corridorData?.stations    ?? [];
  const trains      = corridorData?.trains      ?? [];
  const workOrders  = corridorData?.workOrders  ?? [];
  const events      = corridorData?.events      ?? [];

  return (
    <div className="h-screen bg-[#0B0F17] text-slate-200 flex flex-col overflow-hidden">

      {/* ── Top Header Bar ─────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-[#111827] shrink-0">
        <div className="flex items-center gap-3">
          {/* Logo / Wordmark */}
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 17l6-8 4 4 4-6 4 10" />
              <path d="M3 21h18" strokeWidth="1.5" strokeOpacity="0.4" />
            </svg>
            <div>
              <span className="text-sm font-bold text-slate-100 tracking-tight">RailBlock</span>
              <span className="text-sm font-bold text-emerald-500 ml-1">AI</span>
              <span className="ml-2 text-[9px] font-mono text-slate-600 uppercase tracking-widest">
                NR · DLI Division
              </span>
            </div>
          </div>

          {/* Corridor */}
          <div className="h-4 w-px bg-slate-800" />
          <span className="text-xs font-mono text-slate-500">NDLS–UMB–LDH · 312.0 km</span>
        </div>

        {/* Horizon Toggles */}
        <div className="flex items-center gap-1 border border-slate-800 rounded p-0.5">
          {(Object.keys(HORIZON_LABELS) as Horizon[]).map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                horizon === h
                  ? "bg-slate-700 text-slate-200"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {HORIZON_LABELS[h]}
            </button>
          ))}
        </div>

        {/* Optimize Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="flex items-center gap-2 px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600
                       disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs font-semibold
                       rounded transition-colors"
          >
            {isOptimizing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Solving…
              </>
            ) : (
              <>
                <span>⬡</span> Optimize Blocks
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── KPI Gauges Bar ─────────────────────────────────────────────────── */}
      <div className="h-16 border-b border-slate-800 bg-[#111827] shrink-0 overflow-hidden">
        <KPIGauges kpis={kpis} solverStats={solverStats} isLoading={isOptimizing} />
      </div>

      {/* ── Main Content Area ──────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Chart + Events (80%) */}
        <div className="flex flex-col flex-1 min-w-0">

          {/* Master String Chart */}
          <div className="flex-1 overflow-hidden p-2">
            <MasterStringChart
              stations={stations}
              trains={trains}
              scheduledBlocks={scheduledBlocks}
              horizon={312}
              width={1200}
              height={600}
            />
          </div>

          {/* Perturbations + Event Injection bottom strip */}
          <div className="h-56 border-t border-slate-800 flex min-h-0">
            {/* Perturbations table */}
            <div className="flex-1 border-r border-slate-800 overflow-hidden flex flex-col">
              <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                  Train Perturbations
                </span>
                {perturbations.length > 0 && (
                  <span className="text-[10px] font-mono text-amber-400">
                    {perturbations.length} affected
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                {perturbations.length === 0 ? (
                  <div className="p-4 text-center text-slate-600 text-xs font-mono">
                    No delays computed — run optimizer
                  </div>
                ) : (
                  <table className="w-full text-xs font-mono">
                    <thead className="sticky top-0 bg-[#111827]">
                      <tr className="text-slate-600 text-[10px]">
                        <th className="px-4 py-1.5 text-left">Train</th>
                        <th className="px-3 py-1.5 text-left">Station</th>
                        <th className="px-3 py-1.5 text-left">Orig Dep</th>
                        <th className="px-3 py-1.5 text-right">Delay</th>
                        <th className="px-4 py-1.5 text-left">Cause</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perturbations.map((p, i) => (
                        <tr key={i} className="border-t border-slate-800/50 hover:bg-slate-800/30">
                          <td className="px-4 py-1.5 text-slate-300 font-semibold">{p.trainNumber}</td>
                          <td className="px-3 py-1.5 text-slate-400">{p.stationCode}</td>
                          <td className="px-3 py-1.5 text-slate-400">{p.originalDeparture}</td>
                          <td className="px-3 py-1.5 text-right">
                            <span className={`${p.delayMinutes > 30 ? "text-red-400" : "text-amber-400"} tabular-nums`}>
                              +{p.delayMinutes}m
                            </span>
                          </td>
                          <td className="px-4 py-1.5 text-slate-500 max-w-xs truncate">{p.cause}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Event Panel */}
            <div className="w-72 shrink-0">
              <EventPanel
                events={events}
                trains={trains}
                onInjectEvent={handleInjectEvent}
                isInjecting={isInjecting}
              />
            </div>
          </div>
        </div>

        {/* Work Order Panel (right rail ~20%) */}
        <div className="w-72 shrink-0 border-l border-slate-800 flex flex-col min-h-0">
          <WorkOrderPanel
            workOrders={workOrders}
            onAddWorkOrder={handleAddWorkOrder}
            onCancelWorkOrder={handleCancelWorkOrder}
          />
        </div>
      </div>

      {/* ── Toast Notification ──────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-2.5 rounded border text-xs font-mono shadow-xl
          transition-all duration-200 ${
            toast.type === "ok"
              ? "bg-emerald-950 border-emerald-700 text-emerald-300"
              : toast.type === "warn"
              ? "bg-amber-950 border-amber-700 text-amber-300"
              : "bg-red-950 border-red-700 text-red-300"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
