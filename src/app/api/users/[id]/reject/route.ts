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
      return errorResponse(`Cannot reject employee with status: ${employee.status}`, 400);
    }

    const body = await req.json().catch(() => ({}));
    const reason = (body as any)?.reason || "";

    const updated = await prisma.user.update({
      where: { id },
      data: {
        status: "REJECTED",
        isActive: false,
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
          action: "EMPLOYEE_REJECTED",
          entity: "USER",
          entityId: id,
        },
      }),
      prisma.auditLog.create({
        data: {
          action: "EMPLOYEE_REJECTED",
          performedBy: user.id,
          targetId: id,
          entity: "USER",
          metadata: JSON.stringify({
            employeeName: `${employee.firstName} ${employee.lastName}`,
            reason,
          }),
        },
      }),
    ]);

    return successResponse({ employee: updated, message: "Employee rejected" });
  } catch (error) {
    console.error("Reject error:", error);
    return errorResponse("Internal server error", 500);
  }
}
