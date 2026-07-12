import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth";
import { authorize, ROLES } from "@/lib/middleware/authorization";
import { updateEmployeeSchema, validationErrors } from "@/lib/validation/employee-validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await ctx.params;

    const isSelf = user.id === id;
    const isPrivileged = authorize(user, ROLES.ADMIN, ROLES.HR, ROLES.MANAGER);

    if (!isSelf && !isPrivileged) {
      return errorResponse("Forbidden", 403);
    }

    const employee = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        employeeId: true,
        phone: true,
        role: true,
        status: true,
        isActive: true,
        departmentId: true,
        department: true,
        approvedBy: true,
        approvedAt: true,
        joinedAt: true,
        createdAt: true,
        updatedAt: true,
        departmentRef: { select: { id: true, name: true, code: true } },
        loginHistory: {
          orderBy: { timestamp: "desc" },
          take: 10,
          select: { id: true, timestamp: true },
        },
        roleHistory: {
          orderBy: { changedAt: "desc" },
          select: { id: true, oldRole: true, newRole: true, changedBy: true, changedAt: true },
        },
        activityLogs: {
          orderBy: { timestamp: "desc" },
          take: 20,
          select: { id: true, action: true, entity: true, entityId: true, timestamp: true },
        },
      },
    });

    if (!employee) return errorResponse("Employee not found", 404);

    return successResponse({ employee });
  } catch (error) {
    console.error("User GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await ctx.params;
    const isSelf = user.id === id;
    const isAdmin = authorize(user, ROLES.ADMIN);

    if (!isSelf && !isAdmin) {
      return errorResponse("Forbidden", 403);
    }

    const body = await req.json();
    const result = updateEmployeeSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Validation Error", 400, validationErrors(result.error));
    }

    const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) return errorResponse("Employee not found", 404);

    const data: any = {};
    if (result.data.firstName !== undefined) data.firstName = result.data.firstName;
    if (result.data.lastName !== undefined) data.lastName = result.data.lastName;
    if (result.data.phone !== undefined) data.phone = result.data.phone;

    if (isAdmin && result.data.departmentId !== undefined) {
      data.departmentId = result.data.departmentId;
    }

    const employee = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        employeeId: true,
        phone: true,
        role: true,
        status: true,
        departmentId: true,
        departmentRef: { select: { id: true, name: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "EMPLOYEE_UPDATED",
        entity: "USER",
        entityId: id,
      },
    });

    return successResponse({ employee });
  } catch (error) {
    console.error("User PATCH error:", error);
    return errorResponse("Internal server error", 500);
  }
}
