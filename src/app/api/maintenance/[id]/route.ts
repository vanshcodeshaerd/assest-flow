import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth";
import { authorize, ROLE_GROUPS } from "@/lib/middleware/authorization";
import { updateMaintenanceSchema, validationErrors } from "@/lib/validation/asset-validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await ctx.params;

    const record = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        asset: { select: { id: true, assetId: true, name: true } },
        raisedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!record) return errorResponse("Maintenance record not found", 404);
    return successResponse({ maintenance: record });
  } catch (error) {
    console.error("Get maintenance error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);
    if (!authorize(user, ...ROLE_GROUPS.MANAGEMENT)) return errorResponse("Forbidden", 403);

    const { id } = await ctx.params;
    const body = await req.json();
    const result = updateMaintenanceSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation Error", 400, validationErrors(result.error));

    const record = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: { asset: true },
    });
    if (!record) return errorResponse("Maintenance record not found", 404);

    const data = result.data;
    const updateData: Record<string, unknown> = {};

    if (data.status) updateData.status = data.status;
    if (data.cost !== undefined) updateData.cost = data.cost;
    if (data.afterCondition) updateData.afterCondition = data.afterCondition;
    if (data.description) updateData.description = data.description;
    if (data.vendor !== undefined) updateData.vendor = data.vendor;
    if (data.engineer !== undefined) updateData.engineer = data.engineer;
    if (data.completedDate) updateData.completedDate = new Date(data.completedDate);

    if (data.status === "COMPLETED") {
      updateData.completedDate = updateData.completedDate || new Date();
      await prisma.asset.update({
        where: { id: record.assetId },
        data: {
          status: "AVAILABLE",
          condition: data.afterCondition || record.asset.condition,
        },
      });

      await prisma.assetTimeline.create({
        data: {
          assetId: record.assetId,
          event: "MAINTENANCE_COMPLETED",
          performedBy: user.id,
          metadata: JSON.stringify({ type: record.type, cost: data.cost || record.cost }),
        },
      });
    }

    if (data.status === "IN_PROGRESS") {
      await prisma.assetTimeline.create({
        data: {
          assetId: record.assetId,
          event: "MAINTENANCE_IN_PROGRESS",
          performedBy: user.id,
        },
      });
    }

    if (data.status === "CANCELLED") {
      await prisma.asset.update({
        where: { id: record.assetId },
        data: { status: "AVAILABLE" },
      });
      await prisma.assetTimeline.create({
        data: {
          assetId: record.assetId,
          event: "MAINTENANCE_CANCELLED",
          performedBy: user.id,
        },
      });
    }

    const updated = await prisma.maintenanceRequest.update({
      where: { id },
      data: updateData,
    });

    await prisma.activityLog.create({
      data: { userId: user.id, action: `MAINTENANCE_${data.status || "UPDATED"}`, entity: "MAINTENANCE", entityId: id },
    });

    return successResponse({ maintenance: updated });
  } catch (error) {
    console.error("Update maintenance error:", error);
    return errorResponse("Internal server error", 500);
  }
}
