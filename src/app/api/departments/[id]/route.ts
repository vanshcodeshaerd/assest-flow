import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth";
import { authorize, ROLES } from "@/lib/middleware/authorization";
import { updateDepartmentSchema, validationErrors } from "@/lib/validation/department-validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);
    if (!authorize(user, ROLES.ADMIN)) return errorResponse("Forbidden", 403);

    const { id } = await ctx.params;

    const department = await prisma.department.findFirst({
      where: { id, deletedAt: null },
      include: {
        departmentHead: { select: { id: true, firstName: true, lastName: true, email: true } },
        parentDepartment: { select: { id: true, name: true } },
        subDepartments: { select: { id: true, name: true } },
        _count: { select: { users: true, assets: true } },
      },
    });

    if (!department) return errorResponse("Department not found", 404);

    return successResponse({ department });
  } catch (error) {
    console.error("Department GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);
    if (!authorize(user, ROLES.ADMIN)) return errorResponse("Forbidden", 403);

    const { id } = await ctx.params;
    const body = await req.json();

    const result = updateDepartmentSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Validation Error", 400, validationErrors(result.error));
    }

    const existing = await prisma.department.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return errorResponse("Department not found", 404);

    const { name, code, description, headId, status } = result.data;

    if (name && name !== existing.name) {
      const conflict = await prisma.department.findFirst({
        where: { name, deletedAt: null, NOT: { id } },
      });
      if (conflict) return errorResponse("Department name already exists", 409);
    }

    if (code && code !== existing.code) {
      const conflict = await prisma.department.findFirst({
        where: { code, deletedAt: null, NOT: { id } },
      });
      if (conflict) return errorResponse("Department code already exists", 409);
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(description !== undefined && { description }),
        ...(headId !== undefined && { headId }),
        ...(status !== undefined && { status }),
      },
      include: {
        departmentHead: { select: { id: true, firstName: true, lastName: true, email: true } },
        parentDepartment: { select: { id: true, name: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "DEPARTMENT_UPDATED",
        entity: "DEPARTMENT",
        entityId: department.id,
      },
    });

    return successResponse({ department });
  } catch (error) {
    console.error("Department PATCH error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);
    if (!authorize(user, ROLES.ADMIN)) return errorResponse("Forbidden", 403);

    const { id } = await ctx.params;

    const existing = await prisma.department.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { users: true, assets: true } } },
    });
    if (!existing) return errorResponse("Department not found", 404);

    if (existing._count.users > 0 || existing._count.assets > 0) {
      return errorResponse("Cannot delete department with active users or assets", 400);
    }

    await prisma.department.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "DEPARTMENT_ARCHIVED",
        entity: "DEPARTMENT",
        entityId: id,
      },
    });

    return successResponse({ message: "Department archived successfully" });
  } catch (error) {
    console.error("Department DELETE error:", error);
    return errorResponse("Internal server error", 500);
  }
}
