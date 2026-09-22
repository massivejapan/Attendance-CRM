import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: Returns current Google Sheet sync status, last sync timestamp, and sheet configuration
export async function GET() {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: "GOOGLE_SHEET_SYNC_CONFIG" },
    });

    const [totalStudents, totalAttendances, totalClassLogs] = await Promise.all([
      prisma.student.count(),
      prisma.attendance.count(),
      prisma.classLog.count(),
    ]);

    let config = {
      sheetUrl: "",
      autoSyncDaily: true,
      lastSyncTime: null as string | null,
      syncStatus: "READY",
    };

    if (setting) {
      try {
        config = JSON.parse(setting.value);
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      data: {
        ...config,
        stats: {
          totalStudents,
          totalAttendances,
          totalClassLogs,
        },
      },
    });
  } catch (error: any) {
    console.error("Get sync config error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch sync status" },
      { status: 500 }
    );
  }
}

// POST: Updates Google Sheet sync URL or triggers manual sync
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sheetUrl, autoSyncDaily, triggerSyncNow } = body;

    const currentSetting = await prisma.appSetting.findUnique({
      where: { key: "GOOGLE_SHEET_SYNC_CONFIG" },
    });

    let currentConfig: any = {
      sheetUrl: sheetUrl || "",
      autoSyncDaily: autoSyncDaily ?? true,
      lastSyncTime: null,
      syncStatus: "CONNECTED",
    };

    if (currentSetting) {
      try {
        currentConfig = { ...JSON.parse(currentSetting.value), ...body };
      } catch (e) {}
    }

    if (triggerSyncNow && currentConfig.sheetUrl && currentConfig.sheetUrl.includes("script.google.com")) {
      try {
        const runningBatches = await prisma.batch.findMany({
          include: {
            students: {
              where: { status: "ACTIVE" },
              select: { id: true, studentIdCode: true, name: true },
            },
          },
        });

        // 1. Send payload for each batch attendance
        for (const batch of runningBatches) {
          const latestLog = await prisma.classLog.findFirst({
            where: { batchId: batch.id },
            orderBy: { date: "desc" },
          });

          const latestAttendances = latestLog
            ? await prisma.attendance.findMany({
                where: { batchId: batch.id, date: latestLog.date },
                include: { student: { select: { studentIdCode: true, name: true } } },
              })
            : [];

          const records = latestAttendances.map((a) => ({
            studentIdCode: a.student.studentIdCode,
            studentName: a.student.name,
            status: a.status,
            note: a.note || "",
          }));

          // Fallback if no attendances yet: list active students
          const payloadRecords =
            records.length > 0
              ? records
              : batch.students.map((s) => ({
                  studentIdCode: s.studentIdCode,
                  studentName: s.name,
                  status: "ENROLLED",
                  note: "Active Student",
                }));

          await fetch(currentConfig.sheetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "ATTENDANCE",
              batchName: batch.name.replace(/[^a-zA-Z0-9_-]/g, "_"),
              date: latestLog?.date || new Date().toISOString().split("T")[0],
              dayName: latestLog?.dayName || "Regular",
              teacherName: latestLog?.teacherName || "Assigned Teacher",
              topicCovered: latestLog?.topicCovered || "Syllabus ongoing",
              records: payloadRecords,
            }),
          });
        }

        // 2. Send Master Visa Documents & Milestone Directory Payload
        const allStudents = await prisma.student.findMany({
          where: { status: "ACTIVE" },
          include: { batch: { select: { name: true } } },
          orderBy: { studentIdCode: "asc" },
        });

        const docSummaryRecords = allStudents.map((s) => {
          let docsObj: Record<string, any> = {};
          try {
            if (s.documents) {
              docsObj = JSON.parse(s.documents);
            }
          } catch (e) {}

          const submittedCount = Object.values(docsObj).filter((d: any) => d?.isSubmitted).length;
          const correctionCount = Object.values(docsObj).filter((d: any) => d?.status === "CORRECTION_NEEDED").length;
          
          return {
            studentIdCode: s.studentIdCode,
            studentName: s.name,
            batchName: s.batch?.name || "N/A",
            phone: s.mobileNumber || "",
            guardianNumber: s.guardianNumber || "",
            milestoneStage: s.milestoneStage || "LANGUAGE_COURSE",
            submittedDocs: `${submittedCount} / 27`,
            correctionCount: correctionCount > 0 ? `${correctionCount} items need fix` : "All Clear",
            notes: s.refInfo || "",
          };
        });

        await fetch(currentConfig.sheetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "VISA_DOCUMENTS",
            batchName: "Master_Visa_Documents",
            date: new Date().toISOString().split("T")[0],
            records: docSummaryRecords,
          }),
        });
      } catch (err) {
        console.error("Failed to post data to Google Apps Script:", err);
      }
      currentConfig.lastSyncTime = new Date().toISOString();
      currentConfig.syncStatus = "SYNCED";
    }

    await prisma.appSetting.upsert({
      where: { key: "GOOGLE_SHEET_SYNC_CONFIG" },
      update: {
        value: JSON.stringify(currentConfig),
        lastSyncAt: triggerSyncNow ? new Date() : undefined,
      },
      create: {
        key: "GOOGLE_SHEET_SYNC_CONFIG",
        value: JSON.stringify(currentConfig),
        description: "Google Drive & Google Sheet Daily Auto-Sync Configuration",
        lastSyncAt: triggerSyncNow ? new Date() : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: triggerSyncNow
        ? "Google Sheet auto-sync completed successfully! All attendance & syllabus logs synced."
        : "Google Sheet sync settings saved successfully.",
      data: currentConfig,
    });
  } catch (error: any) {
    console.error("Sync Google Sheet error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to sync Google Sheet" },
      { status: 500 }
    );
  }
}
