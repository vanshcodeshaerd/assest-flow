import { rotateRefreshToken, getRefreshTokenFromCookie, successResponse, errorResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/auth/refresh
 * 
 * Refresh token endpoint
 * - Gets refresh token from HTTP-only cookie
 * - Verifies token hash in database
 * - Checks expiration and revocation status
 * - Rotates refresh token (old becomes invalid)
 * - Issues new access token
 * - Returns new accessToken
 */
export async function POST(req: Request) {
  try {
    // Get refresh token from cookie
    const refreshToken = await getRefreshTokenFromCookie();
    
    if (!refreshToken) {
      return errorResponse("No refresh token provided", 401);
    }

    // Rotate refresh token and get new access token
    const result = await rotateRefreshToken(refreshToken);
    
    if (!result) {
      return errorResponse("Invalid or expired refresh token", 401);
    }

    // Log token refresh activity
    await prisma.activityLog.create({
      data: {
        userId: result.user.id,
        action: "TOKEN_REFRESH",
        entity: "USER",
        entityId: result.user.id,
      },
    });

    return successResponse({
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        employeeId: result.user.employeeId,
        role: result.user.role,
      },
      accessToken: result.accessToken,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return errorResponse("Internal server error", 500);
  }
}
