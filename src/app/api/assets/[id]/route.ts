import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth";
import { authorize, ROLE_GROUPS } from "@/lib/middleware/authorization";
import { updateAssetSchema, validationErrors } from "@/lib/validation/asset-validation";
import { computeAssetScores } from "@/lib/services/asset-ai";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await ctx.params;

    const asset = await prisma.asset.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true } },
        allocations: {
          orderBy: { allocatedDate: "desc" },
          take: 10,
          include: { holder: { select: { id: true, firstName: true, lastName: true, email: true, employeeId: true } } },
        },
        maintenance: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        transfers: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        documents: {
          orderBy: { uploadedAt: "desc" },
        },
        timeline: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!asset) return errorResponse("Asset not found", 404);

    const scores = await computeAssetScores(asset.id);

    return successResponse({ asset: { ...asset, ai: scores } });
  } catch (error) {
    console.error("Get asset error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);
    if (!authorize(user, ...ROLE_GROUPS.MANAGEMENT)) return errorResponse("Forbidden", 403);

    const { id } = await ctx.params;

    const asset = await prisma.asset.findFirst({ where: { id, deletedAt: null } });
    if (!asset) return errorResponse("Asset not found", 404);

    const body = await req.json();
    const result = updateAssetSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation Error", 400, validationErrors(result.error));

    const data = result.data;

    if (data.serialNumber && data.serialNumber !== asset.serialNumber) {
      const existing = await prisma.asset.findFirst({
        where: { serialNumber: data.serialNumber, id: { not: id }, deletedAt: null },
      });
      if (existing) return errorResponse("Serial number already exists", 409);
    }

    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        if (key === "purchaseDate" || key === "warrantyExpiry") {
          updateData[key] = value ? new Date(value as string) : null;
        } else {
          updateData[key] = value;
        }
      }
    }

    const updated = await prisma.asset.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true } },
      },
    });

    await Promise.all([
      prisma.assetTimeline.create({
        data: {
          assetId: id,
          event: "ASSET_UPDATED",
          performedBy: user.id,
          metadata: JSON.stringify(Object.keys(data)),
        },
      }),
      prisma.activityLog.create({
        data: { userId: user.id, action: "ASSET_UPDATED", entity: "ASSET", entityId: id },
      }),
    ]);

    return successResponse({ asset: updated });
  } catch (error) {
    console.error("Update asset error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);
    if (!authorize(user, ...ROLE_GROUPS.ADMIN_ONLY)) return errorResponse("Forbidden", 403);

    const { id } = await ctx.params;

    const asset = await prisma.asset.findFirst({ where: { id, deletedAt: null } });
    if (!asset) return errorResponse("Asset not found", 404);

    if (asset.status === "ALLOCATED") {
      return errorResponse("Cannot delete an allocated asset. Return it first.", 400);
    }

    await prisma.asset.update({
      where: { id },
      data: { deletedAt: new Date(), status: "ARCHIVED" },
    });

    await Promise.all([
      prisma.assetTimeline.create({
        data: { assetId: id, event: "ASSET_ARCHIVED", performedBy: user.id },
      }),
      prisma.activityLog.create({
        data: { userId: user.id, action: "ASSET_ARCHIVED", entity: "ASSET", entityId: id },
      }),
    ]);

    return successResponse({ message: "Asset archived" });
  } catch (error) {
    console.error("Delete asset error:", error);
    return errorResponse("Internal server error", 500);
  }
}
