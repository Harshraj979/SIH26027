"use client";

import React from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defectName?: string;
  department?: string;
  ssrStandardMin?: number;
  isNight?: boolean;
  monsoonActive?: boolean;
  kmTarget?: number;
  nearestDepot?: string;
  transitMinutes?: number;
  historicalCrewBiasMin?: number;
}

export default function SSRDurationCalculatorModal({
  isOpen,
  onClose,
  defectName = "Replacing 6m fractured rail section (TMS-SSR-01)",
  department = "TMS (Civil P-Way)",
  ssrStandardMin = 60,
  isNight = true,
  monsoonActive = false,
  kmTarget = 14.2,
  nearestDepot = "New Delhi Yard Depot (KM 0.0)",
  transitMinutes = 28,
  historicalCrewBiasMin = 5,
}: Props) {
  if (!isOpen) return null;

  const nightPenalty = isNight ? Math.round(ssrStandardMin * 0.15) : 0;
  const weatherPenalty = monsoonActive ? Math.round(ssrStandardMin * 0.25) : 0;
  const totalDuration =
    ssrStandardMin +
    nightPenalty +
    weatherPenalty +
    transitMinutes +
    historicalCrewBiasMin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#000075] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⏱️</span>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                Standard Schedule of Rates (SSR) &amp; AI Duration Engine
              </h3>
              <p className="text-[11px] text-white/70">
                Indian Railways Maintenance Manual Blueprint + Real-World Dynamic Adjustments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-lg font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-[10px] uppercase font-bold text-slate-400">Target Defect / Requisition</p>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{defectName}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Department: <strong>{department}</strong> • LRS Location: <strong>KM {kmTarget.toFixed(1)}</strong>
            </p>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-800">
              Four-Factor True Window Breakdown
            </h4>

            {/* Step 1: Base SSR Manual */}
            <div className="p-3 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">1. Standard Schedule of Rates (The Blueprint Data)</p>
                <p className="text-[11px] text-slate-500">
                  Prescribed maximum baseline from Indian Railways Engineering Maintenance Manual
                </p>
              </div>
              <span className="font-mono font-black text-sm text-blue-900 tabular-nums">
                {ssrStandardMin} min
              </span>
            </div>

            {/* Step 2: Variable A Environmental & Time of Day */}
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/40 flex items-center justify-between">
              <div>
                <p className="font-bold text-amber-950">2. Variable A: Environmental &amp; Time-of-Day Factors</p>
                <p className="text-[11px] text-amber-800">
                  {isNight ? "Night slot (02:00 AM): +15% penalty (slow human movement with flashlights)" : "Daytime slot"}
                  {monsoonActive ? " • Heavy monsoon alert active (+25% slip hazard)" : ""}
                </p>
              </div>
              <span className="font-mono font-black text-sm text-amber-900 tabular-nums">
                +{nightPenalty + weatherPenalty} min
              </span>
            </div>

            {/* Step 3: Variable B LRS Transit Time */}
            <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/40 flex items-center justify-between">
              <div>
                <p className="font-bold text-blue-950">3. Variable B: Location &amp; Accessibility (LRS Transit)</p>
                <p className="text-[11px] text-blue-800">
                  Nearest depot: <strong>{nearestDepot}</strong>. Tower wagon traveling at 30 km/h speed limit.
                </p>
              </div>
              <span className="font-mono font-black text-sm text-blue-900 tabular-nums">
                +{transitMinutes} min
              </span>
            </div>

            {/* Step 4: Variable C Historical ML Feedback Loop */}
            <div className="p-3 rounded-lg border border-purple-200 bg-purple-50/40 flex items-center justify-between">
              <div>
                <p className="font-bold text-purple-950">4. Variable C: Historical ML Feedback Loop</p>
                <p className="text-[11px] text-purple-800">
                  Historical log pattern: Station crew consistently requires buffer to prevent train delays
                </p>
              </div>
              <span className="font-mono font-black text-sm text-purple-900 tabular-nums">
                +{historicalCrewBiasMin} min
              </span>
            </div>

            {/* Total Required Possession Window */}
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 flex items-center justify-between">
              <div>
                <p className="text-[10.5px] uppercase font-black text-emerald-900 tracking-wider">
                  Total Dynamically Adjusted Window Required
                </p>
                <p className="text-xs text-emerald-800 font-medium">
                  Guarantees safety clearance without cutting it too close for oncoming trains
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-emerald-900 tabular-nums">
                  {totalDuration} min
                </span>
                <p className="text-[10px] text-emerald-700 font-semibold">(+{totalDuration - ssrStandardMin}m dynamic buffer)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#000075] hover:bg-[#00005a] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Understood &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
}
