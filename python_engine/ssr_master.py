#!/usr/bin/env python3
"""
RailBlock AI — Standard Schedule of Rates (SSR) Master Blueprint
and AI Dynamic Adjustment Engine.

Indian Railways Maintenance Manual Specifications:
1. Standard Schedule of Rates (SSR) baseline metrics for TMS, SMMS, TDMS.
2. Depot Registry along NDLS–LDH Mainline Corridor (312 km).
3. Linear Referencing System (LRS) Transit Time Calculator (restricted speed: 30 km/h).
4. Real-world AI adjustments: Night penalty (+15%), Weather (+25%), Historical crew bias.
"""

import math
from typing import Dict, Any, Tuple, Optional

# ─────────────────────────────────────────────────────────────────────────────
# 1. STANDARD SCHEDULE OF RATES (SSR) MASTER DIRECTORY
# ─────────────────────────────────────────────────────────────────────────────

SSR_CATALOGUE: Dict[str, Dict[str, Any]] = {
    # ─── TMS: Track Management System (Civil / P-Way) ────────────────────────
    "TMS-SSR-01": {
        "code": "TMS-SSR-01",
        "department": "TMS",
        "name": "Replacing 6m fractured rail section",
        "defectType": "RAIL_FRACTURE",
        "standardMinutes": 60,
        "defaultSeverity": "Critical",
        "requiresBlock": True,
        "description": "Cut and replace fractured rail section with 60kg 90UTS rail and thermit weld.",
    },
    "TMS-SSR-02": {
        "code": "TMS-SSR-02",
        "department": "TMS",
        "name": "Turnout & 1-in-12 Crossover packing & alignment",
        "defectType": "TURNOUT_PACKING",
        "standardMinutes": 90,
        "defaultSeverity": "Major",
        "requiresBlock": True,
        "description": "Mechanized packing and tamping of diamond crossover switches and point rails.",
    },
    "TMS-SSR-03": {
        "code": "TMS-SSR-03",
        "department": "TMS",
        "name": "Ballast deep screening & mechanized tamping (CSM-09)",
        "defectType": "BALLAST_TAMPING",
        "standardMinutes": 120,
        "defaultSeverity": "Major",
        "requiresBlock": True,
        "description": "Ballast cleaning machine (BCM) and tamping consist deep screening on mainline track.",
    },
    "TMS-SSR-04": {
        "code": "TMS-SSR-04",
        "department": "TMS",
        "name": "USFD Ultrasonic Flaw Detection verification",
        "defectType": "USFD_TESTING",
        "standardMinutes": 45,
        "defaultSeverity": "Minor",
        "requiresBlock": False,
        "description": "Digital ultrasonic probe scanning for internal transverse railhead cracks.",
    },
    "TMS-SSR-05": {
        "code": "TMS-SSR-05",
        "department": "TMS",
        "name": "Fish plate joint tightening & emergency bolt replacement",
        "defectType": "FISHPLATE_TIGHTENING",
        "standardMinutes": 30,
        "defaultSeverity": "Major",
        "requiresBlock": True,
        "description": "Inspection and high-tensile bolt torquing on insulated and mechanical fishplates.",
    },
    "TMS-SSR-06": {
        "code": "TMS-SSR-06",
        "department": "TMS",
        "name": "Routine track bed cleaning & cess clearing",
        "defectType": "ROUTINE_CLEANING",
        "standardMinutes": 40,
        "defaultSeverity": "Minor",
        "requiresBlock": False,
        "description": "Vegetation clearing, drain declogging, and cosmetic trackbed dressing.",
    },

    # ─── SMMS: Signal Maintenance Management System (S&T) ─────────────────────
    "SMMS-SSR-01": {
        "code": "SMMS-SSR-01",
        "department": "SMMS",
        "name": "Damaged point-machine motor replacement",
        "defectType": "POINT_MACHINE_FAILURE",
        "standardMinutes": 45,
        "defaultSeverity": "Critical",
        "requiresBlock": True,
        "description": "Replace burnt 110V DC rotary point machine motor, test stroke detection and lock.",
    },
    "SMMS-SSR-02": {
        "code": "SMMS-SSR-02",
        "department": "SMMS",
        "name": "Multi-aspect LED signal aspect unit overhaul",
        "defectType": "SIGNAL_FAILURE",
        "standardMinutes": 30,
        "defaultSeverity": "Major",
        "requiresBlock": True,
        "description": "Swap degraded LED optical aspect unit, calibrate current regulator module.",
    },
    "SMMS-SSR-03": {
        "code": "SMMS-SSR-03",
        "department": "SMMS",
        "name": "Digital Axle Counter (DAC) reset & wheel sensor calibration",
        "defectType": "AXLE_COUNTER_FAULT",
        "standardMinutes": 40,
        "defaultSeverity": "Critical",
        "requiresBlock": True,
        "description": "High-frequency wheel detector sensor alignment and trackside evaluator module reset.",
    },
    "SMMS-SSR-04": {
        "code": "SMMS-SSR-04",
        "department": "SMMS",
        "name": "Track circuit relay overhaul & impedance bond tuning",
        "defectType": "TRACK_CIRCUIT_FAILURE",
        "standardMinutes": 60,
        "defaultSeverity": "Major",
        "requiresBlock": True,
        "description": "Tune AC audio-frequency track circuit (AFTC) oscillators and replace Q-series track relays.",
    },
    "SMMS-SSR-05": {
        "code": "SMMS-SSR-05",
        "department": "SMMS",
        "name": "Electronic Interlocking (EI) CPU card swap",
        "defectType": "INTERLOCKING_FAULT",
        "standardMinutes": 45,
        "defaultSeverity": "Critical",
        "requiresBlock": True,
        "description": "SIL-4 electronic interlocking redundant processor board replacement and cold reboot.",
    },
    "SMMS-SSR-06": {
        "code": "SMMS-SSR-06",
        "department": "SMMS",
        "name": "Signalling cable trench inspection & post repainting",
        "defectType": "CABLE_INSPECTION",
        "standardMinutes": 30,
        "defaultSeverity": "Minor",
        "requiresBlock": False,
        "description": "Visual marker survey and post protective coat application.",
    },

    # ─── TDMS: Traction Distribution Management System (25kV OHE) ─────────────
    "TDMS-SSR-01": {
        "code": "TDMS-SSR-01",
        "department": "TDMS",
        "name": "Broken overhead 25kV composite insulator replacement",
        "defectType": "OHE_INSULATOR_BROKEN",
        "standardMinutes": 30,
        "defaultSeverity": "Critical",
        "requiresBlock": True,
        "description": "De-energize 25kV OHE, earth line, replace flashed-over silicone composite insulator.",
    },
    "TDMS-SSR-02": {
        "code": "TDMS-SSR-02",
        "department": "TDMS",
        "name": "Catenary & contact wire dropper tension adjustment",
        "defectType": "CATENARY_SAG",
        "standardMinutes": 60,
        "defaultSeverity": "Major",
        "requiresBlock": True,
        "description": "Tower wagon hoist, adjust auto-tensioning device (ATD) weights and dropper spacing.",
    },
    "TDMS-SSR-03": {
        "code": "TDMS-SSR-03",
        "department": "TDMS",
        "name": "25kV sub-station feeder cable splice & jointing",
        "defectType": "FEEDER_CABLE_FAULT",
        "standardMinutes": 90,
        "defaultSeverity": "Critical",
        "requiresBlock": True,
        "description": "Cut faulty underground XLPE feeder, execute heat-shrinkable high-voltage joint kit.",
    },
    "TDMS-SSR-04": {
        "code": "TDMS-SSR-04",
        "department": "TDMS",
        "name": "Traction mast cantilever & bracket realignment",
        "defectType": "MAST_CANTILEVER_TILT",
        "standardMinutes": 45,
        "defaultSeverity": "Major",
        "requiresBlock": True,
        "description": "Correct stagger and height of contact wire assembly using 8-wheeler tower wagon.",
    },
    "TDMS-SSR-05": {
        "code": "TDMS-SSR-05",
        "department": "TDMS",
        "name": "Traction Substation (TSS) isolator overhaul",
        "defectType": "ISOLATOR_OVERHAUL",
        "standardMinutes": 40,
        "defaultSeverity": "Major",
        "requiresBlock": True,
        "description": "Inspect and clean high-voltage motorized sectioning isolator contacts and interlocks.",
    },
    "TDMS-SSR-06": {
        "code": "TDMS-SSR-06",
        "department": "TDMS",
        "name": "Rust removal & anti-corrosion painting on OHE pole",
        "defectType": "POLE_RUST",
        "standardMinutes": 40,
        "defaultSeverity": "Minor",
        "requiresBlock": False,
        "description": "Brush off superficial rust and apply zinc-chromate primer and aluminium paint on mast.",
    },
}

# Lookup by defect type name
DEFECT_TYPE_TO_SSR: Dict[str, str] = {
    "RAIL_FRACTURE": "TMS-SSR-01",
    "TURNOUT_PACKING": "TMS-SSR-02",
    "BALLAST_TAMPING": "TMS-SSR-03",
    "USFD_TESTING": "TMS-SSR-04",
    "FISHPLATE_TIGHTENING": "TMS-SSR-05",
    "ROUTINE_CLEANING": "TMS-SSR-06",
    "POINT_MACHINE_FAILURE": "SMMS-SSR-01",
    "SIGNAL_FAILURE": "SMMS-SSR-02",
    "AXLE_COUNTER_FAULT": "SMMS-SSR-03",
    "TRACK_CIRCUIT_FAILURE": "SMMS-SSR-04",
    "INTERLOCKING_FAULT": "SMMS-SSR-05",
    "CABLE_INSPECTION": "SMMS-SSR-06",
    "OHE_INSULATOR_BROKEN": "TDMS-SSR-01",
    "CATENARY_SAG": "TDMS-SSR-02",
    "FEEDER_CABLE_FAULT": "TDMS-SSR-03",
    "MAST_CANTILEVER_TILT": "TDMS-SSR-04",
    "ISOLATOR_OVERHAUL": "TDMS-SSR-05",
    "POLE_RUST": "TDMS-SSR-06",
}

# ─────────────────────────────────────────────────────────────────────────────
# 2. MAINTENANCE DEPOTS (NDLS – UMB – LDH Corridor, 312 km)
# ─────────────────────────────────────────────────────────────────────────────

DEPOTS = [
    {"code": "NDLS_YARD", "name": "New Delhi Yard Depot", "km": 0.0},
    {"code": "PNP_DEPOT",  "name": "Panipat Jn Maintenance Depot", "km": 90.0},
    {"code": "UMB_DEPOT",  "name": "Ambala Cantt Maintenance Depot", "km": 197.0},
    {"code": "LDH_DEPOT",  "name": "Ludhiana Jn Yard Depot", "km": 312.0},
]

RESTRICTED_MAINTENANCE_SPEED_KMH = 30.0  # IR restricted speed limit for tower wagons / trollies
FIXED_SETUP_MINUTES = 20                 # Fixed minimum track lockdown & isolation overhead

# ─────────────────────────────────────────────────────────────────────────────
# 3. LRS TRANSIT TIME CALCULATOR
# ─────────────────────────────────────────────────────────────────────────────

def find_nearest_depot(km_target: float) -> Tuple[Dict[str, Any], float]:
    """
    Finds the closest maintenance depot along the NDLS–LDH corridor.
    Returns (nearest_depot, distance_km).
    """
    best_depot = DEPOTS[0]
    best_dist = abs(km_target - best_depot["km"])
    for d in DEPOTS[1:]:
        dist = abs(km_target - d["km"])
        if dist < best_dist:
            best_dist = dist
            best_depot = d
    return best_depot, round(best_dist, 1)


def compute_transit_minutes(km_target: float) -> Tuple[int, str]:
    """
    Computes transit time from nearest crew depot at 30 km/h.
    - Case A: Yard Defect (dist <= 2.0 km) -> negligible transit (5 min).
    - Case B: Mid-section / Remote Defect -> transit = (dist / 30) * 60 min.
    """
    depot, dist_km = find_nearest_depot(km_target)
    if dist_km <= 2.0:
        transit_min = 5
    else:
        transit_min = int(round((dist_km / RESTRICTED_MAINTENANCE_SPEED_KMH) * 60.0))
    depot_desc = f"{depot['name']} (KM {depot['km']:.1f}, {dist_km:.1f} km away)"
    return transit_min, depot_desc


# ─────────────────────────────────────────────────────────────────────────────
# 4. AI DYNAMIC DURATION ADJUSTMENT LAYER
# ─────────────────────────────────────────────────────────────────────────────

# Historical crew feedback deviations (Station code / location -> average minutes offset)
HISTORICAL_CREW_OFFSETS = {
    "PNP": 10,   # Panipat crew historically takes +10 min on signal overhauls
    "UMB": 5,    # Ambala yard team takes +5 min
    "KKDE": 8,   # Karnal crew takes +8 min
    "SNP": 0,
    "LDH": 5,
}

def calculate_ai_adjusted_duration(
    standard_minutes: int,
    km_target: float,
    start_minute: Optional[int] = None,
    monsoon_active: bool = False,
    station_code: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Calculates true required block possession window incorporating:
      - Variable A: Environmental & Time-of-day (+15% for night 22:00–05:00, +25% for monsoon)
      - Variable B: LRS location & depot transit time at 30 km/h
      - Variable C: Historical machine learning crew feedback bias
    """
    # Variable A: Environmental & Time-of-Day
    is_night = False
    if start_minute is not None:
        # Night: 22:00 (1320 min) to 05:00 (300 min)
        if start_minute >= 1320 or start_minute <= 300:
            is_night = True

    env_multiplier = 0.0
    if is_night:
        env_multiplier += 0.15  # +15% night penalty (working in dark with torches)
    if monsoon_active:
        env_multiplier += 0.25  # +25% monsoon rain penalty (waterlogged tracks, slip hazard)

    env_penalty_min = int(round(standard_minutes * env_multiplier))

    # Variable B: LRS Depot Transit Time
    transit_min, depot_desc = compute_transit_minutes(km_target)

    # Variable C: Historical ML Feedback Bias
    crew_bias_min = 0
    if station_code and station_code in HISTORICAL_CREW_OFFSETS:
        crew_bias_min = HISTORICAL_CREW_OFFSETS[station_code]
    elif 85.0 <= km_target <= 100.0:
        crew_bias_min = 10  # Near Panipat
    elif 185.0 <= km_target <= 210.0:
        crew_bias_min = 5   # Near Ambala

    total_adjusted_min = standard_minutes + env_penalty_min + transit_min + crew_bias_min

    return {
        "standardMinutes": standard_minutes,
        "isNight": is_night,
        "monsoonActive": monsoon_active,
        "environmentalPenaltyMin": env_penalty_min,
        "transitMinutes": transit_min,
        "nearestDepotDesc": depot_desc,
        "historicalCrewBiasMin": crew_bias_min,
        "totalAdjustedMinutes": total_adjusted_min,
        "fixedSetupMinutes": FIXED_SETUP_MINUTES,
    }
