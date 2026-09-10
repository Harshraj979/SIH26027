#!/usr/bin/env python3
"""
RailBlock AI — OR-Tools CP-SAT Block Scheduling Optimizer
with Scikit-Learn HistGradientBoosting Asset Risk Scorer.

Protocol: Reads JSON from stdin, writes JSON to stdout.
All logs go to stderr to keep stdout clean for the bridge.
"""

import sys
import json
import math
import time
import datetime
import traceback
import warnings
warnings.filterwarnings("ignore")

if hasattr(sys.stdin, "reconfigure"):
    sys.stdin.reconfigure(encoding="utf-8")
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

import os
import sys

# Ensure local python_engine modules can be imported
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np
from ortools.sat.python import cp_model
from agents import ArbitrationAgent

# ─────────────────────────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────
MINUTES_IN_DAY = 1440
HEADWAY_MINUTES = 10          # Safety clearance before/after any block
RUSH_WINDOWS = [               # (start_min, end_min) — block forbidden
    (480, 630),                # 08:00–10:30
    (1020, 1170),              # 17:00–19:30
]
HORIZON_MINUTES = MINUTES_IN_DAY  # 24-hour planning horizon

# ─────────────────────────────────────────────────────────────────────────────
# ML ASSET CRITICALITY SCORER (Trained Model & Feature Pipeline from Data training)
# ─────────────────────────────────────────────────────────────────────────────

import os
import joblib
import pandas as pd
from sklearn.preprocessing import MinMaxScaler

class RailwayFeaturePipeline:
    """
    Fitted feature engineering pipeline matching block_planning_pipeline.py.
    Provides transform() method for defect / work order records.
    """
    def __init__(self, reference_date=None):
        self.reference_date = pd.to_datetime(reference_date) if reference_date else pd.to_datetime('2026-09-30')
        self.scaler_traffic = MinMaxScaler()
        self.scaler_goods = MinMaxScaler()
        self.scaler_window = MinMaxScaler()
        self.departments = ['Engineering', 'S&T', 'TRD']
        self.feature_columns = [
            'severity_numeric',
            'days_overdue',
            'days_since_reported',
            'repair_hours',
            'section_traffic_norm',
            'goods_forecast_norm',
            'window_scarcity',
            'electrified_flag',
            'status_flag',
            'dept_Engineering',
            'dept_S&T',
            'dept_TRD'
        ]
        self.is_fitted = False

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        df_out = pd.DataFrame(index=df.index)
        sev_map = {'Critical': 3, 'Major': 2, 'Minor': 1, 1: 3, 2: 2, 3: 1}
        df_out['severity_numeric'] = df.get('severity', pd.Series('Major', index=df.index)).map(sev_map).fillna(2).astype(float)
        df_out['days_overdue'] = df.get('overdue_days', df.get('overdueDays', pd.Series(0, index=df.index))).fillna(0).astype(float)

        if 'date_reported' in df.columns:
            rep_dates = pd.to_datetime(df['date_reported'])
            df_out['days_since_reported'] = (self.reference_date - rep_dates).dt.days.clip(lower=0).astype(float)
        else:
            df_out['days_since_reported'] = df_out['days_overdue'] + 10.0

        dur = df.get('durationMinutes', pd.Series(120, index=df.index))
        df_out['repair_hours'] = df.get('estimated_repair_hours', dur / 60.0).fillna(2.0).astype(float)

        trf = df['avg_daily_trains'].values.reshape(-1, 1) if 'avg_daily_trains' in df.columns else np.full((len(df), 1), 110.0)
        df_out['section_traffic_norm'] = self.scaler_traffic.transform(trf).flatten()

        gf = df['goods_forecast_7day'].values.reshape(-1, 1) if 'goods_forecast_7day' in df.columns else np.full((len(df), 1), 100.0)
        df_out['goods_forecast_norm'] = self.scaler_goods.transform(gf).flatten()

        win = df['available_window_minutes'].clip(lower=10.0).values.reshape(-1, 1) if 'available_window_minutes' in df.columns else np.full((len(df), 1), 120.0)
        df_out['window_scarcity'] = self.scaler_window.transform(1.0 / win).flatten()

        df_out['electrified_flag'] = (df.get('electrified', pd.Series('Y', index=df.index)) == 'Y').astype(float)
        df_out['status_flag'] = ((df.get('status') == 'Overdue') | (df_out['days_overdue'] > 0)).astype(float)

        dept_series = df.get('department', pd.Series('Engineering', index=df.index))
        dept_norm = dept_series.map({'TMS': 'Engineering', 'SMMS': 'S&T', 'TDMS': 'TRD'}).fillna(dept_series)
        for dept in self.departments:
            df_out[f'dept_{dept}'] = (dept_norm == dept).astype(float)

        return df_out[self.feature_columns]

# Ensure class is discoverable for pickle loading
sys.modules['__main__'].RailwayFeaturePipeline = RailwayFeaturePipeline

# ── Load trained models & scored defect cache from Data training ─────────────
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Data training"))
MODEL_PATH = os.path.join(DATA_DIR, "priority_model.pkl")
PIPELINE_PATH = os.path.join(DATA_DIR, "feature_pipeline.pkl")
SCORED_DEFECTS_CSV = os.path.join(DATA_DIR, "scored_defects.csv")

_TRAINED_MODEL = None
_FEATURE_PIPELINE = None
_SCORED_DEFECTS_CACHE = {}

try:
    if os.path.exists(MODEL_PATH):
        _TRAINED_MODEL = joblib.load(MODEL_PATH)
        print(f"[ML] Loaded trained priority model from {MODEL_PATH}", file=sys.stderr)
    if os.path.exists(PIPELINE_PATH):
        _FEATURE_PIPELINE = joblib.load(PIPELINE_PATH)
        print(f"[ML] Loaded fitted feature pipeline from {PIPELINE_PATH}", file=sys.stderr)
    if os.path.exists(SCORED_DEFECTS_CSV):
        df_sc = pd.read_csv(SCORED_DEFECTS_CSV)
        for _, row in df_sc.iterrows():
            _SCORED_DEFECTS_CACHE[str(row['defect_id'])] = {
                'priority_score': float(row['priority_score']),
                'explanation': str(row['explanation']),
                'severity': str(row['severity']),
                'defect_type': str(row['defect_type']),
            }
        print(f"[ML] Loaded {_SCORED_DEFECTS_CACHE.__len__()} precomputed defect explanations", file=sys.stderr)
except Exception as e:
    print(f"[ML Warning] Failed to load trained artifacts: {e}", file=sys.stderr)


def score_work_orders(work_orders: list[dict]) -> list[dict]:
    """
    Score each work order using the trained XGBoost priority model and feature pipeline.
    If the defect ID exists in the trained scored_defects.csv, uses the precomputed
    score and SHAP natural-language explanation. Otherwise, transforms domain features
    and executes live inference.
    """
    scored = []
    for wo in work_orders:
        wo_id = str(wo.get("id", ""))
        cached = _SCORED_DEFECTS_CACHE.get(wo_id)

        if cached is not None:
            risk = cached['priority_score']
            explanation = cached['explanation']
        elif _TRAINED_MODEL is not None and _FEATURE_PIPELINE is not None:
            try:
                # Prepare single-row DataFrame for inference
                df_row = pd.DataFrame([{
                    'department': wo.get('department', 'TMS'),
                    'severity': wo.get('severity', 'Critical' if wo.get('priority', 2) == 1 else 'Major' if wo.get('priority', 2) == 2 else 'Minor'),
                    'overdueDays': wo.get('overdueDays', 0),
                    'durationMinutes': wo.get('durationMinutes', 120),
                    'avg_daily_trains': 120.0,
                    'goods_forecast_7day': 100.0,
                    'available_window_minutes': 120.0,
                    'electrified': 'Y',
                    'status': 'Open',
                }])
                X = _FEATURE_PIPELINE.transform(df_row)
                pred = float(_TRAINED_MODEL.predict(X)[0])
                risk = float(np.clip(pred, 0.0, 100.0))
                explanation = (
                    f"Defect {wo_id} ({wo.get('department')} km {wo.get('kmFrom', 0):.1f}–{wo.get('kmTo', 0):.1f}) "
                    f"scored {risk:.1f}/100 priority based on XGBoost feature pipeline."
                )
            except Exception as exc:
                print(f"[ML Inference Err] {exc}", file=sys.stderr)
                risk = float(wo.get("assetRisk") or 50.0)
                explanation = f"Defect {wo_id} scored {risk:.1f}/100 priority."
        else:
            # Fallback heuristic if models not available
            overdue = wo.get("overdueDays", 0)
            tqi = wo.get("tqiScore", 60)
            risk = float(np.clip(0.3 * overdue + (100 - tqi) * 0.5 + 20, 0, 100))
            explanation = f"Defect {wo_id} scored {risk:.1f}/100 priority."

        penalty_weight = int(100 + 99 * risk)  # 100–10000
        scored.append({
            **wo,
            "assetRisk": round(risk, 1),
            "penaltyWeight": penalty_weight,
            "explanation": explanation,
        })
    return scored


# ─────────────────────────────────────────────────────────────────────────────
# GEOGRAPHIC CLUSTERING (Multi-Dept Corridor Merger)
# ─────────────────────────────────────────────────────────────────────────────

def cluster_work_orders(work_orders: list[dict]) -> list[dict]:
    """
    'Multi-Department Corridor Clustering':
    If TMS + SMMS + TDMS demands overlap the same geographic segment
    (within ±2 km), merge them into a single 'Shadow Block' so the
    line is closed ONCE instead of three separate closures.
    """
    if not work_orders:
        return []

    clusters: list[dict] = []
    used = set()

    for i, wo in enumerate(work_orders):
        if i in used:
            continue
        cluster = {
            "clusterIds": [wo["id"]],
            "kmFrom": wo["kmFrom"],
            "kmTo":   wo["kmTo"],
            "durationMinutes": wo["durationMinutes"],
            "penaltyWeight": wo["penaltyWeight"],
            "assetRisk": wo["assetRisk"],
            "departments": [wo["department"]],
            "isShadowBlock": False,
            "description": wo.get("description", ""),
            "trackId": wo.get("trackId", "UP"),
        }

        for j, other in enumerate(work_orders):
            if j == i or j in used:
                continue
            overlap_km = (
                min(wo["kmTo"], other["kmTo"]) -
                max(wo["kmFrom"], other["kmFrom"])
            )
            if overlap_km >= -2.0:          # within 2 km geographic tolerance
                cluster["clusterIds"].append(other["id"])
                cluster["kmFrom"] = min(cluster["kmFrom"], other["kmFrom"])
                cluster["kmTo"]   = max(cluster["kmTo"],   other["kmTo"])
                cluster["durationMinutes"] = max(
                    cluster["durationMinutes"], other["durationMinutes"]
                )
                cluster["penaltyWeight"] = max(
                    cluster["penaltyWeight"], other["penaltyWeight"]
                )
                cluster["assetRisk"] = max(
                    cluster["assetRisk"], other["assetRisk"]
                )
                if other["department"] not in cluster["departments"]:
                    cluster["departments"].append(other["department"])
                used.add(j)

        if len(cluster["departments"]) > 1:
            cluster["isShadowBlock"] = True
            cluster["description"] = (
                f"SHADOW BLOCK [{'+'.join(cluster['departments'])}] "
                f"{cluster['kmFrom']:.1f}-{cluster['kmTo']:.1f} km"
            )

        used.add(i)
        clusters.append(cluster)

    print(f"[CLUSTER] {len(work_orders)} WOs → {len(clusters)} blocks "
          f"({sum(1 for c in clusters if c['isShadowBlock'])} shadow)", file=sys.stderr)
    return clusters


# ─────────────────────────────────────────────────────────────────────────────
# OR-TOOLS CP-SAT SOLVER
# ─────────────────────────────────────────────────────────────────────────────

def solve(payload: dict) -> dict:
    """
    Main CP-SAT scheduling solver.

    Inputs (from payload):
      - work_orders: list of scored+clustered maintenance demands
      - trains: list of train schedules (priority 1-4)
      - horizon_minutes: planning window (default 1440)
      - date: planning date (YYYY-MM-DD)

    Outputs:
      - scheduled_blocks: optimized block windows
      - train_perturbations: adjusted train times (if any)
      - solver_stats: wall time, conflicts, branches
      - kpis: summary metrics
    """
    t0 = time.perf_counter()
    trains     = payload.get("trains", [])
    raw_wos    = payload.get("workOrders", [])
    horizon    = payload.get("horizonMinutes", HORIZON_MINUTES)
    plan_date  = payload.get("date", datetime.date.today().isoformat())

    if not raw_wos:
        return {
            "scheduledBlocks": [],
            "trainPerturbations": [],
            "solverStats": {"status": "TRIVIAL", "wallTimeMs": 0},
            "kpis": {"blocksScheduled": 0, "shadowBlocks": 0,
                     "p1TrainsProtected": len([t for t in trains if t.get("priority", 4) == 1]),
                     "avgRisk": 0.0}
        }

    # ── Score work orders using trained XGBoost model & feature pipeline ────
    scored   = score_work_orders(raw_wos)
    clusters = cluster_work_orders(scored)

    # ── Multi-Agent Negotiation Layer ───────────────────────────────────────
    monsoon_active = payload.get("monsoonActive", False)
    arbitrator = ArbitrationAgent(monsoon_active=monsoon_active)
    arbitration_transcript = arbitrator.negotiate(scored)

    # Associate arbitration justifications with clusters
    for idx, clu in enumerate(clusters):
        if idx < len(arbitration_transcript.get("justifications", [])):
            clu["justification"] = arbitration_transcript["justifications"][idx]
        elif clu.get("explanation"):
            clu["justification"] = clu["explanation"]

    model = cp_model.CpModel()

    # ── Decision variables: start time in minutes for each block cluster ────
    block_vars = []
    for c in clusters:
        dur     = c["durationMinutes"]
        latest  = horizon - dur
        if latest < 0:
            latest = 0
        start  = model.new_int_var(0, latest, f"start_{c['clusterIds'][0]}")
        end    = model.new_int_var(dur, horizon, f"end_{c['clusterIds'][0]}")
        model.add(end == start + dur)
        interval = model.new_interval_var(start, dur, end, f"iv_{c['clusterIds'][0]}")
        block_vars.append({
            "cluster": c,
            "start":   start,
            "end":     end,
            "interval": interval,
            "dur":     dur,
        })

    # ── Constraint 1 & 2: Pairwise geographic track conflict & safety headway ──
    # Two blocks on the same track conflict in time only if their geographic spans
    # overlap or are within a 15 km safety buffer. Disjoint corridor sections can
    # execute maintenance concurrently.
    for i in range(len(block_vars)):
        for j in range(i+1, len(block_vars)):
            bv_i = block_vars[i]
            bv_j = block_vars[j]
            if bv_i["cluster"].get("trackId") != bv_j["cluster"].get("trackId"):
                continue

            # Check geographic proximity buffer (15.0 km)
            geo_conflict = (
                min(bv_i["cluster"]["kmTo"], bv_j["cluster"]["kmTo"]) + 15.0 >=
                max(bv_i["cluster"]["kmFrom"], bv_j["cluster"]["kmFrom"])
            )

            if geo_conflict:
                b_ij = model.new_bool_var(f"geo_b_{i}_{j}")
                # Either i ends before j starts (with headway), or j ends before i starts
                model.add(bv_i["end"] + HEADWAY_MINUTES <= bv_j["start"]).only_enforce_if(b_ij)
                model.add(bv_j["end"] + HEADWAY_MINUTES <= bv_i["start"]).only_enforce_if(b_ij.negated())

    # ── Constraint 3: Rush-hour curfew ──────────────────────────────────────
    for bv in block_vars:
        for (rsh_start, rsh_end) in RUSH_WINDOWS:
            # Block must not overlap [rsh_start, rsh_end]
            # Either block ends before rsh_start, or starts after rsh_end
            is_before = model.new_bool_var(f"before_{bv['cluster']['clusterIds'][0]}_{rsh_start}")
            model.add(bv["end"] <= rsh_start).only_enforce_if(is_before)
            model.add(bv["start"] >= rsh_end).only_enforce_if(is_before.negated())

    # ── Constraint 4: Priority-1 train protection ────────────────────────────
    p1_windows = []
    for train in trains:
        if train.get("priority", 4) != 1:
            continue
        stops = train.get("stops", [])
        for stop in stops:
            arr = stop.get("arrivalMin")
            dep = stop.get("departureMin")
            km  = stop.get("chainage", 0)
            if km is None:
                continue
            t_ref = dep if dep is not None else arr
            if t_ref is None:
                continue
            arr_eff = arr if arr is not None else t_ref
            dep_eff = dep if dep is not None else t_ref
            # No block within 20 km of this station during ±30 min window
            p1_windows.append({
                "kmFrom": km - 20,
                "kmTo":   km + 20,
                "tFrom":  max(0, arr_eff - 30),
                "tTo":    min(horizon, dep_eff + 30),
            })

    for bv in block_vars:
        clu = bv["cluster"]
        for pw in p1_windows:
            geo_conflict = (
                clu["kmFrom"] < pw["kmTo"] and
                clu["kmTo"]   > pw["kmFrom"]
            )
            if geo_conflict:
                # Block must not overlap the P1 time window
                is_before = model.new_bool_var(
                    f"p1_before_{clu['clusterIds'][0]}_{pw['tFrom']}"
                )
                model.add(bv["end"] <= pw["tFrom"]).only_enforce_if(is_before)
                model.add(bv["start"] >= pw["tTo"]).only_enforce_if(is_before.negated())

    # ── Objective: Minimize weighted lateness ────────────────────────────────
    # Prefer scheduling high-risk (high-penalty) blocks early in the window.
    # Soft objective: minimize sum(penalty_weight * start_time / 60)
    obj_terms = []
    for bv in block_vars:
        weight = bv["cluster"]["penaltyWeight"]
        # Scale start to 0–1440 range; multiply by weight
        obj_terms.append(weight * bv["start"])

    model.minimize(sum(obj_terms))

    # ── Solve ────────────────────────────────────────────────────────────────
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 15.0
    solver.parameters.num_search_workers  = 4
    solver.parameters.log_search_progress = False

    status = solver.solve(model)
    wall_ms = round((time.perf_counter() - t0) * 1000, 1)

    status_name = {
        cp_model.OPTIMAL:   "OPTIMAL",
        cp_model.FEASIBLE:  "FEASIBLE",
        cp_model.INFEASIBLE: "INFEASIBLE",
        cp_model.UNKNOWN:   "UNKNOWN",
    }.get(status, "ERROR")

    print(f"[SOLVER] Status={status_name} wallTime={wall_ms}ms "
          f"obj={solver.objective_value:.0f}", file=sys.stderr)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {
            "scheduledBlocks": [],
            "trainPerturbations": [],
            "solverStats": {
                "status": status_name,
                "wallTimeMs": wall_ms,
                "conflicts": solver.num_conflicts,
                "branches": solver.num_branches,
            },
            "kpis": {"blocksScheduled": 0, "shadowBlocks": 0,
                     "p1TrainsProtected": len(p1_windows),
                     "avgRisk": 0.0, "error": "Solver could not find feasible solution"}
        }

    # ── Extract solution ─────────────────────────────────────────────────────
    scheduled_blocks = []
    total_risk = 0.0

    for bv in block_vars:
        st  = solver.value(bv["start"])
        end = solver.value(bv["end"])
        clu = bv["cluster"]

        def mins_to_hhmm(m: int) -> str:
            h, mn = divmod(int(m), 60)
            return f"{h:02d}:{mn:02d}"

        scheduled_blocks.append({
            "clusterIds":       clu["clusterIds"],
            "isShadowBlock":    clu["isShadowBlock"],
            "departments":      clu["departments"],
            "kmFrom":           clu["kmFrom"],
            "kmTo":             clu["kmTo"],
            "startMin":         st,
            "endMin":           end,
            "durationMinutes":  clu["durationMinutes"],
            "startHHMM":        mins_to_hhmm(st),
            "endHHMM":          mins_to_hhmm(end),
            "assetRisk":        clu["assetRisk"],
            "penaltyWeight":    clu["penaltyWeight"],
            "description":      clu["description"],
            "justification":    clu.get("justification", f"Arbitrated block possession for {', '.join(clu['departments'])}."),
            "trackId":          clu.get("trackId", "UP"),
            "provenance":       "MODELED",
        })
        total_risk += clu["assetRisk"]

    # ── Train perturbations (compute crossing delays & SLW rerouting) ─────────
    train_perturbations = []
    for train in trains:
        if train.get("priority", 4) == 1:
            continue   # P1 trains are never perturbed
        for block in scheduled_blocks:
            for stop in train.get("stops", []):
                dep_raw = stop.get("departureMin") if stop.get("departureMin") is not None else stop.get("arrivalMin")
                km_raw  = stop.get("chainage")
                if dep_raw is None or km_raw is None:
                    continue
                dep_min = float(dep_raw)
                km      = float(km_raw)
                if km < 0 or dep_min < 0:
                    continue
                geo_hit = block["kmFrom"] <= km <= block["kmTo"]
                time_hit = (
                    block["startMin"] - HEADWAY_MINUTES <= dep_min <=
                    block["endMin"] + HEADWAY_MINUTES
                )
                if geo_hit and time_hit:
                    delay = max(0, block["endMin"] + HEADWAY_MINUTES - dep_min)
                    if delay > 0:
                        alt_track = "DN" if block["trackId"] == "UP" else "UP"
                        slw_feasible = (delay <= 45)
                        train_perturbations.append({
                            "trainNumber": train["number"],
                            "priority":    train["priority"],
                            "stationCode": stop.get("stationCode", "?"),
                            "originalDeparture": stop.get("departureHHMM", "?"),
                            "delayMinutes": delay,
                            "cause": block["description"] or "Maintenance Block",
                            "slwDiverted": slw_feasible,
                            "slwRoute": f"Single-Line Working over {alt_track} track (crossovers km {block['kmFrom']:.0f}–{block['kmTo']:.0f})" if slw_feasible else "Held at outer signal",
                        })

    n_shadow    = sum(1 for b in scheduled_blocks if b["isShadowBlock"])
    avg_risk    = round(total_risk / len(scheduled_blocks), 1) if scheduled_blocks else 0.0
    p1_protected = len([t for t in trains if t.get("priority", 4) == 1])

    return {
        "scheduledBlocks":       scheduled_blocks,
        "trainPerturbations":    train_perturbations,
        "arbitrationTranscript": arbitration_transcript,
        "solverStats": {
            "status":      status_name,
            "wallTimeMs":  wall_ms,
            "conflicts":   solver.num_conflicts,
            "branches":    solver.num_branches,
            "objectiveValue": solver.objective_value,
        },
        "kpis": {
            "blocksScheduled":       len(scheduled_blocks),
            "shadowBlocks":          n_shadow,
            "p1TrainsProtected":      p1_protected,
            "avgRisk":               avg_risk,
            "totalWorkOrders":       len(raw_wos),
            "perturbedTrains":       len(set(p["trainNumber"] for p in train_perturbations)),
            "corridorMinutesSaved":  arbitration_transcript.get("corridorMinutesSaved", 0),
        },
    }



# ─────────────────────────────────────────────────────────────────────────────
# ENTRYPOINT
# ─────────────────────────────────────────────────────────────────────────────

def main():
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            raise ValueError("Empty stdin — no JSON payload received")
        payload = json.loads(raw)
        result  = solve(payload)
        print(json.dumps(result, ensure_ascii=False))
        sys.stdout.flush()
    except Exception as exc:
        err = {
            "error": str(exc),
            "traceback": traceback.format_exc(),
            "scheduledBlocks": [],
            "trainPerturbations": [],
            "solverStats": {"status": "ERROR", "wallTimeMs": 0},
            "kpis": {}
        }
        print(json.dumps(err), file=sys.stdout)
        sys.stdout.flush()
        sys.exit(1)


if __name__ == "__main__":
    main()
