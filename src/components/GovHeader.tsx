"use client";

/**
 * GovHeader — Executive Indian Railways Blue Navigation Header
 * 
 * Styled in Indian Railways Deep Navy Blue (#1a3c6e) with strict non-scrollable layout:
 *  - Left Side: Emblem, RailBlock AI title, Northern Railway Delhi Division identity
 *  - Right Side (Docked to far right edge with ml-auto):
 *      1. Status pill: "Double Line Active | 312 km Mainline | 100% P1 Protected"
 *      2. Live IST Clock: e.g. "09:41 pm IST" / "Thu, 10 Sept"
 *      3. User Profile: Avatar "PS", Name "Priya Sharma", Designation "Divisional Railway Manager — Delhi", Role badge "Divisional Railway Manager"
 *      4. "Sign out" button on the far right
 *  - Non-scrollable: Fits comfortably on all screens without horizontal scrollbars.
 */

import React, { useEffect, useState } from "react";
import { ROLE_LABELS } from "@/types/auth";
import { useAuth } from "@/context/AuthContext";

interface Props {
  onLogout: () => void;
}

export default function GovHeader({ onLogout }: Props) {
  const { user } = useAuth();

  const [timeStr, setTimeStr] = useState("09:41 pm IST");
  const [dateStr, setDateStr] = useState("Thu, 10 Sept");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "pm" : "am";
      const formattedHours = String(hours % 12 || 12).padStart(2, "0");
      setTimeStr(`${formattedHours}:${minutes} ${ampm} IST`);

      const weekday = now.toLocaleDateString("en-IN", { weekday: "short" });
      const day = now.getDate();
      const month = now.toLocaleDateString("en-IN", { month: "short" });
      setDateStr(`${weekday}, ${day} ${month}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const displayName = user?.name || "Priya Sharma";
  const displayDesignation = user?.designation || "Divisional Railway Manager — Delhi";
  const displayRole = user?.role ? ROLE_LABELS[user.role] : "Divisional Railway Manager";

  // Extract clean initials excluding titles like Sh., Smt., Er., Dr.
  const initials = displayName
    .replace(/^(Sh\.|Smt\.|Er\.|Dr\.)\s*/i, "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "IR";

  return (
    <header 
      className="w-full shrink-0 text-white shadow-xl select-none overflow-hidden border-b border-black/40"
      style={{
        backgroundColor: "#000085",
        backgroundImage: "linear-gradient(180deg, rgba(0, 0, 0, 0.22) 0%, rgba(0, 0, 0, 0) 22%, rgba(0, 0, 0, 0) 78%, rgba(0, 0, 0, 0.25) 100%)",
      }}
    >
      {/* Indian Tricolor top accent bar */}
      <div
        className="h-1 w-full shrink-0"
        style={{
          background:
            "linear-gradient(90deg, #FF9933 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%)",
        }}
      />

      {/* Main Header Row — Strictly Non-Scrollable (overflow-hidden, perfectly fitted) */}
      <div className="w-full px-3.5 sm:px-5 py-2 flex items-center justify-between gap-2 sm:gap-4 overflow-hidden">
        
        {/* ── LEFT SIDE: Branding, Emblem & Corridor Identity ───────────────── */}
        <div className="flex items-center gap-2.5 shrink min-w-0">
          {/* Emblem / Ashok Chakra */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-xs">
            <svg viewBox="0 0 100 100" className="w-5 h-5 sm:w-6 sm:h-6">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#FF9933" strokeWidth="6" />
              <circle cx="50" cy="50" r="8" fill="#ffffff" />
              {Array.from({ length: 24 }).map((_, i) => {
                const rad = (i * 15 * Math.PI) / 180;
                return (
                  <line
                    key={i}
                    x1={50 + 10 * Math.cos(rad)}
                    y1={50 + 10 * Math.sin(rad)}
                    x2={50 + 38 * Math.cos(rad)}
                    y2={50 + 38 * Math.sin(rad)}
                    stroke="#ffffff"
                    strokeWidth="1.8"
                  />
                );
              })}
            </svg>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1 shrink-0">
                <span>RailBlock</span>
                <span className="text-[#FF9933] font-black text-xs px-1 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">AI</span>
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-white/15 text-blue-100 border border-white/20 whitespace-nowrap shrink-0">
                Northern Railway · Delhi
              </span>
            </div>
            <p className="text-[10.5px] text-blue-100/75 font-medium truncate max-w-[180px] sm:max-w-[260px] lg:max-w-md">
              Corridor Optimizer · NDLS – LDH (312 km)
            </p>
          </div>
        </div>

        {/* ── RIGHT SIDE: Status, Clock, User Profile & Sign Out (Docked to Right) ── */}
        <div className="ml-auto flex items-center justify-end gap-2 sm:gap-3 shrink-0">
          
          {/* 1. Double Line Active | 312 km Mainline | 100% P1 Protected */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 border border-white/20 rounded-full px-2.5 sm:px-3 py-1 text-[11px] text-white shadow-2xs whitespace-nowrap shrink-0">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-semibold text-white">Double Line Active</span>
            </div>
            <span className="text-white/40">|</span>
            <span className="text-blue-100">312 km</span>
            <span className="text-white/40">|</span>
            <span className="text-emerald-300 font-semibold">100% P1</span>
          </div>

          {/* Vertical Divider */}
          <div className="h-5 w-px bg-white/20 shrink-0 hidden md:block" />

          {/* 2. Clock & Date */}
          <div className="flex flex-col items-end text-right shrink-0">
            <span className="text-xs font-bold text-white tabular-nums tracking-wide whitespace-nowrap leading-tight">
              {timeStr}
            </span>
            <span className="text-[10px] text-blue-200 whitespace-nowrap leading-tight">
              {dateStr}
            </span>
          </div>

          {/* Vertical Divider */}
          <div className="h-5 w-px bg-white/20 shrink-0" />

          {/* 3. User Avatar & Details */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Avatar Pill with Initials */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-[#08182f] font-black flex items-center justify-center text-xs shadow-sm border border-white/30 shrink-0">
              {initials}
            </div>

            {/* Name and Designation */}
            <div className="flex flex-col text-left whitespace-nowrap">
              <span className="text-xs font-bold text-white tracking-tight leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-blue-200 font-medium leading-tight">
                {displayDesignation}
              </span>
            </div>

            {/* Role Badge */}
            <div className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-blue-100 border border-white/25 whitespace-nowrap hidden lg:block">
              {user?.department ? `${user.department} · ` : ""}{displayRole}
            </div>
          </div>

          {/* 4. Sign Out button on the far right */}
          <button
            id="logout-btn"
            onClick={onLogout}
            className="text-xs font-semibold px-2.5 py-1 text-white bg-white/10 hover:bg-white/20 active:bg-white/25 rounded-md border border-white/25 transition-all flex items-center gap-1 shadow-2xs cursor-pointer shrink-0 whitespace-nowrap ml-0.5"
            title="Sign out"
          >
            <span>Sign out</span>
            <span className="text-[10px]">↳</span>
          </button>

        </div>

      </div>
    </header>
  );
}
