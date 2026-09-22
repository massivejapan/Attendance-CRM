import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/students - List all students
export async function GET() {
  try {
    const students = await prisma.student.findMany({
      include: {
        batch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const parsedStudents = students.map((s) => {
      let docs = {};
      try {
        if (s.documents) docs = JSON.parse(s.documents);
      } catch (e) {}

      return {
        id: s.id,
        studentIdCode: s.studentIdCode,
        name: s.name,
        mobileNumber: s.mobileNumber || undefined,
        guardianNumber: s.guardianNumber || undefined,
        refInfo: s.refInfo || undefined,
        status: s.status,
        batchId: s.batchId || "",
        batchName: s.batch?.name || s.batchName || "",
        milestoneStage: s.milestoneStage,
        interviewDate: s.interviewDate || undefined,
        interviewTime: s.interviewTime || undefined,
        interviewCompany: s.interviewCompany || undefined,
        interviewPlatform: s.interviewPlatform || undefined,
        coeNumber: s.coeNumber || undefined,
        coeResultDate: s.coeResultDate || undefined,
        visaIssueDate: s.visaIssueDate || undefined,
        visaStatusNotes: s.visaStatusNotes || undefined,
        documents: docs,
      };
    });

    return NextResponse.json({ success: true, students: parsedStudents });
  } catch (error: any) {
    console.error("Fetch students error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch students" },
      { status: 500 }
    );
  }
}

// POST /api/students - Create a new student
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      studentIdCode,
      name,
      banglaName,
      mobileNumber,
      guardianNumber,
      refInfo,
      batchId,
      status = "ACTIVE",
      milestoneStage = "LANGUAGE_COURSE",
      interviewDate,
      interviewTime,
      interviewCompany,
      interviewPlatform,
      coeNumber,
      coeResultDate,
      visaIssueDate,
      visaStatusNotes,
      documents = {},
    } = body;

    if (!studentIdCode || !name || !batchId) {
      return NextResponse.json(
        { success: false, error: "Student ID Code, Name, and Batch ID are required" },
        { status: 400 }
      );
    }

    // Check duplicate studentIdCode
    const existing = await prisma.student.findUnique({
      where: { studentIdCode: studentIdCode.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Student ID Code #${studentIdCode} already exists!` },
        { status: 409 }
      );
    }

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
    });

    const newStudent = await prisma.student.create({
      data: {
        studentIdCode: studentIdCode.trim(),
        name: name.trim(),
        mobileNumber: mobileNumber?.trim() || null,
        guardianNumber: guardianNumber?.trim() || null,
        refInfo: refInfo?.trim() || null,
        status,
        batchId,
        batchName: batch?.name || "",
        milestoneStage,
        interviewDate: interviewDate || null,
        interviewTime: interviewTime || null,
        interviewCompany: interviewCompany || null,
        interviewPlatform: interviewPlatform || null,
        coeNumber: coeNumber || null,
        coeResultDate: coeResultDate || null,
        visaIssueDate: visaIssueDate || null,
        visaStatusNotes: visaStatusNotes || null,
        documents: JSON.stringify(documents),
      },
    });

    return NextResponse.json({
      success: true,
      student: {
        ...newStudent,
        documents,
      },
    });
  } catch (error: any) {
    console.error("Create student error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create student" },
      { status: 500 }
    );
  }
}
