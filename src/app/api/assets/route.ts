import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth";
import { authorize, ROLE_GROUPS } from "@/lib/middleware/authorization";
import { createAssetSchema, validationErrors } from "@/lib/validation/asset-validation";
import { generateAssetId } from "@/lib/services/asset-id";
import { computeAssetScores } from "@/lib/services/asset-ai";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const categoryId = url.searchParams.get("categoryId");
    const departmentId = url.searchParams.get("departmentId");
    const status = url.searchParams.get("status");
    const condition = url.searchParams.get("condition");
    const riskScore = url.searchParams.get("riskScore");
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "25")));

    const where: Record<string, unknown> = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { assetId: { contains: search } },
        { assetTag: { contains: search } },
        { serialNumber: { contains: search } },
        { brand: { contains: search } },
        { vendor: { contains: search } },
        { location: { contains: search } },
      ];
    }

    if (categoryId) where.categoryId = categoryId;
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;
    if (condition) where.condition = condition;
    if (riskScore) where.riskScore = riskScore;

    const allowedSortFields = ["name", "assetId", "createdAt", "purchaseDate", "purchaseCost", "status", "condition", "healthScore"];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, code: true } },
          department: { select: { id: true, name: true } },
        },
        orderBy: { [orderField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.asset.count({ where }),
    ]);

    return successResponse({
      assets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List assets error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) return errorResponse("Unauthorized", 401);
    if (!authorize(user, ...ROLE_GROUPS.MANAGEMENT)) return errorResponse("Forbidden", 403);

    const body = await req.json();
    const result = createAssetSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation Error", 400, validationErrors(result.error));

    const data = result.data;

    const [existingTag, existingSerial] = await Promise.all([
      prisma.asset.findFirst({ where: { assetTag: data.assetTag, deletedAt: null } }),
      data.serialNumber
        ? prisma.asset.findFirst({ where: { serialNumber: data.serialNumber, deletedAt: null } })
        : null,
    ]);

    if (existingTag) return errorResponse("Asset tag already exists", 409);
    if (existingSerial) return errorResponse("Serial number already exists", 409);

    const category = await prisma.assetCategory.findUnique({
      where: { id: data.categoryId },
      select: { code: true, status: true },
    });
    if (!category || category.status !== "ACTIVE") return errorResponse("Invalid or inactive category", 400);

    const assetId = await generateAssetId(category.code);

    const asset = await prisma.asset.create({
      data: {
        assetId,
        assetTag: data.assetTag,
        name: data.name,
        serialNumber: data.serialNumber || null,
        categoryId: data.categoryId,
        departmentId: data.departmentId || null,
        brand: data.brand || null,
        model: data.model || null,
        manufacturer: data.manufacturer || null,
        vendor: data.vendor || null,
        description: data.description || null,
        notes: data.notes || null,
        location: data.location || null,
        storageRoom: data.storageRoom || null,
        assignedManager: data.assignedManager || null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchaseCost: data.purchaseCost ?? null,
        warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
        condition: data.condition,
        status: data.status,
      },
      include: {
        category: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true } },
      },
    });

    await Promise.all([
      prisma.assetTimeline.create({
        data: {
          assetId: asset.id,
          event: "ASSET_REGISTERED",
          performedBy: user.id,
          metadata: JSON.stringify({ assetId: asset.assetId, name: asset.name }),
        },
      }),
      prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "ASSET_REGISTERED",
          entity: "ASSET",
          entityId: asset.id,
        },
      }),
    ]);

    await computeAssetScores(asset.id);

    const updated = await prisma.asset.findUnique({
      where: { id: asset.id },
      include: {
        category: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true } },
      },
    });

    return successResponse({ asset: updated }, 201);
  } catch (error) {
    console.error("Create asset error:", error);
    return errorResponse("Internal server error", 500);
  }
}
