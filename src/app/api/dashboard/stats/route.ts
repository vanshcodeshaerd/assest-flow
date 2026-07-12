import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth";
import { authorize, ROLES } from "@/lib/middleware/authorization";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);
    if (!authorize(user, ROLES.ADMIN)) return errorResponse("Forbidden", 403);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalEmployees,
      pendingApprovals,
      totalDepartments,
      totalCategories,
      totalManagers,
      totalHR,
      recentlyJoined,
      recentActivities,
      statusCounts,
      totalAssets,
      availableAssets,
      allocatedAssets,
      maintenanceAssets,
      damagedAssets,
      lostAssets,
      retiredAssets,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { status: "PENDING", deletedAt: null } }),
      prisma.department.count({ where: { deletedAt: null, status: "ACTIVE" } }),
      prisma.assetCategory.count({ where: { deletedAt: null, status: "ACTIVE" } }),
      prisma.user.count({ where: { role: "MANAGER", deletedAt: null } }),
      prisma.user.count({ where: { role: "HR", deletedAt: null } }),
      prisma.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          departmentRef: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.activityLog.findMany({
        orderBy: { timestamp: "desc" },
        take: 15,
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          timestamp: true,
          user: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.user.groupBy({
        by: ["status"],
        where: { deletedAt: null },
        _count: true,
      }),
      prisma.asset.count({ where: { deletedAt: null } }),
      prisma.asset.count({ where: { deletedAt: null, status: "AVAILABLE" } }),
      prisma.asset.count({ where: { deletedAt: null, status: "ALLOCATED" } }),
      prisma.asset.count({ where: { deletedAt: null, status: "MAINTENANCE" } }),
      prisma.asset.count({ where: { deletedAt: null, status: "DAMAGED" } }),
      prisma.asset.count({ where: { deletedAt: null, status: "LOST" } }),
      prisma.asset.count({ where: { deletedAt: null, status: "RETIRED" } }),
    ]);

    const statusMap = Object.fromEntries(
      statusCounts.map((s) => [s.status, s._count])
    );

    return successResponse({
      stats: {
        totalEmployees,
        pendingApprovals,
        totalDepartments,
        totalCategories,
        totalManagers,
        totalHR,
        activeEmployees: statusMap.ACTIVE || 0,
        inactiveEmployees: statusMap.INACTIVE || 0,
        suspendedEmployees: statusMap.SUSPENDED || 0,
        rejectedEmployees: statusMap.REJECTED || 0,
        totalAssets,
        availableAssets,
        allocatedAssets,
        maintenanceAssets,
        damagedAssets,
        lostAssets,
        retiredAssets,
      },
      recentlyJoined,
      recentActivities,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return errorResponse("Internal server error", 500);
  }
}
