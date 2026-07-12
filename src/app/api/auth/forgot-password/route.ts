import { createOpaqueToken, hashToken, successResponse, errorResponse, RESET_TOKEN_TTL_MINUTES } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema, validationErrors } from "@/lib/auth-validation";
import { rateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/middleware/rate-limit";

/**
 * POST /api/auth/forgot-password
 * 
 * Forgot password endpoint
 * - Validates email using Zod
 * - Generates secure reset token
 * - Hashes and stores token in database
 * - Sets 15-minute expiration
 * - Logs password reset request
 * - Returns success message (email would be sent here)
 */
export async function POST(req: Request) {
  try {
    // Apply rate limiting
    const identifier = getClientIdentifier(req);
    const rateLimitResult = rateLimit(identifier, RATE_LIMITS.PASSWORD_RESET);

    if (!rateLimitResult.success) {
      return errorResponse(
        "Too many password reset attempts. Please try again later.",
        429
      );
    }

    const body = await req.json();

    // Validate request body
    const validationResult = forgotPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(
        "Validation Error",
        400,
        validationErrors(validationResult.error)
      );
    }

    const { email } = validationResult.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return successResponse({
        message: "If an account exists for this email, password reset instructions will be sent.",
      });
    }

    // Generate secure reset token
    const resetToken = createOpaqueToken();
    const tokenHash = hashToken(resetToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

    // Store hashed token in database
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Log password reset request
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET_REQUEST",
        entity: "USER",
        entityId: user.id,
      },
    });

    // In production, send email with reset link containing the token
    // For development, log the token to console
    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset link: http://localhost:3000/reset-password?token=${resetToken}`);

    return successResponse({
      message: "If an account exists for this email, password reset instructions will be sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return errorResponse("Internal server error", 500);
  }
}
