import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Update student details
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      name,
      studentIdCode,
      mobileNumber,
      guardianNumber,
      batchId,
      batchName,
      status,
      refInfo,
    } = body;

    const updated = await prisma.student.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        studentIdCode: studentIdCode !== undefined ? studentIdCode : undefined,
        mobileNumber: mobileNumber !== undefined ? mobileNumber : undefined,
        guardianNumber:
          guardianNumber !== undefined ? guardianNumber : undefined,
        batchId: batchId !== undefined ? batchId : undefined,
        batchName: batchName !== undefined ? batchName : undefined,
        status: status !== undefined ? status : undefined,
        refInfo: refInfo !== undefined ? refInfo : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "শিক্ষার্থীর তথ্য সফলভাবে আপডেট হয়েছে!",
      data: updated,
    });
  } catch (error: any) {
    console.error("Update student error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update student" },
      { status: 500 }
    );
  }
}

// Delete student and related attendance records
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.$transaction([
      prisma.attendance.deleteMany({ where: { studentId: id } }),
      prisma.student.delete({ where: { id } }),
    ]);

    return NextResponse.json({
      success: true,
      message: "শিক্ষার্থী এবং তার সকল রেকর্ড সফলভাবে মুছে ফেলা হয়েছে!",
    });
  } catch (error: any) {
    console.error("Delete student error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete student" },
      { status: 500 }
    );
  }
}
