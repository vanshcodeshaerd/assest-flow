import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "25");
    const status = url.searchParams.get("status");
    const type = url.searchParams.get("type");
    const priority = url.searchParams.get("priority");
    const search = url.searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { description: { contains: search } },
        { asset: { name: { contains: search } } },
        { asset: { assetId: { contains: search } } },
      ];
    }

    const [records, total] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        where,
        include: {
          asset: { select: { id: true, assetId: true, name: true, status: true } },
          raisedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.maintenanceRequest.count({ where }),
    ]);

    const statusCounts = await prisma.maintenanceRequest.groupBy({
      by: ["status"],
      _count: true,
    });

    const stats = {
      total,
      pending: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const s of statusCounts) {
      if (s.status === "PENDING") stats.pending = s._count;
      else if (s.status === "IN_PROGRESS") stats.inProgress = s._count;
      else if (s.status === "COMPLETED") stats.completed = s._count;
      else if (s.status === "CANCELLED") stats.cancelled = s._count;
    }

    return successResponse({
      records,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List maintenance error:", error);
    return errorResponse("Internal server error", 500);
  }
}
