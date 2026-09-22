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
    const { documents } = body;

    const documentsStr = typeof documents === "string" ? documents : JSON.stringify(documents || {});

    const updated = await prisma.student.update({
      where: { id },
      data: {
        documents: documentsStr,
      },
    });

    return NextResponse.json({
      success: true,
      message: "ডকুমেন্টস চেকলিস্ট সফলভাবে সংরক্ষিত হয়েছে!",
      data: updated,
    });
  } catch (error: any) {
    console.error("Save documents error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "ডকুমেন্ট সংরক্ষণ করতে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}
