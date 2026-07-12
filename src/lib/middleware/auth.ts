import { NextRequest, NextResponse } from "next/server";
import { requireAuth, errorResponse } from "@/lib/auth";

/**
 * Authentication middleware for API routes
 * Verifies JWT access token and attaches user to request
 * Returns 401 if authentication fails
 */
export async function withAuth(req: NextRequest) {
  const user = await requireAuth(req);
  
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }
  
  // Attach user to request headers for downstream handlers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", user.id);
  requestHeaders.set("x-user-role", user.role);
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * Higher-order function to wrap API route handlers with authentication
 * @param handler - The API route handler function
 * @returns A new handler that requires authentication
 */
export function requireAuthHandler<T extends any[]>(
  handler: (req: NextRequest, ...args: T) => Promise<Response>
) {
  return async (req: NextRequest, ...args: T): Promise<Response> => {
    const user = await requireAuth(req);
    
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }
    
    // Attach user to request for downstream use
    (req as any).user = user;
    
    return handler(req, ...args);
  };
}
