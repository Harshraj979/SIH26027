"use client";

/**
 * MasterStringChart — Interactive Time-Distance String Chart (Light Gov Theme)
 *
 * X-axis: Time (00:00 – 24:00)
 * Y-axis: Distance (km) — 0 at top (NDLS) → 312 at bottom (LDH)
 *
 * Features:
 *  - High-contrast light mode design for Indian Railways portal
 *  - Sharp High-DPI / Retina canvas scaling
 *  - Midnight wrap-around discontinuity protection (no diagonal screen cuts)
 *  - Priority-coded train trajectories with stop nodes
 *  - Multi-department maintenance possession blocks and shadow bundles
 *  - Rush-hour curfew bands
 *  - Interactive hover tooltips
 */

import React, { useEffect, useRef, useCallback } from "react";
import type { Station, Train, ScheduledBlock, TrainStop } from "@/types";

interface Props {
  stations:        Station[];
  trains:          Train[];
  scheduledBlocks: ScheduledBlock[];
  horizon:         number;   // total km (312)
  width?:          number;
  height?:         number;
}

const PRIORITY_COLORS: Record<number, string> = {
  1: "#059669",  // Emerald 600 — VIP / Vande Bharat
  2: "#2563EB",  // Blue 600    — Shatabdi / SF Express
  3: "#7C3AED",  // Violet 600  — Commuter MEMU
  4: "#64748B",  // Slate 500   — Freight / Container
};

const DEPT_COLORS: Record<string, string> = {
  TMS:  "#D97706",  // Amber 600 — Civil / Track (P.Way)
  SMMS: "#2563EB",  // Blue 600  — Signalling & Telecom
  TDMS: "#DC2626",  // Red 600   — Traction / 25kV OHE
};

const RUSH_WINDOWS = [
  { startMin: 480,  endMin: 630,  label: "Rush 08:00–10:30" },
  { startMin: 1020, endMin: 1170, label: "Rush 17:00–19:30" },
];

function minToX(min: number, canvasW: number, padL: number, padR: number): number {
  const usable = canvasW - padL - padR;
  return padL + (min / 1440) * usable;
}

function kmToY(km: number, maxKm: number, canvasH: number, padT: number, padB: number): number {
  const usable = canvasH - padT - padB;
  return padT + (km / maxKm) * usable;
}

export default function MasterStringChart({
  stations,
  trains,
  scheduledBlocks,
  horizon = 312,
  width   = 1200,
  height  = 640,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const PAD_L = 72;
  const PAD_R = 24;
  const PAD_T = 36;
  const PAD_B = 44;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Retina / High-DPI scaling
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const W = width;
    const H = height;

    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = `${W}px`;
    canvas.style.height = `${H}px`;

    ctx.save();
    ctx.scale(dpr, dpr);

    // ── Background ──────────────────────────────────────────────────────────
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, W, H);

    const xOf = (m: number) => minToX(m, W, PAD_L, PAD_R);
    const yOf = (km: number) => kmToY(km, horizon, H, PAD_T, PAD_B);

    // ── Vertical Grid Lines (Time in hours) ──────────────────────────────────
    for (let h = 0; h <= 24; h += 2) {
      const x = xOf(h * 60);

      ctx.strokeStyle = "#E2E8F0";
      ctx.lineWidth   = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(x, PAD_T);
      ctx.lineTo(x, H - PAD_B);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#64748B";
      ctx.font      = "10px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${String(h).padStart(2, "0")}:00`, x, H - PAD_B + 16);
    }

    // ── Horizontal Grid Lines (Stations & Chainage) ──────────────────────────
    for (const st of stations) {
      const y = yOf(st.chainage);

      ctx.strokeStyle = "#EDF2F7";
      ctx.lineWidth   = 1;
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.moveTo(PAD_L, y);
      ctx.lineTo(W - PAD_R, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#1E293B";
      ctx.font      = "bold 10px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText(st.code, PAD_L - 8, y + 3);

      ctx.fillStyle = "#94A3B8";
      ctx.font      = "9px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${st.chainage.toFixed(0)}k`, PAD_L - 8, y + 14);
    }

    // ── Rush Hour Curfew Bands ──────────────────────────────────────────────
    for (const rw of RUSH_WINDOWS) {
      const x1 = xOf(rw.startMin);
      const x2 = xOf(rw.endMin);

      ctx.fillStyle = "rgba(245, 158, 11, 0.10)";
      ctx.fillRect(x1, PAD_T, x2 - x1, H - PAD_T - PAD_B);

      ctx.strokeStyle = "rgba(217, 119, 6, 0.4)";
      ctx.lineWidth   = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x1, PAD_T);
      ctx.lineTo(x1, H - PAD_B);
      ctx.moveTo(x2, PAD_T);
      ctx.lineTo(x2, H - PAD_B);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#B45309";
      ctx.font      = "bold 9px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("⚡ RUSH CURFEW", (x1 + x2) / 2, PAD_T - 8);
    }

    // ── Scheduled Block Rectangles ──────────────────────────────────────────
    for (const block of scheduledBlocks) {
      const x1 = xOf(block.startMin);
      const x2 = xOf(block.endMin);
      const y1 = yOf(block.kmFrom);
      const y2 = yOf(block.kmTo);

      const primaryDept = block.departments[0] ?? "TMS";
      const color       = DEPT_COLORS[primaryDept] ?? "#64748B";

      // Fill
      ctx.fillStyle = block.isShadowBlock
        ? "rgba(220, 38, 38, 0.14)"
        : `${color}1A`;
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1);

      // Border
      ctx.strokeStyle = block.isShadowBlock ? "#DC2626" : color;
      ctx.lineWidth   = block.isShadowBlock ? 2 : 1.5;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      // Hatch pattern for shadow blocks
      if (block.isShadowBlock && x2 - x1 > 20) {
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = "rgba(220, 38, 38, 0.25)";
        ctx.lineWidth = 1;
        for (let hx = x1; hx < x2 + (y2 - y1); hx += 8) {
          ctx.beginPath();
          ctx.moveTo(hx, y1);
          ctx.lineTo(hx - (y2 - y1), y2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Label (departments badge)
      if (x2 - x1 > 40) {
        ctx.fillStyle = block.isShadowBlock ? "#991B1B" : color;
        ctx.font      = "bold 8px 'JetBrains Mono', monospace";
        ctx.textAlign = "left";
        const label   = block.departments.join("+") + (block.isShadowBlock ? " ◆" : "");
        ctx.fillText(label, x1 + 4, y1 + 12);

        ctx.fillStyle = "#475569";
        ctx.font      = "8px 'JetBrains Mono', monospace";
        ctx.fillText(`${block.startHHMM}–${block.endHHMM}`, x1 + 4, y1 + 22);
      }
    }

    // ── Train Trajectory Lines (with Midnight Wrap Discontinuity Fix) ────────
    for (const train of trains) {
      if (!train.stops || train.stops.length < 2) continue;
      const color = PRIORITY_COLORS[train.priority] ?? "#64748B";

      ctx.strokeStyle = color;
      ctx.lineWidth   = train.priority === 1 ? 2.5 : train.priority <= 2 ? 1.8 : 1.2;
      ctx.setLineDash(train.priority === 4 ? [6, 3] : []);

      const validStops = train.stops.filter(
        (s: TrainStop) => s.chainage != null && (s.arrivalMin != null || s.departureMin != null)
      );
      if (validStops.length < 2) continue;

      // Draw trajectory segments — avoid connecting across midnight
      ctx.beginPath();
      let lastMin: number | null = null;

      for (let i = 0; i < validStops.length; i++) {
        const stop = validStops[i];
        const rawMin = (stop.departureMin ?? stop.arrivalMin)!;
        const tMin = rawMin % 1440;
        const km   = stop.chainage!;
        const x    = xOf(tMin);
        const y    = yOf(km);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          // If time drops significantly (> 300 min decrease), it crossed midnight
          if (lastMin !== null && tMin < lastMin - 120) {
            // End segment at right boundary, start new subpath on left
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        lastMin = tMin;
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Train number label at origin stop
      const first = validStops[0];
      const ft    = (first.departureMin ?? first.arrivalMin)! % 1440;
      const lx    = xOf(ft);
      const ly    = yOf(first.chainage!);

      ctx.fillStyle = color;
      ctx.font      = "bold 9px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(train.number, lx + 4, ly - 4);

      // Node dots at each stop
      for (const stop of validStops) {
        const tMin = (stop.departureMin ?? stop.arrivalMin)! % 1440;
        const x    = xOf(tMin);
        const y    = yOf(stop.chainage!);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, train.priority === 1 ? 3 : 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── Axis Titles & Headers ───────────────────────────────────────────────
    ctx.fillStyle = "#64748B";
    ctx.font      = "10px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("TIME (IST) →", W / 2, H - 4);

    ctx.save();
    ctx.translate(14, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("CHAINAGE (km) →", 0, 0);
    ctx.restore();

    ctx.fillStyle = "#1A3C6E";
    ctx.font      = "bold 11px 'Inter', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("NDLS–LDH MASTER TIME-DISTANCE STRING CHART", PAD_L, 20);

    ctx.fillStyle = "#64748B";
    ctx.font      = "10px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillText(
      new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      W - PAD_R,
      20
    );

    ctx.restore();
  }, [stations, trains, scheduledBlocks, horizon, width, height, PAD_L, PAD_R, PAD_T, PAD_B]);

  useEffect(() => {
    draw();
  }, [draw]);

  // ── Hover Tooltip ─────────────────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const tooltip = tooltipRef.current;
      if (!canvas || !tooltip) return;

      const rect = canvas.getBoundingClientRect();
      const mx   = (e.clientX - rect.left) * (width / rect.width);
      const my   = (e.clientY - rect.top)  * (height / rect.height);

      const usableW = width - PAD_L - PAD_R;
      const usableH = height - PAD_T - PAD_B;

      // Check scheduled block hover
      let found = "";
      for (const block of scheduledBlocks) {
        const x1 = minToX(block.startMin, width, PAD_L, PAD_R);
        const x2 = minToX(block.endMin,   width, PAD_L, PAD_R);
        const y1 = kmToY(block.kmFrom, horizon, height, PAD_T, PAD_B);
        const y2 = kmToY(block.kmTo,   horizon, height, PAD_T, PAD_B);
        if (mx >= x1 && mx <= x2 && my >= y1 && my <= y2) {
          found = `${block.departments.join("+")} Block (${block.trackId} Track)\n${block.startHHMM}–${block.endHHMM} (${block.durationMinutes}m)\nkm ${block.kmFrom.toFixed(1)}–${block.kmTo.toFixed(1)}\nRisk: ${block.assetRisk}%${block.isShadowBlock ? "  ◆ SHADOW BUNDLE" : ""}\n\nXAI REASONING:\n${block.justification ?? "Optimized non-overlapping possession."}`;
          break;
        }
      }

      if (!found) {
        // Check train stop hover
        for (const train of trains) {
          for (const stop of train.stops ?? []) {
            if (stop.chainage == null) continue;
            const t = (stop.departureMin ?? stop.arrivalMin)!;
            const sx = minToX(t % 1440, width, PAD_L, PAD_R);
            const sy = kmToY(stop.chainage, horizon, height, PAD_T, PAD_B);
            if (Math.abs(mx - sx) < 8 && Math.abs(my - sy) < 8) {
              found = `${train.number} — ${train.name}\nP${train.priority} | ${stop.stationCode}\nArr: ${stop.arrivalHHMM ?? "—"}  Dep: ${stop.departureHHMM ?? "—"}`;
              break;
            }
          }
          if (found) break;
        }
      }

      if (found) {
        tooltip.style.display    = "block";
        tooltip.style.left       = `${e.clientX + 14}px`;
        tooltip.style.top        = `${e.clientY - 12}px`;
        tooltip.style.whiteSpace = "pre";
        tooltip.textContent      = found;
      } else {
        tooltip.style.display    = "none";
      }
    },
    [stations, trains, scheduledBlocks, horizon, width, height, PAD_L, PAD_R, PAD_T, PAD_B]
  );

  const handleMouseLeave = () => {
    const tooltip = tooltipRef.current;
    if (tooltip) tooltip.style.display = "none";
  };

  return (
    <div className="relative w-full bg-white rounded border border-gray-300 shadow-sm overflow-hidden">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5 px-4 py-2 bg-[#F8FAFC] border-b border-gray-200 text-xs font-mono text-gray-600">
        <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">LEGEND:</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-1 bg-emerald-600 rounded"/> P1 VIP</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-1 bg-blue-600 rounded"/> P2 Express</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-1 bg-purple-600 rounded"/> P3 MEMU</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-1 border-t border-dashed border-slate-500"/> P4 Freight</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3.5 h-3 border border-amber-600 bg-amber-100/60 rounded-xs"/> TMS Block</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3.5 h-3 border border-blue-600 bg-blue-100/60 rounded-xs"/> SMMS Block</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3.5 h-3 border-2 border-red-600 bg-red-100/60 rounded-xs"/> TDMS / Shadow</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3.5 h-3 bg-amber-100 border border-amber-500/50 rounded-xs"/> Rush Curfew</span>
      </div>

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-auto block"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: "crosshair" }}
      />

      {/* Light Theme Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 hidden bg-white border border-gray-300 rounded shadow-xl px-3 py-2
                   text-xs font-mono text-gray-800 pointer-events-none whitespace-pre
                   leading-relaxed max-w-sm"
      />
    </div>
  );
}
