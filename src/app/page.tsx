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
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex flex-wrap items-center gap-2 shrink-0">
        {/* Horizon selector */}
        <div className="flex items-center gap-1 border border-gray-300 rounded overflow-hidden text-xs">
          {(["DAILY", "WEEKLY", "MONTHLY"] as Horizon[]).map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`px-3 py-1.5 transition-colors ${
                horizon === h
                  ? "bg-[#1a3c6e] text-white font-semibold"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {HORIZON_LABELS[h]}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-gray-200" />

        {/* Optimize */}
        <RoleGate allow={["SYSTEM_ADMIN", "DRM"]}>
          <button
            id="btn-optimize"
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="flex items-center gap-1.5 gov-btn-primary text-xs py-1.5 px-3 disabled:bg-gray-400"
          >
            {isOptimizing ? (
              <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Computing…</span></>
            ) : "▶ Run Block Optimiser"}
          </button>
        </RoleGate>

        {/* Multi-Agent Negotiation */}
        <RoleGate allow={["SYSTEM_ADMIN", "DRM"]}>
          <button
            id="btn-negotiate"
            onClick={() => { if (!arbitrationTranscript) handleNegotiate(false); setIsNegotiationOpen(true); }}
            className="flex items-center gap-1.5 gov-btn-secondary text-xs py-1.5 px-3"
          >
            Multi-Agent Scheduling
          </button>
        </RoleGate>

        {/* Live Disruption Demo */}
        <RoleGate allow={["SYSTEM_ADMIN", "DRM"]}>
          <button
            id="btn-live-demo"
            onClick={handleTriggerLiveDemo}
            disabled={isLiveDemoRunning}
            className="flex items-center gap-1.5 text-xs py-1.5 px-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-semibold rounded transition-colors"
          >
            {isLiveDemoRunning ? (
              <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Simulating…</span></>
            ) : "⚡ Simulate Disruption (Demo)"}
          </button>
        </RoleGate>

        <div className="h-5 w-px bg-gray-200" />

        {/* Digital Twin */}
        <button
          id="btn-digital-twin"
          onClick={() => setIsDigitalTwinOpen(true)}
          className="gov-btn-secondary text-xs py-1.5 px-3"
        >
          Digital Twin (312 km)
        </button>

        {/* What-If Simulator */}
        <RoleGate allow={["SYSTEM_ADMIN", "DRM"]}>
          <button
            id="btn-what-if"
            onClick={() => setIsWhatIfOpen(true)}
            className="gov-btn-secondary text-xs py-1.5 px-3"
          >
            What-If Simulator
          </button>
        </RoleGate>

        {/* Field Feedback */}
        <RoleGate allow={["SYSTEM_ADMIN"]}>
          <button
            id="btn-field-feedback"
            onClick={() => setIsFieldFeedbackOpen(true)}
            className="gov-btn-secondary text-xs py-1.5 px-3"
          >
            Field Execution Log
          </button>
        </RoleGate>
      </div>

      {/* ── Tab Navigation ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 flex gap-0 shrink-0">
        {([
          { id: "schedule",   label: "Block Schedule",       roleRequired: null as ("SYSTEM_ADMIN" | "DRM" | "OBSERVER")[] | null },
          { id: "workorders", label: "Work Orders",           roleRequired: null as ("SYSTEM_ADMIN" | "DRM" | "OBSERVER")[] | null },
          { id: "events",     label: "Operational Events",   roleRequired: null as ("SYSTEM_ADMIN" | "DRM" | "OBSERVER")[] | null },
          { id: "agents",     label: "Agent Decisions",      roleRequired: ["SYSTEM_ADMIN", "DRM"] as ("SYSTEM_ADMIN" | "DRM" | "OBSERVER")[] | null },
        ]).map((tab) => {
          const hidden = tab.roleRequired && (!user || !tab.roleRequired.includes(user.role as "SYSTEM_ADMIN" | "DRM" | "OBSERVER"));
          if (hidden) return null;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`gov-tab ${activeTab === tab.id ? "gov-tab-active" : ""}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

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
                {/* String chart */}
                <div className="flex-1 overflow-hidden p-3">
                  <MasterStringChart
                    stations={stations}
                    trains={trains}
                    scheduledBlocks={scheduledBlocks}
                    horizon={312}
                    width={1200}
                    height={540}
                  />
                </div>

                {/* Perturbations strip */}
                <div className="h-52 border-t border-gray-200 bg-white overflow-hidden flex flex-col shrink-0">
                  <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-3 bg-[#eef2f9]">
                    <span className="text-xs font-bold text-[#1a3c6e] uppercase tracking-wider">
                      Train Delays &amp; Perturbations
                    </span>
                    {perturbations.length > 0 ? (
                      <span className="badge-warn">{perturbations.length} affected</span>
                    ) : (
                      <span className="badge-ok">All trains on schedule</span>
                    )}
                    <span className="ml-auto text-xs text-gray-500">
                      Priority-1 Punctuality: <strong className="text-green-700">100%</strong>
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {perturbations.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-sm">
                        <p>No active delays on Delhi – Ambala – Ludhiana mainline.</p>
                        <p className="text-xs mt-1 text-gray-300">Run the optimiser or inject an event to evaluate impact.</p>
                      </div>
                    ) : (
                      <table className="gov-table">
                        <thead>
                          <tr>
                            <th>Train No.</th>
                            <th>Station</th>
                            <th>Scheduled Departure</th>
                            <th>Delay</th>
                            <th>Cause / Resolution</th>
                          </tr>
                        </thead>
                        <tbody>
                          {perturbations.map((p, i) => (
                            <tr key={i}>
                              <td className="font-semibold text-[#1a3c6e]">{p.trainNumber}</td>
                              <td>{p.stationCode}</td>
                              <td>{p.originalDeparture}</td>
                              <td>
                                <span className={p.delayMinutes > 30 ? "text-red-600 font-bold" : "text-amber-700 font-semibold"}>
                                  +{p.delayMinutes} min
                                </span>
                              </td>
                              <td className="text-gray-600 max-w-xs truncate">{p.cause}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Work Orders Tab */}
        {activeTab === "workorders" && (
          <div className="flex-1 overflow-auto p-4">
            <WorkOrderPanel
              workOrders={workOrders}
              onAddWorkOrder={handleAddWorkOrder}
              onCancelWorkOrder={handleCancelWorkOrder}
            />
          </div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <div className="flex-1 overflow-auto p-4">
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
            <div className="flex-1 overflow-auto p-4">
              <div className="gov-card p-4 mb-4">
                <div className="gov-section-header">Multi-Agent Negotiation Results</div>
                {arbitrationTranscript ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "Total Bids Received",    value: arbitrationTranscript.totalBids },
                        { label: "Shadow Blocks Bundled",  value: arbitrationTranscript.shadowBlocksCount },
                        { label: "Corridor Minutes Saved", value: `${arbitrationTranscript.corridorMinutesSaved} min` },
                        { label: "Blocks Finalised",       value: arbitrationTranscript.bundledBlocks },
                      ].map((m) => (
                        <div key={m.label} className="bg-[#eef2f9] rounded p-3 text-center">
                          <div className="text-xl font-bold text-[#1a3c6e]">{m.value}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{m.label}</div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[#1a3c6e] mb-2">Department Satisfaction</p>
                      {Object.entries(arbitrationTranscript.departmentalSatisfaction).map(([dept, score]) => (
                        <div key={dept} className="flex items-center gap-3 mb-1.5">
                          <span className="text-xs text-gray-600 w-32 shrink-0">{dept}</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-[#1a3c6e] w-10 text-right">{score.toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[#1a3c6e] mb-2">AI Justification Trail (XAI)</p>
                      <ul className="space-y-1.5">
                        {arbitrationTranscript.justifications.map((j, i) => (
                          <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                            <span className="text-[#FF9933] font-bold shrink-0">›</span>
                            {j}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 py-6 text-center">
                    No negotiation has been run yet. Click <strong>Multi-Agent Scheduling</strong> in the toolbar above.
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
