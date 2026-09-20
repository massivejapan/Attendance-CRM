export type UserRole = "SUPER_ADMIN" | "TEACHER";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "EXCUSED" | "OFF_DAY" | "BATCH_CHANGED";

export type StudentStatus = "ACTIVE" | "INACTIVE" | "BATCH_CHANGED" | "COMPLETED" | "DROPPED";

export type MilestoneStage =
  | "LANGUAGE_COURSE"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_PASSED"
  | "COE_PROCESSING"
  | "COE_APPROVED"
  | "VISA_PROCESSING"
  | "VISA_APPROVED"
  | "FLIGHT_READY"
  | "REJECTED";

export interface StudentMilestone {
  stage: MilestoneStage;
  interviewDate?: string;     // YYYY-MM-DD
  interviewTime?: string;     // e.g. "11:00 AM"
  interviewCompany?: string;  // e.g. "Tokyo Care Support Co., Ltd."
  interviewPlatform?: string; // e.g. "Zoom" / "Office Physical"
  interviewResultNotes?: string;
  coeApplicationDate?: string;
  coeResultDate?: string;
  coeNumber?: string;
  visaSubmissionDate?: string;
  visaIssueDate?: string;
  visaStatusNotes?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  assignedBatchIds: string[]; // batch IDs assigned to this teacher
  assignedDays?: string[];   // e.g. ["Sat", "Mon", "Wed"]
  avatarUrl?: string;
  createdAt: string;
}

export interface Batch {
  id: string;
  name: string;
  code?: string;
  scheduleDays: string; // e.g. "Sat Mon Wed" or "Sun Tue Thu"
  timeSlot?: string;    // e.g. "10:00 AM - 12:00 PM"
  startDate?: string;
  endDate?: string;
  estimatedEndDate?: string;
  targetTotalClasses?: number;
  completedClasses?: number;
  daysRemaining?: number;
  status: "RUNNING" | "COMPLETED" | "UPCOMING";
  primaryTeacherId?: string;
  totalStudents?: number;
  studentCount?: number;
}

export interface Student {
  id: string;
  studentIdCode: string; // e.g. "25110", "25235"
  name: string;
  mobileNumber?: string;
  guardianNumber?: string;
  batchId: string;
  batchName?: string;
  status: StudentStatus;
  joinedDate?: string;
  refInfo?: string;
  notes?: string;
  totalClasses?: number;
  totalPresent?: number;
  totalAbsent?: number;
  totalExcused?: number;
  attendancePercentage?: number;
  consecutiveAbsents?: number;
  lastAbsentDates?: string[];
  milestoneStage?: MilestoneStage;
  interviewDate?: string;
  interviewTime?: string;
  interviewCompany?: string;
  interviewPlatform?: string;
  coeNumber?: string;
  coeResultDate?: string;
  visaIssueDate?: string;
  visaStatusNotes?: string;
  milestone?: StudentMilestone; // Career / Interview / COE / Visa details
  batchHistory?: {
    fromBatch?: string;
    toBatch?: string;
    fromBatchName?: string;
    toBatchName?: string;
    fromBatchId?: string;
    toBatchId?: string;
    date: string;
    reason: string;
    transferredBy?: string;
  }[];
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  batchId: string;
  teacherId?: string;
  substituteTeacherName?: string;
  date: string; // YYYY-MM-DD
  dayName: string; // Sat, Mon, etc.
  status: AttendanceStatus;
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ClassLog {
  id: string;
  batchId: string;
  teacherId?: string;
  teacherName: string;
  isSubstitute?: boolean;
  date: string;
  dayName: string;
  topicCovered: string;
  homework?: string;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  totalStudents: number;
  submittedAt: string;
}

export interface StudentAttendanceSummary {
  student: Student;
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  attendancePercentage: number;
  consecutiveAbsents: number;
  lastClassStatus?: AttendanceStatus;
  recentNotes: { date: string; note: string }[];
}

export interface BatchSummaryStats {
  batchId: string;
  batchName: string;
  scheduleDays: string;
  totalStudents: number;
  todayStatus: "COMPLETED" | "PENDING";
  todayPresent?: number;
  todayAbsent?: number;
  todayTeacher?: string;
  todayTopic?: string;
  avgAttendanceRate: number;
}
