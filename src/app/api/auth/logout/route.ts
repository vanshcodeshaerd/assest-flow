import { deleteSession, requireAuth, successResponse, errorResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/auth/logout
 * 
 * Logout endpoint
 * - Requires authentication
 * - Revokes refresh token from database
 * - Clears HTTP-only cookie
 * - Invalidates current session
 * - Logs logout activity
 */
export async function POST(req: Request) {
  try {
    // Verify authentication
    const user = await requireAuth(req);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Revoke refresh token and clear cookies
    await deleteSession();

    // Log logout activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "LOGOUT",
        entity: "USER",
        entityId: user.id,
      },
    });

    return successResponse({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return errorResponse("Internal server error", 500);
  }
}
