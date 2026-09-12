"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DEMO_CREDENTIALS } from "@/lib/auth";

interface DepartmentRoleInfo {
  deptKey: "TMS" | "SMMS" | "TDMS" | "OPERATING";
  name: string;
  hindiName: string;
  defaultEmpId: string;
  defaultPass: string;
  officer: string;
  designation: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  scopeSummary: string;
  icon: string;
}

const DEPARTMENT_ROLES: DepartmentRoleInfo[] = [
  {
    deptKey: "OPERATING",
    name: "Section Controller / Operating",
    hindiName: "मुख्य नियंत्रण कक्ष (प्रशासक)",
    defaultEmpId: "EMP-CTRL-001",
    defaultPass: "ctrl@123",
    officer: "Sh. Niyati Joshi",
    designation: "Chief Controller / Operating (DOM Office, DLI)",
    color: "#a855f7",
    badgeBg: "bg-purple-900/30",
    badgeBorder: "border-purple-500/40 text-purple-300",
    scopeSummary: "Cross-department total visibility • Exclusive approval & time-trim authority • Master string chart optimization",
    icon: "🎛️",
  },
  {
    deptKey: "TMS",
    name: "Engineering (Civil P-Way)",
    hindiName: "इंजीनियरिंग विभाग (पी-वे)",
    defaultEmpId: "EMP-ENG-8821",
    defaultPass: "eng@123",
    officer: "Sh. Harsh Savalia",
    designation: "Sr. DEN (Delhi Division)",
    color: "#38bdf8",
    badgeBg: "bg-blue-900/30",
    badgeBorder: "border-blue-500/40 text-blue-300",
    scopeSummary: "Track maintenance requisitions (BCM, CSM, USFD) • Track geometry & tamping speed limits • Emergency rail repairs",
    icon: "🛤️",
  },
  {
    deptKey: "SMMS",
    name: "Signalling & Telecom (S&T)",
    hindiName: "सिग्नल एवं दूरसंचार विभाग",
    defaultEmpId: "EMP-ST-4419",
    defaultPass: "st@123",
    officer: "Smt. Khush Patel",
    designation: "Sr. DSTE / Signalling (Delhi Division)",
    color: "#34d399",
    badgeBg: "bg-emerald-900/30",
    badgeBorder: "border-emerald-500/40 text-emerald-300",
    scopeSummary: "Interlocking overhaul & point machine testing • Axle counter maintenance • Real-time fail-safe route clearances",
    icon: "📡",
  },
  {
    deptKey: "TDMS",
    name: "Traction & 25kV OHE (TRD)",
    hindiName: "विद्युत कर्षण वितरण विभाग",
    defaultEmpId: "EMP-TRD-9032",
    defaultPass: "trd@123",
    officer: "Er. Mann Butani",
    designation: "DEE / TRD Traction (Delhi Division)",
    color: "#fbbf24",
    badgeBg: "bg-amber-900/30",
    badgeBorder: "border-amber-500/40 text-amber-300",
    scopeSummary: "25kV AC OHE Power Block & PTW Clearances • Contact wire & tower wagon scheduling • Isolator de-energization sync",
    icon: "⚡",
  },
];

interface ZonalNetworkInfo {
  id: string;
  label: string;
  shortName: string;
  code: string;
  detail: string;
  badge: string;
  icon: string;
}

const ZONAL_NETWORKS: ZonalNetworkInfo[] = [
  {
    id: "ALL_INDIA",
    label: "All India (Pan-India Unified View)",
    shortName: "All India (Unified)",
    code: "FOIS-PAN-INDIA",
    detail: "Consolidated Master Network • All 5 Active Zones Synchronized",
    badge: "Master View",
    icon: "🌐",
  },
  {
    id: "NR",
    label: "Northern Railway (NR)",
    shortName: "Northern Railway",
    code: "NR / DLI",
    detail: "Delhi Division • Active Corridor: NDLS – UMB – LDH (312 km)",
    badge: "Active Corridor",
    icon: "📍",
  },
  {
    id: "WR",
    label: "Western Railway (WR)",
    shortName: "Western Railway",
    code: "WR / BCT",
    detail: "Mumbai Central Division • High-Density Mainline Network",
    badge: "Connected",
    icon: "📍",
  },
  {
    id: "CR",
    label: "Central Railway (CR)",
    shortName: "Central Railway",
    code: "CR / CSMT",
    detail: "Mumbai CSMT / Bhusawal Division • Central Freight Trunk",
    badge: "Connected",
    icon: "📍",
  },
  {
    id: "ER",
    label: "Eastern Railway (ER)",
    shortName: "Eastern Railway",
    code: "ER / HWH",
    detail: "Howrah Division • Dedicated Coal & Freight Interlock",
    badge: "Connected",
    icon: "📍",
  },
  {
    id: "SR",
    label: "Southern Railway (SR)",
    shortName: "Southern Railway",
    code: "SR / MAS",
    detail: "Chennai Division • Southern High-Speed Rail Corridor",
    badge: "Connected",
    icon: "📍",
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [empId, setEmpId] = useState("EMP-CTRL-001");
  const [pass, setPass] = useState("ctrl@123");
  const [selectedDeptKey, setSelectedDeptKey] = useState<string>("OPERATING");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Zonal Network Selection Dropdown State
  const [zoneDropdownOpen, setZoneDropdownOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ZonalNetworkInfo>(ZONAL_NETWORKS[0]);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setZoneDropdownOpen(false);
      }
    };
    if (zoneDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [zoneDropdownOpen]);

  // Live IST Clock (Exact format from screenshot)
  const [timeStr, setTimeStr] = useState("19:39:00 IST");
  const [dateStr, setDateStr] = useState("Fri, 11 Sept, 2026");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      setTimeStr(`${hours}:${minutes}:${seconds} IST`);

      const weekday = now.toLocaleDateString("en-IN", { weekday: "short" });
      const day = now.getDate();
      const month = now.toLocaleDateString("en-IN", { month: "short" });
      const year = now.getFullYear();
      setDateStr(`${weekday}, ${day} ${month}, ${year}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Detect active role from Employee ID
  const activeRole = React.useMemo(() => {
    const clean = empId.trim().toUpperCase();
    const found = DEPARTMENT_ROLES.find((d) => d.defaultEmpId.toUpperCase() === clean);
    if (found) return found;
    return DEPARTMENT_ROLES.find((d) => d.deptKey === selectedDeptKey) || DEPARTMENT_ROLES[0];
  }, [empId, selectedDeptKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setTimeout(() => {
      const ok = login(empId.trim(), pass);
      if (!ok) {
        setError("Invalid Employee ID or Password. Please check credentials or select a department profile below.");
        setLoading(false);
      }
    }, 350);
  };

  const handleSelectRole = (role: DepartmentRoleInfo) => {
    setSelectedDeptKey(role.deptKey);
    setEmpId(role.defaultEmpId);
    setPass(role.defaultPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f1f4f9] text-slate-800 flex flex-col font-sans selection:bg-[#000085] selection:text-white antialiased">
      
      {/* ── 1. Top Government Information Strip (Exact #00005a Deep Navy) ── */}
      <div className="bg-[#00005a] text-white text-[11px] py-1.5 px-4 sm:px-8 border-b border-[#000045] flex flex-wrap items-center justify-between gap-y-1 select-none">
        {/* Left: Ministry Identity */}
        <div className="flex items-center gap-2 font-medium tracking-wide">
          <span className="text-[#ffba00] font-bold">भारत सरकार • रेल मंत्रालय</span>
          <span className="text-white/40">|</span>
          <span className="text-slate-100 uppercase text-[10.5px]">
            GOVERNMENT OF INDIA • MINISTRY OF RAILWAYS • PAN-INDIA FOIS PORTAL
          </span>
        </div>

        {/* Right: Live IST Clock & Pan-India Status */}
        <div className="flex items-center gap-3 text-slate-200 ml-auto text-[10.5px]">
          <div className="flex items-center gap-1.5 font-mono">
            <svg className="w-3.5 h-3.5 text-[#ffba00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-[#ffba00] font-bold">{timeStr}</span>
            <span className="text-slate-300">({dateStr})</span>
          </div>

          <span className="text-white/40">|</span>

          <div className="flex items-center gap-1.5 text-slate-100 font-medium">
            <svg className="w-3.5 h-3.5 text-[#ffba00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Pan-India Unified FOIS • All 5 Active Zonal Networks</span>
          </div>
        </div>
      </div>

      {/* ── 2. Brand Header (Exact #000075 Royal Navy) ────────────────────── */}
      <header className="bg-[#000075] text-white py-3 px-4 sm:px-8 shadow-md border-b border-[#000095]">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            {/* Indian Railways Circular Emblem */}
            <div className="w-12 h-12 rounded-full bg-white p-0.5 shadow-md flex items-center justify-center border-2 border-[#ffba00] shrink-0">
              <div className="w-full h-full rounded-full bg-[#000075] flex items-center justify-center p-1">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="#ffba00" strokeWidth="3" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#ffba00" strokeWidth="1" strokeDasharray="2,2" />
                  <path d="M30 42 L70 42 L65 72 L35 72 Z" fill="#ffffff" opacity="0.95" />
                  <circle cx="42" cy="74" r="5" fill="#ffba00" />
                  <circle cx="58" cy="74" r="5" fill="#ffba00" />
                  <rect x="38" y="32" width="24" height="10" rx="2" fill="#38bdf8" />
                  <circle cx="50" cy="22" r="4" fill="#ffba00" />
                  <text x="50" y="60" textAnchor="middle" fill="#000075" fontSize="13" fontWeight="900">IR</text>
                </svg>
              </div>
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
                  Unified Gateway
                </span>
              </h1>
              <p className="text-[11px] text-blue-100/90 font-medium mt-1 leading-tight hidden sm:block">
                भारतीय रेल स्वचालित ब्लॉक नियोजन एवं गलियारा अनुरक्षण प्रणाली | AI Corridor Block Planning System
              </p>
            </div>
          </div>

          {/* Right Status Controls */}
          <div className="flex items-center gap-3 ml-auto">
            
            {/* Interactive Zonal Network Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                id="zonal-network-selector-btn"
                onClick={() => setZoneDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 bg-[#00005a] hover:bg-[#00006e] active:bg-[#00004e] border border-blue-400/40 hover:border-blue-400/70 rounded-lg px-3 py-1.5 text-xs text-white font-medium shadow-xs transition-colors cursor-pointer"
                aria-expanded={zoneDropdownOpen}
                aria-haspopup="listbox"
              >
                <span>{selectedZone.icon}</span>
                {selectedZone.id === "ALL_INDIA" && <span className="hidden sm:inline">🇮🇳</span>}
                <span className="max-w-[180px] sm:max-w-[240px] truncate">{selectedZone.label}</span>
                <span className={`text-blue-300 text-[10px] transition-transform duration-200 ${zoneDropdownOpen ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>

              {/* Dropdown Menu Popover */}
              {zoneDropdownOpen && (
                <div 
                  className="absolute right-0 mt-1.5 w-72 sm:w-84 bg-[#00005a] border border-blue-400/40 rounded-xl shadow-2xl z-50 overflow-hidden"
                  role="listbox"
                >
                  <div className="p-2.5 bg-[#000048] border-b border-blue-900/60 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                      Select Zonal Rail Network
                    </span>
                    <span className="text-[10px] text-[#ffba00] font-mono">
                      5 Active Zones
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto p-1 divide-y divide-blue-950/40">
                    {ZONAL_NETWORKS.map((zone) => {
                      const isSelected = selectedZone.id === zone.id;
                      return (
                        <button
                          key={zone.id}
                          type="button"
                          onClick={() => {
                            setSelectedZone(zone);
                            setZoneDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-lg transition-colors flex items-start gap-2.5 cursor-pointer ${
                            isSelected
                              ? "bg-[#000075] text-white"
                              : "hover:bg-white/10 text-slate-200"
                          }`}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <span className="text-sm mt-0.5 shrink-0">{zone.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-semibold truncate leading-tight">
                                {zone.label}
                              </p>
                              {isSelected && (
                                <span className="text-[#ffba00] text-xs font-bold shrink-0">✓</span>
                              )}
                            </div>
                            <p className="text-[10.5px] text-blue-200/80 truncate mt-0.5">
                              {zone.detail}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9.5px] font-mono text-slate-300 bg-black/20 px-1 py-0.2 rounded">
                                {zone.code}
                              </span>
                              <span className="text-[9.5px] text-[#ffba00] font-medium">
                                • {zone.badge}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-2 bg-[#000045] border-t border-blue-900/60 text-[10px] text-slate-300 flex items-center justify-between">
                    <span>Selected: <strong className="text-white">{selectedZone.shortName}</strong></span>
                    <span className="text-emerald-400 font-semibold">● Online</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 bg-[#112284] border border-blue-500/40 rounded-lg px-3 py-1.5 text-xs text-white font-medium shadow-xs">
              <svg className="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Official Portal Access Only</span>
            </div>
          </div>

        </div>
      </header>

      {/* ── 3. High-Visibility Saffron / Orange Operational Bulletin Ribbon ── */}
      <div className="bg-[#ea580b] border-y border-[#c2410c] text-white text-xs py-1.5 px-4 flex items-center overflow-hidden shadow-inner">
        <div className="shrink-0 flex items-center gap-1.5 bg-[#000075] text-[#ffba00] font-bold px-3 py-0.5 rounded text-[11px] uppercase tracking-wider mr-3 shadow-xs border border-blue-900">
          <span>सूचना / BULLETIN</span>
        </div>

        <div className="flex-1 overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-[marquee_30s_linear_infinite] hover:[animation-play-state:paused] text-white font-medium text-[11.5px]">
            <span>Clearance &amp; Maintenance Optimizer • Operating across NR, WR, CR, ER, and SR Zonal Networks • Real-time Supabase Data Synchronization &amp; Safety Clearances Online.</span>
          </div>
        </div>

        <div className="shrink-0 hidden md:flex items-center gap-3 pl-4">
          <span className="text-[#ffba00] font-bold tracking-widest text-xs">★★★</span>
          <div className="flex items-center gap-1.5 bg-[#000075]/90 border border-white/20 text-white text-[10.5px] font-semibold px-2 py-0.5 rounded">
            <span>🛡 RAILBLOCK AI ACTIVE</span>
          </div>
        </div>
      </div>

      {/* ── 4. Hero Section: Clean & Dignified Indian Railways Royal Navy ──── */}
      <section 
        className="text-white py-12 sm:py-16 px-4 text-center border-b border-[#000095] relative overflow-hidden shadow-sm"
        style={{
          backgroundColor: "#000075",
          backgroundImage: "linear-gradient(180deg, rgba(0, 0, 0, 0.22) 0%, rgba(0, 0, 0, 0) 18%, rgba(0, 0, 0, 0) 80%, rgba(0, 0, 0, 0.25) 100%)",
        }}
      >
        <div className="relative max-w-4xl mx-auto z-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight flex flex-wrap items-center justify-center gap-2 sm:gap-3 leading-tight">
            <span className="text-[#ffba00]">
              रेल-ब्लॉक पोर्टल
            </span>
            <span className="text-white/60 font-light">|</span>
            <span className="text-white">
              RAILBLOCK PORTAL
            </span>
          </h2>

          <p className="mt-3 text-sm sm:text-base text-slate-100 font-medium tracking-wide">
            भारतीय रेल स्वचालित ब्लॉक नियोजन एवं गलियारा अनुरक्षण प्रणाली
          </p>
          <p className="text-xs sm:text-sm text-blue-200/90 font-normal tracking-wide mt-1">
            AI-Powered Automatic Block Planning &amp; Corridor Maintenance Management System
          </p>

          <div className="mt-4 inline-flex items-center gap-2 bg-[#00005a]/80 border border-white/20 rounded-full px-3.5 py-1 text-[11px] text-blue-100 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>NDLS – UMB – LDH Corridor • 312 km Double-Line Mainline</span>
          </div>
        </div>
      </section>

      {/* ── 5. SINGLE LOGIN LAYOUT WITH RBAC FOR ALL DEPARTMENTS ──────────── */}
      <main className="flex-1 max-w-[880px] w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
        
        <div className="bg-white border border-slate-300 rounded-2xl shadow-xl overflow-hidden">
          
          {/* Card Title Header (#000075 with gentle top/bottom fade) */}
          <div 
            className="text-white p-5 sm:p-6 border-b border-[#000095] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
            style={{
              backgroundColor: "#000075",
              backgroundImage: "linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0) 25%, rgba(0, 0, 0, 0) 75%, rgba(0, 0, 0, 0.25) 100%)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#ffba00] shadow-xs shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                  विभागीय प्रवेश द्वार | Unified Single Sign-On
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  Role isolation and permissions strictly validated under IR-RBAC Tier 1.
                </p>
              </div>
            </div>

            {/* Live Role Badge */}
            <div className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00005a] border border-white/20 text-xs shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-blue-100">Scope:</span>
              <span className="font-bold text-[#ffba00]">{activeRole.deptKey}</span>
            </div>
          </div>

          {/* Login Form Body */}
          <div className="p-6 sm:p-8">
            
            {/* Department Quick Switcher Tabs (All 4 Departments) */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Select Department Scope / विभाग चुनें:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {DEPARTMENT_ROLES.map((role) => {
                  const isSelected = activeRole.deptKey === role.deptKey;
                  return (
                    <button
                      key={role.deptKey}
                      type="button"
                      onClick={() => handleSelectRole(role)}
                      style={
                        isSelected
                          ? {
                              backgroundColor: "#000075",
                              backgroundImage: "linear-gradient(180deg, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.2) 100%)",
                            }
                          : undefined
                      }
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "text-white border-[#000075] shadow-md ring-2 ring-blue-500/40"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          isSelected ? "bg-white/20 text-[#ffba00]" : "bg-slate-200 text-slate-600"
                        }`}>
                          {role.deptKey}
                        </span>
                        {isSelected && <span className="text-[#ffba00] text-xs font-bold">✓</span>}
                      </div>
                      <p className="text-xs font-bold leading-tight line-clamp-1">
                        {role.name.split(" / ")[0]}
                      </p>
                      <p className={`text-[10.5px] mt-0.5 line-clamp-1 ${isSelected ? "text-blue-100" : "text-slate-500"}`}>
                        {role.officer}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 bg-red-50 border border-red-300 rounded-lg p-3 text-xs text-red-700 flex items-start gap-2.5">
                <span className="text-red-500 font-bold shrink-0 text-sm">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Single Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Employee ID */}
                <div>
                  <label htmlFor="input-empid" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    2. Employee ID / कर्मचारी पहचान संख्या
                  </label>
                  <input
                    id="input-empid"
                    type="text"
                    required
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    placeholder="e.g. EMP-CTRL-001"
                    className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:border-[#000075] focus:ring-2 focus:ring-[#000075]/20 font-mono transition-all"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Designated: <strong className="text-slate-800">{activeRole.officer}</strong> ({activeRole.designation})
                  </span>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="input-password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    3. System Password / पासवर्ड
                  </label>
                  <input
                    id="input-password"
                    type="password"
                    required
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder="Enter password"
                    className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:border-[#000075] focus:ring-2 focus:ring-[#000075]/20 transition-all"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Demo password: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">{activeRole.defaultPass}</code>
                  </span>
                </div>

              </div>

              {/* Dynamic RBAC Scope Box for Current Department */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
                      IR-RBAC Tier 1 Authority Scope:
                    </span>
                    <span className="text-[10.5px] font-bold text-[#000075]">
                      {activeRole.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">SECURITY RULE #4.1</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  ✓ {activeRole.scopeSummary}
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="unified-login-submit"
                  disabled={loading}
                  className="w-full bg-[#000075] hover:bg-[#000065] active:bg-[#000055] disabled:bg-slate-400 text-white font-bold py-3.5 px-4 rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#000095]"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Validating Departmental Credentials…</span>
                    </>
                  ) : (
                    <>
                      <span>Login to {activeRole.name.split(" / ")[0]} Console / प्रवेश करें</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>

            </form>

            {/* Other Demo Profiles */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-600">Executive Demo Credentials:</span>
              <div className="flex flex-wrap gap-2">
                {DEMO_CREDENTIALS.filter((c) => ["ADMIN001", "DRM001", "OBS001"].includes(c.employeeId)).map((c) => (
                  <button
                    key={c.employeeId}
                    type="button"
                    onClick={() => {
                      setEmpId(c.employeeId);
                      setPass(c.password);
                      setError(null);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 cursor-pointer font-medium transition-colors"
                  >
                    {c.employeeId} ({c.name})
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* ── 6. Government Compliance Footer ───────────────────────────────── */}
      <footer className="bg-[#030712] text-slate-300 text-xs py-6 px-4 border-t border-black mt-auto">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <p className="text-white font-semibold">
              Ministry of Railways · Government of India (रेल मंत्रालय · भारत सरकार)
            </p>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Integrated with FOIS (Freight Operations Information System) &amp; CRIS (Centre for Railway Information Systems)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <span className="bg-[#000055] px-2.5 py-1 rounded text-slate-200 border border-white/20">
              IR-RBAC Tier 1 Certified
            </span>
            <span className="bg-[#000055] px-2.5 py-1 rounded text-slate-200 border border-white/20">
              TLS 1.3 Strict Enforced
            </span>
            <span className="text-[#facc15] font-mono font-medium">
              RESTRICTED // OFFICIAL USE ONLY
            </span>
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto mt-4 pt-3 border-t border-white/10 text-[10.5px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Ministry of Railways, Government of India. All rights reserved.</p>
          <p>RailBlock AI · Autonomous Block Scheduling Engine · SIH26027</p>
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
