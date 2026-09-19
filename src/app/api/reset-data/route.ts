import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const seedScript = path.join(process.cwd(), "scripts/seed-database.js");
    
    // Execute seed script to wipe and repopulate pure Excel data
    await new Promise((resolve, reject) => {
      exec(
        `node "${seedScript}"`,
        { env: { ...process.env, PATH: `C:\\Program Files\\nodejs;${process.env.PATH}` } },
        (error, stdout, stderr) => {
          if (error) {
            console.error("Reset error:", stderr || error.message);
            return reject(error);
          }
          console.log("Reset stdout:", stdout);
          resolve(stdout);
        }
      );
    });

    return NextResponse.json({
      success: true,
      message: "Database test data cleared and restored to clean Master Excel state!",
    });
  } catch (error: any) {
    console.error("Reset Data API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to reset database" },
      { status: 500 }
    );
  }
}
