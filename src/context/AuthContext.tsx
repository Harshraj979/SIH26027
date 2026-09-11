"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "@/types/auth";
import { getUser, login as authLogin, directLogin as authDirectLogin, logout as authLogout } from "@/lib/auth";

interface AuthContextValue {
  user:        User | null;
  isReady:     boolean;
  login:       (employeeId: string, password: string) => boolean;
  directLogin: (employeeId: string) => boolean;
  logout:      () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user:        null,
  isReady:     false,
  login:       () => false,
  directLogin: () => false,
  logout:      () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setUser(getUser());
    setIsReady(true);
  }, []);

  const login = useCallback((employeeId: string, password: string): boolean => {
    const u = authLogin(employeeId, password);
    if (u) { setUser(u); return true; }
    return false;
  }, []);

  const directLogin = useCallback((employeeId: string): boolean => {
    const u = authDirectLogin(employeeId);
    if (u) { setUser(u); return true; }
    return false;
  }, []);

  const logout = useCallback(() => {
    authLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isReady, login, directLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
