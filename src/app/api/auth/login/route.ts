import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "ইউজারনেম/ইমেইল এবং পাসওয়ার্ড আবশ্যক" },
        { status: 400 }
      );
    }

    const cleanInput = username.trim().toLowerCase();

    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: cleanInput, mode: "insensitive" } },
          { email: { equals: cleanInput, mode: "insensitive" } },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "সঠিক ইউজারনেম/ইমেইল পাওয়া যায়নি" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: "এই অ্যাকাউন্টটি বর্তমানে নিষ্ক্রিয় রয়েছে" },
        { status: 403 }
      );
    }

    // Verify bcrypt password
    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "ভুল পাসওয়ার্ড! দয়া করে সঠিক পাসওয়ার্ড দিন।" },
        { status: 401 }
      );
    }

    // Generate JWT Token
    const token = await signToken({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role as "SUPER_ADMIN" | "TEACHER",
    });

    const userSafe = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      assignedBatchIds: JSON.parse(user.assignedBatchIds || "[]"),
      assignedDays: JSON.parse(user.assignedDays || "[]"),
      isActive: user.isActive,
    };

    const response = NextResponse.json({
      success: true,
      message: "লগইন সফল হয়েছে!",
      user: userSafe,
      token,
    });

    // Set HTTP-only session cookie
    response.cookies.set("auth_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "লগইনে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}
