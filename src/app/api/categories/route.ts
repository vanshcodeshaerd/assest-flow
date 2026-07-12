import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth";
import { authorize, ROLES } from "@/lib/middleware/authorization";
import { categorySchema, validationErrors } from "@/lib/validation/category-validation";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);
    if (!authorize(user, ROLES.ADMIN)) return errorResponse("Forbidden", 403);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "25");
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [categories, total] = await Promise.all([
      prisma.assetCategory.findMany({
        where,
        include: { _count: { select: { assets: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.assetCategory.count({ where }),
    ]);

    return successResponse({
      categories,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Categories GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);
    if (!authorize(user, ROLES.ADMIN)) return errorResponse("Forbidden", 403);

    const body = await req.json();
    const result = categorySchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Validation Error", 400, validationErrors(result.error));
    }

    const { name, code, description, status } = result.data;

    const existing = await prisma.assetCategory.findFirst({
      where: {
        OR: [
          { name: { equals: name } },
          { code: { equals: code } },
        ],
        deletedAt: null,
      },
    });

    if (existing) {
      const field = existing.name === name ? "name" : "code";
      return errorResponse(`Category ${field} already exists`, 409);
    }

    const category = await prisma.assetCategory.create({
      data: { name, code, description, status },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "CATEGORY_CREATED",
        entity: "CATEGORY",
        entityId: category.id,
      },
    });

    return successResponse({ category }, 201);
  } catch (error) {
    console.error("Category POST error:", error);
    return errorResponse("Internal server error", 500);
  }
}
