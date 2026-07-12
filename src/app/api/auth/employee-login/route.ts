import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword, toAuthUser, issueAuthTokens, successResponse, errorResponse } from "@/lib/auth";
import { loginSchema, validationErrors } from "@/lib/auth-validation";

/**
 * POST /api/auth/employee-login
 * 
 * Employee login portal accepting email OR employeeId
 * - Validates input using Zod
 * - Verifies password using scrypt
 * - Checks user active status
 * - Restricts to employee roles only
 * - Creates session with JWT + refresh token
 * - Logs login history
 * - Returns user + accessToken
 */
export async function POST(req: Request) {
  try {
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

    const { identifier, password } = validationResult.data;

    // Find user by email or employeeId
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { employeeId: identifier },
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

    // Role check - only employees can use this portal
    const internalRoles = ["EMPLOYEE", "DEPT_HEAD", "ASSET_MANAGER"];
    if (!internalRoles.includes(user.role)) {
      return errorResponse("This login portal is only for employee accounts.", 403);
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
      redirect: "/employee/dashboard",
    });
  } catch (error) {
    console.error("Employee login error:", error);
    return errorResponse("Internal server error", 500);
  }
}
