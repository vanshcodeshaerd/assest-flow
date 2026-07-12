import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth";
import { authorize, ROLES } from "@/lib/middleware/authorization";
import { statusSchema, validationErrors } from "@/lib/validation/employee-validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);
    if (!authorize(user, ROLES.ADMIN)) return errorResponse("Forbidden. Admin access required.", 403);

    const { id } = await ctx.params;

    if (id === user.id) {
      return errorResponse("Cannot change your own status", 400);
    }

    const body = await req.json();
    const result = statusSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Validation Error", 400, validationErrors(result.error));
    }

    const employee = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!employee) return errorResponse("Employee not found", 404);

    const { status } = result.data;
    if (employee.status === status) {
      return errorResponse(`Employee already has status: ${status}`, 400);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        status,
        isActive: status === "ACTIVE",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        employeeId: true,
        role: true,
        status: true,
        isActive: true,
      },
    });

    await Promise.all([
      prisma.activityLog.create({
        data: {
          userId: user.id,
          action: `EMPLOYEE_STATUS_${status}`,
          entity: "USER",
          entityId: id,
        },
      }),
      prisma.auditLog.create({
        data: {
          action: "STATUS_CHANGED",
          performedBy: user.id,
          targetId: id,
          entity: "USER",
          metadata: JSON.stringify({
            oldStatus: employee.status,
            newStatus: status,
          }),
        },
      }),
    ]);

    return successResponse({ employee: updated, message: `Status changed to ${status}` });
  } catch (error) {
    console.error("Status error:", error);
    return errorResponse("Internal server error", 500);
  }
}
