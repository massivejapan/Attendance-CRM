const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function parseExcelDate(serial) {
  if (!serial) return null;
  if (typeof serial === "string") {
    const d = new Date(serial);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
    const num = parseFloat(serial);
    if (!isNaN(num) && num > 20000) {
      const dt = new Date(Math.round((num - 25569) * 86400 * 1000));
      return dt.toISOString().split("T")[0];
    }
    return null;
  }
  if (typeof serial === "number") {
    const dt = new Date(Math.round((serial - 25569) * 86400 * 1000));
    return dt.toISOString().split("T")[0];
  }
  return null;
}

// Running batches explicit list and schedules
const RUNNING_BATCH_CONFIG = {
  "MJLI 15": { startDate: "2026-04-15", estimatedEndDate: "2026-10-30", targetTotalClasses: 72, completedClasses: 58, scheduleDays: "Sat Mon Wed", timeSlot: "10:00 AM - 12:00 PM" },
  "MJLI 17": { startDate: "2026-05-10", estimatedEndDate: "2026-11-20", targetTotalClasses: 72, completedClasses: 48, scheduleDays: "Sun Tue Thu", timeSlot: "02:00 PM - 04:00 PM" },
  "MJLI 18": { startDate: "2026-06-01", estimatedEndDate: "2026-12-15", targetTotalClasses: 72, completedClasses: 40, scheduleDays: "Sat Mon Wed", timeSlot: "04:00 PM - 06:00 PM" },
  "MJLI 19": { startDate: "2026-07-01", estimatedEndDate: "2027-01-15", targetTotalClasses: 72, completedClasses: 26, scheduleDays: "Sun Tue Thu", timeSlot: "10:00 AM - 12:00 PM" },
  "MJLI 20": { startDate: "2026-08-01", estimatedEndDate: "2027-02-15", targetTotalClasses: 72, completedClasses: 16, scheduleDays: "Sat Mon Wed", timeSlot: "02:00 PM - 04:00 PM" },
  "N4 26C": { startDate: "2026-08-15", estimatedEndDate: "2027-02-28", targetTotalClasses: 72, completedClasses: 12, scheduleDays: "Sun Tue Thu", timeSlot: "04:00 PM - 06:00 PM" },
  "MJLI-21": { startDate: "2026-09-01", estimatedEndDate: "2027-03-15", targetTotalClasses: 72, completedClasses: 6, scheduleDays: "Sat Mon Wed", timeSlot: "10:00 AM - 12:00 PM" },
  "MJLI 22": { startDate: "2026-09-15", estimatedEndDate: "2027-03-30", targetTotalClasses: 72, completedClasses: 2, scheduleDays: "Sun Tue Thu", timeSlot: "02:00 PM - 04:00 PM" },
};

async function seed() {
  console.log("==========================================");
  console.log("🚀 Starting Complete Database Seeding & Excel Migration");
  console.log("==========================================");

  // 1. Clean previous data
  console.log("Clearing previous database tables...");
  await prisma.attendance.deleteMany({});
  await prisma.classLog.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.batch.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.appSetting.deleteMany({});

  // 2. Create Super Admin & Teachers
  const adminPassword = await bcrypt.hash("admin123", 10);
  const teacherPassword = await bcrypt.hash("teacher123", 10);

  await prisma.user.create({
    data: {
      name: "Super Administrator",
      username: "admin",
      email: "admin@massivejapan.com",
      password: adminPassword,
      role: "SUPER_ADMIN",
      isActive: true,
      assignedBatchIds: JSON.stringify(["ALL"]),
    },
  });
  console.log("✓ Super Admin created: admin / admin123");

  await prisma.user.create({
    data: {
      name: "MAM Sir",
      username: "mam",
      email: "mam@massivejapan.com",
      password: teacherPassword,
      role: "TEACHER",
      phone: "01711-223344",
      isActive: true,
      assignedBatchIds: JSON.stringify([]),
      assignedDays: JSON.stringify(["Sat", "Mon", "Wed"]),
    },
  });

  await prisma.user.create({
    data: {
      name: "Shakil Sir",
      username: "shakil",
      email: "shakil@massivejapan.com",
      password: teacherPassword,
      role: "TEACHER",
      phone: "01822-334455",
      isActive: true,
      assignedBatchIds: JSON.stringify([]),
      assignedDays: JSON.stringify(["Sun", "Tue", "Thu"]),
    },
  });

  await prisma.user.create({
    data: {
      name: "Nazrul Islam Sir",
      username: "nazrul",
      email: "nazrul@massivejapan.com",
      password: teacherPassword,
      role: "TEACHER",
      phone: "01933-445566",
      isActive: true,
      assignedBatchIds: JSON.stringify([]),
      assignedDays: JSON.stringify(["Sat", "Mon", "Wed"]),
    },
  });
  console.log("✓ Core Teachers created (mam, shakil, nazrul)");

  // 3. Pre-create all batches from both files
  const masterFile = path.join(__dirname, "../MJLI_Batch_Information_Connected.xlsx");
  const attFile = path.join(__dirname, "../ATTENDANCE_SHEET_FIXED.xlsx");

  const batchNames = new Set();
  let masterRows = [];

  if (fs.existsSync(masterFile)) {
    const wb = xlsx.readFile(masterFile);
    const masterSheetName = wb.SheetNames.find((s) => s.toLowerCase().includes("master"));
    if (masterSheetName) {
      masterRows = xlsx.utils.sheet_to_json(wb.Sheets[masterSheetName], { defval: "" });
      masterRows.forEach((r) => {
        const b = String(r["Batch"] || "").trim();
        if (b) batchNames.add(b);
      });
    }
  }

  let attWb = null;
  if (fs.existsSync(attFile)) {
    attWb = xlsx.readFile(attFile);
    attWb.SheetNames.forEach((s) => {
      if (!s.toLowerCase().includes("orginal") && !s.toLowerCase().includes("original")) {
        const b = s.trim();
        if (b) batchNames.add(b);
      }
    });
  }

  console.log(`Creating ${batchNames.size} batches...`);
  const batchesToCreate = [];
  for (const bName of batchNames) {
    const isExplicitRunning = !!RUNNING_BATCH_CONFIG[bName] || bName.toLowerCase().includes("22") || bName.toLowerCase().includes("21") || bName.toLowerCase().includes("20");
    const config = RUNNING_BATCH_CONFIG[bName] || {};
    const status = isExplicitRunning ? "RUNNING" : "COMPLETED";

    batchesToCreate.push({
      name: bName,
      scheduleDays: config.scheduleDays || (bName.includes("24") || bName.includes("25") ? "Sun Tue Thu" : "Sat Mon Wed"),
      timeSlot: config.timeSlot || "10:00 AM - 12:00 PM",
      startDate: config.startDate ? new Date(config.startDate) : new Date("2025-01-01"),
      estimatedEndDate: config.estimatedEndDate || (status === "RUNNING" ? "2026-12-31" : "2025-07-01"),
      targetTotalClasses: config.targetTotalClasses || 72,
      completedClasses: config.completedClasses || (status === "COMPLETED" ? 72 : 20),
      status: status,
    });
  }

  await prisma.batch.createMany({
    data: batchesToCreate,
    skipDuplicates: true,
  });

  const allBatches = await prisma.batch.findMany({});
  const batchMap = new Map();
  allBatches.forEach((b) => batchMap.set(b.name, b));
  console.log(`✓ ${allBatches.length} batches saved to database.`);

  // 4. Prepare Students from Master File
  const uniqueStudentsMap = new Map(); // studentIdCode -> student object

  for (const row of masterRows) {
    const batchName = String(row["Batch"] || "").trim();
    const studentIdCode = String(row["Student ID"] || "").trim();
    const studentName = String(row["Student Name"] || "").trim();
    const mobileNumber = String(row["Mobile Number"] || "").trim();
    const guardianNumber = String(row["Guardian Number"] || "").trim();
    const courseStatus = String(row["Course Status"] || "").trim().toLowerCase();

    if (!studentIdCode || !studentName) continue;
    if (uniqueStudentsMap.has(studentIdCode)) continue; // keep first occurrence

    const batch = batchMap.get(batchName);

    let milestoneStage = "LANGUAGE_COURSE";
    let interviewCompany = null;
    let interviewDate = null;
    let interviewTime = null;
    let coeNumber = null;
    let visaIssueDate = null;
    let visaNotes = null;

    if (studentIdCode === "25235") {
      milestoneStage = "VISA_APPROVED";
      coeNumber = "COE-2026-TK890";
      visaIssueDate = "2026-09-10";
      visaNotes = "Visa Approved. Flight next month.";
    } else if (studentIdCode === "25236") {
      milestoneStage = "INTERVIEW_SCHEDULED";
      interviewDate = "2026-09-25";
      interviewTime = "11:30 AM";
      interviewCompany = "Tokyo Care Services Corp";
    } else if (studentIdCode === "25110") {
      milestoneStage = "COE_PROCESSING";
      coeNumber = "COE-2026-OSAKA12";
      visaNotes = "Documents submitted to Immigration.";
    } else if (studentIdCode === "155") {
      milestoneStage = "FLIGHT_READY";
      visaIssueDate = "2026-09-01";
      visaNotes = "Ticket confirmed.";
    }

    const isStudentComplete = courseStatus.includes("complete") || courseStatus.includes("closed");

    uniqueStudentsMap.set(studentIdCode, {
      studentIdCode: studentIdCode,
      name: studentName,
      mobileNumber: mobileNumber === "0" ? null : mobileNumber,
      guardianNumber: guardianNumber === "0" ? null : guardianNumber,
      batchId: batch ? batch.id : null,
      batchName: batch ? batch.name : null,
      status: isStudentComplete ? "COMPLETED" : "ACTIVE",
      milestoneStage,
      interviewCompany,
      interviewDate,
      interviewTime,
      coeNumber,
      visaIssueDate,
      visaStatusNotes: visaNotes,
    });
  }

  // Also scan attendance sheet for any extra students not in master
  if (attWb) {
    for (const sheetName of attWb.SheetNames) {
      if (sheetName.toLowerCase().includes("orginal") || sheetName.toLowerCase().includes("original")) continue;
      const sheet = attWb.Sheets[sheetName];
      if (!sheet) continue;
      const cleanBatchName = sheetName.trim();
      const batch = batchMap.get(cleanBatchName);
      const isRunning = batch ? batch.status === "RUNNING" : false;

      const sheetData = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      for (let r = 0; r < sheetData.length; r++) {
        const row = sheetData[r];
        const studentId = String(row[1] || "").trim();
        const studentName = String(row[2] || "").trim();
        if (studentId && studentName && studentId.length >= 2 && !uniqueStudentsMap.has(studentId) && isNaN(Number(studentName))) {
          uniqueStudentsMap.set(studentId, {
            studentIdCode: studentId,
            name: studentName,
            mobileNumber: null,
            guardianNumber: null,
            batchId: batch ? batch.id : null,
            batchName: batch ? batch.name : null,
            status: isRunning ? "ACTIVE" : "COMPLETED",
            milestoneStage: "LANGUAGE_COURSE",
          });
        }
      }
    }
  }

  console.log(`Creating ${uniqueStudentsMap.size} unique students in database...`);
  await prisma.student.createMany({
    data: Array.from(uniqueStudentsMap.values()),
    skipDuplicates: true,
  });

  const allStudents = await prisma.student.findMany({});
  const studentMap = new Map();
  allStudents.forEach((s) => studentMap.set(s.studentIdCode, s));
  console.log(`✓ ${allStudents.length} students loaded into memory.`);

  // 5. Process Attendance Records & Class Logs
  const attendanceRecordsMap = new Map();
  const classLogsMap = new Map();
  const batchCompletedClassCount = new Map();

  if (attWb) {
    console.log(`Processing attendance sheets from ${path.basename(attFile)}...`);
    for (const sheetName of attWb.SheetNames) {
      if (sheetName.toLowerCase().includes("orginal") || sheetName.toLowerCase().includes("original")) continue;
      const sheet = attWb.Sheets[sheetName];
      if (!sheet) continue;

      const cleanBatchName = sheetName.trim();
      const batch = batchMap.get(cleanBatchName);
      if (!batch) continue;

      const sheetData = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      if (sheetData.length < 9) continue;

      let teacherRowIdx = -1;
      let dayRowIdx = -1;
      let dateRowIdx = -1;

      for (let r = 0; r < Math.min(12, sheetData.length); r++) {
        const row = sheetData[r];
        if (row.some((cell) => ["Sat", "Mon", "Tue", "Wed", "Thu", "Sun", "Fri"].includes(String(cell).trim()))) {
          dayRowIdx = r;
          if (r > 0) teacherRowIdx = r - 1;
          if (r + 1 < sheetData.length) dateRowIdx = r + 1;
          break;
        }
      }

      if (dateRowIdx === -1) continue;

      const teacherRow = sheetData[teacherRowIdx] || [];
      const dayRow = sheetData[dayRowIdx] || [];
      const dateRow = sheetData[dateRowIdx] || [];

      const colMap = [];
      for (let col = 6; col < dateRow.length; col++) {
        const dateStr = parseExcelDate(dateRow[col]);
        if (dateStr) {
          const tName = String(teacherRow[col] || "").trim();
          const dName = String(dayRow[col] || "").trim();
          colMap.push({
            colIndex: col,
            dateStr: dateStr,
            dayName: dName,
            teacherName: tName || "Teacher",
          });
        }
      }

      batchCompletedClassCount.set(batch.id, colMap.length);

      for (let r = dateRowIdx + 1; r < sheetData.length; r++) {
        const row = sheetData[r];
        const studentId = String(row[1] || "").trim();
        const studentName = String(row[2] || "").trim();

        if (!studentId || !studentName || studentId.length < 2) continue;

        const student = studentMap.get(studentId);
        if (!student) continue;

        for (const col of colMap) {
          const mark = String(row[col.colIndex] || "").trim().toUpperCase();
          if (!mark) continue;

          let status = "PRESENT";
          let note = null;

          if (mark === "A") {
            status = "ABSENT";
            note = "Absent in class";
          } else if (mark === "E" || mark === "LEAVE") {
            status = "EXCUSED";
            note = "Leave granted";
          } else if (mark === "OFF DAY") {
            status = "OFF_DAY";
          } else if (mark.includes("BATCH")) {
            status = "BATCH_CHANGED";
          } else if (mark === "P") {
            status = "PRESENT";
          } else {
            continue;
          }

          const uniqueKey = `${student.id}_${batch.id}_${col.dateStr}`;
          attendanceRecordsMap.set(uniqueKey, {
            studentId: student.id,
            batchId: batch.id,
            date: col.dateStr,
            dayName: col.dayName,
            status,
            note,
          });
        }
      }

      if (colMap.length > 0) {
        const lastCol = colMap[colMap.length - 1];
        const logKey = `${batch.id}_${lastCol.dateStr}`;
        classLogsMap.set(logKey, {
          batchId: batch.id,
          date: lastCol.dateStr,
          dayName: lastCol.dayName,
          teacherName: lastCol.teacherName || "MAM Sir",
          topicCovered: "অধ্যায় ৪: জাপানি ব্যাকরণ অনুশীলন ও শব্দার্থ রিভিশন সম্পন্ন করা হয়েছে।",
          homework: "পৃষ্ঠা ৪২-এর অনুশীলন ১ থেকে ১০ খাতায় লিখে আনা।",
          presentCount: 5,
          absentCount: 1,
          excusedCount: 0,
          totalStudents: 6,
        });
      }
    }
  }

  // Update batch completed class counts
  for (const [batchId, count] of batchCompletedClassCount.entries()) {
    if (count > 0) {
      await prisma.batch.update({
        where: { id: batchId },
        data: { completedClasses: count },
      });
    }
  }

  // 6. Bulk Insert Attendance & Class Logs in Chunks
  console.log(`\nBulk inserting ${attendanceRecordsMap.size} attendance records to Supabase...`);
  const attArray = Array.from(attendanceRecordsMap.values());
  const chunkSize = 1500;
  for (let i = 0; i < attArray.length; i += chunkSize) {
    const chunk = attArray.slice(i, i + chunkSize);
    await prisma.attendance.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    console.log(`✓ Inserted chunk ${Math.floor(i / chunkSize) + 1} (${chunk.length} records)`);
  }

  console.log(`Bulk inserting ${classLogsMap.size} class logs...`);
  const logsArray = Array.from(classLogsMap.values());
  await prisma.classLog.createMany({
    data: logsArray,
    skipDuplicates: true,
  });

  // 7. Update assigned batches for teachers (Assign Running Batches)
  const runningBatches = await prisma.batch.findMany({ where: { status: "RUNNING" } });
  const allBatchIds = allBatches.map((b) => b.id);
  const runningBatchIds = runningBatches.map((b) => b.id);

  const mamBatches = runningBatchIds.slice(0, 3);
  const shakilBatches = runningBatchIds.slice(3, 6);
  const nazrulBatches = runningBatchIds.slice(6, 8);

  await prisma.user.update({
    where: { username: "admin" },
    data: { assignedBatchIds: JSON.stringify(allBatchIds) },
  });
  await prisma.user.update({
    where: { username: "mam" },
    data: { assignedBatchIds: JSON.stringify(mamBatches) },
  });
  await prisma.user.update({
    where: { username: "shakil" },
    data: { assignedBatchIds: JSON.stringify(shakilBatches) },
  });
  await prisma.user.update({
    where: { username: "nazrul" },
    data: { assignedBatchIds: JSON.stringify(nazrulBatches) },
  });

  const totalS = await prisma.student.count();
  const totalB = await prisma.batch.count();
  const runningB = await prisma.batch.count({ where: { status: "RUNNING" } });
  const completedB = await prisma.batch.count({ where: { status: "COMPLETED" } });
  const totalA = await prisma.attendance.count();

  console.log("==========================================");
  console.log(`🎉 Supabase PostgreSQL Seeding 100% COMPLETE!`);
  console.log(`- Students: ${totalS}`);
  console.log(`- Total Batches: ${totalB} (Running: ${runningB}, Completed: ${completedB})`);
  console.log(`- Attendance Records: ${totalA}`);
  console.log("==========================================");
}

seed()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
