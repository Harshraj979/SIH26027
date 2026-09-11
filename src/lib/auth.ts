/**
 * Mock Auth Library — SIH Demo Credentials
 * Three hardcoded demo accounts, one per RBAC role.
 */

import type { User, Role } from "@/types/auth";
import { ROLE_PERMISSIONS } from "@/types/auth";

// ─── Demo user store ──────────────────────────────────────────────────────────

export interface DemoCredential {
  employeeId: string;
  password:   string;
  user:       User;
}

export const DEMO_USERS: DemoCredential[] = [
  // ─── Department Consoles (IR-RBAC Tier 1 Authorized) ───────────────
  {
    employeeId: "EMP-ENG-8821",
    password:   "eng@123",
    user: {
      id:          "u-eng-8821",
      employeeId:  "EMP-ENG-8821",
      name:        "Sh. Harsh Savalia",
      role:        "DRM",
      designation: "Sr. DEN (Delhi Division)",
      division:    "DLI",
      department:  "TMS",
    },
  },
  {
    employeeId: "EMP-ST-4419",
    password:   "st@123",
    user: {
      id:          "u-st-4419",
      employeeId:  "EMP-ST-4419",
      name:        "Smt. Khush Patel",
      role:        "DRM",
      designation: "Sr. DSTE / Signalling (Delhi Division)",
      division:    "DLI",
      department:  "SMMS",
    },
  },
  {
    employeeId: "EMP-TRD-9032",
    password:   "trd@123",
    user: {
      id:          "u-trd-9032",
      employeeId:  "EMP-TRD-9032",
      name:        "Er. Mann Butani",
      role:        "DRM",
      designation: "DEE / TRD Traction (Delhi Division)",
      division:    "DLI",
      department:  "TDMS",
    },
  },
  {
    employeeId: "EMP-CTRL-001",
    password:   "ctrl@123",
    user: {
      id:          "u-ctrl-001",
      employeeId:  "EMP-CTRL-001",
      name:        "Sh. Niyati Joshi",
      role:        "SYSTEM_ADMIN",
      designation: "Chief Controller / Operating (DOM Office, DLI)",
      division:    "DLI",
      department:  "OPERATING",
    },
  },

  // ─── Executive & Observer Accounts ───────────────────────────────────
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
      department:  "OPERATING",
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
  const cleanId = employeeId.trim().toUpperCase();
  const found = DEMO_USERS.find(
    (d) => d.employeeId.toUpperCase() === cleanId && d.password === password
  );
  if (!found) return null;

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(found.user));
  }
  return found.user;
}

export function directLogin(employeeId: string): User | null {
  const cleanId = employeeId.trim().toUpperCase();
  const found = DEMO_USERS.find(
    (d) => d.employeeId.toUpperCase() === cleanId
  );
  if (!found) return null;

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(found.user));
  }
  return found.user;
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, "LOGGED_OUT");
  }
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw || raw === "LOGGED_OUT") return null;
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
  department:  d.user.department,
}));
