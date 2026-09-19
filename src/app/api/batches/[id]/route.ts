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
    const {
      name,
      scheduleDays,
      timeSlot,
      status,
      estimatedEndDate,
      targetTotalClasses,
      completedClasses,
    } = body;

    const updated = await prisma.batch.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        scheduleDays: scheduleDays !== undefined ? scheduleDays : undefined,
        timeSlot: timeSlot !== undefined ? timeSlot : undefined,
        status: status !== undefined ? status : undefined,
        estimatedEndDate:
          estimatedEndDate !== undefined ? estimatedEndDate : undefined,
        targetTotalClasses:
          targetTotalClasses !== undefined
            ? Number(targetTotalClasses)
            : undefined,
        completedClasses:
          completedClasses !== undefined ? Number(completedClasses) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        status === "COMPLETED"
          ? "ব্যাচটি সফলভাবে 'সম্পন্ন' (Completed) হিসেবে চিহ্নিত করা হয়েছে এবং শিক্ষকদের তালিকা থেকে সরানো হয়েছে।"
          : "ব্যাচ তথ্য সফলভাবে আপডেট হয়েছে!",
      data: updated,
    });
  } catch (error: any) {
    console.error("Update batch error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update batch" },
      { status: 500 }
    );
  }
}
