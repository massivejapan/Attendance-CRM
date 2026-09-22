import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, username, email, password, phone, role, assignedBatchIds, assignedDays } = body;

    if (!name || !username) {
      return NextResponse.json(
        { success: false, error: "নাম ও ইউজারনেম আবশ্যক" },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check if username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          ...(email ? [{ email: email.trim().toLowerCase() }] : []),
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "এই ইউজারনেম বা ইমেইল দিয়ে ইতোমধ্যে একজন ইউজার রয়েছেন" },
        { status: 400 }
      );
    }

    // Default password if not provided is massive123
    const rawPassword = password && password.trim() ? password.trim() : "massive123";
    const hashedPassword = await hashPassword(rawPassword);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        username: cleanUsername,
        email: email ? email.trim().toLowerCase() : null,
        phone: phone ? phone.trim() : null,
        password: hashedPassword,
        role: role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "TEACHER",
        isActive: true,
        assignedBatchIds: JSON.stringify(assignedBatchIds || []),
        assignedDays: JSON.stringify(assignedDays || ["Sat", "Mon", "Wed"]),
      },
    });

    return NextResponse.json({
      success: true,
      message: `ইউজার "${newUser.name}" সফলভাবে যুক্ত হয়েছে!`,
      data: {
        ...newUser,
        assignedBatchIds: JSON.parse(newUser.assignedBatchIds || "[]"),
        assignedDays: JSON.parse(newUser.assignedDays || "[]"),
      },
    });
  } catch (error: any) {
    console.error("Create teacher error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "শিক্ষক যুক্ত করতে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}
