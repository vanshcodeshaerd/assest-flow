import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, toAuthUser, issueAuthTokens, successResponse, errorResponse } from "@/lib/auth";
import { signupSchema, validationErrors } from "@/lib/auth-validation";
import { rateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/middleware/rate-limit";

/**
 * POST /api/auth/signup
 * 
 * Employee signup endpoint with validation
 * - Validates all required fields using Zod
 * - Checks unique email and employeeId
 * - Hashes password using scrypt
 * - Sets default role to EMPLOYEE
 * - Creates user and issues auth tokens
 */
export async function POST(req: Request) {
  try {
    // Apply rate limiting
    const identifier = getClientIdentifier(req);
    const rateLimitResult = rateLimit(identifier, RATE_LIMITS.AUTH);

    if (!rateLimitResult.success) {
      return errorResponse(
        "Too many signup attempts. Please try again later.",
        429
      );
    }

    const body = await req.json();

    // Validate request body
    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(
        "Validation Error",
        400,
        validationErrors(validationResult.error)
      );
    }

    const { firstName, lastName, employeeId, email, password, department, phone } = validationResult.data;

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingEmail) {
      return errorResponse("Company email already registered", 409);
    }

    // Check if employeeId already exists
    const existingEmployeeId = await prisma.user.findUnique({
      where: { employeeId },
    });

    if (existingEmployeeId) {
      return errorResponse("Employee ID already registered", 409);
    }

    // Hash password
    const passwordHash = hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        employeeId,
        email: email.toLowerCase(),
        passwordHash,
        department,
        phone,
        role: "EMPLOYEE", // Default role for all new signups
        status: "ACTIVE",
        isActive: true,
      },
    });

    // Issue auth tokens
    const authUser = toAuthUser(user);
    const { accessToken } = await issueAuthTokens(authUser);

    // Log signup activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "SIGNUP",
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
    }, 201);
  } catch (error) {
    console.error("Signup error:", error);
    return errorResponse("Internal server error", 500);
  }
}
