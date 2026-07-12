import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth";
import { authorize, ROLE_GROUPS } from "@/lib/middleware/authorization";
import { maintenanceSchema, validationErrors } from "@/lib/validation/asset-validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);
    if (!authorize(user, ...ROLE_GROUPS.MANAGEMENT)) return errorResponse("Forbidden", 403);

    const { id } = await ctx.params;
    const body = await req.json();
    const result = maintenanceSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation Error", 400, validationErrors(result.error));

    const asset = await prisma.asset.findFirst({ where: { id, deletedAt: null } });
    if (!asset) return errorResponse("Asset not found", 404);

    if (asset.status === "ALLOCATED") {
      await prisma.asset.update({ where: { id }, data: { status: "MAINTENANCE" } });
      const activeAlloc = await prisma.allocation.findFirst({
        where: { assetId: id, status: "ACTIVE" },
      });
      if (activeAlloc) {
        await prisma.allocation.update({
          where: { id: activeAlloc.id },
          data: { status: "RETURNED", returnedAt: new Date() },
        });
      }
    } else {
      await prisma.asset.update({ where: { id }, data: { status: "MAINTENANCE" } });
    }

    const data = result.data;
    const maintenance = await prisma.maintenanceRequest.create({
      data: {
        assetId: id,
        raisedById: user.id,
        type: data.type,
        priority: data.priority,
        description: data.description,
        vendor: data.vendor || null,
        engineer: data.engineer || null,
        cost: data.cost ?? null,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
        beforeCondition: data.beforeCondition || asset.condition,
        status: "SCHEDULED",
      },
    });

    await Promise.all([
      prisma.assetTimeline.create({
        data: {
          assetId: id,
          event: "MAINTENANCE_CREATED",
          performedBy: user.id,
          metadata: JSON.stringify({ type: data.type, priority: data.priority }),
        },
      }),
      prisma.activityLog.create({
        data: { userId: user.id, action: "MAINTENANCE_CREATED", entity: "ASSET", entityId: id },
      }),
    ]);

    return successResponse({ maintenance, message: "Maintenance request created" }, 201);
  } catch (error) {
    console.error("Create maintenance error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await ctx.params;

    const records = await prisma.maintenanceRequest.findMany({
      where: { assetId: id },
      orderBy: { createdAt: "desc" },
      include: {
        raisedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return successResponse({ maintenance: records });
  } catch (error) {
    console.error("Get maintenance error:", error);
    return errorResponse("Internal server error", 500);
  }
}
