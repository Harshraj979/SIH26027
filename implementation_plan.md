# RailBlock AI: Integrated Multi-Department Block Planning & Decision Support System (SIH26027)

End-to-end implementation architecture for an **AI-powered Automatic Block Planning System** on the 312 km New Delhi (NDLS) to Ludhiana (LDH) mainline corridor.

This system integrates four departmental systems into a single unified Decision Support System:
1. **TMS (Track Management System)** — Civil Engineering (P-Way)
2. **SMMS (Signalling Maintenance & Management System)** — Signal & Telecom (S&T)
3. **TDMS (Traction Distribution Management System)** — Electrical (TRD / 25kV OHE)
4. **COA (Control Office Application)** — Central Operating Authority & AI Optimization Engine

---

## User Review Required

> [!IMPORTANT]
> **Key Architectural Alignments & Enhancements Added:**
> 1. **4-Portal Centralized Architecture**: A unified role-switchable portal where engineers from TMS, SMMS, and TDMS submit maintenance demands, all funneling into the central **COA Controller Dashboard** where the AI engine plans, optimizes, and sanctions blocks.
> 2. **ML Urgency Scorer with Hard Safety Override**:
>    - Urgent safety risks (e.g., USFD rail flaw `IMR` or point machine failure with Priority Score > 90) trigger an automatic **Hard Safety Override** that mandates the block immediately, prioritizing track integrity over train delay penalties.
>    - Routine defects (e.g., mast rust, routine cable testing) are strictly slotted into zero-impact natural traffic gaps.
> 3. **SSR Duration Engine with 3-Factor Dynamic Adjustment**:
>    - **Baseline**: Indian Railways Standard Schedule of Rates (SSR).
>    - **Factor A (Environment & Night)**: +15% duration buffer for nighttime (02:00 AM) and adverse weather.
>    - **Factor B (Spatial Transit & Setup)**: Exact Linear Referencing System (LRS Kilometer Post + Mast numbers) calculating 20-min standard protection setup plus Tower Wagon depot-to-site transit speed (30 km/h).
>    - **Factor C (Historical ML Feedback)**: Crew & section performance calibration.
> 4. **Spatial CP-SAT Optimization Solver**:
>    - Replaces naive single-track blocks with multi-line chainage logic (`UP_FAST`, `DN_FAST`, `UP_SLOW`, `DN_SLOW` on quad sections, `UP`/`DN` on double sections).
>    - Solves the **Setup Efficiency vs. Cascading Delay Penalty** equation with train hierarchy: Vande Bharat / Rajdhani (P1) > Superfast / Mail (P2) > Passenger (P3) > Freight (P4).
>    - Replaces solver `INFEASIBLE` drops with soft-slack priority deferrals (weekly vs. monthly buckets).
> 5. **Dual-Horizon Schedule Engine**:
>    - **Weekly Horizon (7-Day Granular)**: Immediate tactical slots for high-priority items (Score > 70).
>    - **Monthly Horizon (30-Day Strategic)**: Macro corridors for heavy track machinery (BCM, CSM, TRT) and routine maintenance (Score < 50).
> 6. **Digital T/351 Disconnection Dossier**: Generates the official Indian Railways sanction slip with digital signatures, interlock isolation codes, and station master alerts.

---

## Proposed Changes

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 RAILBLOCK AI ARCHITECTURE                              │
├───────────────────────┬────────────────────────┬───────────────────────────────────────┤
│    TMS (Track)        │     SMMS (Signals)     │           TDMS (Electrical)           │
│  - Rail Fractures     │  - Point Machines      │  - 25kV OHE Neutral Sections          │
│  - USFD IMR/OBS Flaws │  - Track Circuits      │  - Insulator & Cantilever Overhaul    │
│  - Tamping Requests   │  - Signal Aspect Heads │  - Feeder Disconnections              │
└───────────┬───────────┴───────────┬────────────┴───────────────────┬───────────────────┘
            │                       │                                │
            └───────────────────────┼────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CENTRAL COA INGESTION & PIPELINE ENGINE                         │
│  - Linear Referencing System (LRS): Section, LineID (UP_FAST/DN_FAST), KM Posts, Masts │
│  - Depot-to-Site Transit Calculator (30 km/h Tower Wagon) + 20-min Setup Standard     │
│  - SSR Duration Engine + Night/Weather Multiplier (+15%) + Crew Calibration            │
│  - AI/ML Urgency Scorer (HistGradientBoosting / Random Forest) -> Priority 0-100       │
└───────────────────────────────────┬────────────────────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                 OR-TOOLS CP-SAT TRAFFIC-AWARE SPATIAL SCHEDULER                        │
│  - Hard Safety Override (Score > 90): Enforce block, regulate/detour trains           │
│  - Setup Efficiency vs Delay Penalty Optimization                                      │
│  - Train Hierarchy Protection: Vande Bharat/Rajdhani > SF > Commuter > Freight        │
│  - Multi-Department Shadow Block Clustering (Merge Track + Signal + OHE into 1 window) │
│  - Soft Slack Deferral: Defer non-urgent blocks to Monthly plan instead of crashing   │
└───────────────────────────────────┬────────────────────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                       CENTRAL CONTROLLER WORKSTATION & OUTPUT                          │
│  - Master String Chart (Live Time-Distance Canvas with Train Lines & Block Rectangles) │
│  - Dual-Horizon Views: 7-Day Granular Operational Plan vs 30-Day Strategic Plan        │
│  - Explainable AI (XAI) Justification Ledger (Setup saved, minutes delayed, why clubbed)│
│  - 1-Click Sanction & Official Indian Railways T/351 Disconnection Memo Generator      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Database & Domain Modeling (Prisma & SQLite)

#### [MODIFY] [prisma/schema.prisma](file:///d:/SIH2026/SIH26027/prisma/schema.prisma)
- Update `Track` and `WorkOrder` models to support:
  - Exact `lineId`: `UP_FAST`, `DN_FAST`, `UP_SLOW`, `DN_SLOW`, `UP_MAIN`, `DN_MAIN`.
  - Linear Referencing System (LRS): `kmFrom`, `kmTo`, `mastFrom`, `mastTo`, `depotStationCode`, `transitMinutes`.
  - SSR Baseline Duration vs. AI Adjusted Duration:
    - `ssrBaseDurationMinutes` (manual standard)
    - `aiAdjustedDurationMinutes` (with night/weather/crew buffer)
    - `adjustmentReason` (e.g. `"+15% Night Shift (02:00 AM), +15m Tower Wagon transit from UMB"`).
  - Authentic Department Defect Categories:
    - TMS: `IMR` (Immediate Rail Removal), `OBS` (Observed Rail Flaw), `TQI_EXCEEDED`, `BALLAST_CLEANING`, `TURNOUT_RENEWAL`.
    - SMMS: `POINT_MACHINE_OVERHAUL`, `TRACK_CIRCUIT_FAILURE`, `SIGNAL_ASPECT_REPLACEMENT`, `AXLE_COUNTER_TEST`.
    - TDMS: `OHE_POWER_BLOCK_25KV`, `INSULATOR_REPLACEMENT`, `CANTILEVER_ADJUSTMENT`, `NEUTRAL_SECTION_CHECK`.
  - Hard Safety Flag: `isHardSafetyOverride` (boolean, set when score >= 90).
  - Train Priority Mapping:
    - Priority 1: Vande Bharat, Rajdhani, Tejas Express (Zero delay tolerance).
    - Priority 2: Shatabdi, Superfast, Mail Express.
    - Priority 3: Commuter, MEMU, Passenger.
    - Priority 4: Freight / Container rakes (Scheduled freight paths).
  - Horizon Flag: `planningHorizon` (`WEEKLY` vs `MONTHLY`).
  - Official Sanction Memo Model: `BlockSanctionMemo` storing T/351 memo number, authorizing officer, isolation switch status, timestamp.

#### [MODIFY] [prisma/seed.ts](file:///d:/SIH2026/SIH26027/prisma/seed.ts) (or create new seed script)
- Populate the **312 km NDLS–LDH corridor** with authentic railway infrastructure:
  - Stations: New Delhi (NDLS, km 0.0), Subzi Mandi (SZM, km 3.0), Panipat (PNP, km 89.0), Karnal (KUN, km 123.0), Kurukshetra (KKDE, km 156.0), Ambala Cantt (UMB, km 198.0), Sirhind (SIR, km 251.0), Khanna (KNN, km 268.0), Ludhiana (LDH, km 312.0).
  - Quadruple track between NDLS–SZM; double track between SZM–LDH with goods loop lines.
  - Realistic initial pool of 25+ departmental work orders:
    - High-urgency IMR rail fractures and point motor overhauls (Score > 90).
    - Medium-urgency tamping and OHE insulator jobs (Score 60-80).
    - Routine monthly preventative maintenance (Score < 50).
  - Realistic timetables for Vande Bharat (22439), Shatabdi (12005/12006), Paschim Express (12925), Freight Container Rakes (BTPN/BOXN).

---

### Python AI/ML & Optimization Engine

#### [MODIFY] [python_engine/solver.py](file:///d:/SIH2026/SIH26027/python_engine/solver.py)
1. **SSR Duration Engine & Transit Calculator**:
   - Implement `calculate_adjusted_duration(work_order, planned_start_min, weather_condition)`:
     - Base SSR time (e.g. 60m rail replacement, 45m point machine, 30m insulator).
     - Night penalty: +15% if start time falls in night hours (22:00 to 05:00).
     - Transit time: Distance from nearest depot / station at 30 km/h maintenance speed + fixed 20 min setup time.
2. **ML Urgency Scorer & Hard Safety Override**:
   - Classify incoming work orders using the trained model (`block_planning_pipeline.py` / HistGradientBoosting).
   - If `urgencyScore >= 90` (IMR, point failure):
     - Mark `hard_override = True`.
     - Force block window allocation regardless of traffic penalty.
     - Compute necessary train detours or passenger speed regulations (TSR).
3. **Multi-Track Spatial Constraint Logic**:
   - Upgrade conflict checking to evaluate `lineId` (`UP_FAST` vs `UP_SLOW`) and spatial chainage:
     - Two blocks on the same `lineId` conflict only if their kilometer spans overlap or are within a 10 km safety buffer.
     - Blocks on different `lineId`s (e.g. `UP_FAST` vs `UP_SLOW`) or opposite tracks (`UP` vs `DN`) can run simultaneously.
     - Blocks >15 km apart on the same track run concurrently.
4. **Traffic-Aware Setup Efficiency vs. Delay Penalty Objective**:
   - Formulate the multi-criteria CP-SAT objective function:
     $$\text{Objective} = \sum_{\text{blocks}} (\text{UrgencyWeight} \times \text{ScheduleEarly}) - \text{Bonus}_{\text{clubbing}} + \sum_{\text{trains}} (\text{TrainPriorityWeight} \times \text{DelayMinutes}) + \sum_{\text{deferred}} \text{DeferralPenalty}$$
   - Priority weights: P1 Vande Bharat (Weight: 10,000 / zero delay), P2 Superfast (Weight: 1,500), P3 Commuter (Weight: 400), P4 Freight (Weight: 50).
   - Clubbing Bonus: High positive reward for merging TMS + SMMS + TDMS tasks at the same kilometer within the same time window (saves 20-min setup time and prevents multiple line closures).
5. **Soft Constraint Slack & Dual-Horizon Classification**:
   - Introduce boolean execution variables `is_scheduled_weekly` and `is_deferred_monthly` with slack variables.
   - If high train traffic makes it impossible to schedule all tasks in the 7-day weekly horizon, the solver **never crashes with INFEASIBLE**. Instead, it schedules all critical safety items (Score >= 70) and systematically defers non-critical maintenance (Score < 50) to the **Monthly Strategic Plan**, logging a detailed XAI explanation.

#### [MODIFY] [python_engine/agents.py](file:///d:/SIH2026/SIH26027/python_engine/agents.py)
- Refactor the Multi-Agent Arbitration Layer into 4 specialized departmental agents:
  - `EngineeringAgent` (TMS): Advocates for track geometry, rail health, and tamping blocks.
  - `SignalsAgent` (SMMS): Advocates for point machine integrity and interlocking tests.
  - `TractionAgent` (TDMS): Advocates for 25kV power cutoffs and feeder isolations.
  - `OperationsAgent` (COA Controller): Defends passenger punctuality, evaluates freight paths, and arbitrates joint shadow windows.
- Generate structured XAI (Explainable AI) negotiation transcripts detailing setup time saved, train minutes spared, and joint safety guarantees.

---

### Backend API Bridge & Ingestion Pipeline

#### [MODIFY] [src/lib/pythonBridge.ts](file:///d:/SIH2026/SIH26027/src/lib/pythonBridge.ts)
- Support dynamic Python executable detection (`.venv/Scripts/python.exe` on Windows, `python3` on Linux/macOS, fallback to system PATH).
- Add support for dual-horizon mode payload (`mode: "WEEKLY"` vs `mode: "MONTHLY"`).

#### [MODIFY] [src/app/api/schedule/route.ts](file:///d:/SIH2026/SIH26027/src/app/api/schedule/route.ts)
- Accept filtering by planning horizon (`weekly` vs `monthly`), line corridor segments, and departmental origin.
- Return structured response including:
  - `scheduledBlocks` (with shadow cluster details, SSR adjusted durations, exact LRS coordinates).
  - `deferredTasks` (with explicit reasons why deferred to monthly plan).
  - `kpis` (Total setup time saved, train punctuality index, multi-dept synergy ratio).
  - `t351Memos` (Generated pre-sanction dossiers).

#### [MODIFY] [src/app/api/events/route.ts](file:///d:/SIH2026/SIH26027/src/app/api/events/route.ts)
- Fix database mutation bug: Ensure What-If simulation and delay scenarios compute downstream perturbations in-memory without permanently corrupting baseline `trainStop` records in `dev.db`.

---

### Frontend: 4-Portal Interface & Controller Workstation

#### [MODIFY] [src/components/GovHeader.tsx](file:///d:/SIH2026/SIH26027/src/components/GovHeader.tsx)
- Add a prominent **Portal Selector / Role Switcher**:
  - `TMS - Civil Engineering (Track)`
  - `SMMS - S&T (Signalling)`
  - `TDMS - Electrical (TRD/OHE)`
  - `COA - Central Operating Control (Admin)`
- Display active system badges: `Corridor: NDLS - LDH (312 km) | Quad/Double Mainline | Live COA Feed Connected`.

#### [MODIFY] [src/components/WorkOrderPanel.tsx](file:///d:/SIH2026/SIH26027/src/components/WorkOrderPanel.tsx)
- Departmental Demand Entry & Ingestion View:
  - Tailor form fields when logged in as TMS (IMR/OBS, TQI, machine requirement), SMMS (Point Machine, T/351 memo, interlock), or TDMS (25kV Feeder, Elementary Section, Tower Wagon).
  - Display AI Urgency Badge: `CRITICAL SAFETY OVERRIDE (95/100)`, `HIGH (78/100)`, `ROUTINE PREVENTATIVE (35/100)`.
  - Display SSR Duration breakdown: `Base: 60m | +15m Transit (UMB) | +15% Night Shift | Total: 84m`.
  - Display LRS chainage: `KM 42/10-14 (UP FAST)`.

#### [MODIFY] [src/components/MasterStringChart.tsx](file:///d:/SIH2026/SIH26027/src/components/MasterStringChart.tsx)
- The Centerpiece Time-Distance Canvas for COA Controllers:
  - Accurate 312 km NDLS–LDH vertical axis with all key junction stations (NDLS, PNP, KUN, KKDE, UMB, SIR, LDH).
  - Multi-line rendering (`UP_FAST` / `DN_FAST` vs `UP_SLOW` / `DN_SLOW` toggle).
  - High-contrast train paths color-coded by priority (Vande Bharat = Emerald green, SF Express = Blue, Passenger = Purple, Freight = Dashed gray).
  - Color-coded maintenance blocks:
    - Gold = TMS Track block
    - Blue = SMMS Signal block
    - Red = TDMS Power block
    - Glowing Purple/Navy Badge = **Multi-Department Shadow Block (All 3 Working Together)**.
  - Interactive tooltip showing: Departures, duration, setup time saved, and affected train buffer.

#### [MODIFY] [src/components/StrategicPlannerView.tsx](file:///d:/SIH2026/SIH26027/src/components/StrategicPlannerView.tsx)
- Implement the **Dual-Horizon Toggle**:
  - **Weekly Operational Plan (7-Day)**: Granular day-by-day Gantt of approved high-priority blocks slotted into COA timetable gaps.
  - **Monthly Strategic Plan (30-Day)**: 4-week macro calendar showing heavy machinery maintenance (BCM, CSM tamping runs) and deferred routine tasks.
  - Live calculation of Corridor Availability: `Target: 82% | Current: 86.4% (+4.4% Availability Gained)`.

#### [NEW] [src/components/T351SanctionModal.tsx](file:///d:/SIH2026/SIH26027/src/components/T351SanctionModal.tsx)
- Official Indian Railways Digital Block Sanction Dossier:
  - Standard railway format for **Form T/351 (Disconnection & Reconnection Notice)**.
  - Details: Sanction Number, Section Controller ID, Stations in Block, Line ID, 25kV OHE Isolation Switch Number, Track Protection Gang SSE In-Charge.
  - 1-Click **"Sanction & Transmit to Stations"** with digital timestamp and printable PDF export.

---

## Verification Plan

### Automated Verification
1. **TypeScript & Build Verification**:
   - `npx tsc --noEmit` — Validate strict type compliance across all components and API routes.
   - `npm run build` — Ensure clean Next.js Turbopack production compilation.
2. **Python Engine Unit & Integration Tests**:
   - Run test script validating:
     - SSR adjusted duration calculations across day vs. night and yard vs. mid-section scenarios.
     - ML urgency score thresholds and hard safety override activation on score >= 90.
     - CP-SAT multi-line spatial non-overlap (concurrent blocks at distant kilometers on same track, separate lines running parallel).
     - Non-crash soft constraint slack when corridor is saturated (deferred tasks logged to monthly horizon).

### Manual & Interactive Verification
1. **4-Portal Navigation Flow**:
   - Log in / switch to **TMS**: Submit an `IMR Rail Fracture` at KM 45 on `UP_FAST`. Verify AI assigns Urgency Score > 90 and flags `CRITICAL SAFETY OVERRIDE`.
   - Switch to **TDMS**: Submit a `25kV OHE Insulator Overhaul` at KM 46 on `UP_FAST`.
   - Switch to **SMMS**: Submit a `Point Machine Overhaul` at KM 45.
   - Switch to **COA (Central Controller)**: Click **"Run Multi-Department Optimization"**.
2. **Optimization & Clustering Verification**:
   - Verify all 3 demands are clustered into a **Single Shadow Block** at KM 44.5–46.5.
   - Verify the block is placed inside the 01:30 AM – 04:00 AM natural night window.
   - Verify Vande Bharat and Rajdhani express trajectories on the Master String Chart remain completely unperturbed (0 minutes delay).
   - Verify the summary card shows `Setup Time Saved: 40 minutes (2 line shutdowns prevented)`.
3. **Hard Safety Override Stress Test**:
   - Submit an emergency rail defect during peak hours (10:00 AM).
   - Verify the system grants the emergency block immediately, overrides traffic penalty, and calculates the safest train detour.
4. **Digital T/351 Sanction Generation**:
   - Click **"Sanction Block"** on the COA dashboard.
   - Verify the T/351 Disconnection Dossier opens with official Indian Railways formatting, displaying the station names, line IDs, and isolation switch numbers.
