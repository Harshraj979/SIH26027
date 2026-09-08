# RailBlock AI — SIH26027
## AI-Powered Automatic Block Planning for Indian Railways
### Full Solution Blueprint & Autonomous Multi-Agent Negotiation Engine

> **Problem Statement ID**: SIH26027  
> **Core Concept**: Digital Twin + Multi-Agent Negotiation Engine (Not a Monolithic Optimizer)  
> **Corridor Pilot**: Northern Railway (NR) · Delhi Division · New Delhi (NDLS) to Ludhiana Jn (LDH) — 312 km Mainline

---

## 1. The Core Idea

Most teams pitch:
> *"Integrate TMS/SMMS/TDMS/COA data → run an optimizer → output a schedule."*

That is necessary but not sufficient. It treats block planning as a **static scheduling problem**. It isn't. It is a **multi-party negotiation problem under uncertainty**, because three maintenance departments:
1. **Engineering (TMS)**: Track, sleepers, rails, turnouts, civil speed restrictions
2. **Signal & Telecom (SMMS)**: Relays, point machines, track circuits, automatic block signalling
3. **Traction Distribution (TDMS)**: 25kV AC overhead equipment (OHE), neutral sections, substations

and **Operations (COA)**:
- Section Controllers, train pathing, Priority 1 protection (Vande Bharat, Shatabdi, Rajdhani), freight throughput

are all competing for the same finite corridor-time, each with different urgency logic, and the "right" answer changes the moment a goods train gets rescheduled or an IMD monsoon alert comes in.

### Our Differentiator:
- **Autonomous Department Agents**: Each department is modeled as an autonomous AI agent with its own priority and utility function.
- **Central Arbitration / Coordinator Agent**: Runs constrained optimization (OR-Tools CP-SAT) with Explainable AI (XAI) to resolve conflicts transparently in seconds instead of days.
- **Corridor Digital Twin**: Live geo-tagged corridor (track + traction + signalling assets) underneath, ensuring every proposed block is physically and electrically feasible (e.g., S&T repair at KM 42 automatically triggers OHE feeder isolation KM 41–43).
- **"What-If" Perturbation Simulator**: Section controllers can drag goods-train paths, simulate weather advisories, or test Single-Line Working (SLW) to see instant re-negotiation in under 5 seconds.
- **Dual-Horizon Planning**: Rolling Weekly (Tactical) plan auto-reconciled with 30-Day Monthly (Strategic) quotas.
- **Closed-Loop Execution Feedback**: Mobile-first track-side PWA for Senior Section Engineers (SSE) to log real-time start/end times and overrun reasons, retraining duration models.

---

## 2. Gap Analysis (8 Key Dimensions)

| Dimension | Existing Systems (TMS / SMMS / BDMS) | Global Rail Tools (RailSys / OpenTrack) | RailBlock AI (Our Solution) |
| :--- | :--- | :--- | :--- |
| **Data Model** | Siloed per department; isolated DBs | Timetable simulation, weak defect link | **Unified Knowledge Graph** linking assets ↔ defects ↔ corridor ↔ timetable slots |
| **Prioritization** | Manual, seniority-based, FCFS on BDMS | Rule-based capacity allocation | **ML Criticality Scoring** (Failure-Prob × Consequence × Traffic-Density) |
| **Coordination** | Phone calls, emails, physical meetings | Not designed for IR 4-dept ecosystem | **Multi-Agent Negotiation** with explainable arbitration logic & shadow bundling |
| **Planning Horizon** | Short-term ad hoc emergency requests | Long-horizon timetable simulation | **Rolling Weekly (Tactical) + Monthly (Strategic)** auto-reconciled |
| **Feedback Loop** | None — zero learning from past overruns | Simulation-only, disconnected from field | **Closed-Loop**: Track-side PWA logs retrain duration & criticality models |
| **Explainability** | Opaque manual decisions | Black-box optimizer outputs | **Natural Language XAI Justification** for every decision |
| **Field Usability** | Desktop-only division staff | Workstation engineering software | **Mobile-First PWA** for field SSE engineers |
| **Disruption** | Static once approved; days to re-plan | Partial perturbation support | **Dynamic Re-Planning Agent** triggers automatic re-optimization in < 1s |

---

## 3. System Architecture & Workflow

```
┌────────────────────────────────────────────────────────────────────────────┐
│ 1. DATA INGESTION LAYER (Live Telemetry & Streams)                         │
│ TMS (Track Defects) │ SMMS (Signal Relays) │ TDMS (25kV OHE Faults)        │
│ COA (Timetables & Rakes) │ Freight Forecasts │ IMD Weather/Monsoon API    │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ 2. UNIFIED RAILWAY KNOWLEDGE GRAPH (Digital Twin Core)                     │
│ Nodes: Track Segments, Signals, OHE Feeder Zones, Crossovers, Stations     │
│ Edges: Physical Adjacency, Electrical Dependency, SLW Routing Crossovers   │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ 3. CRITICALITY & URGENCY ENGINE (Physics-Informed ML)                      │
│ HistGradientBoosting Regressor: f(TQI, Overdue Days, Cumulative GMT, Mon) │
│ Outputs dynamic urgency weight per work order [100 to 10,000]             │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ 4. MULTI-AGENT NEGOTIATION & ARBITRATION LAYER                             │
│ Engg-Agent │ S&T-Agent │ TRD-Agent │ Operations-Agent (COA Constraints)    │
│ → Arbitration Agent: Contract-Net Bidding + CP-SAT Hard Constraint Solver │
│ → Merges co-located demands into Shadow Bundles (saves 500+ corridor mins) │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ 5. DUAL-HORIZON BLOCK PLAN GENERATOR                                       │
│ Weekly Tactical Plan (Minute-precision String Chart) ⇄ Monthly Strategic   │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ 6. CONTROLLER COCKPIT, WHAT-IF SIMULATOR & FIELD FEEDBACK PWA              │
│ Controller accept/override with XAI trail ⇄ Mobile PWA track-side logging  │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Modern Technologies Used

- **Knowledge Graph (Digital Twin)**: Models physical and electrical dependencies (e.g. Signal SN-301 requires OHE power isolation on TSS-UMB).
- **Multi-Agent Systems (MAS)**: Autonomous departmental agents with Contract-Net bidding protocol.
- **Constraint Programming (OR-Tools CP-SAT)**: Solves headway, rush-hour curfews, single-line working, and non-overlapping block assignments in milliseconds.
- **Explainable AI (XAI)**: Natural language decision reasoning for railway safety sign-off.
- **Progressive Web App**: Offline-capable mobile view for field engineers to submit actual start/end times and overrun reasons.
- **Next.js 16 + React 19 + TypeScript + Tailwind CSS**: Command & Control center UI with canvas-rendered Time-Distance String Chart.

---

## 5. Getting Started

### Prerequisites
- Node.js 20+
- Python 3.12 or 3.13 with packages:
  ```bash
  pip install ortools scikit-learn numpy
  ```

### Installation & Setup
```bash
# 1. Install Node dependencies
npm install

# 2. Initialize and seed SQLite database
npm run db:setup

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. SIH Live Presentation & Demo Guide

1. **Problem Reframing (30s)**: Click `🎯 Pitch Blueprint` to show judges why traditional static optimizers fail on Indian Railways.
2. **Digital Twin (60s)**: Click `🌐 Digital Twin (312km)` to demonstrate physical & electrical cross-dependencies along the Delhi–Ludhiana mainline.
3. **Live Disruption Demo (<5s)**: Click `⚡ Live Disruption Demo (<5s)` to trigger an IMD heavy monsoon alert on the Ambala section. Watch the system re-negotiate and bundle 12 blocks across 3 departments with CP-SAT solving in ~970ms!
4. **Explainable AI**: Inspect the Arbitration Audit Trail and natural language justifications generated for Section Controllers.
5. **Dual-Horizon**: Toggle to `Monthly Strategic` to demonstrate macro-quota allocations, heavy tamping machine scheduling, and ₹42.8 Lakhs/month bulk procurement savings.
