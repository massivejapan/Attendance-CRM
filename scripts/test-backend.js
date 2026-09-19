const http = require("http");

async function req(url, options = {}) {
  const u = new URL(url);
  const data = options.body ? JSON.stringify(options.body) : null;
  return new Promise((resolve, reject) => {
    const r = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, text: body });
          }
        });
      }
    );
    r.on("error", reject);
    if (data) r.write(data);
    r.end();
  });
}

async function runTests() {
  console.log("==========================================");
  console.log("🧪 Running Comprehensive Backend & DB Tests");
  console.log("==========================================");

  // 1. Test Bootstrap API
  console.log("\n[Test 1] Testing GET /api/bootstrap...");
  const bootstrapRes = await req("http://localhost:3000/api/bootstrap");
  if (bootstrapRes.status === 200 && bootstrapRes.data.success) {
    const { students, batches, users, classLogs } = bootstrapRes.data.data;
    console.log(`✓ Bootstrap Success:`);
    console.log(`  - Students Loaded: ${students.length}`);
    console.log(`  - Batches Loaded: ${batches.length}`);
    console.log(`  - Users/Teachers Loaded: ${users.length}`);
    console.log(`  - Class Logs Loaded: ${classLogs.length}`);
  } else {
    console.error("✕ Bootstrap Failed:", bootstrapRes);
    process.exit(1);
  }

  // 2. Test Attendance Submission API
  console.log("\n[Test 2] Testing POST /api/attendance...");
  const sampleBatch = bootstrapRes.data.data.batches[0];
  const sampleStudent = bootstrapRes.data.data.students.find((s) => s.batchId === sampleBatch.id) || bootstrapRes.data.data.students[0];

  const attendancePayload = {
    batchId: sampleBatch.id,
    teacherId: "usr-admin-1",
    teacherName: "MAM Sir",
    isSubstitute: false,
    date: "2026-09-19",
    dayName: "Sat",
    records: [
      { studentId: sampleStudent.id, status: "PRESENT", note: "Participated actively" },
    ],
    topicCovered: "Testing Lesson: Minna no Nihongo Chapter 12 Grammar & Kanji Drill",
    homework: "Practice workbook pages 50-52",
  };

  const attRes = await req("http://localhost:3000/api/attendance", {
    method: "POST",
    body: attendancePayload,
  });

  if (attRes.status === 200 && attRes.data.success) {
    console.log("✓ Attendance Submission Success:", attRes.data.message);
  } else {
    console.error("✕ Attendance Submission Failed:", attRes);
    process.exit(1);
  }

  // 3. Test Student Batch Transfer API
  console.log(`\n[Test 3] Testing POST /api/students/${sampleStudent.id}/shift-batch...`);
  const targetBatch = bootstrapRes.data.data.batches[1] || bootstrapRes.data.data.batches[0];
  const shiftRes = await req(`http://localhost:3000/api/students/${sampleStudent.id}/shift-batch`, {
    method: "POST",
    body: {
      newBatchId: targetBatch.id,
      newBatchName: targetBatch.name,
      reason: "Requested time shift from morning to evening batch",
      transferredBy: "Admin",
    },
  });

  if (shiftRes.status === 200 && shiftRes.data.success) {
    console.log("✓ Student Batch Shift Success:", shiftRes.data.message);
  } else {
    console.error("✕ Student Batch Shift Failed:", shiftRes);
    process.exit(1);
  }

  // 4. Test Career Milestone Update API
  console.log(`\n[Test 4] Testing POST /api/students/${sampleStudent.id}/milestone...`);
  const milestoneRes = await req(`http://localhost:3000/api/students/${sampleStudent.id}/milestone`, {
    method: "POST",
    body: {
      milestoneStage: "INTERVIEW_SCHEDULED",
      interviewDate: "2026-09-28",
      interviewTime: "02:00 PM",
      interviewCompany: "Tokyo Care Corporation",
      interviewPlatform: "Zoom",
      visaStatusNotes: "Mock interview practice scheduled.",
    },
  });

  if (milestoneRes.status === 200 && milestoneRes.data.success) {
    console.log("✓ Student Career Milestone Update Success:", milestoneRes.data.message);
  } else {
    console.error("✕ Student Career Milestone Update Failed:", milestoneRes);
    process.exit(1);
  }

  // 5. Test Google Sheet Sync API
  console.log("\n[Test 5] Testing POST /api/sync-google-sheet...");
  const syncRes = await req("http://localhost:3000/api/sync-google-sheet", {
    method: "POST",
    body: {
      sheetUrl: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit",
      triggerSyncNow: true,
    },
  });

  if (syncRes.status === 200 && syncRes.data.success) {
    console.log("✓ Google Sheet Sync Success:", syncRes.data.message);
  } else {
    console.error("✕ Google Sheet Sync Failed:", syncRes);
    process.exit(1);
  }

  // 6. Test 1-Click Test Data Reset & Excel Restore
  console.log("\n[Test 6] Testing POST /api/reset-data (1-Click Test Wipe & Excel Restore)...");
  const resetRes = await req("http://localhost:3000/api/reset-data", {
    method: "POST",
  });

  if (resetRes.status === 200 && resetRes.data.success) {
    console.log("✓ 1-Click Test Data Reset Success:", resetRes.data.message);
  } else {
    console.error("✕ 1-Click Test Data Reset Failed:", resetRes);
    process.exit(1);
  }

  console.log("\n==========================================");
  console.log("🎉 All 6 Automated Backend Tests Passed Flawlessly (100% Success)!");
  console.log("==========================================");
}

runTests().catch(console.error);
