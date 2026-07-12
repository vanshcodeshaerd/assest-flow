import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (user.passwordHash !== password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Role check
    if (user.role === "EMPLOYEE") {
      return NextResponse.json({ error: "Employees must use the Employee Login portal." }, { status: 403 });
    }

    // Create session
    await createSession({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    await prisma.loginHistory.create({
      data: { userId: user.id },
    });

    const redirectUrl = user.role === "ADMIN" ? "/admin/dashboard" : "/dashboard";
    return NextResponse.json({ success: true, redirect: redirectUrl });
  } catch (error) {
    console.error("Login error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
