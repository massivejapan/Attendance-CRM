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
  documents?: Record<string, StudentDocumentItem>;
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

export interface StudentDocumentItem {
  id: string; // e.g. "app_form_jp"
  title: string;
  isSubmitted: boolean;
  receivedDate?: string; // YYYY-MM-DD
  receivedBy?: string; // e.g. "Sadif", "Admin"
  status?: "OK" | "CORRECTION_NEEDED" | "PENDING";
  note?: string; // Editable note / correction remarks
  updatedAt?: string;
}

export const STANDARD_VISA_DOCUMENTS: { id: string; title: string; category: string }[] = [
  { id: "app_form_jp", title: "Application Form ( From JP School )", category: "Application" },
  { id: "study_purpose_en", title: "Study Purpose English", category: "Statement of Purpose" },
  { id: "study_purpose_jp", title: "Study Purpose JP Translate", category: "Statement of Purpose" },
  { id: "lang_cert_massive", title: "Languages Certificate ( Massive )", category: "Language" },
  { id: "passport", title: "Student Passport", category: "Identity" },
  { id: "lang_cert_jp_other", title: "Japanese Languages Certificate ( If any )", category: "Language" },
  { id: "edu_cert", title: "HSC/Bachelor Certificate", category: "Education" },
  { id: "edu_cert_jp", title: "HSC /Bachelor Certificate JP Translate", category: "Education" },
  { id: "edu_transcript", title: "HSC/Bachelor Transcript", category: "Education" },
  { id: "edu_transcript_jp", title: "HSC/Bachelor Transcript JP Translate", category: "Education" },
  { id: "uni_noc", title: "University NOC ( If Running Student )", category: "Education" },
  { id: "uni_noc_jp", title: "University NOC JP Translate", category: "Education" },
  { id: "nid_sponsor", title: "NID Sponsor", category: "Sponsor" },
  { id: "nid_sponsor_jp", title: "NID Sponsor Jp Translate", category: "Sponsor" },
  { id: "family_cert", title: "Family Certificate ( Student)", category: "Family" },
  { id: "family_cert_jp", title: "Family Certificate ( Student) JP Translate", category: "Family" },
  { id: "sponsor_tin", title: "Sponsor TIN Certificate", category: "Financial" },
  { id: "sponsor_tin_jp", title: "Sponsor TIN Certificate JP Translate", category: "Financial" },
  { id: "sponsor_tax", title: "Sponsor TAX Certificate", category: "Financial" },
  { id: "sponsor_tax_jp", title: "Sponsor TAX Certificate JP Translate", category: "Financial" },
  { id: "sponsor_ack_cert", title: "Sponsor Acknowledgement Certificate", category: "Financial" },
  { id: "sponsor_ack_cert_jp", title: "Sponsor Acknowledgement Certificate JP Translate", category: "Financial" },
  { id: "sponsor_trade_license", title: "Sponsor Trade License", category: "Business" },
  { id: "sponsor_trade_license_jp", title: "Sponsor Trade License JP Translate", category: "Business" },
  { id: "bank_solvency", title: "Bank Solvency Certificate", category: "Banking" },
  { id: "bank_solvency_jp", title: "Bank Solvency Certificate JP Translate", category: "Banking" },
  { id: "bank_statement", title: "Bank Statement", category: "Banking" },
];

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

export type CallStatus = "CONNECTED" | "NO_ANSWER" | "BUSY" | "WRONG_NUMBER";
export type GuardianResponse = "WILL_RESUME" | "BATCH_CHANGE" | "DROPPED" | "NEEDS_TIME" | "OTHER";
export type FollowUpResolution = "PENDING" | "RESOLVED" | "DROPPED";

export interface FollowUpCallLog {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  batchName?: string;
  guardianNumber?: string;
  calledBy: string;
  calledAt: string; // ISO string
  callStatus: CallStatus;
  guardianResponse: GuardianResponse;
  notes: string;
  resolutionStatus: FollowUpResolution;
}

