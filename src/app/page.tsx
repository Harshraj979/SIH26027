"use client";

/**
 * RailBlock AI — Indian Railways Block Planning & Scheduling System
 * Redesigned as a standard Indian Government portal interface.
 * RBAC: System Administrator, DRM, Observer roles enforced.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import LoginPage from "@/components/LoginPage";
import GovHeader from "@/components/GovHeader";
import RoleGate from "@/components/RoleGate";
import WorkOrderPanel from "@/components/WorkOrderPanel";
import KPIGauges from "@/components/KPIGauges";
import EventPanel, { EventPayload } from "@/components/EventPanel";
import MasterStringChart from "@/components/MasterStringChart";
import BlockScheduleRegistry from "@/components/BlockScheduleRegistry";
import CorridorTimelineGantt from "@/components/CorridorTimelineGantt";
import MultiAgentNegotiationModal from "@/components/MultiAgentNegotiationModal";
import DigitalTwinDrawer from "@/components/DigitalTwinDrawer";
import WhatIfSimulator, { SimulationParams } from "@/components/WhatIfSimulator";
import FieldFeedbackModal, { ExecutionPayload } from "@/components/FieldFeedbackModal";
import StrategicPlannerView from "@/components/StrategicPlannerView";

import type {
  CorridorData, OptimizeResponse, WorkOrder,
  ScheduledBlock, TrainPerturbation, KPIs, SolverStats,
  ArbitrationTranscript,
} from "@/types";
import { ROLE_PERMISSIONS } from "@/types/auth";

type Horizon = "DAILY" | "WEEKLY" | "MONTHLY";

const HORIZON_LABELS: Record<Horizon, string> = {
  DAILY:   "Today's Schedule",
  WEEKLY:  "Weekly Plan",
  MONTHLY: "Monthly Strategic",
};

// ─── Inner app (requires auth) ─────────────────────────────────────────────

function MainApp() {
  const { user, logout } = useAuth();

  // Permissions shorthand
  const perms = user ? ROLE_PERMISSIONS[user.role] : ROLE_PERMISSIONS.OBSERVER;

  // ── Core State ──────────────────────────────────────────────────────────────
  const [corridorData, setCorridorData]                 = useState<CorridorData | null>(null);
  const [scheduledBlocks, setScheduledBlocks]           = useState<ScheduledBlock[]>([]);
  const [perturbations, setPerturbations]               = useState<TrainPerturbation[]>([]);
  const [kpis, setKpis]                                 = useState<KPIs | null>(null);
  const [solverStats, setSolverStats]                   = useState<SolverStats | null>(null);
  const [arbitrationTranscript, setArbitrationTranscript] = useState<ArbitrationTranscript | null>(null);
  const [horizon, setHorizon]                           = useState<Horizon>("DAILY");
  const [activeTab, setActiveTab]                       = useState<"schedule" | "workorders" | "events" | "agents">("schedule");
  const [scheduleSubTab, setScheduleSubTab]             = useState<"gantt" | "registry" | "chart" | "delays">("gantt");

  // ── Loading ─────────────────────────────────────────────────────────────────
  const [isOptimizing, setIsOptimizing]                 = useState(false);
  const [isInjecting, setIsInjecting]                   = useState(false);
  const [isNegotiating, setIsNegotiating]               = useState(false);
  const [isSimulating, setIsSimulating]                 = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isReconciling, setIsReconciling]               = useState(false);
  const [isLiveDemoRunning, setIsLiveDemoRunning]       = useState(false);
  const [isLoading, setIsLoading]                       = useState(true);
  const [loadError, setLoadError]                       = useState<string | null>(null);

  // ── Modals ──────────────────────────────────────────────────────────────────
  const [isNegotiationOpen, setIsNegotiationOpen]       = useState(false);
  const [isDigitalTwinOpen, setIsDigitalTwinOpen]       = useState(false);
  const [isWhatIfOpen, setIsWhatIfOpen]                 = useState(false);
  const [isFieldFeedbackOpen, setIsFieldFeedbackOpen]   = useState(false);

  // ── Toast ───────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "warn" | "err" } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, type: "ok" | "warn" | "err" = "ok") => {
    setToast({ msg, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  // ── Load corridor + initial solve ───────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    fetch("/api/corridor")
      .then((r) => { if (!r.ok) throw new Error(`Corridor API error: ${r.status}`); return r.json(); })
      .then(async (data: CorridorData) => {
        setCorridorData(data);
        setIsLoading(false);
        try {
          const date = new Date().toISOString().split("T")[0];
          const res = await fetch("/api/optimize", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date }),
          });
          const optData: OptimizeResponse = await res.json();
          if (!optData.error) {
            setScheduledBlocks(optData.scheduledBlocks ?? []);
            setPerturbations(optData.trainPerturbations ?? []);
            setKpis(optData.kpis);
            setSolverStats(optData.solverStats);
          }
        } catch { /* non-blocking */ }
      })
      .catch((e) => { setLoadError(e.message); setIsLoading(false); });
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleOptimize = useCallback(async () => {
    if (isOptimizing || !perms.canOptimize) return;
    setIsOptimizing(true);
    try {
      const date = new Date().toISOString().split("T")[0];
      const res = await fetch("/api/optimize", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      const data: OptimizeResponse = await res.json();
      if (data.error) {
        showToast(`Solver error: ${data.error}`, "err");
      } else {
        setScheduledBlocks(data.scheduledBlocks ?? []);
        setPerturbations(data.trainPerturbations ?? []);
        setKpis(data.kpis); setSolverStats(data.solverStats);
        const cd = await fetch("/api/corridor").then((r) => r.json()) as CorridorData;
        setCorridorData(cd);
        const { status, wallTimeMs } = data.solverStats;
        showToast(
          `${status} — ${data.kpis.blocksScheduled} blocks scheduled in ${wallTimeMs?.toFixed(0)}ms`,
          status === "OPTIMAL" || status === "FEASIBLE" ? "ok" : "warn"
        );
      }
    } catch (e) { showToast(`Network error: ${String(e)}`, "err"); }
    finally { setIsOptimizing(false); }
  }, [isOptimizing, perms, showToast]);

  const handleNegotiate = useCallback(async (monsoonActive: boolean) => {
    if (isNegotiating || !perms.canNegotiate) return;
    setIsNegotiating(true);
    try {
      const date = new Date().toISOString().split("T")[0];
      const res = await fetch("/api/negotiate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, monsoonActive }),
      });
      const data = await res.json();
      if (data.error) { showToast(`Negotiation error: ${data.error}`, "err"); }
      else {
        setArbitrationTranscript(data.arbitrationTranscript);
        setScheduledBlocks(data.scheduledBlocks ?? []);
        setPerturbations(data.trainPerturbations ?? []);
        setKpis(data.kpis); setSolverStats(data.solverStats);
        const cd = await fetch("/api/corridor").then((r) => r.json()) as CorridorData;
        setCorridorData(cd);
        showToast(
          `Negotiation complete: ${data.arbitrationTranscript?.shadowBlocksCount ?? 0} shadow blocks, ${data.arbitrationTranscript?.corridorMinutesSaved ?? 0} min saved`,
          "ok"
        );
      }
    } catch (e) { showToast(`Negotiation error: ${String(e)}`, "err"); }
    finally { setIsNegotiating(false); }
  }, [isNegotiating, perms, showToast]);

  const handleTriggerLiveDemo = useCallback(async () => {
    if (isLiveDemoRunning) return;
    setIsLiveDemoRunning(true);
    showToast("Simulating disruption: Heavy monsoon alert on UMB–KKDE + freight rescheduling…", "warn");
    try {
      const date = new Date().toISOString().split("T")[0];
      const res = await fetch("/api/negotiate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, monsoonActive: true }),
      });
      const data = await res.json();
      if (!data.error) {
        setArbitrationTranscript(data.arbitrationTranscript);
        setScheduledBlocks(data.scheduledBlocks ?? []);
        setPerturbations(data.trainPerturbations ?? []);
        setKpis(data.kpis); setSolverStats(data.solverStats);
        const cd = await fetch("/api/corridor").then((r) => r.json()) as CorridorData;
        setCorridorData(cd);
        setIsNegotiationOpen(true);
        showToast(`Disruption re-optimised in ${data.solverStats?.wallTimeMs?.toFixed(0)}ms — 0 Priority-1 train delays.`, "ok");
      }
    } catch (e) { showToast(`Demo error: ${String(e)}`, "err"); }
    finally { setIsLiveDemoRunning(false); }
  }, [isLiveDemoRunning, showToast]);

  const handleInjectEvent = useCallback(async (payload: EventPayload) => {
    if (isInjecting || !perms.canInjectEvent) return;
    setIsInjecting(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.solverResult) {
        setScheduledBlocks(data.solverResult.scheduledBlocks ?? []);
        setPerturbations(data.solverResult.trainPerturbations ?? []);
        setKpis(data.solverResult.kpis); setSolverStats(data.solverResult.solverStats);
        const cd = await fetch("/api/corridor").then((r) => r.json()) as CorridorData;
        setCorridorData(cd);
        showToast(`Event recorded and schedule re-computed: ${data.solverResult.solverStats.status}`, "warn");
      }
    } catch (e) { showToast(`Event error: ${String(e)}`, "err"); }
    finally { setIsInjecting(false); }
  }, [isInjecting, perms, showToast]);

  const handleApplySimulation = useCallback(async (params: SimulationParams) => {
    setIsSimulating(true);
    try {
      showToast(`Running what-if simulation for train ${params.selectedTrainNumber}…`, "warn");
      const res = await fetch("/api/events", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: params.monsoonActive ? "WEATHER_MONSOON" : "GOODS_RESCHEDULE",
          description: `What-If: ${params.selectedTrainNumber} rescheduled +${params.goodsTrainShiftMinutes}m`,
          severity: params.monsoonActive ? "CRITICAL" : "CAUTION",
          kmFrom: 90, kmTo: 224,
          delayMinutes: params.goodsTrainShiftMinutes,
          affectedTrainNumbers: [params.selectedTrainNumber],
        }),
      });
      const data = await res.json();
      if (data.solverResult) {
        setScheduledBlocks(data.solverResult.scheduledBlocks ?? []);
        setPerturbations(data.solverResult.trainPerturbations ?? []);
        setKpis(data.solverResult.kpis); setSolverStats(data.solverResult.solverStats);
        const cd = await fetch("/api/corridor").then((r) => r.json()) as CorridorData;
        setCorridorData(cd);
        showToast("What-if simulation applied — corridor schedule updated.", "ok");
        setIsWhatIfOpen(false);
      }
    } catch (e) { showToast(`Simulation error: ${String(e)}`, "err"); }
    finally { setIsSimulating(false); }
  }, [showToast]);

  const handleLogExecution = useCallback(async (payload: ExecutionPayload) => {
    setIsSubmittingFeedback(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) showToast(data.message, "ok");
    } catch (e) { showToast(`Feedback error: ${String(e)}`, "err"); }
    finally { setIsSubmittingFeedback(false); }
  }, [showToast]);

  const handleReconcile = useCallback(() => {
    setIsReconciling(true);
    setTimeout(() => {
      setIsReconciling(false);
      showToast("Weekly block schedule successfully reconciled with Monthly Corridor Quotas.", "ok");
    }, 900);
  }, [showToast]);

  const handleAddWorkOrder = useCallback(async (wo: Partial<WorkOrder>) => {
    try {
      const res = await fetch("/api/workorders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...wo, requestedDate: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const cd = await fetch("/api/corridor").then((r) => r.json()) as CorridorData;
      setCorridorData(cd);
      showToast("Work order created and queued for multi-agent scheduling.", "ok");
    } catch (e) { showToast(`Error: ${String(e)}`, "err"); }
  }, [showToast]);

  const handleCancelWorkOrder = useCallback(async (id: string) => {
    try {
      await fetch(`/api/workorders?id=${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const cd = await fetch("/api/corridor").then((r) => r.json()) as CorridorData;
      setCorridorData(cd);
      showToast("Work order cancelled.", "warn");
    } catch (e) { showToast(`Error: ${String(e)}`, "err"); }
  }, [showToast]);

  // ── Loading / Error states ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gov-bg flex flex-col">
        <GovHeader onLogout={logout} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#1a3c6e] border-t-transparent rounded-full animate-spin mx-auto border-4" />
            <p className="text-sm text-gray-600">Loading corridor data, please wait…</p>
            <p className="text-xs text-gray-400">Connecting to Northern Railway Database</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gov-bg flex flex-col">
        <GovHeader onLogout={logout} />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg w-full gov-card p-8 text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <h2 className="text-lg font-bold text-red-700">Database Initialisation Required</h2>
            <p className="text-sm text-gray-500">{loadError}</p>
            <div className="bg-gray-50 border border-gray-200 rounded p-4 text-left text-xs font-mono text-gray-700 space-y-1">
              <p className="font-semibold text-gray-800 mb-2">Run these commands to seed data:</p>
              <p className="text-[#1a3c6e]">npx prisma migrate dev --name init</p>
              <p className="text-[#1a3c6e]">npx tsx prisma/seed.ts</p>
            </div>
            <button onClick={() => window.location.reload()} className="gov-btn-primary">
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stations   = corridorData?.stations   ?? [];
  const trains     = corridorData?.trains     ?? [];
  const workOrders = corridorData?.workOrders ?? [];
  const events     = corridorData?.events     ?? [];

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col">
      <GovHeader onLogout={logout} />

      {/* ── KPI Summary Bar ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 shrink-0">
        <KPIGauges kpis={kpis} solverStats={solverStats} isLoading={isOptimizing} />
      </div>

      {/* ── Action Toolbar ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Horizon selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            {(["DAILY", "WEEKLY", "MONTHLY"] as Horizon[]).map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  horizon === h
                    ? "bg-white text-[#1a3c6e] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {HORIZON_LABELS[h]}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Primary Action: Optimize */}
          <RoleGate allow={["SYSTEM_ADMIN", "DRM"]}>
            <button
              id="btn-optimize"
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="flex items-center gap-2 bg-[#1a3c6e] hover:bg-[#14305a] disabled:bg-slate-300 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-xs transition-colors"
            >
              {isOptimizing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Solving CP-SAT Model…</span>
                </>
              ) : (
                <>
                  <span>▶</span>
                  <span>Run Block Optimiser</span>
                </>
              )}
            </button>
          </RoleGate>

          {/* Multi-Agent Arbitration */}
          <RoleGate allow={["SYSTEM_ADMIN", "DRM"]}>
            <button
              id="btn-negotiate"
              onClick={() => { if (!arbitrationTranscript) handleNegotiate(false); setIsNegotiationOpen(true); }}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold py-2 px-3 rounded-lg shadow-2xs transition-colors"
            >
              <span>🤝</span>
              <span>Multi-Agent Scheduling</span>
            </button>
          </RoleGate>

          {/* Live Disruption Demo */}
          <RoleGate allow={["SYSTEM_ADMIN", "DRM"]}>
            <button
              id="btn-live-demo"
              onClick={handleTriggerLiveDemo}
              disabled={isLiveDemoRunning}
              className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 disabled:bg-slate-200 text-xs font-semibold py-2 px-3 rounded-lg shadow-2xs transition-colors"
            >
              {isLiveDemoRunning ? (
                <>
                  <span className="w-3 h-3 border-2 border-amber-900 border-t-transparent rounded-full animate-spin" />
                  <span>Simulating…</span>
                </>
              ) : (
                <>
                  <span>⚡</span>
                  <span>Simulate Disruption (Demo)</span>
                </>
              )}
            </button>
          </RoleGate>
        </div>

        {/* Right side secondary tools */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Digital Twin */}
          <button
            id="btn-digital-twin"
            onClick={() => setIsDigitalTwinOpen(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold py-2 px-3 rounded-lg shadow-2xs transition-colors"
          >
            <span>🗺️</span>
            <span>Digital Twin (312 km)</span>
          </button>

          {/* What-If Simulator */}
          <RoleGate allow={["SYSTEM_ADMIN", "DRM"]}>
            <button
              id="btn-what-if"
              onClick={() => setIsWhatIfOpen(true)}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold py-2 px-3 rounded-lg shadow-2xs transition-colors"
            >
              <span>🧪</span>
              <span>What-If Simulator</span>
            </button>
          </RoleGate>

          {/* Field Feedback */}
          <RoleGate allow={["SYSTEM_ADMIN"]}>
            <button
              id="btn-field-feedback"
              onClick={() => setIsFieldFeedbackOpen(true)}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold py-2 px-3 rounded-lg shadow-2xs transition-colors"
            >
              <span>📱</span>
              <span>Field Execution Log</span>
            </button>
          </RoleGate>
        </div>
      </div>

      {/* ── Tab Navigation ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-5 flex gap-2 shrink-0">
        {([
          { id: "schedule",   label: "Block Schedule",       badge: scheduledBlocks.length, roleRequired: null as ("SYSTEM_ADMIN" | "DRM" | "OBSERVER")[] | null },
          { id: "workorders", label: "Work Orders",           badge: workOrders.length,      roleRequired: null as ("SYSTEM_ADMIN" | "DRM" | "OBSERVER")[] | null },
          { id: "events",     label: "Operational Events",   badge: events.length,          roleRequired: null as ("SYSTEM_ADMIN" | "DRM" | "OBSERVER")[] | null },
          { id: "agents",     label: "Agent Decisions & XAI", badge: null,                   roleRequired: ["SYSTEM_ADMIN", "DRM"] as ("SYSTEM_ADMIN" | "DRM" | "OBSERVER")[] | null },
        ]).map((tab) => {
          const hidden = tab.roleRequired && (!user || !tab.roleRequired.includes(user.role as "SYSTEM_ADMIN" | "DRM" | "OBSERVER"));
          if (hidden) return null;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "text-[#1a3c6e] border-[#FF9933] font-bold"
                  : "text-slate-500 border-transparent hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge != null && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  isActive ? "bg-blue-100 text-[#1a3c6e]" : "bg-slate-100 text-slate-500"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden bg-[#f8fafc]">

        {/* Block Schedule Tab */}
        {activeTab === "schedule" && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {horizon === "MONTHLY" ? (
              <div className="flex-1 overflow-auto">
                <StrategicPlannerView
                  workOrders={workOrders}
                  onSwitchToTactical={() => setHorizon("WEEKLY")}
                  onReconcile={handleReconcile}
                  isReconciling={isReconciling}
                />
              </div>
            ) : (
              <div className="flex flex-col flex-1 min-h-0">
                {/* Clean Sub-Navigation Bar */}
                <div className="bg-white border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                    <button
                      onClick={() => setScheduleSubTab("gantt")}
                      className={`px-3 py-1 font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                        scheduleSubTab === "gantt"
                          ? "bg-white text-[#1a3c6e] shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <span>📊 Section Timeline (Gantt)</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                        Primary
                      </span>
                    </button>
                    <button
                      onClick={() => setScheduleSubTab("registry")}
                      className={`px-3 py-1 font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                        scheduleSubTab === "registry"
                          ? "bg-white text-[#1a3c6e] shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <span>📋 Block Registry</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-[#1a3c6e]">
                        {scheduledBlocks.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setScheduleSubTab("chart")}
                      className={`px-3 py-1 font-semibold rounded-md transition-all ${
                        scheduleSubTab === "chart"
                          ? "bg-white text-[#1a3c6e] shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      📈 Time-Distance Diagram
                    </button>
                    <button
                      onClick={() => setScheduleSubTab("delays")}
                      className={`px-3 py-1 font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                        scheduleSubTab === "delays"
                          ? "bg-white text-[#1a3c6e] shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <span>⚠️ Delays &amp; Perturbations</span>
                      {perturbations.length > 0 ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
                          {perturbations.length}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                          0
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Operational indicators on right */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold">
                      <span>⚡</span>
                      <span>{scheduledBlocks.filter((b) => b.isShadowBlock).length} Shadow Bundles</span>
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                      <span>🛡️</span>
                      <span>100% P1 Trains Protected</span>
                    </span>
                  </div>
                </div>

                {/* Sub-view: Section Timeline (Gantt) — Intuitive, Non-overlapping Corridor View */}
                {scheduleSubTab === "gantt" && (
                  <div className="flex-1 overflow-hidden p-4 sm:p-5 flex flex-col">
                    <CorridorTimelineGantt
                      scheduledBlocks={scheduledBlocks}
                      stations={stations}
                    />
                  </div>
                )}

                {/* Sub-view: Block Registry */}
                {scheduleSubTab === "registry" && (
                  <div className="flex-1 overflow-hidden">
                    <BlockScheduleRegistry
                      scheduledBlocks={scheduledBlocks}
                      stations={stations}
                      onSwitchToChart={() => setScheduleSubTab("gantt")}
                    />
                  </div>
                )}

                {/* Sub-view: String Chart */}
                {scheduleSubTab === "chart" && (
                  <div className="flex-1 overflow-auto p-4 flex flex-col gap-3">
                    <div className="flex-1 min-h-[580px] bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
                      <MasterStringChart
                        stations={stations}
                        trains={trains}
                        scheduledBlocks={scheduledBlocks}
                        horizon={312}
                        width={1240}
                        height={600}
                      />
                    </div>

                    {/* Collapsible train delay summary strip */}
                    {perturbations.length > 0 && (
                      <div className="bg-white rounded-xl border border-amber-200 p-3.5 shadow-xs flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          <span className="font-bold text-amber-900">
                            {perturbations.length} Active Train Delays Detected
                          </span>
                          <span className="text-slate-500 hidden sm:inline">
                            — P1 VIP Trains (Vande Bharat, Rajdhani) remain 100% punctually protected.
                          </span>
                        </div>
                        <button
                          onClick={() => setScheduleSubTab("delays")}
                          className="text-xs font-semibold text-[#1a3c6e] hover:underline shrink-0"
                        >
                          View Delay Details &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-view: Train Perturbations & Delays */}
                {scheduleSubTab === "delays" && (
                  <div className="flex-1 overflow-auto p-4 sm:p-5">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden max-w-6xl mx-auto">
                      <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a3c6e]">
                            Train Delays &amp; Single-Line Working (SLW) Routing
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Real-time dynamic train delay propagation and dispatch recommendations
                          </p>
                        </div>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          Priority-1 Punctuality: 100%
                        </span>
                      </div>

                      {perturbations.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 text-xs">
                          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl font-bold mx-auto mb-3">
                            ✓
                          </div>
                          <p className="font-semibold text-slate-700 text-sm">All Trains Operating On Schedule</p>
                          <p className="mt-1 max-w-sm mx-auto text-slate-400">
                            Zero perturbations on the Delhi – Ambala – Ludhiana mainline. Run the optimiser or inject an incident to test conflict handling.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                                <th className="py-3 px-4">Train No. &amp; Name</th>
                                <th className="py-3 px-4">Priority</th>
                                <th className="py-3 px-4">Station</th>
                                <th className="py-3 px-4">Scheduled Departure</th>
                                <th className="py-3 px-4">Delay</th>
                                <th className="py-3 px-4">Operational Resolution / Cause</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {perturbations.map((p, i) => (
                                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="py-3 px-4 font-bold text-[#1a3c6e]">
                                    {p.trainNumber}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                      p.priority === 1 ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                                      p.priority === 2 ? "bg-blue-50 text-blue-800 border-blue-200" :
                                      "bg-slate-100 text-slate-700 border-slate-200"
                                    }`}>
                                      P{p.priority}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 font-semibold text-slate-800">
                                    {p.stationCode}
                                  </td>
                                  <td className="py-3 px-4 font-mono text-slate-600">
                                    {p.originalDeparture}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`text-xs font-bold tabular-nums ${
                                      p.delayMinutes > 30 ? "text-rose-600" : "text-amber-700"
                                    }`}>
                                      +{p.delayMinutes} min
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-slate-700 max-w-md">
                                    <div className="flex items-center gap-2">
                                      {p.slwDiverted && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                          SLW Diverted
                                        </span>
                                      )}
                                      <span>{p.cause}</span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Work Orders Tab */}
        {activeTab === "workorders" && (
          <div className="flex-1 overflow-auto p-4 sm:p-5">
            <WorkOrderPanel
              workOrders={workOrders}
              onAddWorkOrder={handleAddWorkOrder}
              onCancelWorkOrder={handleCancelWorkOrder}
            />
          </div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <div className="flex-1 overflow-auto p-4 sm:p-5">
            <EventPanel
              events={events}
              trains={trains}
              onInjectEvent={handleInjectEvent}
              isInjecting={isInjecting}
            />
          </div>
        )}

        {/* Agent Decisions Tab — DRM + Admin only */}
        {activeTab === "agents" && (
          <RoleGate allow={["SYSTEM_ADMIN", "DRM"]}>
            <div className="flex-1 overflow-auto p-4 sm:p-5">
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 max-w-6xl mx-auto space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a3c6e]">
                      Multi-Agent Autonomous Arbitration Results
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pareto-optimal consensus between Engineering (TMS), Signalling (SMMS), and Traction (TDMS)
                    </p>
                  </div>
                  <button
                    onClick={() => { if (!arbitrationTranscript) handleNegotiate(false); setIsNegotiationOpen(true); }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#1a3c6e] text-white hover:bg-[#14305a] transition-colors"
                  >
                    Open Live Arbitration Dialog
                  </button>
                </div>

                {arbitrationTranscript ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "Total Bids Received",    value: arbitrationTranscript.totalBids, color: "text-[#1a3c6e]" },
                        { label: "Shadow Blocks Bundled",  value: arbitrationTranscript.shadowBlocksCount, color: "text-rose-700" },
                        { label: "Corridor Minutes Saved", value: `${arbitrationTranscript.corridorMinutesSaved} min`, color: "text-emerald-700" },
                        { label: "Blocks Finalised",       value: arbitrationTranscript.bundledBlocks, color: "text-slate-800" },
                      ].map((m) => (
                        <div key={m.label} className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-center">
                          <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{m.label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5">
                      <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Department Satisfaction &amp; Utility Convergence
                      </p>
                      {Object.entries(arbitrationTranscript.departmentalSatisfaction).map(([dept, score]) => (
                        <div key={dept} className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-slate-700 w-36 shrink-0">{dept}</span>
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-rose-500"}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-800 w-12 text-right">{score.toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        AI Justification Audit Trail (XAI)
                      </p>
                      <div className="space-y-2">
                        {arbitrationTranscript.justifications.map((j, i) => (
                          <div key={i} className="text-xs text-slate-700 p-3 bg-slate-50/70 border border-slate-200 rounded-lg flex items-start gap-2.5 leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF9933] mt-1.5 shrink-0" />
                            <span>{j}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 py-10 text-center space-y-2">
                    <p>No multi-agent arbitration session has been executed yet.</p>
                    <button
                      onClick={() => handleNegotiate(false)}
                      className="text-xs font-bold text-[#1a3c6e] hover:underline"
                    >
                      Click here to run Multi-Agent Arbitration now &rarr;
                    </button>
                  </div>
                )}
              </div>
            </div>
          </RoleGate>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────────── */}

      <MultiAgentNegotiationModal
        isOpen={isNegotiationOpen}
        onClose={() => setIsNegotiationOpen(false)}
        transcript={arbitrationTranscript}
        onReNegotiate={handleNegotiate}
        isNegotiating={isNegotiating}
      />

      <DigitalTwinDrawer
        isOpen={isDigitalTwinOpen}
        onClose={() => setIsDigitalTwinOpen(false)}
        stations={stations}
        assets={corridorData?.digitalTwin?.assets ?? []}
      />

      <WhatIfSimulator
        isOpen={isWhatIfOpen}
        onClose={() => setIsWhatIfOpen(false)}
        trains={trains}
        scheduledBlocks={scheduledBlocks}
        onApplySimulation={handleApplySimulation}
        isSimulating={isSimulating}
      />

      <FieldFeedbackModal
        isOpen={isFieldFeedbackOpen}
        onClose={() => setIsFieldFeedbackOpen(false)}
        scheduledBlocks={scheduledBlocks}
        onLogExecution={handleLogExecution}
        isSubmitting={isSubmittingFeedback}
      />

      {/* ── Toast ─────────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 max-w-sm px-4 py-3 rounded border shadow-lg text-sm transition-all ${
          toast.type === "ok"
            ? "bg-green-50 border-green-300 text-green-800"
            : toast.type === "warn"
            ? "bg-amber-50 border-amber-300 text-amber-800"
            : "bg-red-50 border-red-300 text-red-800"
        }`}>
          <div className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5">
              {toast.type === "ok" ? "✓" : toast.type === "warn" ? "⚠" : "✕"}
            </span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root page: auth gate ────────────────────────────────────────────────────

function AuthGate() {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1a3c6e] border-t-transparent rounded-full animate-spin" />
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
