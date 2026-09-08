"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DEMO_CREDENTIALS } from "@/lib/auth";
import { ROLE_LABELS, ROLE_BADGE_COLORS } from "@/types/auth";
import type { Role } from "@/types/auth";

export default function LoginPage() {
  const { login }           = useAuth();
  const [empId, setEmpId]   = useState("");
  const [pass, setPass]     = useState("");
  const [error, setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setTimeout(() => {
      const ok = login(empId.trim(), pass);
      if (!ok) setError("Invalid Employee ID or Password. Please try again.");
      setLoading(false);
    }, 400);
  };

  const fillDemo = (id: string, pw: string) => {
    setEmpId(id);
    setPass(pw);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gov-bg flex flex-col">
      {/* India Gov top strip */}
      <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #FF9933 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%)" }} />

      {/* Ministry Banner */}
      <div className="bg-[#003087] text-white py-3 px-6 flex items-center gap-4">
        {/* Ashoka Chakra SVG placeholder */}
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 overflow-hidden">
          <svg viewBox="0 0 100 100" className="w-10 h-10">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#FF9933" strokeWidth="6"/>
            <circle cx="50" cy="50" r="8" fill="#000080"/>
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 360) / 24;
              const rad   = (angle * Math.PI) / 180;
              const x1 = 50 + 10 * Math.cos(rad);
              const y1 = 50 + 10 * Math.sin(rad);
              const x2 = 50 + 40 * Math.cos(rad);
              const y2 = 50 + 40 * Math.sin(rad);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000080" strokeWidth="1.5"/>;
            })}
          </svg>
        </div>
        <div>
          <p className="text-xs text-blue-200 font-medium tracking-wide">भारत सरकार · Government of India</p>
          <h1 className="text-base font-bold leading-tight">Ministry of Railways — रेल मंत्रालय</h1>
          <p className="text-xs text-blue-200">Indian Railways | भारतीय रेल · Northern Railway, Delhi Division</p>
        </div>
      </div>

      {/* Main login card area */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          
          {/* System title bar */}
          <div className="bg-[#1a3c6e] text-white py-3 px-6 rounded-t-lg text-center">
            <h2 className="text-base font-bold tracking-wide">
              Automatic Block Planning System — AI-Powered
            </h2>
            <p className="text-xs text-blue-200 mt-0.5">
              NDLS – UMB – LDH Corridor · 312 km · Solution Reference: SIH26027
            </p>
          </div>

          <div className="bg-white border border-gray-300 rounded-b-lg shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              
              {/* Left: Login form */}
              <div className="p-8 border-r border-gray-200">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 bg-[#FF9933] rounded-sm"/>
                    <h3 className="text-lg font-bold text-[#1a3c6e]">Staff Login</h3>
                  </div>
                  <p className="text-xs text-gray-500">
                    Authorised railway personnel only. Use your Employee ID and system password.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="empId" className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Employee ID / कर्मचारी पहचान संख्या
                    </label>
                    <input
                      id="empId"
                      type="text"
                      required
                      value={empId}
                      onChange={(e) => setEmpId(e.target.value)}
                      placeholder="e.g. ADMIN001"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1a3c6e] focus:ring-1 focus:ring-[#1a3c6e]"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Password / पासवर्ड
                    </label>
                    <input
                      id="password"
                      type="password"
                      required
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
                      placeholder="Enter password"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1a3c6e] focus:ring-1 focus:ring-[#1a3c6e]"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-300 rounded px-3 py-2 text-xs text-red-700 flex items-start gap-2">
                      <span className="text-red-500 font-bold shrink-0">⚠</span>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    id="login-submit"
                    className="w-full bg-[#1a3c6e] hover:bg-[#14305a] disabled:bg-gray-400 text-white py-2.5 rounded text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                        Verifying…
                      </>
                    ) : "Login / प्रवेश करें"}
                  </button>
                </form>

                <p className="text-[11px] text-gray-400 mt-4 text-center">
                  Having trouble? Contact your Division IT helpdesk.
                </p>
              </div>

              {/* Right: Demo credentials panel */}
              <div className="p-8 bg-blue-50">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 bg-[#138808] rounded-sm"/>
                    <h3 className="text-sm font-bold text-[#1a3c6e]">Demo Accounts (SIH Demonstration)</h3>
                  </div>
                  <p className="text-xs text-gray-500">
                    Click any card below to auto-fill credentials for evaluation purposes.
                  </p>
                </div>

                <div className="space-y-3">
                  {DEMO_CREDENTIALS.map((cred) => (
                    <button
                      key={cred.employeeId}
                      id={`demo-${cred.employeeId.toLowerCase()}`}
                      type="button"
                      onClick={() => fillDemo(cred.employeeId, cred.password)}
                      className="w-full text-left border border-gray-300 rounded-lg p-3 bg-white hover:border-[#1a3c6e] hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-bold text-gray-900 group-hover:text-[#1a3c6e]">
                              {cred.name}
                            </span>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${ROLE_BADGE_COLORS[cred.role as Role]}`}>
                              {ROLE_LABELS[cred.role as Role]}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{cred.designation}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[11px] font-mono text-gray-700 font-semibold">{cred.employeeId}</p>
                          <p className="text-[11px] font-mono text-gray-400">{cred.password}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-4 bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800">
                  <strong>Note:</strong> These are mock credentials for SIH demonstration only. Production deployment will use Indian Railways SSO / HRMS integration.
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-4 text-xs text-gray-400 space-y-0.5">
            <p>© 2025 Ministry of Railways, Government of India. All rights reserved.</p>
            <p>Solution SIH26027 · Version 1.0 · Data classification: RESTRICTED</p>
          </div>
        </div>
      </div>
    </div>
  );
}
