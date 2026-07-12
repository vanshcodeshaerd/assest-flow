import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth";
import { authorize, ROLES } from "@/lib/middleware/authorization";
import { updateCategorySchema, validationErrors } from "@/lib/validation/category-validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);
    if (!authorize(user, ROLES.ADMIN)) return errorResponse("Forbidden", 403);

    const { id } = await ctx.params;

    const category = await prisma.assetCategory.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { assets: true } } },
    });

    if (!category) return errorResponse("Category not found", 404);

    return successResponse({ category });
  } catch (error) {
    console.error("Category GET error:", error);
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

    const result = updateCategorySchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Validation Error", 400, validationErrors(result.error));
    }

    const existing = await prisma.assetCategory.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return errorResponse("Category not found", 404);

    const { name, code, description, status } = result.data;

    if (name && name !== existing.name) {
      const conflict = await prisma.assetCategory.findFirst({
        where: { name, deletedAt: null, NOT: { id } },
      });
      if (conflict) return errorResponse("Category name already exists", 409);
    }

    if (code && code !== existing.code) {
      const conflict = await prisma.assetCategory.findFirst({
        where: { code, deletedAt: null, NOT: { id } },
      });
      if (conflict) return errorResponse("Category code already exists", 409);
    }

    const category = await prisma.assetCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "CATEGORY_UPDATED",
        entity: "CATEGORY",
        entityId: category.id,
      },
    });

    return successResponse({ category });
  } catch (error) {
    console.error("Category PATCH error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);
    if (!authorize(user, ROLES.ADMIN)) return errorResponse("Forbidden", 403);

    const { id } = await ctx.params;

    const existing = await prisma.assetCategory.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { assets: true } } },
    });
    if (!existing) return errorResponse("Category not found", 404);

    if (existing._count.assets > 0) {
      return errorResponse("Cannot delete category with active assets", 400);
    }

    await prisma.assetCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "CATEGORY_ARCHIVED",
        entity: "CATEGORY",
        entityId: id,
      },
    });

    return successResponse({ message: "Category archived successfully" });
  } catch (error) {
    console.error("Category DELETE error:", error);
    return errorResponse("Internal server error", 500);
  }
}
