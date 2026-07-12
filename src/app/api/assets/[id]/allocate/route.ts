import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth";
import { authorize, ROLE_GROUPS } from "@/lib/middleware/authorization";
import { allocateAssetSchema, validationErrors } from "@/lib/validation/asset-validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);
    if (!authorize(user, ...ROLE_GROUPS.MANAGEMENT)) return errorResponse("Forbidden", 403);

    const { id } = await ctx.params;
    const body = await req.json();
    const result = allocateAssetSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation Error", 400, validationErrors(result.error));

    const { employeeId, expectedReturn, notes } = result.data;

    const asset = await prisma.asset.findFirst({ where: { id, deletedAt: null } });
    if (!asset) return errorResponse("Asset not found", 404);

    const nonAllocatable = ["LOST", "DAMAGED", "RETIRED", "DISPOSED", "ARCHIVED", "ALLOCATED", "MAINTENANCE"];
    if (nonAllocatable.includes(asset.status)) {
      return errorResponse(`Cannot allocate asset with status: ${asset.status}`, 400);
    }

    const employee = await prisma.user.findFirst({
      where: { id: employeeId, deletedAt: null, status: "ACTIVE" },
    });
    if (!employee) return errorResponse("Employee not found or inactive", 404);

    const [allocation] = await prisma.$transaction([
      prisma.allocation.create({
        data: {
          assetId: id,
          holderId: employeeId,
          allocatedBy: user.id,
          expectedReturn: expectedReturn ? new Date(expectedReturn) : null,
          notes: notes || null,
          status: "ACTIVE",
        },
        include: {
          holder: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.asset.update({
        where: { id },
        data: { status: "ALLOCATED", assignedTo: employeeId },
      }),
      prisma.assetTimeline.create({
        data: {
          assetId: id,
          event: "ASSET_ALLOCATED",
          performedBy: user.id,
          metadata: JSON.stringify({
            employeeId,
            employeeName: `${employee.firstName} ${employee.lastName}`,
          }),
        },
      }),
      prisma.activityLog.create({
        data: { userId: user.id, action: "ASSET_ALLOCATED", entity: "ASSET", entityId: id },
      }),
      prisma.notification.create({
        data: {
          userId: employeeId,
          title: "Asset Allocated",
          description: `Asset "${asset.name}" (${asset.assetId}) has been allocated to you.`,
        },
      }),
    ]);

    return successResponse({ allocation, message: "Asset allocated successfully" }, 201);
  } catch (error) {
    console.error("Allocate asset error:", error);
    return errorResponse("Internal server error", 500);
  }
}
