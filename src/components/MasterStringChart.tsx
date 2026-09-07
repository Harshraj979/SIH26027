"use client";

/**
 * MasterStringChart — Interactive Time-Distance String Chart
 *
 * X-axis: Time (00:00 – 24:00)
 * Y-axis: Distance (km) — 0 at top (NDLS) → 312 at bottom (LDH)
 *
 * Renders:
 *  - Train trajectory lines (color-coded by priority)
 *  - Scheduled maintenance block rectangles (shaded hazard zones)
 *  - Rush-hour curfew bands (amber shading)
 *  - Shadow Block callouts
 *  - Hoverable tooltips for all elements
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
  1: "#10B981",  // Emerald — VIP/P1
  2: "#60A5FA",  // Blue   — Mail/Express
  3: "#A78BFA",  // Purple — Commuter MEMU
  4: "#6B7280",  // Gray   — Freight
};

const DEPT_COLORS: Record<string, string> = {
  TMS:  "#F59E0B",  // Amber — Civil/Track
  SMMS: "#3B82F6",  // Blue  — Signalling
  TDMS: "#EF4444",  // Red   — Traction OHE
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

function hhmm(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function MasterStringChart({
  stations,
  trains,
  scheduledBlocks,
  horizon = 312,
  width   = 1200,
  height  = 680,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const PAD_L = 72;
  const PAD_R = 20;
  const PAD_T = 36;
  const PAD_B = 48;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Clear
    ctx.fillStyle = "#0B0F17";
    ctx.fillRect(0, 0, W, H);

    const xOf = (m: number) => minToX(m, W, PAD_L, PAD_R);
    const yOf = (km: number) => kmToY(km, horizon, H, PAD_T, PAD_B);

    // ── Grid Lines (time) ────────────────────────────────────────────────
    ctx.strokeStyle = "#1F2937";
    ctx.lineWidth   = 1;
    ctx.setLineDash([2, 4]);
    for (let h = 0; h <= 24; h += 2) {
      const x = xOf(h * 60);
      ctx.beginPath(); ctx.moveTo(x, PAD_T); ctx.lineTo(x, H - PAD_B); ctx.stroke();

      ctx.fillStyle = "#4B5563";
      ctx.font      = "10px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${String(h).padStart(2, "0")}:00`, x, H - PAD_B + 14);
    }
    ctx.setLineDash([]);

    // ── Grid Lines (stations / km) ───────────────────────────────────────
    for (const st of stations) {
      const y = yOf(st.chainage);
      ctx.strokeStyle = "#1F2937";
      ctx.lineWidth   = 1;
      ctx.setLineDash([2, 6]);
      ctx.beginPath(); ctx.moveTo(PAD_L, y); ctx.lineTo(W - PAD_R, y); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#9CA3AF";
      ctx.font      = "10px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${st.code}`, PAD_L - 6, y + 4);

      ctx.fillStyle = "#4B5563";
      ctx.font      = "9px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${st.chainage.toFixed(0)}`, PAD_L - 6, y + 15);
    }

    // ── Rush Hour Curfew Bands ────────────────────────────────────────────
    for (const rw of RUSH_WINDOWS) {
      const x1 = xOf(rw.startMin);
      const x2 = xOf(rw.endMin);
      ctx.fillStyle = "rgba(245, 158, 11, 0.07)";
      ctx.fillRect(x1, PAD_T, x2 - x1, H - PAD_T - PAD_B);
      ctx.strokeStyle = "rgba(245, 158, 11, 0.3)";
      ctx.lineWidth   = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(x1, PAD_T); ctx.lineTo(x1, H - PAD_B); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, PAD_T); ctx.lineTo(x2, H - PAD_B); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(245, 158, 11, 0.5)";
      ctx.font      = "9px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("⚡ RUSH CURFEW", (x1 + x2) / 2, PAD_T - 6);
    }

    // ── Scheduled Block Rectangles ────────────────────────────────────────
    for (const block of scheduledBlocks) {
      const x1 = xOf(block.startMin);
      const x2 = xOf(block.endMin);
      const y1 = yOf(block.kmFrom);
      const y2 = yOf(block.kmTo);

      const primaryDept = block.departments[0] ?? "TMS";
      const color       = DEPT_COLORS[primaryDept] ?? "#6B7280";

      // Fill
      ctx.fillStyle = block.isShadowBlock
        ? "rgba(239, 68, 68, 0.18)"
        : `${color}22`;
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1);

      // Border
      ctx.strokeStyle = block.isShadowBlock ? "#EF4444" : color;
      ctx.lineWidth   = block.isShadowBlock ? 2 : 1.5;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      // Hatch pattern for shadow blocks
      if (block.isShadowBlock && x2 - x1 > 20) {
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = "rgba(239, 68, 68, 0.3)";
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
      if (x2 - x1 > 50) {
        ctx.fillStyle = color;
        ctx.font      = "8px 'JetBrains Mono', monospace";
        ctx.textAlign = "left";
        const label   = block.departments.join("+") + (block.isShadowBlock ? " ◆" : "");
        ctx.fillText(label, x1 + 3, y1 + 11);
        ctx.fillStyle = "#9CA3AF";
        ctx.font      = "8px 'JetBrains Mono', monospace";
        ctx.fillText(`${block.startHHMM}–${block.endHHMM}`, x1 + 3, y1 + 21);
      }
    }

    // ── Train Trajectory Lines ────────────────────────────────────────────
    for (const train of trains) {
      if (!train.stops || train.stops.length < 2) continue;
      const color = PRIORITY_COLORS[train.priority] ?? "#9CA3AF";

      ctx.strokeStyle = color;
      ctx.lineWidth   = train.priority === 1 ? 2.5 : train.priority <= 2 ? 1.8 : 1.2;
      ctx.setLineDash(train.priority === 4 ? [6, 3] : []);

      // Draw line through stops (time → km)
      const validStops = train.stops.filter(
        (s: TrainStop) => s.chainage != null && (s.arrivalMin != null || s.departureMin != null)
      );

      if (validStops.length < 2) continue;

      ctx.beginPath();
      validStops.forEach((stop: TrainStop, i: number) => {
        const tMin = (stop.departureMin ?? stop.arrivalMin)!;
        const km   = stop.chainage!;
        const x    = xOf(tMin % 1440);
        const y    = yOf(km);
        if (i === 0) ctx.moveTo(x, y);
        else         ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Train number label at first stop
      const first = validStops[0];
      const ft    = (first.departureMin ?? first.arrivalMin)! % 1440;
      const lx    = xOf(ft);
      const ly    = yOf(first.chainage!);

      ctx.fillStyle   = color;
      ctx.font        = "9px 'JetBrains Mono', monospace";
      ctx.textAlign   = "left";
      ctx.shadowColor = "#0B0F17";
      ctx.shadowBlur  = 3;
      ctx.fillText(train.number, lx + 3, ly - 4);
      ctx.shadowBlur  = 0;

      // Dot at each stop
      for (const stop of validStops) {
        const tMin = (stop.departureMin ?? stop.arrivalMin)! % 1440;
        const x    = xOf(tMin);
        const y    = yOf(stop.chainage!);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, train.priority === 1 ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── Axis Labels ───────────────────────────────────────────────────────
    ctx.fillStyle   = "#6B7280";
    ctx.font        = "10px 'Inter', sans-serif";
    ctx.textAlign   = "center";
    ctx.fillText("TIME (IST) →", W / 2, H - 4);

    ctx.save();
    ctx.translate(12, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("CHAINAGE (km) →", 0, 0);
    ctx.restore();

    // ── Chart Title ───────────────────────────────────────────────────────
    ctx.fillStyle = "#D1D5DB";
    ctx.font      = "bold 11px 'Inter', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("NDLS–LDH MASTER TIME-DISTANCE STRING CHART", PAD_L, 20);

    ctx.fillStyle = "#6B7280";
    ctx.font      = "10px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillText(`${new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}`, W - PAD_R, 20);

  }, [stations, trains, scheduledBlocks, horizon, PAD_L, PAD_R, PAD_T, PAD_B]);

  useEffect(() => {
    draw();
  }, [draw]);

  // ── Tooltip on mouse hover ────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const tooltip = tooltipRef.current;
    if (!canvas || !tooltip) return;

    const rect = canvas.getBoundingClientRect();
    const mx   = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my   = (e.clientY - rect.top)  * (canvas.height / rect.height);

    const W = canvas.width;
    const H = canvas.height;
    const usableW = W - PAD_L - PAD_R;
    const usableH = H - PAD_T - PAD_B;

    const timeMin = ((mx - PAD_L) / usableW) * 1440;
    const km      = ((my - PAD_T) / usableH) * horizon;

    // Check if hovering over a scheduled block
    let found = "";
    for (const block of scheduledBlocks) {
      const x1 = minToX(block.startMin, W, PAD_L, PAD_R);
      const x2 = minToX(block.endMin,   W, PAD_L, PAD_R);
      const y1 = kmToY(block.kmFrom, horizon, H, PAD_T, PAD_B);
      const y2 = kmToY(block.kmTo,   horizon, H, PAD_T, PAD_B);
      if (mx >= x1 && mx <= x2 && my >= y1 && my <= y2) {
        found = `${block.departments.join("+")} Block (${block.trackId} Track)\n${block.startHHMM}–${block.endHHMM} (${block.durationMinutes}m)\nkm ${block.kmFrom.toFixed(1)}–${block.kmTo.toFixed(1)}\nRisk: ${block.assetRisk}%${block.isShadowBlock ? "  ◆ SHADOW BUNDLE" : ""}\n\nXAI REASONING:\n${block.justification ?? "Optimized non-overlapping possession."}`;
        break;
      }
    }

    if (!found) {
      // Check train proximity
      for (const train of trains) {
        for (const stop of train.stops ?? []) {
          if (stop.chainage == null) continue;
          const t = (stop.departureMin ?? stop.arrivalMin)!;
          const sx = minToX(t % 1440, W, PAD_L, PAD_R);
          const sy = kmToY(stop.chainage, horizon, H, PAD_T, PAD_B);
          if (Math.abs(mx - sx) < 8 && Math.abs(my - sy) < 8) {
            found = `${train.number} — ${train.name}\nP${train.priority} | ${stop.stationCode}\nArr: ${stop.arrivalHHMM ?? "—"} Dep: ${stop.departureHHMM ?? "—"}`;
            break;
          }
        }
        if (found) break;
      }
    }

    if (found) {
      tooltip.style.display  = "block";
      tooltip.style.left     = `${e.clientX + 12}px`;
      tooltip.style.top      = `${e.clientY - 10}px`;
      tooltip.style.whiteSpace = "pre";
      tooltip.textContent    = found;
    } else {
      tooltip.style.display = "none";
    }
  }, [stations, trains, scheduledBlocks, horizon, PAD_L, PAD_R, PAD_T, PAD_B]);

  const handleMouseLeave = () => {
    const tooltip = tooltipRef.current;
    if (tooltip) tooltip.style.display = "none";
  };

  return (
    <div className="relative w-full bg-[#0B0F17] rounded border border-slate-800">
      {/* Legend */}
      <div className="flex items-center gap-6 px-4 pt-3 pb-1 border-b border-slate-800 text-xs font-mono text-slate-400">
        <span className="text-slate-600">LEGEND:</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-0.5 bg-emerald-500 rounded"/>&nbsp;P1 VIP</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-0.5 bg-blue-400 rounded"/>&nbsp;P2 Mail/SF</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-0.5 bg-purple-400 rounded"/>&nbsp;P3 MEMU</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-0.5 border-t border-dashed border-gray-500"/>&nbsp;P4 Freight</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-3 border border-amber-500 bg-amber-900/20 rounded-sm"/>&nbsp;TMS Block</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-3 border border-blue-500 bg-blue-900/20 rounded-sm"/>&nbsp;SMMS Block</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-3 border-2 border-red-500 bg-red-900/20 rounded-sm"/>&nbsp;TDMS / Shadow</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-3 bg-amber-900/30 border border-amber-600/40 rounded-sm"/>&nbsp;Rush Curfew</span>
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

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 hidden bg-[#111827] border border-slate-700 rounded px-3 py-2
                   text-xs font-mono text-slate-200 shadow-xl pointer-events-none whitespace-pre
                   leading-relaxed max-w-xs"
      />
    </div>
  );
}
