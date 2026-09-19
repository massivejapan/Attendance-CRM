import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, phone, email, assignedBatchIds, assignedDays, isActive } = body;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        phone: phone !== undefined ? phone : undefined,
        email: email !== undefined ? email : undefined,
        assignedBatchIds:
          assignedBatchIds !== undefined
            ? JSON.stringify(assignedBatchIds)
            : undefined,
        assignedDays:
          assignedDays !== undefined ? JSON.stringify(assignedDays) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "শিক্ষকের তথ্য ও ব্যাচ অ্যাসাইনমেন্ট সফলভাবে আপডেট হয়েছে!",
      data: {
        ...updated,
        assignedBatchIds: JSON.parse(updated.assignedBatchIds || "[]"),
        assignedDays: JSON.parse(updated.assignedDays || "[]"),
      },
    });
  } catch (error: any) {
    console.error("Update teacher error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update teacher" },
      { status: 500 }
    );
  }
}
