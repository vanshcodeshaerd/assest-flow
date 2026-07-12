import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: password, // In production, hash this password
        role: "USER",
      },
    });

    // Create session for the newly created user
    await createSession({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    await prisma.loginHistory.create({
      data: { userId: user.id },
    });

    return NextResponse.json({ success: true, redirect: "/dashboard" });
  } catch (error) {
    console.error("Signup error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
