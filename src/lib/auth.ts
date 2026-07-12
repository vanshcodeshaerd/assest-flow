import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { jwtVerify, SignJWT, type JWTPayload } from "jose";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_DAYS = 7;
export const RESET_TOKEN_TTL_MINUTES = 15;

const secret = process.env.JWT_SECRET || "dev_assetflow_change_me";
const key = new TextEncoder().encode(secret);
const refreshCookieName = "refreshToken";

export type AuthRole = "EMPLOYEE" | "DEPT_HEAD" | "ASSET_MANAGER" | "ADMIN" | "USER" | "MANAGER" | "HR";

export type AuthUser = {
  id: string;
  email: string;
  employeeId: string | null;
  role: AuthRole;
  firstName?: string | null;
  lastName?: string | null;
};

type AccessTokenPayload = JWTPayload & {
  userId: string;
  role: AuthRole;
  employeeId?: string | null;
};

export function successResponse<T>(data: T, status = 200) {
  return Response.json({ success: true, ...data }, { status });
}

export function errorResponse(message: string, status = 400, errors: unknown[] = []) {
  return Response.json({ success: false, message, errors }, { status });
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [algorithm, salt, storedKey] = passwordHash.split(":");

  if (algorithm !== "scrypt" || !salt || !storedKey) {
    return false;
  }

  const derivedKey = scryptSync(password, salt, 64);
  const storedKeyBuffer = Buffer.from(storedKey, "hex");

  return storedKeyBuffer.length === derivedKey.length && timingSafeEqual(storedKeyBuffer, derivedKey);
}

export function createOpaqueToken() {
  return randomBytes(48).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAccessToken(user: AuthUser) {
  return new SignJWT({
    userId: user.id,
    role: user.role,
    employeeId: user.employeeId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(key);
}

export async function verifyAccessToken(accessToken: string) {
  const { payload } = await jwtVerify(accessToken, key, { algorithms: ["HS256"] });
  return payload as AccessTokenPayload;
}

export async function createRefreshSession(userId: string, refreshToken: string) {
  const requestHeaders = await headers();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  const session = await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt,
      ipAddress:
        requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        requestHeaders.get("x-real-ip"),
      browser: requestHeaders.get("user-agent"),
      device: requestHeaders.get("sec-ch-ua-platform"),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(refreshCookieName, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });

  return session;
}

export async function issueAuthTokens(user: AuthUser) {
  const accessToken = await createAccessToken(user);
  const refreshToken = createOpaqueToken();

  await createRefreshSession(user.id, refreshToken);

  return { accessToken, refreshToken };
}

export async function rotateRefreshToken(currentToken: string) {
  const tokenHash = hashToken(currentToken);
  const session = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    return null;
  }

  const user = session.user;

  if (!user.isActive || user.status !== "ACTIVE") {
    return null;
  }

  const nextRefreshToken = createOpaqueToken();
  const nextRefreshTokenHash = hashToken(nextRefreshToken);

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: session.id },
      data: {
        revokedAt: new Date(),
        replacedByTokenHash: nextRefreshTokenHash,
      },
    }),
    prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: nextRefreshTokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  const cookieStore = await cookies();
  cookieStore.set(refreshCookieName, nextRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
  });

  const authUser = toAuthUser(user);
  const accessToken = await createAccessToken(authUser);

  return { user: authUser, accessToken };
}

export async function getRefreshTokenFromCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(refreshCookieName)?.value || null;
}

export async function revokeCurrentRefreshToken() {
  const refreshToken = await getRefreshTokenFromCookie();

  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: {
        tokenHash: hashToken(refreshToken),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  const cookieStore = await cookies();
  cookieStore.delete(refreshCookieName);
}

export async function verifySession(accessToken?: string | null) {
  try {
    let token = accessToken;

    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get("accessToken")?.value || null;
    }

    if (!token) return null;

    const payload = await verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user || !user.isActive || user.status !== "ACTIVE") {
      return null;
    }

    return { user: toAuthUser(user) };
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request) {
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const session = await verifySession(bearerToken);

  if (!session) {
    return null;
  }

  return session.user;
}

export function authorize(user: AuthUser, ...roles: AuthRole[]) {
  return roles.includes(user.role);
}

export async function createSession(user: AuthUser) {
  const { accessToken } = await issueAuthTokens(user);
  const cookieStore = await cookies();

  cookieStore.set("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
  });

  return accessToken;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("accessToken");
  await revokeCurrentRefreshToken();
}

export function toAuthUser(user: {
  id: string;
  email: string;
  employeeId: string | null;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    employeeId: user.employeeId,
    role: user.role as AuthRole,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

