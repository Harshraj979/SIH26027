/**
 * RBAC — Role-Based Access Control Types
 * Three roles as per SIH26027 requirements:
 *   SYSTEM_ADMIN → Full platform control
 *   DRM          → Railway data + submission approval
 *   OBSERVER     → Read-only public gallery
 */

export type Role = "SYSTEM_ADMIN" | "DRM" | "OBSERVER";

export interface User {
  id: string;
  employeeId: string;
  name: string;
  role: Role;
  designation: string;
  division: string;
  department?: "TMS" | "SMMS" | "TDMS" | "OPERATING";
}

/** What each role is allowed to do */
export const ROLE_PERMISSIONS: Record<Role, {
  canOptimize: boolean;
  canCreateWorkOrder: boolean;
  canCancelWorkOrder: boolean;
  canInjectEvent: boolean;
  canNegotiate: boolean;
  canAccessDigitalTwin: boolean;
  canAccessFieldFeedback: boolean;
  canViewAuditLogs: boolean;
  canManageUsers: boolean;
  canApproveSubmissions: boolean;
  canExportData: boolean;
}> = {
  SYSTEM_ADMIN: {
    canOptimize:          true,
    canCreateWorkOrder:   true,
    canCancelWorkOrder:   true,
    canInjectEvent:       true,
    canNegotiate:         true,
    canAccessDigitalTwin: true,
    canAccessFieldFeedback: true,
    canViewAuditLogs:     true,
    canManageUsers:       true,
    canApproveSubmissions: true,
    canExportData:        true,
  },
  DRM: {
    canOptimize:          true,
    canCreateWorkOrder:   true,
    canCancelWorkOrder:   true,
    canInjectEvent:       true,
    canNegotiate:         true,
    canAccessDigitalTwin: true,
    canAccessFieldFeedback: true,
    canViewAuditLogs:     true,
    canManageUsers:       false,
    canApproveSubmissions: true,
    canExportData:        true,
  },
  OBSERVER: {
    canOptimize:          false,
    canCreateWorkOrder:   false,
    canCancelWorkOrder:   false,
    canInjectEvent:       false,
    canNegotiate:         false,
    canAccessDigitalTwin: true,
    canAccessFieldFeedback: false,
    canViewAuditLogs:     false,
    canManageUsers:       false,
    canApproveSubmissions: false,
    canExportData:        false,
  },
};

export const ROLE_LABELS: Record<Role, string> = {
  SYSTEM_ADMIN: "System Administrator",
  DRM:          "Divisional Railway Manager",
  OBSERVER:     "Observer",
};

export const ROLE_BADGE_COLORS: Record<Role, string> = {
  SYSTEM_ADMIN: "bg-red-100 text-red-800 border-red-300",
  DRM:          "bg-blue-100 text-blue-800 border-blue-300",
  OBSERVER:     "bg-gray-100 text-gray-700 border-gray-300",
};
