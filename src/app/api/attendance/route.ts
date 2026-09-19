import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      batchId,
      teacherId,
      teacherName,
      isSubstitute,
      date,
      dayName,
      records, // Array<{ studentId: string; status: string; note?: string }>
      topicCovered,
      homework,
    } = body;

    if (!batchId || !date || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: batchId, date, or records" },
        { status: 400 }
      );
    }

    // Verify valid user for foreign key
    let validTeacherId: string | null = null;
    if (teacherId) {
      const userExists = await prisma.user.findUnique({
        where: { id: teacherId },
        select: { id: true },
      });
      if (userExists) {
        validTeacherId = userExists.id;
      }
    }

    // Counts calculation
    let presentCount = 0;
    let absentCount = 0;
    let excusedCount = 0;

    for (const r of records) {
      if (r.status === "PRESENT") presentCount++;
      else if (r.status === "ABSENT") absentCount++;
      else if (r.status === "EXCUSED") excusedCount++;
    }

    const totalStudents = records.length;

    // Prisma Transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // 1. Upsert attendance records
      for (const rec of records) {
        // Resolve student ID
        let resolvedStudentId = rec.studentId;
        const studentObj = await tx.student.findFirst({
          where: {
            OR: [{ id: rec.studentId }, { studentIdCode: rec.studentId }],
          },
          select: { id: true },
        });

        if (!studentObj) continue;
        resolvedStudentId = studentObj.id;

        await tx.attendance.upsert({
          where: {
            studentId_batchId_date: {
              studentId: resolvedStudentId,
              batchId,
              date,
            },
          },
          update: {
            status: rec.status,
            note: rec.note || null,
            dayName: dayName || null,
            teacherId: validTeacherId,
            substituteTeacherName: isSubstitute ? teacherName : null,
          },
          create: {
            studentId: resolvedStudentId,
            batchId,
            date,
            dayName: dayName || null,
            status: rec.status,
            note: rec.note || null,
            teacherId: validTeacherId,
            substituteTeacherName: isSubstitute ? teacherName : null,
          },
        });
      }

      // 2. Upsert ClassLog if topicCovered is provided
      if (topicCovered) {
        await tx.classLog.upsert({
          where: {
            batchId_date: {
              batchId,
              date,
            },
          },
          update: {
            teacherId: validTeacherId,
            teacherName: teacherName || "Teacher",
            isSubstitute: Boolean(isSubstitute),
            dayName: dayName || null,
            topicCovered,
            homework: homework || null,
            presentCount,
            absentCount,
            excusedCount,
            totalStudents,
            submittedAt: new Date(),
          },
          create: {
            batchId,
            teacherId: validTeacherId,
            teacherName: teacherName || "Teacher",
            isSubstitute: Boolean(isSubstitute),
            date,
            dayName: dayName || null,
            topicCovered,
            homework: homework || null,
            presentCount,
            absentCount,
            excusedCount,
            totalStudents,
            submittedAt: new Date(),
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "হাজিরা ও সিলেবাস নোট ডাটাবেজে সফলভাবে সংরক্ষিত হয়েছে!",
      stats: { presentCount, absentCount, excusedCount, totalStudents },
    });
  } catch (error: any) {
    console.error("Attendance API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save attendance" },
      { status: 500 }
    );
  }
}
