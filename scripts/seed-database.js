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

  const admin = await prisma.user.create({
    data: {
      name: "Super Administrator",
      username: "admin",
      email: "admin@mjli-attendance.com",
      password: adminPassword,
      role: "SUPER_ADMIN",
      isActive: true,
      assignedBatchIds: JSON.stringify(["ALL"]),
    },
  });
  console.log("✓ Super Admin created: admin / admin123");

  const mam = await prisma.user.create({
    data: {
      name: "MAM Sir",
      username: "mam",
      email: "mam@mjli-attendance.com",
      password: teacherPassword,
      role: "TEACHER",
      phone: "01711-223344",
      isActive: true,
      assignedBatchIds: JSON.stringify([]),
      assignedDays: JSON.stringify(["Sat", "Mon", "Wed"]),
    },
  });

  const shakil = await prisma.user.create({
    data: {
      name: "Shakil Sir",
      username: "shakil",
      email: "shakil@mjli-attendance.com",
      password: teacherPassword,
      role: "TEACHER",
      phone: "01822-334455",
      isActive: true,
      assignedBatchIds: JSON.stringify([]),
      assignedDays: JSON.stringify(["Sun", "Tue", "Thu"]),
    },
  });

  const nazrul = await prisma.user.create({
    data: {
      name: "Nazrul Islam Sir",
      username: "nazrul",
      email: "nazrul@mjli-attendance.com",
      password: teacherPassword,
      role: "TEACHER",
      phone: "01933-445566",
      isActive: true,
      assignedBatchIds: JSON.stringify([]),
      assignedDays: JSON.stringify(["Sat", "Mon", "Wed"]),
    },
  });
  console.log("✓ Core Teachers created (mam, shakil, nazrul)");

  // 3. Process Master Batch & Student Information
  const masterFile = path.join(__dirname, "../MJLI_Batch_Information_Connected.xlsx");
  const batchMap = new Map(); // name -> batch record

  if (fs.existsSync(masterFile)) {
    console.log(`\nReading Master File: ${path.basename(masterFile)}...`);
    const wb = xlsx.readFile(masterFile);

    const masterSheetName = wb.SheetNames.find((s) => s.toLowerCase().includes("master"));
    if (masterSheetName) {
      const masterRows = xlsx.utils.sheet_to_json(wb.Sheets[masterSheetName], { defval: "" });
      console.log(`Found ${masterRows.length} student records in ${masterSheetName}`);

      for (const row of masterRows) {
        const batchName = String(row["Batch"] || "").trim();
        const studentIdCode = String(row["Student ID"] || "").trim();
        const studentName = String(row["Student Name"] || "").trim();
        const mobileNumber = String(row["Mobile Number"] || "").trim();
        const guardianNumber = String(row["Guardian Number"] || "").trim();
        const courseStatus = String(row["Course Status"] || "").trim().toLowerCase();

        if (!studentIdCode || !studentName) continue;

        let batch = null;
        if (batchName) {
          if (!batchMap.has(batchName)) {
            const isExplicitRunning = RUNNING_BATCH_CONFIG[batchName] || courseStatus.includes("run");
            const status = isExplicitRunning ? "RUNNING" : "COMPLETED";
            const config = RUNNING_BATCH_CONFIG[batchName] || {};

            const newBatch = await prisma.batch.upsert({
              where: { name: batchName },
              update: {},
              create: {
                name: batchName,
                scheduleDays: config.scheduleDays || (batchName.includes("24") || batchName.includes("25") ? "Sun Tue Thu" : "Sat Mon Wed"),
                timeSlot: config.timeSlot || "10:00 AM - 12:00 PM",
                startDate: config.startDate ? new Date(config.startDate) : new Date("2025-01-01"),
                estimatedEndDate: config.estimatedEndDate || (status === "RUNNING" ? "2026-12-31" : "2025-07-01"),
                targetTotalClasses: config.targetTotalClasses || 72,
                completedClasses: config.completedClasses || (status === "COMPLETED" ? 72 : 20),
                status: status,
              },
            });
            batchMap.set(batchName, newBatch);
          }
          batch = batchMap.get(batchName);
        }

        // Realistic milestones for tracking demonstration
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

        await prisma.student.upsert({
          where: { studentIdCode: studentIdCode },
          update: {
            name: studentName,
            mobileNumber: mobileNumber === "0" ? null : mobileNumber,
            guardianNumber: guardianNumber === "0" ? null : guardianNumber,
            batchId: batch ? batch.id : null,
            batchName: batch ? batch.name : null,
            status: isStudentComplete ? "COMPLETED" : "ACTIVE",
          },
          create: {
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
          },
        });
      }
      console.log("✓ Master students and batches imported successfully.");
    }
  }

  // 4. Process Attendance Sheet File
  const attFile = path.join(__dirname, "../ATTENDANCE_SHEET_FIXED.xlsx");
  if (fs.existsSync(attFile)) {
    console.log(`\nReading Attendance File: ${path.basename(attFile)}...`);
    const wb = xlsx.readFile(attFile);

    for (const sheetName of wb.SheetNames) {
      if (sheetName.toLowerCase().includes("orginal") || sheetName.toLowerCase().includes("original")) {
        continue;
      }
      const sheet = wb.Sheets[sheetName];
      if (!sheet) continue;

      const cleanBatchName = sheetName.trim();
      let batch = await prisma.batch.findUnique({ where: { name: cleanBatchName } });
      const isConfigRunning = !!RUNNING_BATCH_CONFIG[cleanBatchName];

      if (!batch) {
        const config = RUNNING_BATCH_CONFIG[cleanBatchName] || {};
        batch = await prisma.batch.create({
          data: {
            name: cleanBatchName,
            scheduleDays: config.scheduleDays || (cleanBatchName.includes("24") || cleanBatchName.includes("25") ? "Sun Tue Thu" : "Sat Mon Wed"),
            timeSlot: config.timeSlot || "02:00 PM - 04:00 PM",
            startDate: config.startDate ? new Date(config.startDate) : new Date("2026-01-01"),
            estimatedEndDate: config.estimatedEndDate || (isConfigRunning ? "2026-12-31" : "2025-12-31"),
            targetTotalClasses: 72,
            status: isConfigRunning ? "RUNNING" : "COMPLETED",
          },
        });
        batchMap.set(cleanBatchName, batch);
      }

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

      // Update completedClasses count in batch
      if (colMap.length > 0) {
        await prisma.batch.update({
          where: { id: batch.id },
          data: { completedClasses: colMap.length },
        });
      }

      // Process students and attendance records
      let recordCount = 0;
      for (let r = dateRowIdx + 1; r < sheetData.length; r++) {
        const row = sheetData[r];
        const studentId = String(row[1] || "").trim();
        const studentName = String(row[2] || "").trim();

        if (!studentId || !studentName || studentId.length < 2) continue;

        let student = await prisma.student.findUnique({ where: { studentIdCode: studentId } });
        if (!student) {
          student = await prisma.student.create({
            data: {
              studentIdCode: studentId,
              name: studentName,
              batchId: batch.id,
              batchName: batch.name,
              status: isConfigRunning ? "ACTIVE" : "COMPLETED",
            },
          });
        } else if (!student.batchId) {
          await prisma.student.update({
            where: { id: student.id },
            data: { batchId: batch.id, batchName: batch.name },
          });
        }

        // Insert attendance records
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

          await prisma.attendance.upsert({
            where: {
              studentId_batchId_date: {
                studentId: student.id,
                batchId: batch.id,
                date: col.dateStr,
              },
            },
            update: { status, note, dayName: col.dayName },
            create: {
              studentId: student.id,
              batchId: batch.id,
              date: col.dateStr,
              dayName: col.dayName,
              status,
              note,
            },
          }).catch(() => {});
          recordCount++;
        }
      }

      // Create a sample class log for the latest date
      if (colMap.length > 0) {
        const lastCol = colMap[colMap.length - 1];
        await prisma.classLog.upsert({
          where: {
            batchId_date: {
              batchId: batch.id,
              date: lastCol.dateStr,
            },
          },
          update: {},
          create: {
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
          },
        }).catch(() => {});
      }

      console.log(`✓ Processed batch sheet: ${cleanBatchName} (${recordCount} marks)`);
    }
  }

  // 5. Update assigned batches for teachers (Assign Running Batches)
  const runningBatches = await prisma.batch.findMany({ where: { status: "RUNNING" } });
  const allBatches = await prisma.batch.findMany({});
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
  console.log(`🎉 Seeding Complete!`);
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
