"use client";

import React from "react";
import type { Role } from "@/types/auth";
import { useAuth } from "@/context/AuthContext";

interface Props {
  allow: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * RoleGate — Renders children only if the logged-in user has an allowed role.
 * Usage:
 *   <RoleGate allow={["SYSTEM_ADMIN", "DRM"]}>
 *     <SomeAdminPanel />
 *   </RoleGate>
 */
export default function RoleGate({ allow, children, fallback = null }: Props) {
  const { user } = useAuth();
  if (!user || !allow.includes(user.role)) return <>{fallback}</>;
  return <>{children}</>;
}
