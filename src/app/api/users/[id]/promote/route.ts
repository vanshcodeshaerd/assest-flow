import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth";
import { authorize, ROLES } from "@/lib/middleware/authorization";
import { promoteSchema, validationErrors } from "@/lib/validation/employee-validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);
    if (!authorize(user, ROLES.ADMIN)) return errorResponse("Forbidden. Admin access required.", 403);

    const { id } = await ctx.params;

    if (id === user.id) {
      return errorResponse("Cannot change your own role", 400);
    }

    const body = await req.json();
    const result = promoteSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Validation Error", 400, validationErrors(result.error));
    }

    const employee = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!employee) return errorResponse("Employee not found", 404);

    if (employee.status !== "ACTIVE") {
      return errorResponse("Can only change role of active employees", 400);
    }

    const { newRole } = result.data;
    if (employee.role === newRole) {
      return errorResponse("Employee already has this role", 400);
    }

    const oldRole = employee.role;

    const [updated] = await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { role: newRole },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          employeeId: true,
          role: true,
          status: true,
        },
      }),
      prisma.roleHistory.create({
        data: {
          employeeId: id,
          oldRole,
          newRole,
          changedBy: user.id,
        },
      }),
      prisma.auditLog.create({
        data: {
          action: "ROLE_CHANGED",
          performedBy: user.id,
          targetId: id,
          entity: "USER",
          metadata: JSON.stringify({
            employeeName: `${employee.firstName} ${employee.lastName}`,
            oldRole,
            newRole,
          }),
        },
      }),
      prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "ROLE_CHANGED",
          entity: "USER",
          entityId: id,
        },
      }),
    ]);

    return successResponse({
      employee: updated,
      message: `Role changed from ${oldRole} to ${newRole}`,
    });
  } catch (error) {
    console.error("Promote error:", error);
    return errorResponse("Internal server error", 500);
  }
}
