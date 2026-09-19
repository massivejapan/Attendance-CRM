import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [users, batches, rawStudents, classLogs, settings] = await Promise.all([
      prisma.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          phone: true,
          assignedBatchIds: true,
          assignedDays: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.batch.findMany({
        include: {
          _count: {
            select: { students: true },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.student.findMany({
        include: {
          attendances: {
            orderBy: { date: "desc" },
            take: 30, // Last 30 attendance records for fast responsiveness
          },
        },
        orderBy: { studentIdCode: "asc" },
      }),
      prisma.classLog.findMany({
        orderBy: { date: "desc" },
        take: 100,
      }),
      prisma.appSetting.findMany({}),
    ]);

    // Parse JSON fields
    const parsedUsers = users.map((u) => ({
      ...u,
      assignedBatchIds: u.assignedBatchIds ? JSON.parse(u.assignedBatchIds) : [],
      assignedDays: u.assignedDays ? JSON.parse(u.assignedDays) : [],
    }));

    const parsedStudents = rawStudents.map((s) => {
      const attendances = s.attendances || [];
      const presentCount = attendances.filter((a) => a.status === "PRESENT").length;
      const absentCount = attendances.filter((a) => a.status === "ABSENT").length;
      const excusedCount = attendances.filter((a) => a.status === "EXCUSED").length;
      const totalCount = attendances.length;
      const attendancePercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 100;

      // Calculate consecutive absents
      let consecutiveAbsents = 0;
      for (const att of attendances) {
        if (att.status === "ABSENT") {
          consecutiveAbsents++;
        } else if (att.status === "PRESENT" || att.status === "EXCUSED") {
          break;
        }
      }

      return {
        id: s.id,
        studentIdCode: s.studentIdCode,
        name: s.name,
        mobileNumber: s.mobileNumber || undefined,
        guardianNumber: s.guardianNumber || undefined,
        refInfo: s.refInfo || undefined,
        batchId: s.batchId || "",
        batchName: s.batchName || "",
        status: s.status as "ACTIVE" | "INACTIVE" | "COMPLETED",
        totalPresent: presentCount,
        totalAbsent: absentCount,
        totalExcused: excusedCount,
        totalClasses: totalCount,
        attendancePercentage,
        consecutiveAbsents,
        lastAbsentDates: attendances
          .filter((a) => a.status === "ABSENT")
          .slice(0, 5)
          .map((a) => a.date),
        milestoneStage: s.milestoneStage as any,
        interviewDate: s.interviewDate || undefined,
        interviewTime: s.interviewTime || undefined,
        interviewCompany: s.interviewCompany || undefined,
        interviewPlatform: s.interviewPlatform || undefined,
        coeNumber: s.coeNumber || undefined,
        coeResultDate: s.coeResultDate || undefined,
        visaIssueDate: s.visaIssueDate || undefined,
        visaStatusNotes: s.visaStatusNotes || undefined,
        batchHistory: s.batchHistory ? JSON.parse(s.batchHistory) : [],
      };
    });

    const today = new Date();
    const parsedBatches = batches.map((b) => {
      let daysRemaining: number | undefined = undefined;
      if (b.estimatedEndDate) {
        const end = new Date(b.estimatedEndDate);
        const diffMs = end.getTime() - today.getTime();
        daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      }

      return {
        id: b.id,
        name: b.name,
        code: b.code || undefined,
        scheduleDays: b.scheduleDays || "Sat Mon Wed",
        timeSlot: b.timeSlot || "10:00 AM - 12:00 PM",
        startDate: b.startDate ? b.startDate.toISOString().split("T")[0] : undefined,
        endDate: b.endDate ? b.endDate.toISOString().split("T")[0] : undefined,
        estimatedEndDate: b.estimatedEndDate || undefined,
        targetTotalClasses: b.targetTotalClasses || 72,
        completedClasses: b.completedClasses || 0,
        daysRemaining,
        status: b.status as "RUNNING" | "COMPLETED" | "UPCOMING",
        studentCount: b._count.students,
      };
    });

    const parsedClassLogs = classLogs.map((log) => ({
      id: log.id,
      batchId: log.batchId,
      teacherId: log.teacherId || "",
      teacherName: log.teacherName,
      isSubstitute: log.isSubstitute,
      date: log.date,
      dayName: log.dayName || "",
      topicCovered: log.topicCovered,
      homework: log.homework || undefined,
      presentCount: log.presentCount,
      absentCount: log.absentCount,
      excusedCount: log.excusedCount,
      totalStudents: log.totalStudents,
      submittedAt: log.submittedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        users: parsedUsers,
        batches: parsedBatches,
        students: parsedStudents,
        classLogs: parsedClassLogs,
        settings,
      },
    });
  } catch (error: any) {
    console.error("Bootstrap API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load CRM data" },
      { status: 500 }
    );
  }
}
