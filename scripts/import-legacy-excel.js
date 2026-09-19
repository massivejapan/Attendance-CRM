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
    if (!isNaN(d.getTime())) return d;
    const num = parseFloat(serial);
    if (!isNaN(num) && num > 20000) {
      return new Date(Math.round((num - 25569) * 86400 * 1000));
    }
    return null;
  }
  if (typeof serial === "number") {
    return new Date(Math.round((serial - 25569) * 86400 * 1000));
  }
  return null;
}

async function main() {
  console.log("=== Starting Legacy Excel Import ===");

  // 1. Ensure Super Admin Exists
  const adminPassword = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "Super Administrator",
      username: "admin",
      email: "admin@attendance.crm",
      password: adminPassword,
      role: "SUPER_ADMIN",
    },
  });
  console.log("✓ Super Admin initialized:", adminUser.username);

  // 2. Read Master Batch & Student File
  const masterFilePath = path.join(__dirname, "../MJLI_Batch_Information_Connected.xlsx");
  if (fs.existsSync(masterFilePath)) {
    console.log("Found Master Excel file:", masterFilePath);
    const wb = xlsx.readFile(masterFilePath);

    // Read Master Summary Sheet
    const masterSheetName = wb.SheetNames.find((s) => s.toLowerCase().includes("master"));
    if (masterSheetName) {
      console.log(`Reading '${masterSheetName}' sheet...`);
      const masterRows = xlsx.utils.sheet_to_json(wb.Sheets[masterSheetName], { defval: "" });

      for (const row of masterRows) {
        const batchName = String(row["Batch"] || "").trim();
        const studentId = String(row["Student ID"] || "").trim();
        const studentName = String(row["Student Name"] || "").trim();
        const mobileNumber = String(row["Mobile Number"] || "").trim();
        const guardianNumber = String(row["Guardian Number"] || "").trim();
        const courseStatus = String(row["Course Status"] || "").trim();

        if (!studentId || !studentName) continue;

        let batchId = null;
        if (batchName) {
          const batch = await prisma.batch.upsert({
            where: { name: batchName },
            update: {},
            create: {
              name: batchName,
              status: courseStatus.toLowerCase() === "complete" ? "COMPLETED" : "RUNNING",
            },
          });
          batchId = batch.id;
        }

        await prisma.student.upsert({
          where: { studentIdCode: studentId },
          update: {
            name: studentName,
            mobileNumber: mobileNumber === "0" ? null : mobileNumber,
            guardianNumber: guardianNumber === "0" ? null : guardianNumber,
            batchId: batchId,
          },
          create: {
            studentIdCode: studentId,
            name: studentName,
            mobileNumber: mobileNumber === "0" ? null : mobileNumber,
            guardianNumber: guardianNumber === "0" ? null : guardianNumber,
            batchId: batchId,
            status: courseStatus.toLowerCase() === "complete" ? "COMPLETED" : "ACTIVE",
          },
        });
      }
      console.log("✓ Master students and batches imported.");
    }
  }

  // 3. Read Attendance Sheet File
  const attFilePath = path.join(__dirname, "../ATTENDANCE_SHEET_FIXED.xlsx");
  if (fs.existsSync(attFilePath)) {
    console.log("Found Attendance Excel file:", attFilePath);
    const wb = xlsx.readFile(attFilePath);

    const defaultTeacherPassword = await bcrypt.hash("teacher123", 10);

    for (const sheetName of wb.SheetNames) {
      if (sheetName.toLowerCase() === "orginal" || sheetName.toLowerCase().includes("original")) {
        continue;
      }
      const sheet = wb.Sheets[sheetName];
      if (!sheet) continue;

      console.log(`Processing Attendance Sheet: ${sheetName}...`);

      // Ensure batch exists
      const cleanBatchName = sheetName.trim();
      const batch = await prisma.batch.upsert({
        where: { name: cleanBatchName },
        update: {},
        create: {
          name: cleanBatchName,
          status: "RUNNING",
        },
      });

      // Parse Sheet Rows manually to extract dates & teachers
      const sheetData = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      if (sheetData.length < 10) continue;

      // Find Header rows
      // Typically:
      // Row 6 (index 6): Teacher Names
      // Row 7 (index 7): Days (Sat, Mon, Wed)
      // Row 8 (index 8): Dates (46116, etc.)
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

      // Map column indexes to date, day, teacher
      const columnMap = [];
      for (let col = 6; col < dateRow.length; col++) {
        const dateVal = parseExcelDate(dateRow[col]);
        if (dateVal && !isNaN(dateVal.getTime())) {
          const teacherName = String(teacherRow[col] || "").trim();
          const dayName = String(dayRow[col] || "").trim();
          
          let teacherId = null;
          if (teacherName && teacherName !== "BATCH START DATE" && teacherName.length > 1) {
            const username = teacherName.toLowerCase().replace(/[^a-z0-9]/g, "");
            const teacher = await prisma.user.upsert({
              where: { username: username },
              update: {},
              create: {
                name: teacherName,
                username: username,
                password: defaultTeacherPassword,
                role: "TEACHER",
              },
            });
            teacherId = teacher.id;

            // Connect Teacher to Batch
            await prisma.batchTeacher.upsert({
              where: {
                batchId_teacherId: {
                  batchId: batch.id,
                  teacherId: teacher.id,
                },
              },
              update: {},
              create: {
                batchId: batch.id,
                teacherId: teacher.id,
              },
            }).catch(() => {});
          }

          columnMap.push({
            colIndex: col,
            date: dateVal,
            dayName: dayName,
            teacherId: teacherId,
          });
        }
      }

      // Process Student Rows
      for (let r = dateRowIdx + 1; r < sheetData.length; r++) {
        const row = sheetData[r];
        const studentId = String(row[1] || "").trim();
        const studentName = String(row[2] || "").trim();

        if (!studentId || !studentName || studentId.length < 2) continue;

        // Upsert student
        const student = await prisma.student.upsert({
          where: { studentIdCode: studentId },
          update: {
            batchId: batch.id,
          },
          create: {
            studentIdCode: studentId,
            name: studentName,
            batchId: batch.id,
            status: "ACTIVE",
          },
        });

        // Insert attendance for each column
        for (const cm of columnMap) {
          const mark = String(row[cm.colIndex] || "").trim().toUpperCase();
          if (!mark) continue;

          let status = "PRESENT";
          if (mark === "A") status = "ABSENT";
          else if (mark === "E" || mark === "LEAVE" || mark === "EXCUSED") status = "EXCUSED";
          else if (mark === "OFF DAY") status = "OFF_DAY";
          else if (mark.includes("BATCH")) status = "BATCH_CHANGED";
          else if (mark === "P") status = "PRESENT";
          else continue;

          await prisma.attendance.upsert({
            where: {
              studentId_batchId_date: {
                studentId: student.id,
                batchId: batch.id,
                date: cm.date,
              },
            },
            update: {
              status: status,
              teacherId: cm.teacherId,
              dayName: cm.dayName,
            },
            create: {
              studentId: student.id,
              batchId: batch.id,
              teacherId: cm.teacherId,
              date: cm.date,
              dayName: cm.dayName,
              status: status,
            },
          }).catch((err) => {});
        }
      }
      console.log(`✓ Processed sheet ${sheetName}`);
    }
  }

  console.log("=== Migration Completed Successfully ===");
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
