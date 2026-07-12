import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth";
import { authorize, ROLE_GROUPS } from "@/lib/middleware/authorization";
import { returnAssetSchema, validationErrors } from "@/lib/validation/asset-validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);
    if (!authorize(user, ...ROLE_GROUPS.MANAGEMENT)) return errorResponse("Forbidden", 403);

    const { id } = await ctx.params;
    const body = await req.json();
    const result = returnAssetSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation Error", 400, validationErrors(result.error));

    const asset = await prisma.asset.findFirst({ where: { id, deletedAt: null } });
    if (!asset) return errorResponse("Asset not found", 404);
    if (asset.status !== "ALLOCATED") return errorResponse("Asset is not currently allocated", 400);

    const activeAllocation = await prisma.allocation.findFirst({
      where: { assetId: id, status: "ACTIVE" },
      include: { holder: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!activeAllocation) return errorResponse("No active allocation found", 400);

    const { condition, notes } = result.data;

    await prisma.$transaction([
      prisma.allocation.update({
        where: { id: activeAllocation.id },
        data: {
          status: "RETURNED",
          returnedAt: new Date(),
          returnDate: new Date(),
          notes: notes ? `${activeAllocation.notes || ""}\nReturn: ${notes}`.trim() : activeAllocation.notes,
        },
      }),
      prisma.asset.update({
        where: { id },
        data: {
          status: "AVAILABLE",
          assignedTo: null,
          condition: condition || asset.condition,
        },
      }),
      prisma.assetTimeline.create({
        data: {
          assetId: id,
          event: "ASSET_RETURNED",
          performedBy: user.id,
          metadata: JSON.stringify({
            returnedFrom: `${activeAllocation.holder.firstName} ${activeAllocation.holder.lastName}`,
            condition: condition || asset.condition,
          }),
        },
      }),
      prisma.activityLog.create({
        data: { userId: user.id, action: "ASSET_RETURNED", entity: "ASSET", entityId: id },
      }),
    ]);

    return successResponse({ message: "Asset returned successfully" });
  } catch (error) {
    console.error("Return asset error:", error);
    return errorResponse("Internal server error", 500);
  }
}
