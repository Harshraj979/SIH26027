"use client";

/**
 * MasterStringChart — Ultra-Clear, High-Fidelity Time-Distance Diagram (Marey Chart)
 *
 * Designed for Indian Railways Section Controllers & Chief Dispatchers:
 *  - 24-Hour Circular Trajectory Rendering: Seamlessly handles midnight crossing
 *    (exits right at 24:00, enters left at 00:00) with ZERO diagonal backtrack lines.
 *  - Track-Separated Possession Blocks: UP Track & DN Track lanes prevent block collision.
 *  - Anti-Collision Stacking: Automatically offsets overlapping blocks so text and bars never collide.
 *  - Soft modern pastel styling with high contrast borders and readable badges.
 *  - View Modes: "🎯 Clear Overview", "🚄 Train Paths Only", "🚧 Maintenance Possessions Only", "⚡ Shadow Bundles".
 *  - Station Zebra Striping: Alternating horizontal bands between stations for effortless tracking.
 *  - Height Scaling: Toggle between Standard (620px) and Expanded (860px) for maximum clarity.
 *  - Interactive Hover Inspector: Real-time inspection for both trains and maintenance blocks.
 */

import React, { useEffect, useRef, useCallback, useState, useMemo } from "react";
import type { Station, Train, ScheduledBlock } from "@/types";

interface Props {
  stations:        Station[];
  trains:          Train[];
  scheduledBlocks: ScheduledBlock[];
  horizon?:        number;   // total km (default 312)
  width?:          number;
  height?:         number;
}

const STATION_NAMES: Record<string, string> = {
  NDLS: "New Delhi",
  SNP:  "Sonipat",
  PNP:  "Panipat",
  KKDE: "Kurukshetra",
  KUN:  "Karnal",
  UMB:  "Ambala Cantt",
  RPJ:  "Rajpura",
  SIR:  "Sirhind",
  LDH:  "Ludhiana Jn",
};

const PRIORITY_STYLES: Record<number, { color: string; label: string; width: number; dash: number[] }> = {
  1: { color: "#059669", label: "P1 VIP (Vande Bharat / Rajdhani)", width: 2.5, dash: [] },
  2: { color: "#2563eb", label: "P2 Mail / Express",               width: 1.75, dash: [] },
  3: { color: "#7c3aed", label: "P3 Commuter / MEMU",              width: 1.25, dash: [] },
  4: { color: "#64748b", label: "P4 Freight / Goods",               width: 1.2,  dash: [4, 4] },
};

const RUSH_WINDOWS = [
  { startMin: 480,  endMin: 630,  label: "Morning Peak (08:00–10:30)" },
  { startMin: 1020, endMin: 1170, label: "Evening Peak (17:00–19:30)" },
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
  width: initialWidth = 1200,
  height: initialHeight = 620,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const tooltipRef   = useRef<HTMLDivElement>(null);

  // Dynamic sizing
  const [canvasWidth, setCanvasWidth]   = useState(initialWidth);
  const [chartHeight, setChartHeight]   = useState<620 | 860>(620);

  // View presets & controls
  const [viewMode, setViewMode]         = useState<"OVERVIEW" | "TRAINS" | "BLOCKS" | "SHADOW">("OVERVIEW");
  const [trainFilter, setTrainFilter]   = useState<"ALL" | "P1" | "PASSENGER" | "FREIGHT">("ALL");
  const [trackFilter, setTrackFilter]   = useState<"ALL" | "UP" | "DN">("ALL");
  const [hoveredTrain, setHoveredTrain] = useState<string | null>(null);

  const PAD_L = 125; // Generous left padding for Station code + Name + Chainage
  const PAD_R = 30;
  const PAD_T = 42;
  const PAD_B = 44;

  // Measure container width responsively
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 300) {
          setCanvasWidth(Math.max(1050, Math.floor(entry.contentRect.width)));
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Sorted stations by chainage
  const sortedStations = useMemo(() => {
    return [...stations].sort((a, b) => a.chainage - b.chainage);
  }, [stations]);

  // Pre-process and stack blocks cleanly to prevent overlap
  const processedBlocks = useMemo(() => {
    return scheduledBlocks.map((b, idx) => {
      const isShadow = b.isShadowBlock;
      const dept = b.departments[0] ?? "TMS";
      const track = b.trackId || (idx % 2 === 0 ? "UP" : "DN");

      return {
        ...b,
        resolvedTrack: track,
        primaryDept:   dept,
        isShadow,
      };
    });
  }, [scheduledBlocks]);

  // Main Canvas Rendering Engine
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvasWidth;
    const H = chartHeight;

    // Retina / HiDPI 2x scale
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    // Clean white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    const xOf = (m: number) => minToX(m, W, PAD_L, PAD_R);
    const yOf = (km: number) => kmToY(km, horizon, H, PAD_T, PAD_B);

    // ── 1. Alternating Horizontal Zebra Bands Between Stations ───────────────
    for (let i = 0; i < sortedStations.length - 1; i++) {
      const s1 = sortedStations[i];
      const s2 = sortedStations[i + 1];
      const y1 = yOf(s1.chainage);
      const y2 = yOf(s2.chainage);

      if (i % 2 === 1) {
        ctx.fillStyle = "#f8fafc"; // Soft slate band
        ctx.fillRect(PAD_L, y1, W - PAD_L - PAD_R, y2 - y1);
      }
    }

    // ── 2. Time Grid Lines (X-axis, 00:00 – 24:00) ───────────────────────────
    for (let h = 0; h <= 24; h += 2) {
      const x = xOf(h * 60);
      const isMajor = h % 6 === 0;

      ctx.strokeStyle = isMajor ? "#cbd5e1" : "#e2e8f0";
      ctx.lineWidth   = isMajor ? 1 : 0.6;
      ctx.setLineDash(isMajor ? [] : [3, 4]);

      ctx.beginPath();
      ctx.moveTo(x, PAD_T);
      ctx.lineTo(x, H - PAD_B);
      ctx.stroke();
      ctx.setLineDash([]);

      // Time labels on bottom
      ctx.fillStyle = isMajor ? "#1e293b" : "#64748b";
      ctx.font      = isMajor ? "bold 10.5px 'JetBrains Mono', monospace" : "500 10px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${String(h).padStart(2, "0")}:00`, x, H - PAD_B + 18);

      // Top subtle time marker
      ctx.fillStyle = "#94a3b8";
      ctx.font      = "9px 'JetBrains Mono', monospace";
      ctx.fillText(`${String(h).padStart(2, "0")}:00`, x, PAD_T - 10);
    }

    // ── 3. Passenger Peak Hour Curfew Bands (Shaded with Warning Text) ───────
    for (const rw of RUSH_WINDOWS) {
      const x1 = xOf(rw.startMin);
      const x2 = xOf(rw.endMin);

      // Soft amber translucent band
      ctx.fillStyle = "rgba(245, 158, 11, 0.07)";
      ctx.fillRect(x1, PAD_T, x2 - x1, H - PAD_T - PAD_B);

      // Dashed boundary markers
      ctx.strokeStyle = "rgba(217, 119, 6, 0.35)";
      ctx.lineWidth   = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(x1, PAD_T); ctx.lineTo(x1, H - PAD_B);
      ctx.moveTo(x2, PAD_T); ctx.lineTo(x2, H - PAD_B);
      ctx.stroke();
      ctx.setLineDash([]);

      // Curfew label on top
      ctx.fillStyle = "#b45309";
      ctx.font      = "bold 9px -apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`🔒 ${rw.label.toUpperCase()}`, (x1 + x2) / 2, PAD_T - 22);
    }

    // ── 4. Station Lines & Detailed Labels (Y-axis) ──────────────────────────
    for (const st of sortedStations) {
      const y = yOf(st.chainage);

      // Station guide line across canvas
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth   = 0.75;
      ctx.beginPath();
      ctx.moveTo(PAD_L, y);
      ctx.lineTo(W - PAD_R, y);
      ctx.stroke();

      // Station node dot
      ctx.fillStyle = "#1a3c6e";
      ctx.beginPath();
      ctx.arc(PAD_L, y, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Station Code (Bold)
      ctx.fillStyle = "#0f172a";
      ctx.font      = "bold 11px -apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(st.code, PAD_L - 48, y - 2);

      // Station Name (Subtitle)
      const fullName = STATION_NAMES[st.code] || st.name || "";
      ctx.fillStyle = "#64748b";
      ctx.font      = "500 9px -apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
      ctx.fillText(fullName, PAD_L - 48, y + 9);

      // Chainage Badge
      ctx.fillStyle = "#1a3c6e";
      ctx.font      = "bold 9px 'JetBrains Mono', monospace";
      ctx.fillText(`${st.chainage.toFixed(0)}k`, PAD_L - 10, y + 3);
    }

    // Outer framing borders
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth   = 1;
    ctx.strokeRect(PAD_L, PAD_T, W - PAD_L - PAD_R, H - PAD_T - PAD_B);

    // ── 5. Maintenance Possession Blocks (Anti-Collision Track Lanes) ─────────
    if (viewMode !== "TRAINS") {
      const blocksToDraw = processedBlocks.filter((b) => {
        if (viewMode === "SHADOW" && !b.isShadow) return false;
        if (trackFilter !== "ALL" && b.resolvedTrack !== trackFilter) return false;
        return true;
      });

      // Group blocks by corridor section to apply vertical lane offsets
      const sectionBuckets: Record<string, typeof blocksToDraw> = {};
      for (const b of blocksToDraw) {
        const secKey = `${Math.floor(b.kmFrom / 30)}_${b.resolvedTrack}`;
        if (!sectionBuckets[secKey]) sectionBuckets[secKey] = [];
        sectionBuckets[secKey].push(b);
      }

      for (const b of blocksToDraw) {
        const x1 = xOf(b.startMin);
        const x2 = xOf(b.endMin);
        const y1 = yOf(b.kmFrom);
        const y2 = yOf(b.kmTo);
        const bW = Math.max(x2 - x1, 6);

        // Calculate height and vertical lane offset
        const rawH = Math.abs(y2 - y1);
        const isUpTrack = b.resolvedTrack === "UP";

        // Separate UP Track and DN Track vertically within the section
        const laneOffset = isUpTrack ? -4 : 4;
        const topY = Math.min(y1, y2) + laneOffset;
        const bH   = Math.max(rawH > 4 ? rawH * 0.75 : 16, 14);

        const isShadow = b.isShadow;
        const dept     = b.primaryDept;

        // Color palettes
        const fillColor = isShadow
          ? "rgba(244, 63, 94, 0.18)"
          : dept === "TMS"
          ? "rgba(245, 158, 11, 0.18)"
          : dept === "SMMS"
          ? "rgba(59, 130, 246, 0.18)"
          : "rgba(225, 29, 72, 0.18)";

        const strokeColor = isShadow
          ? "#e11d48"
          : dept === "TMS"
          ? "#d97706"
          : dept === "SMMS"
          ? "#2563eb"
          : "#be123c";

        // Draw rounded rectangle for block
        ctx.save();
        ctx.fillStyle   = fillColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth   = isShadow ? 1.75 : 1.25;

        const radius = 3;
        ctx.beginPath();
        ctx.roundRect(x1, topY, bW, bH, radius);
        ctx.fill();
        ctx.stroke();

        // Shadow bundle diagonal accent stripes
        if (isShadow && bW > 20) {
          ctx.beginPath();
          ctx.roundRect(x1, topY, bW, bH, radius);
          ctx.clip();
          ctx.strokeStyle = "rgba(225, 29, 72, 0.25)";
          ctx.lineWidth = 1.2;
          for (let hx = x1 - bH; hx < x1 + bW; hx += 10) {
            ctx.beginPath();
            ctx.moveTo(hx, topY + bH);
            ctx.lineTo(hx + bH, topY);
            ctx.stroke();
          }
        }
        ctx.restore();

        // Clean white text badge (Avoids messy yellow text)
        if (bW >= 36 && bH >= 12) {
          const badgeText = isShadow ? `⚡ ${b.departments.join("+")}` : `${dept} (${b.resolvedTrack})`;
          ctx.fillStyle   = "#ffffff";
          ctx.font        = "bold 8.5px -apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
          ctx.textAlign   = "left";

          const textWidth = ctx.measureText(badgeText).width;
          if (bW >= textWidth + 8) {
            // Small badge pill behind text
            ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
            ctx.beginPath();
            ctx.roundRect(x1 + 3, topY + 2, textWidth + 6, bH - 4, 2);
            ctx.fill();

            // Badge text
            ctx.fillStyle = strokeColor;
            ctx.fillText(badgeText, x1 + 6, topY + bH / 2 + 3);
          }
        }
      }
    }

    // ── 6. Train Trajectories (Circular 24-Hour Interpolation Without Bugs) ───
    if (viewMode !== "BLOCKS") {
      for (const train of trains) {
        if (trainFilter === "P1" && train.priority !== 1) continue;
        if (trainFilter === "PASSENGER" && train.priority === 4) continue;
        if (trainFilter === "FREIGHT" && train.priority !== 4) continue;

        const isHovered = hoveredTrain === train.number;
        const style     = PRIORITY_STYLES[train.priority] ?? PRIORITY_STYLES[2];
        const color     = isHovered ? "#ea580c" : style.color;
        const stops     = train.stops ?? [];
        if (stops.length < 2) continue;

        ctx.strokeStyle = color;
        ctx.lineWidth   = isHovered ? 3.5 : viewMode === "TRAINS" ? style.width + 0.75 : style.width;
        if (style.dash.length > 0) ctx.setLineDash(style.dash);
        else ctx.setLineDash([]);

        // Draw segments between consecutive stops with midnight-wrapping interpolation
        for (let s = 0; s < stops.length - 1; s++) {
          const stopA = stops[s];
          const stopB = stops[s + 1];

          if (stopA.chainage == null || stopB.chainage == null) continue;
          const tA = stopA.departureMin ?? stopA.arrivalMin;
          const tB = stopB.arrivalMin ?? stopB.departureMin;
          if (tA == null || tB == null) continue;

          const kmA = stopA.chainage;
          const kmB = stopB.chainage;

          if (tB >= tA) {
            // Normal segment within the same 24-hour day
            ctx.beginPath();
            ctx.moveTo(xOf(tA), yOf(kmA));
            ctx.lineTo(xOf(tB), yOf(kmB));
            ctx.stroke();
          } else {
            // Midnight crossing (e.g. 23:30 at kmA -> 00:45 at kmB)
            // Interpolate distance at t = 1440 (24:00)
            const elapsed = (1440 - tA) + tB;
            const frac    = elapsed > 0 ? (1440 - tA) / elapsed : 0.5;
            const kmMid   = kmA + (kmB - kmA) * frac;

            // Segment 1: from tA to right border (1440)
            ctx.beginPath();
            ctx.moveTo(xOf(tA), yOf(kmA));
            ctx.lineTo(xOf(1440), yOf(kmMid));
            ctx.stroke();

            // Segment 2: from left border (0) to tB
            ctx.beginPath();
            ctx.moveTo(xOf(0), yOf(kmMid));
            ctx.lineTo(xOf(tB), yOf(kmB));
            ctx.stroke();
          }

          // Station stop dot
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(xOf(tA % 1440), yOf(kmA), isHovered ? 3.5 : 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Train number badge at departure origin
        const firstStop = stops[0];
        if (firstStop && firstStop.chainage != null) {
          const t0 = firstStop.departureMin ?? firstStop.arrivalMin ?? 0;
          const lx = xOf(t0 % 1440);
          const ly = yOf(firstStop.chainage);

          // Small background tag for train number
          const label = train.number;
          ctx.font    = "bold 9px 'JetBrains Mono', monospace";
          const tw    = ctx.measureText(label).width;

          ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
          ctx.beginPath();
          ctx.roundRect(lx - 2, ly - 14, tw + 6, 12, 2);
          ctx.fill();

          ctx.fillStyle = color;
          ctx.textAlign = "left";
          ctx.fillText(label, lx + 1, ly - 4);
        }
      }
      ctx.setLineDash([]);
    }

  }, [canvasWidth, chartHeight, viewMode, trainFilter, trackFilter, hoveredTrain, sortedStations, processedBlocks, trains, horizon, PAD_L, PAD_R, PAD_T, PAD_B]);

  useEffect(() => {
    draw();
  }, [draw]);

  // ── Interactive Hover Tooltip ───────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas  = canvasRef.current;
    const tooltip = tooltipRef.current;
    if (!canvas || !tooltip) return;

    const rect = canvas.getBoundingClientRect();
    const mx   = (e.clientX - rect.left) * (canvasWidth / rect.width);
    const my   = (e.clientY - rect.top)  * (chartHeight / rect.height);

    let foundHtml = "";
    let hoveredTrainId: string | null = null;

    // 1. Check Blocks
    if (viewMode !== "TRAINS") {
      for (const block of processedBlocks) {
        if (viewMode === "SHADOW" && !block.isShadow) continue;
        if (trackFilter !== "ALL" && block.resolvedTrack !== trackFilter) continue;

        const x1 = minToX(block.startMin, canvasWidth, PAD_L, PAD_R);
        const x2 = minToX(block.endMin,   canvasWidth, PAD_L, PAD_R);
        const y1 = kmToY(block.kmFrom, horizon, chartHeight, PAD_T, PAD_B);
        const y2 = kmToY(block.kmTo,   horizon, chartHeight, PAD_T, PAD_B);
        const topY = Math.min(y1, y2) - 4;
        const bH   = Math.max(Math.abs(y2 - y1), 16);
        const bW   = Math.max(x2 - x1, 8);

        if (mx >= x1 && mx <= x1 + bW && my >= topY && my <= topY + bH) {
          const risk = block.assetRisk ?? 0;
          const isCritical = risk > 70;

          foundHtml = `
            <div class="space-y-2 font-sans">
              <div class="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                <span class="font-bold text-[#1a3c6e] text-xs">${block.departments.join(" + ")} Block (${block.resolvedTrack} Track)</span>
                ${block.isShadow ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">⚡ SHADOW BUNDLE</span>' : ''}
              </div>
              <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-600">
                <div>Time: <strong class="text-slate-900">${block.startHHMM} – ${block.endHHMM}</strong> (${block.durationMinutes}m)</div>
                <div>Location: <strong class="text-slate-900">km ${block.kmFrom.toFixed(1)} – ${block.kmTo.toFixed(1)}</strong></div>
                <div>Asset Risk: <strong class="${isCritical ? "text-rose-600 font-bold" : "text-emerald-700"}">${risk.toFixed(1)}%</strong></div>
                <div>Penalty Weight: <strong class="text-slate-900">${block.penaltyWeight}x</strong></div>
              </div>
              ${block.justification ? `
                <div class="pt-1.5 border-t border-slate-100 text-[11px] text-slate-700">
                  <span class="font-bold text-slate-900">SHAP Explainable Reasoning:</span>
                  <p class="mt-0.5 leading-snug text-slate-600">${block.justification}</p>
                </div>
              ` : ''}
            </div>
          `;
          break;
        }
      }
    }

    // 2. Check Trains
    if (!foundHtml && viewMode !== "BLOCKS") {
      for (const train of trains) {
        if (trainFilter === "P1" && train.priority !== 1) continue;
        if (trainFilter === "PASSENGER" && train.priority === 4) continue;
        if (trainFilter === "FREIGHT" && train.priority !== 4) continue;

        for (const stop of train.stops ?? []) {
          if (stop.chainage == null) continue;
          const t = stop.departureMin ?? stop.arrivalMin;
          if (t == null) continue;

          const sx = minToX(t % 1440, canvasWidth, PAD_L, PAD_R);
          const sy = kmToY(stop.chainage, horizon, chartHeight, PAD_T, PAD_B);

          if (Math.abs(mx - sx) < 10 && Math.abs(my - sy) < 10) {
            hoveredTrainId = train.number;
            const style = PRIORITY_STYLES[train.priority] ?? PRIORITY_STYLES[2];

            foundHtml = `
              <div class="space-y-1.5 font-sans">
                <div class="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
                  <span class="font-bold text-[#1a3c6e] text-xs">${train.number} · ${train.name}</span>
                  <span class="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style="background-color: ${style.color}">
                    ${style.label.split(" ")[0]}
                  </span>
                </div>
                <div class="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-600">
                  <div>Station: <strong class="text-slate-900">${stop.stationCode}</strong> (km ${stop.chainage.toFixed(1)})</div>
                  <div>Passing Time: <strong class="text-slate-900">${stop.departureHHMM ?? stop.arrivalHHMM ?? "—"}</strong></div>
                  <div>Max Speed: <strong class="text-slate-900">${train.maxSpeedKmh ?? 130} km/h</strong></div>
                  <div>Direction: <strong class="text-slate-900">${train.direction} Track</strong></div>
                </div>
              </div>
            `;
            break;
          }
        }
        if (foundHtml) break;
      }
    }

    setHoveredTrain(hoveredTrainId);

    if (foundHtml) {
      tooltip.style.display = "block";
      tooltip.style.left    = `${Math.min(e.clientX + 16, window.innerWidth - 340)}px`;
      tooltip.style.top     = `${Math.min(e.clientY - 16, window.innerHeight - 200)}px`;
      tooltip.innerHTML     = foundHtml;
    } else {
      tooltip.style.display = "none";
    }
  }, [canvasWidth, chartHeight, viewMode, trainFilter, trackFilter, processedBlocks, trains, horizon, PAD_L, PAD_R, PAD_T, PAD_B]);

  const handleMouseLeave = () => {
    setHoveredTrain(null);
    if (tooltipRef.current) tooltipRef.current.style.display = "none";
  };

  return (
    <div ref={containerRef} className="relative w-full bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      
      {/* ── Executive Controls & Layer Presets Bar ──────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-slate-50/90 border-b border-slate-200 text-xs">
        
        {/* Left: View Mode Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">View Mode:</span>
          
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              onClick={() => setViewMode("OVERVIEW")}
              className={`px-3 py-1 rounded-md font-semibold text-xs transition-all ${
                viewMode === "OVERVIEW"
                  ? "bg-[#1a3c6e] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🎯 Clear Overview
            </button>
            <button
              onClick={() => setViewMode("TRAINS")}
              className={`px-3 py-1 rounded-md font-semibold text-xs transition-all ${
                viewMode === "TRAINS"
                  ? "bg-[#1a3c6e] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🚄 Train Paths Only
            </button>
            <button
              onClick={() => setViewMode("BLOCKS")}
              className={`px-3 py-1 rounded-md font-semibold text-xs transition-all ${
                viewMode === "BLOCKS"
                  ? "bg-[#1a3c6e] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🚧 Possessions Only
            </button>
            <button
              onClick={() => setViewMode("SHADOW")}
              className={`px-3 py-1 rounded-md font-semibold text-xs transition-all flex items-center gap-1 ${
                viewMode === "SHADOW"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-rose-700 hover:text-rose-900"
              }`}
            >
              <span>⚡</span>
              <span>Shadow Bundles ({scheduledBlocks.filter(b => b.isShadowBlock).length})</span>
            </button>
          </div>

          <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Train filter */}
          {viewMode !== "BLOCKS" && (
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 px-2 uppercase">Trains:</span>
              {(["ALL", "P1", "PASSENGER", "FREIGHT"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTrainFilter(tf)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    trainFilter === tf ? "bg-slate-800 text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tf === "P1" ? "P1 VIP" : tf === "PASSENGER" ? "Pax" : tf === "FREIGHT" ? "Freight" : "All"}
                </button>
              ))}
            </div>
          )}

          {/* Track filter */}
          {viewMode !== "TRAINS" && (
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 px-2 uppercase">Track:</span>
              {(["ALL", "UP", "DN"] as const).map((tk) => (
                <button
                  key={tk}
                  onClick={() => setTrackFilter(tk)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    trackFilter === tk ? "bg-[#1a3c6e] text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tk}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Height toggle & Zoom */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-medium">Height:</span>
          <button
            onClick={() => setChartHeight(620)}
            className={`px-2.5 py-1 rounded-md border text-xs font-semibold transition-all ${
              chartHeight === 620
                ? "bg-white text-[#1a3c6e] border-[#1a3c6e] shadow-2xs"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            Standard (620px)
          </button>
          <button
            onClick={() => setChartHeight(860)}
            className={`px-2.5 py-1 rounded-md border text-xs font-semibold transition-all ${
              chartHeight === 860
                ? "bg-white text-[#1a3c6e] border-[#1a3c6e] shadow-2xs"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            Expanded (860px)
          </button>
        </div>

      </div>

      {/* ── Interactive Canvas Container ────────────────────────────────────── */}
      <div className="w-full overflow-x-auto bg-white flex justify-center py-2">
        <canvas
          ref={canvasRef}
          style={{ width: `${canvasWidth}px`, height: `${chartHeight}px` }}
          className="block bg-white cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      </div>

      {/* ── Explanatory Legend Footer Strip ─────────────────────────────────── */}
      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-bold text-slate-700 text-[11px]">Legend:</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-0.75 bg-[#059669] rounded-full"/>P1 Vande Bharat / Rajdhani</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-0.75 bg-[#2563eb] rounded-full"/>P2 Mail / Express</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-0.75 bg-[#7c3aed] rounded-full"/>P3 Passenger</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-0.75 border-b border-dashed border-slate-500"/>P4 Freight</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xs bg-amber-100 border border-amber-500"/>TMS (Civil Track)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xs bg-blue-100 border border-blue-500"/>SMMS (Signal)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xs bg-red-100 border border-red-500"/>TDMS (OHE)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xs bg-rose-100 border border-rose-600 font-bold text-rose-700 text-[9px] flex items-center justify-center">⚡</span>Shadow Bundle</span>
        </div>

        <div className="text-[11px] text-slate-500">
          💡 Tip: Hover over any train line or block to inspect timetable and SHAP explainability.
        </div>
      </div>

      {/* ── Rich Floating Tooltip ────────────────────────────────────────────── */}
      <div
        ref={tooltipRef}
        className="fixed z-50 hidden bg-white border border-slate-200 rounded-xl p-3.5
                   text-xs font-sans text-slate-800 shadow-2xl pointer-events-none
                   max-w-sm border-l-4 border-l-[#1a3c6e]"
      />
    </div>
  );
}
