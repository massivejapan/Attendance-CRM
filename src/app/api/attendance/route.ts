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

    // Fast foreign key verification
    let validTeacherId: string | null = null;
    let effectiveTeacherName = teacherName || "Teacher";

    if (teacherId) {
      const userObj = await prisma.user.findUnique({
        where: { id: teacherId },
        select: { id: true, name: true },
      });
      if (userObj) {
        validTeacherId = userObj.id;
        if (!teacherName) effectiveTeacherName = userObj.name;
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

    // Fast student ID resolution mapping
    const batchStudents = await prisma.student.findMany({
      where: {
        OR: [{ batchId }, { id: { in: records.map((r) => r.studentId) } }],
      },
      select: { id: true, studentIdCode: true },
    });

    const studentIdMap = new Map<string, string>();
    batchStudents.forEach((s) => {
      studentIdMap.set(s.id, s.id);
      studentIdMap.set(s.studentIdCode, s.id);
    });

    // 1. Bulk Delete existing records for this batch & date (1 fast query)
    await prisma.attendance.deleteMany({
      where: { batchId, date },
    });

    // 2. Bulk Insert all records in 1 single query (createMany)
    const recordsToCreate = records.map((rec) => ({
      studentId: studentIdMap.get(rec.studentId) || rec.studentId,
      batchId,
      date,
      dayName: dayName || null,
      status: rec.status,
      note: rec.note || null,
      teacherId: validTeacherId,
      substituteTeacherName: isSubstitute ? effectiveTeacherName : null,
    }));

    await prisma.attendance.createMany({
      data: recordsToCreate,
      skipDuplicates: true,
    });

    // 3. Fast Upsert ClassLog if topicCovered is provided (1 query)
    if (topicCovered) {
      await prisma.classLog.upsert({
        where: {
          batchId_date: {
            batchId,
            date,
          },
        },
        update: {
          teacherId: validTeacherId,
          teacherName: effectiveTeacherName,
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
          teacherName: effectiveTeacherName,
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

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");
    const date = searchParams.get("date");

    if (!batchId || !date) {
      return NextResponse.json(
        { success: false, error: "batchId এবং date আবশ্যক" },
        { status: 400 }
      );
    }

    await prisma.attendance.deleteMany({
      where: { batchId, date },
    });

    await prisma.classLog.deleteMany({
      where: { batchId, date },
    });

    return NextResponse.json({
      success: true,
      message: `${date} তারিখের হাজিরা সফলভাবে রিসেট করা হয়েছে! শিক্ষক এখন পুনরায় নতুন করে হাজিরা দিতে পারবেন।`,
    });
  } catch (error: any) {
    console.error("Delete attendance error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete attendance" },
      { status: 500 }
    );
  }
}
