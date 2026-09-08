/**
 * Mock Auth Library — SIH Demo Credentials
 * Three hardcoded demo accounts, one per RBAC role.
 */

import type { User, Role } from "@/types/auth";
import { ROLE_PERMISSIONS } from "@/types/auth";

// ─── Demo user store ──────────────────────────────────────────────────────────

interface DemoCredential {
  employeeId: string;
  password:   string;
  user:       User;
}

const DEMO_USERS: DemoCredential[] = [
  {
    employeeId: "ADMIN001",
    password:   "admin@123",
    user: {
      id:          "u-admin",
      employeeId:  "ADMIN001",
      name:        "Rajesh Kumar",
      role:        "SYSTEM_ADMIN",
      designation: "Chief Operations Manager",
      division:    "DLI",
    },
  },
  {
    employeeId: "DRM001",
    password:   "drm@123",
    user: {
      id:          "u-drm",
      employeeId:  "DRM001",
      name:        "Priya Sharma",
      role:        "DRM",
      designation: "Divisional Railway Manager — Delhi",
      division:    "DLI",
    },
  },
  {
    employeeId: "OBS001",
    password:   "obs@123",
    user: {
      id:          "u-obs",
      employeeId:  "OBS001",
      name:        "Arjun Singh",
      role:        "OBSERVER",
      designation: "External Stakeholder / Auditor",
      division:    "NR",
    },
  },
];

// ─── Auth functions ───────────────────────────────────────────────────────────

const STORAGE_KEY = "railblock_user";

export function login(employeeId: string, password: string): User | null {
  const found = DEMO_USERS.find(
    (d) => d.employeeId === employeeId.toUpperCase() && d.password === password
  );
  if (!found) return null;

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(found.user));
  }
  return found.user;
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function hasPermission(
  user: User | null,
  permission: keyof typeof ROLE_PERMISSIONS[Role]
): boolean {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role]?.[permission] ?? false;
}

// Demo creds for display on login page
export const DEMO_CREDENTIALS = DEMO_USERS.map((d) => ({
  employeeId:  d.employeeId,
  password:    d.password,
  role:        d.user.role as Role,
  name:        d.user.name,
  designation: d.user.designation,
}));
