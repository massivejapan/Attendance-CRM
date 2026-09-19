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
    const { newBatchId, newBatchName, reason, transferredBy } = body;

    if (!newBatchId || !newBatchName) {
      return NextResponse.json(
        { success: false, error: "newBatchId and newBatchName are required" },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    // Parse existing history
    let history: any[] = [];
    try {
      if (student.batchHistory) {
        history = JSON.parse(student.batchHistory);
      }
    } catch (e) {
      history = [];
    }

    const newHistoryEntry = {
      fromBatchId: student.batchId,
      fromBatchName: student.batchName || "N/A",
      toBatchId: newBatchId,
      toBatchName: newBatchName,
      date: new Date().toISOString().split("T")[0],
      reason: reason || "Batch Shifted by Admin",
      transferredBy: transferredBy || "Admin",
    };

    history.unshift(newHistoryEntry);

    const updated = await prisma.student.update({
      where: { id },
      data: {
        batchId: newBatchId,
        batchName: newBatchName,
        batchHistory: JSON.stringify(history),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Student shifted to ${newBatchName} successfully.`,
    });
  } catch (error: any) {
    console.error("Shift batch error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to shift batch" },
      { status: 500 }
    );
  }
}
