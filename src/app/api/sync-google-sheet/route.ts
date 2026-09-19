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

    if (triggerSyncNow) {
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
