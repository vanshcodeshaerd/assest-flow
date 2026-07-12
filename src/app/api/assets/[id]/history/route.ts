import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await ctx.params;

    const asset = await prisma.asset.findFirst({ where: { id, deletedAt: null } });
    if (!asset) return errorResponse("Asset not found", 404);

    const timeline = await prisma.assetTimeline.findMany({
      where: { assetId: id },
      orderBy: { createdAt: "desc" },
    });

    return successResponse({ timeline });
  } catch (error) {
    console.error("Get asset history error:", error);
    return errorResponse("Internal server error", 500);
  }
}
