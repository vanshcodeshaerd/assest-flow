import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth";
import { authorize, ROLE_GROUPS } from "@/lib/middleware/authorization";
import { transferAssetSchema, validationErrors } from "@/lib/validation/asset-validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);
    if (!authorize(user, ...ROLE_GROUPS.MANAGEMENT)) return errorResponse("Forbidden", 403);

    const { id } = await ctx.params;
    const body = await req.json();
    const result = transferAssetSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation Error", 400, validationErrors(result.error));

    const { toEmployeeId, toDepartmentId, toLocation, reason } = result.data;

    if (!toEmployeeId && !toDepartmentId && !toLocation) {
      return errorResponse("At least one transfer target is required", 400);
    }

    const asset = await prisma.asset.findFirst({
      where: { id, deletedAt: null },
      include: {
        allocations: {
          where: { status: "ACTIVE" },
          include: { holder: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });
    if (!asset) return errorResponse("Asset not found", 404);

    const nonTransferable = ["LOST", "RETIRED", "DISPOSED", "ARCHIVED"];
    if (nonTransferable.includes(asset.status)) {
      return errorResponse(`Cannot transfer asset with status: ${asset.status}`, 400);
    }

    const currentAllocation = asset.allocations[0];
    const updateData: Record<string, unknown> = {};

    if (toEmployeeId) {
      const newHolder = await prisma.user.findFirst({
        where: { id: toEmployeeId, deletedAt: null, status: "ACTIVE" },
      });
      if (!newHolder) return errorResponse("Target employee not found or inactive", 404);
      updateData.assignedTo = toEmployeeId;
    }
    if (toDepartmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: toDepartmentId, deletedAt: null },
      });
      if (!dept) return errorResponse("Target department not found", 404);
      updateData.departmentId = toDepartmentId;
    }
    if (toLocation) {
      updateData.location = toLocation;
    }

    const ops: unknown[] = [
      prisma.assetTransfer.create({
        data: {
          assetId: id,
          fromEmployeeId: currentAllocation?.holder.id || asset.assignedTo || null,
          toEmployeeId: toEmployeeId || null,
          fromDepartmentId: asset.departmentId || null,
          toDepartmentId: toDepartmentId || null,
          fromLocation: asset.location || null,
          toLocation: toLocation || null,
          reason: reason || null,
          approvedBy: user.id,
        },
      }),
      prisma.asset.update({ where: { id }, data: updateData }),
      prisma.assetTimeline.create({
        data: {
          assetId: id,
          event: "ASSET_TRANSFERRED",
          performedBy: user.id,
          metadata: JSON.stringify({ toEmployeeId, toDepartmentId, toLocation, reason }),
        },
      }),
      prisma.activityLog.create({
        data: { userId: user.id, action: "ASSET_TRANSFERRED", entity: "ASSET", entityId: id },
      }),
    ];

    if (toEmployeeId && currentAllocation) {
      ops.push(
        prisma.allocation.update({
          where: { id: currentAllocation.id },
          data: { status: "TRANSFERRED", returnedAt: new Date() },
        }),
        prisma.allocation.create({
          data: {
            assetId: id,
            holderId: toEmployeeId,
            allocatedBy: user.id,
            status: "ACTIVE",
          },
        })
      );
    } else if (toEmployeeId && !currentAllocation) {
      ops.push(
        prisma.allocation.create({
          data: {
            assetId: id,
            holderId: toEmployeeId,
            allocatedBy: user.id,
            status: "ACTIVE",
          },
        })
      );
      updateData.status = "ALLOCATED";
      ops.push(prisma.asset.update({ where: { id }, data: { status: "ALLOCATED" } }));
    }

    await prisma.$transaction(ops as any);

    return successResponse({ message: "Asset transferred successfully" });
  } catch (error) {
    console.error("Transfer asset error:", error);
    return errorResponse("Internal server error", 500);
  }
}
