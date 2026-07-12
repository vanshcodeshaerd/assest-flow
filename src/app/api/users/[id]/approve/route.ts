import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth";
import { authorize, ROLES } from "@/lib/middleware/authorization";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);
    if (!authorize(user, ROLES.ADMIN)) return errorResponse("Forbidden. Admin access required.", 403);

    const { id } = await ctx.params;

    const employee = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!employee) return errorResponse("Employee not found", 404);

    if (employee.status !== "PENDING") {
      return errorResponse(`Cannot approve employee with status: ${employee.status}`, 400);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        status: "ACTIVE",
        isActive: true,
        approvedBy: user.id,
        approvedAt: new Date(),
        joinedAt: new Date(),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        employeeId: true,
        role: true,
        status: true,
      },
    });

    await Promise.all([
      prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "EMPLOYEE_APPROVED",
          entity: "USER",
          entityId: id,
        },
      }),
      prisma.auditLog.create({
        data: {
          action: "EMPLOYEE_APPROVED",
          performedBy: user.id,
          targetId: id,
          entity: "USER",
          metadata: JSON.stringify({
            employeeName: `${employee.firstName} ${employee.lastName}`,
            employeeEmail: employee.email,
          }),
        },
      }),
    ]);

    return successResponse({ employee: updated, message: "Employee approved successfully" });
  } catch (error) {
    console.error("Approve error:", error);
    return errorResponse("Internal server error", 500);
  }
}
