import { hashToken, hashPassword, successResponse, errorResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema, validationErrors } from "@/lib/auth-validation";

/**
 * POST /api/auth/reset-password
 * 
 * Reset password endpoint
 * - Validates token and new password using Zod
 * - Verifies token hash and expiration
 * - Checks if token already used
 * - Hashes new password
 * - Updates user password
 * - Marks token as used
 * - Logs password change
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate request body
    const validationResult = resetPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(
        "Validation Error",
        400,
        validationErrors(validationResult.error)
      );
    }

    const { token, password } = validationResult.data;

    // Hash the token to compare with database
    const tokenHash = hashToken(token);

    // Find valid password reset record
    const passwordReset = await prisma.passwordReset.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!passwordReset) {
      return errorResponse("Invalid or expired reset token", 400);
    }

    // Check if token is expired
    if (passwordReset.expiresAt < new Date()) {
      return errorResponse("Reset token has expired", 400);
    }

    // Check if token already used
    if (passwordReset.used) {
      return errorResponse("Reset token has already been used", 400);
    }

    // Check if user is active
    if (!passwordReset.user.isActive || passwordReset.user.status !== "ACTIVE") {
      return errorResponse("Account is inactive. Please contact administrator.", 403);
    }

    // Hash new password
    const newPasswordHash = hashPassword(password);

    // Update user password and mark token as used in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: passwordReset.userId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.passwordReset.update({
        where: { id: passwordReset.id },
        data: { used: true },
      }),
    ]);

    // Log password change
    await prisma.activityLog.create({
      data: {
        userId: passwordReset.userId,
        action: "PASSWORD_RESET",
        entity: "USER",
        entityId: passwordReset.userId,
      },
    });

    return successResponse({
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return errorResponse("Internal server error", 500);
  }
}
