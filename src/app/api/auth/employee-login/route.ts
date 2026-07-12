import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { employeeId, password } = await req.json();

    if (!employeeId || !password) {
      return NextResponse.json({ error: "Employee ID and password required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { employeeId },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (user.passwordHash !== password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (user.role !== "EMPLOYEE") {
      return NextResponse.json({ error: "This login portal is only for employees." }, { status: 403 });
    }

    // Create session
    await createSession({
      id: user.id,
      employeeId: user.employeeId,
      role: user.role,
    });

    await prisma.loginHistory.create({
      data: { userId: user.id },
    });

    return NextResponse.json({ success: true, redirect: "/employee/dashboard" });
  } catch (error) {
    console.error("Login error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
