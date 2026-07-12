import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth";
import { authorize, ROLES } from "@/lib/middleware/authorization";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const isAdmin = authorize(user, ROLES.ADMIN);
    const isHR = authorize(user, ROLES.HR);
    const isManager = authorize(user, ROLES.MANAGER);

    if (!isAdmin && !isHR && !isManager) {
      return errorResponse("Forbidden", 403);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "25"), 100);
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (isManager && !isAdmin && !isHR) {
      where.departmentId = user.id;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { employeeId: { contains: search } },
      ];
    }

    if (department) where.departmentId = department;
    if (role) where.role = role;
    if (status) where.status = status;

    const orderBy: any = {};
    const validSortFields = ["createdAt", "firstName", "lastName", "employeeId", "role", "status"];
    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = "desc";
    }

    const [employees, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
          createdAt: true,
          joinedAt: true,
          approvedAt: true,
          departmentRef: { select: { id: true, name: true, code: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return successResponse({
      employees,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Users GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}
