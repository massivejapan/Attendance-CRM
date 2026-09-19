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
      milestoneStage,
      interviewDate,
      interviewTime,
      interviewCompany,
      interviewPlatform,
      coeNumber,
      coeResultDate,
      visaIssueDate,
      visaStatusNotes,
    } = body;

    const updated = await prisma.student.update({
      where: { id },
      data: {
        milestoneStage: milestoneStage || undefined,
        interviewDate: interviewDate !== undefined ? interviewDate : undefined,
        interviewTime: interviewTime !== undefined ? interviewTime : undefined,
        interviewCompany: interviewCompany !== undefined ? interviewCompany : undefined,
        interviewPlatform: interviewPlatform !== undefined ? interviewPlatform : undefined,
        coeNumber: coeNumber !== undefined ? coeNumber : undefined,
        coeResultDate: coeResultDate !== undefined ? coeResultDate : undefined,
        visaIssueDate: visaIssueDate !== undefined ? visaIssueDate : undefined,
        visaStatusNotes: visaStatusNotes !== undefined ? visaStatusNotes : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Student career milestone updated successfully",
    });
  } catch (error: any) {
    console.error("Milestone update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update milestone" },
      { status: 500 }
    );
  }
}
