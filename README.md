# MJLI Student Attendance, Teacher Tracking & Career CRM

A production-grade, full-stack Next.js web application designed for **Massive Japan Language Institute (MJLI)** to manage student attendance, teacher course tracking, batch management, milestone/visa career tracking, automated alerts, and Google Sheets sync.

---

## 🌟 Key Features

### 1. Smart Student Attendance System
- **Single-Click Batch Attendance:** Mark Present, Absent, Late, or Leave for entire batches.
- **Consecutive Absence Alerts:** Highlights students who missed 2+ consecutive classes so teachers/admins can follow up immediately.
- **Class Logs & Syllabus Topics:** Teachers can log the topic/syllabus taught for each class date.
- **Attendance Percentage & History:** Instant visibility of total attendance rate, present count, and absent history.

### 2. Teacher Management & Tracking
- **Teacher Course & Syllabus Tracking:** Record and review what each teacher taught on any given date ("তারা কি পড়াইছে কোনদিন").
- **Batch Assignment:** Super Admin can add/remove assigned batches for teachers with an interactive batch selector modal.
- **Batch Isolation:** Teachers only see and take attendance for batches assigned to them in `RUNNING` status.

### 3. Super Admin Batch & Lifecycle Management
- **1-Click Batch Status Toggle:** Easily switch batches between `RUNNING` and `COMPLETED`.
- **Teacher View Isolation:** When a batch is marked as `COMPLETED`, it automatically hides from the active teacher view.
- **Estimated Completion Countdown:** Tracks course duration, completed classes, and estimated completion date countdown (`daysRemaining`, `targetTotalClasses = 72`).
- **New Batch Preparation Noticeboard:** Dashboard alerts administrators when batches are nearing completion within 45 days.

### 4. Student Management & Milestone Tracking
- **Full Student Profile & CRUD:** Edit student details (name, student ID, batch, mobile, guardian phone, status) and delete records.
- **Batch Shifting:** Move students between batches with an audit history.
- **Career & Visa Pipeline:** Track Interview prep, COE (Certificate of Eligibility) issuance, and Visa approval milestones with dashboard reminders.

### 5. Data Reliability & Backup
- **Master Excel Dataset Preserved:** Complete 342 students, 29 batches, and 7,700+ historical attendance records imported.
- **1-Click Test Data Reset:** Administrators can test adding data or shifts and restore the clean master dataset instantly with 1 click.
- **Google Sheets / Drive Auto-Sync:** Automated backup sync module to mirror attendance records to Google Drive/Sheets.

---

## 🛠 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Custom brand palette: `#F26622` Orange & `#662C90` Purple)
- **Icons:** Lucide React
- **ORM & Database:** Prisma ORM with SQLite (local development) / PostgreSQL (Supabase / Neon production ready)
- **Excel Processing:** SheetJS (`xlsx`)

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/massivejapan/Attendance-CRM.git
cd Attendance-CRM
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

### 4. Generate Prisma Client & Push Database Schema
```bash
npx prisma generate
npx prisma db push
```

### 5. Seed Initial Data (from Excel)
```bash
node scripts/seed-db.js
```

### 6. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
├── prisma/
│   ├── schema.prisma              # Database schema definition
│   └── dev.db                     # Local SQLite database
├── public/                        # Static assets & logos
├── scripts/
│   ├── seed-db.js                 # Excel data parser and database seeder
│   └── setup-supabase.js          # 1-step Supabase PostgreSQL migration script
├── src/
│   ├── app/
│   │   ├── api/                   # REST API routes (attendance, bootstrap, students, batches, teachers)
│   │   ├── layout.tsx             # Root layout with Bengali & Inter fonts
│   │   └── page.tsx               # Main app page router
│   ├── components/
│   │   ├── admin/                 # Admin components (Dashboard, Batches, Teachers, Students, Reports)
│   │   └── teacher/               # Teacher components (AttendanceSheet)
│   ├── context/
│   │   └── AppContext.tsx         # Global application state management
│   ├── lib/
│   │   └── prisma.ts              # Prisma singleton client
│   └── types/
│       └── index.ts               # TypeScript interfaces & types
└── package.json
```

---

## 🔐 Default Credentials

| Role | Email / ID | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@massivejapan.com` | `admin123` |
| **Teacher (Sample)** | `teacher@massivejapan.com` | `teacher123` |

---

## 📄 License
Massive Japan Language Institute (MJLI) - All rights reserved.
