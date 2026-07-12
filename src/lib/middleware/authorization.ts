import { NextRequest } from "next/server";
import { AuthRole, AuthUser, errorResponse } from "@/lib/auth";

/**
 * Authorization middleware for RBAC
 * Checks if user has required role(s)
 * Returns 403 if unauthorized
 */
export function authorize(user: AuthUser, ...allowedRoles: AuthRole[]): boolean {
  return allowedRoles.includes(user.role);
}

/**
 * Higher-order function to wrap API route handlers with role-based authorization
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @param handler - The API route handler function
 * @returns A new handler that requires specific roles
 */
export function requireRoles<T extends any[]>(
  allowedRoles: AuthRole[],
  handler: (req: NextRequest, ...args: T) => Promise<Response>
) {
  return async (req: NextRequest, ...args: T): Promise<Response> => {
    const user = (req as any).user;
    
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }
    
    if (!authorize(user, ...allowedRoles)) {
      return errorResponse(
        `Forbidden. Required roles: ${allowedRoles.join(", ")}`,
        403
      );
    }
    
    return handler(req, ...args);
  };
}

/**
 * Role constants for easy reference
 */
export const ROLES = {
  EMPLOYEE: "EMPLOYEE" as AuthRole,
  DEPT_HEAD: "DEPT_HEAD" as AuthRole,
  ASSET_MANAGER: "ASSET_MANAGER" as AuthRole,
  ADMIN: "ADMIN" as AuthRole,
  USER: "USER" as AuthRole,
  MANAGER: "MANAGER" as AuthRole,
  HR: "HR" as AuthRole,
} as const;

export const ROLE_GROUPS = {
  ALL: [ROLES.EMPLOYEE, ROLES.DEPT_HEAD, ROLES.ASSET_MANAGER, ROLES.ADMIN, ROLES.USER, ROLES.MANAGER, ROLES.HR],
  MANAGEMENT: [ROLES.DEPT_HEAD, ROLES.ASSET_MANAGER, ROLES.ADMIN, ROLES.MANAGER],
  ADMIN_ONLY: [ROLES.ADMIN],
  HR_AND_ADMIN: [ROLES.ADMIN, ROLES.HR],
  INTERNAL: [ROLES.EMPLOYEE, ROLES.DEPT_HEAD, ROLES.ASSET_MANAGER, ROLES.MANAGER, ROLES.HR],
} as const;
