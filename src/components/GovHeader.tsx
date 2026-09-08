"use client";

import React from "react";
import type { User } from "@/types/auth";
import { ROLE_LABELS, ROLE_BADGE_COLORS } from "@/types/auth";
import { useAuth } from "@/context/AuthContext";

interface Props {
  onLogout: () => void;
}

export default function GovHeader({ onLogout }: Props) {
  const { user } = useAuth();

  return (
    <header className="w-full shrink-0 shadow-sm">
      {/* India tricolor top bar */}
      <div
        className="h-1.5 w-full"
        style={{
          background:
            "linear-gradient(90deg, #FF9933 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%)",
        }}
      />

      {/* Ministry Banner */}
      <div className="bg-[#003087] text-white px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Chakra */}
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0">
            <svg viewBox="0 0 100 100" className="w-7 h-7">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#FF9933" strokeWidth="7"/>
              <circle cx="50" cy="50" r="8" fill="#000080"/>
              {Array.from({ length: 24 }).map((_, i) => {
                const rad = (i * 15 * Math.PI) / 180;
                return (
                  <line
                    key={i}
                    x1={50 + 10 * Math.cos(rad)} y1={50 + 10 * Math.sin(rad)}
                    x2={50 + 38 * Math.cos(rad)} y2={50 + 38 * Math.sin(rad)}
                    stroke="#000080" strokeWidth="1.8"
                  />
                );
              })}
            </svg>
          </div>
          <div className="leading-tight">
            <p className="text-[10px] text-blue-200">भारत सरकार · Government of India</p>
            <p className="text-sm font-bold">Ministry of Railways — रेल मंत्रालय</p>
            <p className="text-[10px] text-blue-300">Indian Railways · Northern Railway, Delhi Division</p>
          </div>
        </div>

        {/* Right: LIVE indicator + user info */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Data status */}
          <div className="hidden sm:flex items-center gap-1.5 bg-blue-900/50 border border-blue-600/40 rounded px-2 py-1 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"/>
            <span className="text-amber-300 font-semibold">SIMULATED DATA</span>
          </div>
          
          {/* Time */}
          <div className="hidden md:block text-[11px] text-blue-300 tabular-nums">
            {new Date().toLocaleString("en-IN", {
              day:    "2-digit",
              month:  "short",
              year:   "numeric",
              hour:   "2-digit",
              minute: "2-digit",
              hour12: true,
            })} IST
          </div>
        </div>
      </div>

      {/* System name bar + user bar */}
      <div className="bg-[#1a3c6e] text-white px-4 py-2 flex items-center justify-between gap-4 border-t border-blue-800">
        <div>
          <h1 className="text-sm font-bold leading-tight">
            Automatic Block Planning &amp; Scheduling System
          </h1>
          <p className="text-[11px] text-blue-300">
            NDLS – UMB – LDH · 312 km Double Line · AI-Powered Multi-Agent Optimizer (SIH26027)
          </p>
        </div>

        {/* Logged in user */}
        {user && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold">{user.name}</p>
              <p className="text-[10px] text-blue-300">{user.designation}</p>
            </div>
            <div className={`text-[10px] font-bold px-2 py-1 rounded border ${ROLE_BADGE_COLORS[user.role]}`}>
              {ROLE_LABELS[user.role]}
            </div>
            <button
              id="logout-btn"
              onClick={onLogout}
              className="text-[11px] px-2.5 py-1 border border-blue-400/50 text-blue-200 hover:bg-white/10 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
