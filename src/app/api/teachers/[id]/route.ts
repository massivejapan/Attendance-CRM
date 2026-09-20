import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, phone, email, password, assignedBatchIds, assignedDays, isActive } = body;

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name.trim();
    if (phone !== undefined) dataToUpdate.phone = phone.trim();
    if (email !== undefined) dataToUpdate.email = email.trim().toLowerCase();
    if (assignedBatchIds !== undefined) dataToUpdate.assignedBatchIds = JSON.stringify(assignedBatchIds);
    if (assignedDays !== undefined) dataToUpdate.assignedDays = JSON.stringify(assignedDays);
    if (isActive !== undefined) dataToUpdate.isActive = isActive;

    // If new password is provided, hash it
    if (password && password.trim().length > 0) {
      dataToUpdate.password = await hashPassword(password.trim());
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      message: "শিক্ষকের তথ্য ও পাসওয়ার্ড সফলভাবে আপডেট হয়েছে!",
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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "শিক্ষক পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    if (user.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "সুপার অ্যাডমিন অ্যাকাউন্ট ডিলিট করা যাবে না" },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: `শিক্ষক "${user.name}" সফলভাবে মুছে ফেলা হয়েছে!`,
    });
  } catch (error: any) {
    console.error("Delete teacher error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "শিক্ষক ডিলিট করতে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}
