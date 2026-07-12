import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword, toAuthUser, issueAuthTokens, successResponse, errorResponse } from "@/lib/auth";
import { loginSchema, validationErrors } from "@/lib/auth-validation";
import { rateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/middleware/rate-limit";

/**
 * POST /api/auth/login
 * 
 * Login endpoint accepting email OR employeeId
 * - Validates input using Zod
 * - Verifies password using scrypt
 * - Checks user active status
 * - Creates session with JWT + refresh token
 * - Logs login history
 * - Returns user + accessToken
 */
export async function POST(req: Request) {
  try {
    // Apply rate limiting
    const identifier = getClientIdentifier(req);
    const rateLimitResult = rateLimit(identifier, RATE_LIMITS.AUTH);

    if (!rateLimitResult.success) {
      return errorResponse(
        "Too many login attempts. Please try again later.",
        429
      );
    }

    const body = await req.json();

    // Validate request body
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(
        "Validation Error",
        400,
        validationErrors(validationResult.error)
      );
    }

    const { identifier: loginIdentifier, password } = validationResult.data;

    // Find user by email or employeeId
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginIdentifier.toLowerCase() },
          { employeeId: loginIdentifier },
        ],
      },
    });

    if (!user) {
      return errorResponse("Invalid credentials", 401);
    }

    // Verify password
    const isValidPassword = verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return errorResponse("Invalid credentials", 401);
    }

    // Check if user is active
    if (!user.isActive || user.status !== "ACTIVE") {
      return errorResponse("Account is inactive. Please contact administrator.", 403);
    }

    // Role check - employees must use employee login portal
    if (user.role === "EMPLOYEE") {
      return errorResponse("Employees must use the Employee Login portal.", 403);
    }

    // Issue auth tokens
    const authUser = toAuthUser(user);
    const { accessToken } = await issueAuthTokens(authUser);

    // Create session cookie
    await createSession(authUser);

    // Log login history
    await prisma.loginHistory.create({
      data: { userId: user.id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        entity: "USER",
        entityId: user.id,
      },
    });

    // Determine redirect based on role
    const redirectUrl = user.role === "ADMIN" ? "/admin/dashboard" : "/dashboard";

    return successResponse({
      user: {
        id: authUser.id,
        email: authUser.email,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        employeeId: authUser.employeeId,
        role: authUser.role,
      },
      accessToken,
      redirect: redirectUrl,
    });
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("Internal server error", 500);
  }
}
