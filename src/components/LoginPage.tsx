"use client";

/**
 * RailBlock AI — Unified Indian Railways Departmental Gateway
 * Cleaned, Authentic & Dignified Ministry Portal:
 * - 1-Click Role Login with Zero Exposed Passwords
 * - Custom RailBlock AI Railway Insignia (Compliant with State Emblem Act)
 * - Softened Badges: "Simulated RBAC Environment"
 * - Live IST Clock & Northern Railway Corridor Status
 */

import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";

export interface DemoRoleProfile {
  id: string;
  deptKey: "COA" | "TMS" | "TDMS" | "SMMS";
  name: string;
  hindiName: string;
  officer: string;
  designation: string;
  division: string;
  badgeClass: string;
  accentColor: string;
  icon: string;
  scopeSummary: string;
  empId: string;
  secret: string;
}

const DEMO_ROLES: DemoRoleProfile[] = [
  {
    id: "role-coa",
    deptKey: "COA",
    name: "COA — Central Controller",
    hindiName: "केंद्रीय नियंत्रण कक्ष (प्रशासक)",
    officer: "Sh. Niyati Joshi",
    designation: "Chief Section Controller (DOM Office, DLI)",
    division: "Delhi Division (NR)",
    badgeClass: "bg-purple-100 text-purple-900 border-purple-300",
    accentColor: "#9333ea",
    icon: "🎛️",
    scopeSummary: "Central Administrator Brain: CP-SAT optimization execution, corridor balancing scale, 312 km spatial map, and conflict-free schedule ratification.",
    empId: "EMP-CTRL-001",
    secret: "ctrl@123",
  },
  {
    id: "role-tms",
    deptKey: "TMS",
    name: "TMS — Civil Engineering",
    hindiName: "इंजीनियरिंग विभाग (पी-वे)",
    officer: "Sh. Harsh Savalia",
    designation: "Sr. Divisional Engineer / P-Way (DLI)",
    division: "Delhi Division (NR)",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
    accentColor: "#d97706",
    icon: "🛤️",
    scopeSummary: "Track Management System: Rail fractures, deep ballast screening (BCM), USFD ultrasonic flaw detection, and TQI track geometry maintenance.",
    empId: "EMP-ENG-8821",
    secret: "eng@123",
  },
  {
    id: "role-tdms",
    deptKey: "TDMS",
    name: "TDMS — 25kV Traction / OHE",
    hindiName: "विद्युत कर्षण वितरण विभाग",
    officer: "Er. Mann Butani",
    designation: "Divisional Electrical Engineer / TRD",
    division: "Delhi Division (NR)",
    badgeClass: "bg-rose-100 text-rose-900 border-rose-300",
    accentColor: "#e11d48",
    icon: "⚡",
    scopeSummary: "Traction Distribution System: 25kV AC overhead catenary power blocks, permit-to-work (PTW) clearances, insulator replacements, and tower wagon scheduling.",
    empId: "EMP-TRD-9032",
    secret: "trd@123",
  },
  {
    id: "role-smms",
    deptKey: "SMMS",
    name: "SMMS — Signalling & Telecom",
    hindiName: "सिग्नल एवं दूरसंचार विभाग",
    officer: "Smt. Khush Patel",
    designation: "Sr. DSTE / Signalling (Delhi Division)",
    division: "Delhi Division (NR)",
    badgeClass: "bg-blue-100 text-blue-900 border-blue-300",
    accentColor: "#2563eb",
    icon: "📡",
    scopeSummary: "Signal Maintenance System: SIL-4 electronic interlocking, point machine motor overhauls, digital axle counter (DAC) calibrations, and signal units.",
    empId: "EMP-ST-4419",
    secret: "st@123",
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<DemoRoleProfile>(DEMO_ROLES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Optional manual login state (hidden behind an accordion for clean UI)
  const [showManualLogin, setShowManualLogin] = useState(false);
  const [manualEmpId, setManualEmpId] = useState("");
  const [manualPass, setManualPass] = useState("");

  // Live IST Clock
  const [timeStr, setTimeStr] = useState("19:39:00 IST");
  const [dateStr, setDateStr] = useState("Fri, 11 Sept, 2026");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      setTimeStr(`${hours}:${minutes}:${seconds} IST`);

      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
      setDateStr(`${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}, ${now.getFullYear()}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOneClickLogin = (role: DemoRoleProfile) => {
    setError(null);
    setLoading(true);
    setTimeout(() => {
      const ok = login(role.empId, role.secret);
      if (!ok) {
        setError("Unable to authenticate session. Please try again.");
        setLoading(false);
      }
    }, 280);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setTimeout(() => {
      const ok = login(manualEmpId.trim(), manualPass);
      if (!ok) {
        setError("Invalid Employee ID or Password. Please try selecting a role from the quick access menu above.");
        setLoading(false);
      }
    }, 350);
  };

  return (
    <div className="min-h-screen bg-[#f1f4f9] text-slate-800 flex flex-col font-sans selection:bg-[#000085] selection:text-white antialiased">
      
      {/* ── 1. Top Government Information Strip ───────────────────────────── */}
      <div className="bg-[#00005a] text-white text-[11px] py-1.5 px-4 sm:px-8 border-b border-[#000045] flex flex-wrap items-center justify-between gap-y-1 select-none">
        <div className="flex items-center gap-2 font-medium tracking-wide">
          <span className="text-[#ffba00] font-bold">भारत सरकार • रेल मंत्रालय</span>
          <span className="text-white/40">|</span>
          <span className="text-slate-100 uppercase text-[10.5px]">
            GOVERNMENT OF INDIA • MINISTRY OF RAILWAYS • CORRIDOR BLOCK OPTIMIZER
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-200 ml-auto text-[10.5px]">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-[#ffba00] font-bold">{timeStr}</span>
            <span className="text-slate-300">({dateStr})</span>
          </div>
          <span className="text-white/40">|</span>
          <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Northern Railway (DLI Division) Active</span>
          </div>
        </div>
      </div>

      {/* ── 2. Brand Header with Custom RailBlock AI Insignia ─────────────── */}
      <header className="bg-[#000075] text-white py-3.5 px-4 sm:px-8 shadow-md border-b border-[#000095]">
        <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            {/* Custom RailBlock AI Insignia Badge */}
            <div className="w-12 h-12 rounded-xl bg-white/10 border-2 border-[#ffba00] p-1 shadow-md flex items-center justify-center shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                <circle cx="50" cy="50" r="44" stroke="#ffba00" strokeWidth="3" />
                <path d="M50 14 L50 28 M34 22 L66 22" stroke="#ffba00" strokeWidth="2.5" strokeLinecap="round" />
                <polygon points="50,20 54,26 50,32 46,26" fill="#ffba00" />
                <path d="M36 84 L44 40 M64 84 L56 40" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                <line x1="39" y1="74" x2="61" y2="74" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                <line x1="42" y1="62" x2="58" y2="62" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                <line x1="44" y1="50" x2="56" y2="50" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                <path d="M46 42 Q50 36 54 42 L56 56 Q50 60 44 56 Z" fill="#ffba00" opacity="0.95" />
              </svg>
            </div>

            <div>
              <p className="text-[11px] font-bold text-[#ffba00] tracking-wider uppercase flex items-center gap-1.5">
                <span>भारतीय रेल</span>
                <span className="text-white/40">•</span>
                <span>INDIAN RAILWAYS</span>
              </p>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none mt-0.5 flex items-center gap-2">
                <span>RailBlock AI</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/15 text-blue-100 border border-white/20 px-2 py-0.5 rounded">
                  Corridor Portal
                </span>
              </h1>
              <p className="text-[11px] text-blue-100/90 font-medium mt-1 leading-tight hidden sm:block">
                स्वचालित ब्लॉक नियोजन एवं गलियारा अनुरक्षण प्रबंधन प्रणाली • NDLS–UMB–LDH Mainline (312 km)
              </p>
            </div>
          </div>

          {/* Right Status Pill */}
          <div className="flex items-center gap-2.5 ml-auto text-xs">
            <div className="flex items-center gap-1.5 bg-[#00005a] border border-blue-400/40 rounded-lg px-3 py-1.5 text-white font-medium shadow-xs">
              <span className="text-[#ffba00]">🛡️</span>
              <span>100% VIP Punctuality Protected</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 bg-blue-900/40 border border-white/20 rounded-lg px-3 py-1.5 text-blue-200">
              <span>Quadruple-Track Segment</span>
            </div>
          </div>

        </div>
      </header>

      {/* ── 3. Operational Bulletin Ribbon ────────────────────────────────── */}
      <div className="bg-[#ea580b] border-y border-[#c2410c] text-white text-xs py-1.5 px-4 flex items-center overflow-hidden shadow-inner">
        <div className="shrink-0 flex items-center gap-1.5 bg-[#000075] text-[#ffba00] font-bold px-3 py-0.5 rounded text-[11px] uppercase tracking-wider mr-3 shadow-xs border border-blue-900">
          <span>सूचना / BULLETIN</span>
        </div>

        <div className="flex-1 overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-[marquee_35s_linear_infinite] hover:[animation-play-state:paused] text-white font-medium text-[11.5px]">
            <span>Active Corridor: Northern Railway Delhi Division (312 km) • Integrated TMS, SMMS &amp; TDMS Requisitions Online • CP-SAT Optimization Engine FEASIBLE • Vande Bharat Timetable Clearances Verified.</span>
          </div>
        </div>

        <div className="shrink-0 hidden md:flex items-center gap-2 pl-4">
          <span className="text-[#ffba00] font-bold text-xs">●</span>
          <span className="text-white text-[10.5px] font-semibold">SIMULATED RBAC ACTIVE</span>
        </div>
      </div>

      {/* ── 4. Main Portal Login Layout ────────────────────────────────────── */}
      <main className="flex-1 max-w-[1020px] w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        
        <div className="bg-white border border-slate-300 rounded-2xl shadow-xl overflow-hidden">
          
          {/* Card Title Banner */}
          <div 
            className="text-white p-5 sm:p-6 border-b border-[#000095] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
            style={{
              backgroundColor: "#000075",
              backgroundImage: "linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0) 25%, rgba(0, 0, 0, 0) 75%, rgba(0, 0, 0, 0.25) 100%)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#ffba00] shadow-xs shrink-0 text-xl">
                <span>🚆</span>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                  विभागीय प्रवेश द्वार | One-Click Departmental Access
                </h2>
                <p className="text-xs text-blue-100 mt-0.5">
                  Select a departmental or executive role below to enter the live corridor scheduling portal instantly.
                </p>
              </div>
            </div>

            <div className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00005a] border border-white/20 text-xs shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-blue-100">Environment:</span>
              <span className="font-bold text-[#ffba00]">Simulated RBAC</span>
            </div>
          </div>

          {/* Form / Selection Body */}
          <div className="p-5 sm:p-7">
            
            {/* Error Message */}
            {error && (
              <div className="mb-5 bg-red-50 border border-red-300 rounded-xl p-3.5 text-xs text-red-700 flex items-start gap-2.5">
                <span className="text-red-500 font-bold shrink-0 text-base">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Select Your Role (Clean 1-Click Cards) */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Choose Departmental Authority / पद एवं विभाग चुनें:
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  Click any role card to view authority scope
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {DEMO_ROLES.map((role) => {
                  const isSelected = selectedRole.id === role.id;
                  return (
                    <div
                      key={role.id}
                      onClick={() => setSelectedRole(role)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                        isSelected
                          ? "bg-blue-50/70 text-slate-900 border-[#000075] shadow-md ring-2 ring-[#000075]/20"
                          : "bg-slate-50/80 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${role.badgeClass}`}>
                            {role.icon} {role.deptKey}
                          </span>
                          {isSelected && (
                            <span className="text-[#000075] text-xs font-black bg-blue-100 px-1.5 py-0.5 rounded-full">
                              Active ✓
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-bold text-slate-900 leading-tight">
                          {role.name}
                        </p>
                        <p className="text-[11px] font-medium text-slate-600 mt-0.5">
                          {role.officer}
                        </p>
                        <p className="text-[10.5px] text-slate-500">
                          {role.designation}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10.5px]">
                        <span className="text-slate-500">{role.division}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRole(role);
                            handleOneClickLogin(role);
                          }}
                          className="font-bold text-[#000075] hover:underline flex items-center gap-0.5"
                        >
                          <span>Enter</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Role Authority Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{selectedRole.icon}</span>
                  <div>
                    <span className="font-bold text-slate-900 text-xs">
                      {selectedRole.name} • {selectedRole.officer}
                    </span>
                    <span className="text-[11px] text-slate-500 ml-2">({selectedRole.designation})</span>
                  </div>
                </div>
                <span className="text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded self-start sm:self-auto">
                  ● Verified Role Authority
                </span>
              </div>
              <p className="text-slate-600 text-[11.5px] leading-relaxed">
                <strong>Operational Scope:</strong> {selectedRole.scopeSummary}
              </p>
            </div>

            {/* Primary Action Button: 1-Click Login */}
            <div>
              <button
                type="button"
                id="one-click-login-btn"
                disabled={loading}
                onClick={() => handleOneClickLogin(selectedRole)}
                className="w-full bg-[#000075] hover:bg-blue-900 active:bg-[#00005a] disabled:bg-slate-400 text-white font-bold py-3.5 px-4 rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-blue-900"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Establishing Secure Corridor Session…</span>
                  </>
                ) : (
                  <>
                    <span>Enter Portal as {selectedRole.name.split(" / ")[0]} / प्रवेश करें</span>
                    <span className="text-[#ffba00] font-black text-base">→</span>
                  </>
                )}
              </button>
            </div>

            {/* Optional Manual Credential Entry Accordion */}
            <div className="mt-5 pt-3 border-t border-slate-200 text-center">
              <button
                type="button"
                onClick={() => setShowManualLogin((prev) => !prev)}
                className="text-[11.5px] text-slate-500 hover:text-slate-800 font-medium cursor-pointer transition-colors inline-flex items-center gap-1.5"
              >
                <span>{showManualLogin ? "▲ Hide Custom Credential Form" : "▼ Use Manual Employee Credentials"}</span>
              </button>

              {showManualLogin && (
                <form onSubmit={handleManualSubmit} className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-3 max-w-lg mx-auto animate-in fade-in duration-200">
                  <p className="text-xs text-slate-600 font-medium">
                    Enter employee credentials manually if testing custom credentials:
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      required
                      value={manualEmpId}
                      onChange={(e) => setManualEmpId(e.target.value)}
                      placeholder="e.g. EMP-CTRL-001"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#000075]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      System Password
                    </label>
                    <input
                      type="password"
                      required
                      value={manualPass}
                      onChange={(e) => setManualPass(e.target.value)}
                      placeholder="Enter system password"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#000075]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-3 rounded-lg text-xs cursor-pointer transition-colors"
                  >
                    Authenticate Credentials
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>

      </main>

      {/* ── 5. Clean Government Compliance Footer ─────────────────────────── */}
      <footer className="bg-[#030712] text-slate-300 text-xs py-5 px-4 border-t border-black mt-auto">
        <div className="max-w-[1360px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div>
            <p className="text-white font-semibold">
              Ministry of Railways · Government of India (रेल मंत्रालय · भारत सरकार)
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Corridor Maintenance &amp; Autonomous Block Scheduling System · Northern Railway (Delhi Division)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 text-[10.5px]">
            <span className="bg-[#000055] px-2.5 py-1 rounded text-slate-200 border border-white/20">
              Simulated RBAC Environment
            </span>
            <span className="bg-[#000055] px-2.5 py-1 rounded text-slate-200 border border-white/20">
              Role-Isolated Permissions
            </span>
            <span className="text-[#facc15] font-mono font-medium">
              OFFICIAL SYSTEM BUILD
            </span>
          </div>
        </div>

        <div className="max-w-[1360px] mx-auto mt-3 pt-3 border-t border-white/10 text-[10.5px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Ministry of Railways, Government of India. Autonomous Block Scheduling Engine.</p>
          <p className="font-mono text-slate-400">SIH26027 · RailBlock AI</p>
        </div>
      </footer>

      {/* CSS Animation for Bulletin Marquee */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}
