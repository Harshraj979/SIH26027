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

import numpy as np
from ortools.sat.python import cp_model
from sklearn.ensemble import HistGradientBoostingRegressor
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
# ML ASSET CRITICALITY SCORER
# ─────────────────────────────────────────────────────────────────────────────

def build_risk_scorer():
    """
    Train a HistGradientBoostingRegressor on synthetic-but-realistic asset
    health data. In production this would be trained on historical inspection
    records from the Central Railway Asset Management System (CRAMS).

    Features: [overdue_days, cumulative_gmt, tqi_score]
    Target: asset_failure_risk (0–100)
    """
    rng = np.random.default_rng(42)
    n = 2000

    overdue_days   = rng.uniform(0, 365, n)
    cumulative_gmt = rng.uniform(0, 500, n)        # Gross Metric Tonnes
    tqi_score      = rng.uniform(0, 100, n)        # Track Quality Index (higher = better)

    # Physics-informed ground truth
    risk = (
        0.15 * overdue_days
        + 0.08 * cumulative_gmt
        - 0.30 * tqi_score        # good TQI reduces risk
        + rng.normal(0, 3, n)
    )
    risk = np.clip(risk, 0, 100)

    X = np.column_stack([overdue_days, cumulative_gmt, tqi_score])
    clf = HistGradientBoostingRegressor(
        max_iter=200, max_depth=5, learning_rate=0.05, random_state=42
    )
    clf.fit(X, risk)
    print("[ML] Asset risk model trained.", file=sys.stderr)
    return clf


def score_work_orders(scorer, work_orders: list[dict]) -> list[dict]:
    """
    Score each work order and compute solver penalty weight.
    penalty_weight = 100 + 9900 * (risk / 100)  →  range [100, 10000]
    """
    scored = []
    for wo in work_orders:
        overdue_days   = wo.get("overdueDays", 0)
        cumulative_gmt = wo.get("cumulativeGmt", 0)
        tqi_score      = wo.get("tqiScore", 50)
        X = np.array([[overdue_days, cumulative_gmt, tqi_score]])
        risk = float(np.clip(scorer.predict(X)[0], 0, 100))
        penalty_weight = int(100 + 99 * risk)  # 100–10000
        scored.append({**wo, "assetRisk": round(risk, 1), "penaltyWeight": penalty_weight})
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

    # ── Multi-Agent Negotiation Layer ───────────────────────────────────────
    monsoon_active = payload.get("monsoonActive", False)
    arbitrator = ArbitrationAgent(monsoon_active=monsoon_active)
    arbitration_transcript = arbitrator.negotiate(raw_wos)

    # ── Build ML scorer and score work orders ────────────────────────────────
    scorer   = build_risk_scorer()
    scored   = score_work_orders(scorer, raw_wos)
    clusters = cluster_work_orders(scored)

    # Associate arbitration justifications with clusters
    just_map = {}
    for idx, just in enumerate(arbitration_transcript.get("justifications", [])):
        if idx < len(clusters):
            clusters[idx]["justification"] = just


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

    # ── Constraint 1: No two blocks on same track overlap (no-overlap) ───────
    up_intervals  = [bv["interval"] for bv in block_vars if bv["cluster"].get("trackId", "UP") == "UP"]
    dn_intervals  = [bv["interval"] for bv in block_vars if bv["cluster"].get("trackId", "DN") == "DN"]
    if len(up_intervals) > 1:
        model.add_no_overlap(up_intervals)
    if len(dn_intervals) > 1:
        model.add_no_overlap(dn_intervals)

    # ── Constraint 2: 10-minute safety headway between consecutive blocks ────
    # Implemented by padding duration in the no-overlap constraint (done above)
    # and additionally enforcing pairwise headway:
    for i in range(len(block_vars)):
        for j in range(i+1, len(block_vars)):
            bv_i = block_vars[i]
            bv_j = block_vars[j]
            # Only enforce headway on same track
            if bv_i["cluster"].get("trackId") != bv_j["cluster"].get("trackId"):
                continue
            b_ij = model.new_bool_var(f"b_{i}_{j}")
            # If i before j: end_i + HEADWAY <= start_j
            model.add(bv_i["end"] + HEADWAY_MINUTES <= bv_j["start"]).only_enforce_if(b_ij)
            # If j before i: end_j + HEADWAY <= start_i
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
