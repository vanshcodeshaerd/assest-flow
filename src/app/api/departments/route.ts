import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth";
import { authorize, ROLES } from "@/lib/middleware/authorization";
import { departmentSchema, validationErrors } from "@/lib/validation/department-validation";

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

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        include: {
          departmentHead: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: { select: { users: true, assets: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.department.count({ where }),
    ]);

    return successResponse({
      departments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Departments GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);
    if (!authorize(user, ROLES.ADMIN)) return errorResponse("Forbidden", 403);

    const body = await req.json();
    const result = departmentSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Validation Error", 400, validationErrors(result.error));
    }

    const { name, code, description, headId, status } = result.data;

    const existing = await prisma.department.findFirst({
      where: {
        OR: [{ name }, { code }],
        deletedAt: null,
      },
    });

    if (existing) {
      const field = existing.name === name ? "name" : "code";
      return errorResponse(`Department ${field} already exists`, 409);
    }

    const department = await prisma.department.create({
      data: { name, code, description, headId, status, createdBy: user.id },
      include: {
        departmentHead: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "DEPARTMENT_CREATED",
        entity: "DEPARTMENT",
        entityId: department.id,
      },
    });

    return successResponse({ department }, 201);
  } catch (error) {
    console.error("Department POST error:", error);
    return errorResponse("Internal server error", 500);
  }
}
