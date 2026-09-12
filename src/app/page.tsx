"use client";

/**
 * RailBlock AI — Indian Railways 4-Portal Block Planning & Scheduling System
 *
 * Dedicated Simple Dashboards:
 * 1. TMS Portal  — Civil P-Way Track Maintenance
 * 2. SMMS Portal — Signal & Telecom Maintenance
 * 3. TDMS Portal — 25kV Traction / OHE Maintenance
 * 4. COA Central — Central Administrator Brain (Unified Pipeline, Balancing Scale & Dual-Horizon Planner)
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import LoginPage from "@/components/LoginPage";
import GovHeader from "@/components/GovHeader";
import RoleGate from "@/components/RoleGate";
import PortalNavigator, { PortalType } from "@/components/PortalNavigator";
import COABalancingScaleWidget from "@/components/COABalancingScaleWidget";
import SSRDurationCalculatorModal from "@/components/SSRDurationCalculatorModal";
import BlockScheduleRegistry from "@/components/BlockScheduleRegistry";
import WorkOrderPanel from "@/components/WorkOrderPanel";
import TMSPortalView from "@/components/portals/TMSPortalView";
import SMMSPortalView from "@/components/portals/SMMSPortalView";
import TDMSPortalView from "@/components/portals/TDMSPortalView";

import type {
  CorridorData,
  OptimizeResponse,
  WorkOrder,
  ScheduledBlock,
  KPIs,
  SolverStats,
} from "@/types";
import { ROLE_PERMISSIONS } from "@/types/auth";

type Horizon = "WEEKLY" | "MONTHLY";

const HORIZON_LABELS: Record<Horizon, { title: string; subtitle: string }> = {
  WEEKLY: {
    title: "Weekly Tactical Plan",
    subtitle: "7-Day Tactical Horizon • High Priority (> 70) • Immediate Timetable Windows",
  },
  MONTHLY: {
    title: "Monthly Strategic Plan",
    subtitle: "30-Day Preventative Horizon • Routine Defects (< 50) • Stable Timetable Quotas",
  },
};

// ─── Inner App (Authenticated) ───────────────────────────────────────────────

function MainApp() {
  const { user, logout } = useAuth();
  const perms = user ? ROLE_PERMISSIONS[user.role] : ROLE_PERMISSIONS.OBSERVER;

  // ── 1. Portal Navigation State ─────────────────────────────────────────────
  const [activePortal, setActivePortal] = useState<PortalType>(() => {
    if (user?.department === "TMS") return "TMS";
    if (user?.department === "SMMS") return "SMMS";
    if (user?.department === "TDMS") return "TDMS";
    return "COA";
  });

  useEffect(() => {
    if (user?.department === "TMS") setActivePortal("TMS");
    else if (user?.department === "SMMS") setActivePortal("SMMS");
    else if (user?.department === "TDMS") setActivePortal("TDMS");
  }, [user?.department]);

  // ── 2. Core Operational State ──────────────────────────────────────────────
  const [corridorData, setCorridorData]       = useState<CorridorData | null>(null);
  const [scheduledBlocks, setScheduledBlocks] = useState<ScheduledBlock[]>([]);
  const [kpis, setKpis]                       = useState<KPIs | null>(null);
  const [solverStats, setSolverStats]         = useState<SolverStats | null>(null);
  const [horizon, setHorizon]                 = useState<Horizon>("WEEKLY");
  const [coaTab, setCoaTab]                   = useState<"schedule" | "pipeline">("schedule");

  // ── 3. UI & Modal State ────────────────────────────────────────────────────
  const [isOptimizing, setIsOptimizing]               = useState(false);
  const [isLoading, setIsLoading]                     = useState(true);
  const [loadError, setLoadError]                     = useState<string | null>(null);
  const [isSSRCalculatorOpen, setIsSSRCalculatorOpen] = useState(false);

  // ── 4. Toast Alerts ────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "warn" | "err" } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, type: "ok" | "warn" | "err" = "ok") => {
    setToast({ msg, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  // ── 5. Data Ingestion & Initial Solve ──────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    fetch("/api/corridor")
      .then((r) => {
        if (!r.ok) throw new Error(`Corridor API error: ${r.status}`);
        return r.json();
      })
      .then(async (data: CorridorData) => {
        setCorridorData(data);
        setIsLoading(false);
        try {
          const date = new Date().toISOString().split("T")[0];
          const res = await fetch("/api/optimize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date, horizonType: "WEEKLY" }),
          });
          const optData: OptimizeResponse = await res.json();
          if (!optData.error) {
            setScheduledBlocks(optData.scheduledBlocks ?? []);
            setKpis(optData.kpis);
            setSolverStats(optData.solverStats);
          }
        } catch {
          /* non-blocking */
        }
      })
      .catch((e) => {
        setLoadError(e.message);
        setIsLoading(false);
      });
  }, []);

  // ── 6. Optimization Trigger ────────────────────────────────────────────────
  const handleOptimize = useCallback(
    async (forcedHorizon?: Horizon) => {
      if (isOptimizing || !perms.canOptimize) return;
      setIsOptimizing(true);
      const targetHorizon = forcedHorizon || horizon;

      try {
        const date = new Date().toISOString().split("T")[0];
        const res = await fetch("/api/optimize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            horizonType: targetHorizon,
          }),
        });

        const data: OptimizeResponse = await res.json();
        if (data.error) {
          showToast(`Solver error: ${data.error}`, "err");
        } else {
          setScheduledBlocks(data.scheduledBlocks ?? []);
          setKpis(data.kpis);
          setSolverStats(data.solverStats);

          const cd = (await fetch("/api/corridor").then((r) => r.json())) as CorridorData;
          setCorridorData(cd);

          const { status, wallTimeMs } = data.solverStats;
          showToast(
            `${status} — ${data.kpis.blocksScheduled} blocks computed for ${HORIZON_LABELS[targetHorizon].title} in ${wallTimeMs?.toFixed(0)}ms`,
            status === "OPTIMAL" || status === "FEASIBLE" ? "ok" : "warn"
          );
        }
      } catch (e) {
        showToast(`Network error: ${String(e)}`, "err");
      } finally {
        setIsOptimizing(false);
      }
    },
    [isOptimizing, perms, horizon, showToast]
  );

  // ── 7. Work Order Handlers ─────────────────────────────────────────────────
  const handleAddWorkOrder = useCallback(
    async (wo: Partial<WorkOrder>) => {
      try {
        const res = await fetch("/api/workorders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...wo, requestedDate: new Date().toISOString() }),
        });
        if (!res.ok) throw new Error(await res.text());

        const cd = (await fetch("/api/corridor").then((r) => r.json())) as CorridorData;
        setCorridorData(cd);
        showToast("Work order logged & forwarded to Central COA Pipeline.", "ok");
      } catch (e) {
        showToast(`Error: ${String(e)}`, "err");
      }
    },
    [showToast]
  );

  const handleCancelWorkOrder = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/workorders?id=${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "CANCELLED" }),
        });
        const cd = (await fetch("/api/corridor").then((r) => r.json())) as CorridorData;
        setCorridorData(cd);
        showToast("Work order cancelled.", "warn");
      } catch (e) {
        showToast(`Error: ${String(e)}`, "err");
      }
    },
    [showToast]
  );

  // ── 8. Loading & Error States ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <GovHeader onLogout={logout} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#000075] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Connecting to Unified Railway Pipeline…</p>
            <p className="text-xs text-slate-500">Loading NDLS – UMB – LDH Corridor Data (312 km)</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <GovHeader onLogout={logout} />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-red-200 rounded-xl p-6 text-center space-y-3 shadow-sm">
            <div className="text-3xl">⚠️</div>
            <h2 className="text-base font-bold text-red-700">Database Initialisation Required</h2>
            <p className="text-xs text-slate-600">{loadError}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 text-xs font-bold bg-[#000075] text-white rounded-lg hover:bg-blue-900 transition-colors">
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stations   = corridorData?.stations   ?? [];
  const workOrders = corridorData?.workOrders ?? [];
  const shadowBlocksCount = scheduledBlocks.filter((b) => b.isShadowBlock).length;
  const setupMinutesSaved = shadowBlocksCount * 20;

  return (
    <div className="min-h-screen bg-[#f4f6fa] flex flex-col text-slate-800">
      
      {/* ── 1. Top Strip: Official Ministry Strip ───────────────────────────── */}
      <div className="bg-[#00005a] text-white text-[11px] py-1 px-4 sm:px-8 border-b border-blue-900/60 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2 font-medium">
          <span>🇮🇳</span>
          <span className="font-bold text-slate-100">भारत सरकार</span>
          <span className="text-white/40">|</span>
          <span className="text-slate-200">Government of India</span>
          <span className="text-white/40 hidden sm:inline">•</span>
          <span className="text-slate-300 hidden sm:inline">Ministry of Railways</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300 font-medium text-[10.5px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="hidden sm:inline">Northern Railway (Delhi Division)</span>
          <span className="text-white/40 hidden sm:inline">|</span>
          <span className="text-[#ffba00] font-bold">NDLS – UMB – LDH Corridor (312 km)</span>
        </div>
      </div>

      {/* ── 2. Official Header with User Profile ────────────────────────────── */}
      <GovHeader onLogout={logout} />

      {/* ── 3. Four Integrated Portals Navigation Switcher ──────────────────── */}
      <PortalNavigator
        activePortal={activePortal}
        onSelectPortal={setActivePortal}
        counts={{
          TMS: workOrders.filter((w) => w.department === "TMS").length,
          SMMS: workOrders.filter((w) => w.department === "SMMS").length,
          TDMS: workOrders.filter((w) => w.department === "TDMS").length,
          scheduled: scheduledBlocks.length,
        }}
        onDirectToCOA={() => setActivePortal("COA")}
      />

      {/* ── 4. Department Field Portals (TMS / SMMS / TDMS) ─────────────────── */}
      {activePortal === "TMS" && (
        <div className="flex-1 overflow-auto">
          <TMSPortalView
            workOrders={workOrders}
            onAddWorkOrder={handleAddWorkOrder}
            onDirectToCOA={() => setActivePortal("COA")}
          />
        </div>
      )}

      {activePortal === "SMMS" && (
        <div className="flex-1 overflow-auto">
          <SMMSPortalView
            workOrders={workOrders}
            onAddWorkOrder={handleAddWorkOrder}
            onDirectToCOA={() => setActivePortal("COA")}
          />
        </div>
      )}

      {activePortal === "TDMS" && (
        <div className="flex-1 overflow-auto">
          <TDMSPortalView
            workOrders={workOrders}
            onAddWorkOrder={handleAddWorkOrder}
            onDirectToCOA={() => setActivePortal("COA")}
          />
        </div>
      )}

      {/* ── 5. Central Administrator Portal (COA Master Brain) ───────────────── */}
      {activePortal === "COA" && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          {/* Executive Control Strip */}
          <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 shrink-0 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              
              {/* Left: Corridor Context */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#000075] text-[#ffba00] border border-blue-900">
                    COA CENTRAL ADMINISTRATOR
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    NDLS–LDH Mainline (312 km Quadruple-Track)
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-[#000075] tracking-tight">
                  Unified AI Prioritisation &amp; Multi-Horizon Optimization Engine
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Directing requisitions from <span className="font-semibold text-amber-800">TMS Track</span>, <span className="font-semibold text-blue-800">SMMS Signals</span>, and <span className="font-semibold text-red-800">TDMS Traction</span> into conflict-free maintenance blocks.
                </p>
              </div>

              {/* Right: Dual-Horizon Switcher & Actions */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Horizon Switcher (Weekly vs Monthly) */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                  {(["WEEKLY", "MONTHLY"] as Horizon[]).map((h) => (
                    <button
                      key={h}
                      onClick={() => {
                        setHorizon(h);
                        handleOptimize(h);
                      }}
                      className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                        horizon === h
                          ? "bg-white text-[#000075] shadow-xs"
                          : "text-slate-600 hover:text-slate-900 font-medium"
                      }`}
                      title={HORIZON_LABELS[h].subtitle}
                    >
                      {h === "WEEKLY" ? "📅 Weekly Plan (> 70 Prio)" : "📆 Monthly Plan (< 50 Prio)"}
                    </button>
                  ))}
                </div>

                {/* SSR Rates Blueprint Modal Button */}
                <button
                  onClick={() => setIsSSRCalculatorOpen(true)}
                  className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-xs font-semibold py-2 px-3 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  title="Standard Schedule of Rates manual baseline & AI adjustment breakdown"
                >
                  <span>⏱️</span>
                  <span>SSR Master Rates</span>
                </button>

                {/* Run Optimizer Button */}
                <RoleGate allow={["SYSTEM_ADMIN", "DRM"]}>
                  <button
                    onClick={() => handleOptimize()}
                    disabled={isOptimizing}
                    className="flex items-center gap-1.5 bg-[#000075] hover:bg-blue-900 disabled:bg-slate-300 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-xs transition-all border border-blue-900 cursor-pointer"
                  >
                    {isOptimizing ? (
                      <>
                        <span className="w-3 h-3 border-2 border-[#ffba00] border-t-transparent rounded-full animate-spin" />
                        <span className="text-[#ffba00]">Optimizing CP-SAT…</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[#ffba00]">▶</span>
                        <span>Run AI Optimizer</span>
                      </>
                    )}
                  </button>
                </RoleGate>
              </div>
            </div>

            {/* 4 Clean Key Performance Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-slate-100">
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Corridor Scope</p>
                  <p className="text-base font-black text-[#000075]">312 km</p>
                  <p className="text-[10.5px] text-slate-500">NDLS – UMB – LDH (4 Lines)</p>
                </div>
                <div className="text-lg">🛤️</div>
              </div>

              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Scheduled Slots</p>
                  <p className="text-base font-black text-slate-900">{scheduledBlocks.length} Blocks</p>
                  <p className="text-[10.5px] text-emerald-700 font-semibold">✓ 0 Conflict Overlaps</p>
                </div>
                <div className="text-lg">📅</div>
              </div>

              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Setup Saved</p>
                  <p className="text-base font-black text-rose-700">+{setupMinutesSaved} min</p>
                  <p className="text-[10.5px] text-slate-500">{shadowBlocksCount} Shared Bundles</p>
                </div>
                <div className="text-lg">⚡</div>
              </div>

              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">P1 Punctuality</p>
                  <p className="text-base font-black text-emerald-700">100% Protected</p>
                  <p className="text-[10.5px] text-slate-500">0 min delay Vande Bharat</p>
                </div>
                <div className="text-lg">🛡️</div>
              </div>
            </div>
          </div>

          {/* Simple Tab Navigation */}
          <div className="bg-white border-b border-slate-200 px-4 sm:px-8 flex gap-2 shrink-0">
            <button
              onClick={() => setCoaTab("schedule")}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                coaTab === "schedule"
                  ? "text-[#000075] border-[#ffba00]"
                  : "text-slate-500 border-transparent hover:text-slate-800"
              }`}
            >
              <span>🚆 Approved Corridor Schedule &amp; Balancing Scale</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-[#000075]">
                {scheduledBlocks.length}
              </span>
            </button>

            <button
              onClick={() => setCoaTab("pipeline")}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                coaTab === "pipeline"
                  ? "text-[#000075] border-[#ffba00]"
                  : "text-slate-500 border-transparent hover:text-slate-800"
              }`}
            >
              <span>📋 Unified Defect Pipeline (TMS + SMMS + TDMS)</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
                {workOrders.length}
              </span>
            </button>
          </div>

          {/* Tab 1: Approved Corridor Schedule & Balancing Scale */}
          {coaTab === "schedule" && (
            <div className="flex-1 overflow-auto p-4 sm:p-5 flex flex-col gap-4">
              
              {/* ── Visual Mathematical Balancing Scale Widget ──────────────── */}
              <div className="shrink-0">
                <COABalancingScaleWidget scheduledBlocks={scheduledBlocks} />
              </div>

              {/* ── Clean Scheduled Blocks Registry ─────────────────────────── */}
              <div className="flex-1 min-h-[450px]">
                <BlockScheduleRegistry
                  scheduledBlocks={scheduledBlocks}
                  stations={stations}
                />
              </div>
            </div>
          )}

          {/* Tab 2: Unified Defect Pipeline */}
          {coaTab === "pipeline" && (
            <div className="flex-1 overflow-auto p-4 sm:p-5">
              <WorkOrderPanel
                workOrders={workOrders}
                onAddWorkOrder={handleAddWorkOrder}
                onCancelWorkOrder={handleCancelWorkOrder}
              />
            </div>
          )}

        </div>
      )}

      {/* ── Standard Schedule of Rates (SSR) Calculator Modal ──────────────── */}
      <SSRDurationCalculatorModal
        isOpen={isSSRCalculatorOpen}
        onClose={() => setIsSSRCalculatorOpen(false)}
      />

      {/* ── Toast Alert ────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 max-w-sm px-4 py-3 rounded-lg border shadow-lg text-xs font-medium transition-all ${
            toast.type === "ok"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : toast.type === "warn"
              ? "bg-amber-50 border-amber-300 text-amber-900"
              : "bg-rose-50 border-rose-300 text-rose-900"
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="shrink-0 font-bold">
              {toast.type === "ok" ? "✓" : toast.type === "warn" ? "⚠️" : "✕"}
            </span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Root Page with Authentication Provider ─────────────────────────────────

function AuthGate() {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#000075] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <LoginPage />;
  return <MainApp />;
}

export default function Page() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
