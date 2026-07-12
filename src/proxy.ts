import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, JWTPayload } from "jose";

interface SessionPayload extends JWTPayload {
  user: {
    id: string;
    email?: string;
    employeeId?: string;
    role: string;
  };
}

export async function proxy(req: NextRequest) {
  const cookie = req.cookies.get("session")?.value;
  let session: SessionPayload | null = null;
  
  if (cookie) {
    try {
      const secretKey = "super_secret_assetflow_key";
      const key = new TextEncoder().encode(secretKey);
      const { payload } = await jwtVerify(cookie, key, { algorithms: ["HS256"] });
      session = payload as SessionPayload;
    } catch(e) {}
  }
  
  const path = req.nextUrl.pathname;

  if (path.startsWith("/admin")) {
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }
  }

  if (path.startsWith("/employee")) {
    if (path.startsWith("/employee/login")) return NextResponse.next();
    
    if (!session || session.user.role !== "EMPLOYEE") {
      return NextResponse.redirect(new URL("/employee/login", req.nextUrl));
    }
  }

  if (path.startsWith("/dashboard")) {
    if (!session || session.user.role !== "USER") {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/employee/:path*", "/dashboard/:path*"],
};
