import { requireAuth, successResponse, errorResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/auth/me
 * 
 * Get current user endpoint
 * - Requires authentication
 * - Verifies access token
 * - Returns current user data
 * - Excludes sensitive fields (passwordHash, etc.)
 */
export async function GET(req: Request) {
  try {
    // Verify authentication
    const user = await requireAuth(req);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Fetch full user data
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        email: true,
        department: true,
        phone: true,
        role: true,
        status: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!fullUser) {
      return errorResponse("User not found", 404);
    }

    return successResponse({ user: fullUser });
  } catch (error) {
    console.error("Get current user error:", error);
    return errorResponse("Internal server error", 500);
  }
}
