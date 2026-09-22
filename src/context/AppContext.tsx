"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  User,
  Batch,
  Student,
  AttendanceRecord,
  ClassLog,
  StudentAttendanceSummary,
  AttendanceStatus,
  StudentMilestone,
  FollowUpCallLog,
  StudentDocumentItem,
} from "@/types";
import {
  initialUsers,
  initialBatches,
  initialStudents,
  initialAttendanceRecords,
  initialClassLogs,
} from "@/lib/mockData";

interface AppContextType {
  currentUser: User | null;
  users: User[];
  batches: Batch[];
  students: Student[];
  attendances: AttendanceRecord[];
  classLogs: ClassLog[];
  isLoading: boolean;
  isResetting: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAs: (userId: string) => void;
  logout: () => void;
  getStudentSummary: (studentId: string) => StudentAttendanceSummary | null;
  getBatchStudents: (batchId: string) => Student[];
  getTeacherBatches: (teacherId: string) => Batch[];
  isAttendanceSubmittedForDate: (batchId: string, date: string) => boolean;
  getClassLogForDate: (batchId: string, date: string) => ClassLog | undefined;
  getConsecutiveAbsentsForStudent: (studentId: string, beforeDate?: string) => number;
  deleteAttendanceForDate: (batchId: string, date: string) => Promise<{ success: boolean; message: string }>;
  saveAttendance: (
    batchId: string,
    date: string,
    dayName: string,
    records: { studentId: string; status: AttendanceStatus; note?: string }[],
    topicCovered: string,
    homework?: string,
    substituteTeacherName?: string
  ) => Promise<{ success: boolean; message: string; isUpdate: boolean }>;
  shiftStudentBatch: (
    studentId: string,
    newBatchId: string,
    reason: string
  ) => Promise<boolean>;
  updateStudentMilestone: (
    studentId: string,
    milestone: StudentMilestone
  ) => Promise<boolean>;
  updateStudentDocuments: (
    studentId: string,
    documents: Record<string, StudentDocumentItem>
  ) => Promise<boolean>;
  addStudent: (student: Omit<Student, "id" | "joinedDate">) => void;
  updateStudent: (student: Student) => Promise<boolean>;
  deleteStudent: (studentId: string) => Promise<boolean>;
  addTeacher: (teacherData: {
    name: string;
    username: string;
    email?: string;
    phone?: string;
    password?: string;
    assignedBatchIds?: string[];
    assignedDays?: string[];
  }) => Promise<{ success: boolean; error?: string }>;
  updateTeacher: (teacher: User & { password?: string }) => Promise<boolean>;
  deleteTeacher: (teacherId: string) => Promise<boolean>;
  addBatch: (batch: Omit<Batch, "id">) => void;
  updateBatch: (batch: Batch) => Promise<boolean>;
  toggleBatchStatus: (batchId: string, newStatus: "RUNNING" | "COMPLETED") => Promise<boolean>;
  resetDatabaseToSeed: () => Promise<{ success: boolean; message: string }>;
  refreshData: () => Promise<void>;
  returnToSuperAdmin: () => void;
  followUpLogs: FollowUpCallLog[];
  addFollowUpLog: (log: Omit<FollowUpCallLog, "id" | "calledAt">) => void;
  resolveIrregularStudent: (studentId: string, resolution: "RESOLVED" | "DROPPED", note?: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [batches, setBatches] = useState<Batch[]>(initialBatches);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>(initialAttendanceRecords);
  const [classLogs, setClassLogs] = useState<ClassLog[]>(initialClassLogs);
  const [followUpLogs, setFollowUpLogs] = useState<FollowUpCallLog[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Load saved call logs from localStorage
  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem("mjli_call_logs");
      if (savedLogs) {
        setFollowUpLogs(JSON.parse(savedLogs));
      }
    } catch (e) {
      console.warn("Could not load saved call logs:", e);
    }
  }, []);

  // Restore session from localStorage on initial render
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("mjli_user");
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.warn("Could not parse saved user session:", e);
    }
  }, []);

  // Fetch initial data from Prisma Database Bootstrap API
  const refreshData = useCallback(async () => {
    try {
      const res = await fetch("/api/bootstrap", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.users?.length) setUsers(json.data.users);
          if (json.data.batches?.length) setBatches(json.data.batches);
          if (json.data.students?.length) setStudents(json.data.students);
          if (json.data.classLogs?.length) setClassLogs(json.data.classLogs);
          
          // Re-set current user reference if updated
          setCurrentUser((prev) => {
            if (!prev) return null;
            const match = json.data.users?.find((u: User) => u.id === prev.id || u.username === prev.username);
            if (match) {
              localStorage.setItem("mjli_user", JSON.stringify(match));
              return match;
            }
            return prev;
          });
        }
      }
    } catch (e) {
      console.warn("Bootstrap API fallback to local state:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Login handler
  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.user) {
        setCurrentUser(json.user);
        localStorage.setItem("mjli_user", JSON.stringify(json.user));
        return { success: true };
      } else {
        return { success: false, error: json.error || "ইউজারনেম বা পাসওয়ার্ড ভুল হয়েছে" };
      }
    } catch (e: any) {
      return { success: false, error: e.message || "সার্ভারে সংযোগ করা যায়নি" };
    }
  };

  const loginAs = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem("mjli_user", JSON.stringify(user));
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    localStorage.removeItem("mjli_user");
    setCurrentUser(null);
  };

  const getBatchStudents = (batchId: string): Student[] => {
    return students.filter((s) => s.batchId === batchId && s.status === "ACTIVE");
  };

  const getTeacherBatches = (teacherId: string): Batch[] => {
    const user = users.find((u) => u.id === teacherId);
    if (!user) return [];
    if (user.role === "SUPER_ADMIN") return batches;
    return batches.filter((b) => user.assignedBatchIds.includes(b.id));
  };

  const isAttendanceSubmittedForDate = (batchId: string, date: string): boolean => {
    return (
      attendances.some((a) => a.batchId === batchId && a.date === date) ||
      classLogs.some((cl) => cl.batchId === batchId && cl.date === date)
    );
  };

  const getClassLogForDate = (batchId: string, date: string): ClassLog | undefined => {
    return classLogs.find((cl) => cl.batchId === batchId && cl.date === date);
  };

  const getStudentSummary = (studentId: string): StudentAttendanceSummary | null => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return null;

    const studentRecords = attendances
      .filter((a) => a.studentId === studentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalClasses =
      student.totalClasses ||
      studentRecords.filter((a) => a.status !== "OFF_DAY" && a.status !== "BATCH_CHANGED").length;
    const presentCount = student.totalPresent ?? studentRecords.filter((a) => a.status === "PRESENT").length;
    const absentCount = student.totalAbsent ?? studentRecords.filter((a) => a.status === "ABSENT").length;
    const excusedCount = student.totalExcused ?? studentRecords.filter((a) => a.status === "EXCUSED").length;

    const attendancePercentage =
      totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 100;

    let consecutiveAbsences = 0;
    for (const record of studentRecords) {
      if (record.status === "ABSENT") {
        consecutiveAbsences++;
      } else if (record.status === "PRESENT") {
        break;
      }
    }

    const lastClassRecord = studentRecords[0];

    return {
      student,
      totalClasses: Math.max(totalClasses, 1),
      presentCount,
      absentCount,
      excusedCount,
      attendancePercentage,
      consecutiveAbsents: consecutiveAbsences,
      lastClassStatus: lastClassRecord ? lastClassRecord.status : undefined,
      recentNotes: studentRecords
        .filter((r) => r.note)
        .map((r) => ({ date: r.date, note: r.note || "" })),
    };
  };

  const getConsecutiveAbsentsForStudent = (studentId: string, beforeDate?: string): number => {
    const studentRecords = attendances
      .filter((a) => a.studentId === studentId && (beforeDate ? a.date < beforeDate : true))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let count = 0;
    for (const record of studentRecords) {
      if (record.status === "ABSENT") {
        count++;
      } else if (record.status === "PRESENT") {
        break;
      }
    }
    return count;
  };

  const deleteAttendanceForDate = async (
    batchId: string,
    date: string
  ): Promise<{ success: boolean; message: string }> => {
    setAttendances((prev) =>
      prev.filter((a) => !(a.batchId === batchId && a.date === date))
    );
    setClassLogs((prev) =>
      prev.filter((l) => !(l.batchId === batchId && l.date === date))
    );

    try {
      const res = await fetch(
        `/api/attendance?batchId=${encodeURIComponent(batchId)}&date=${encodeURIComponent(date)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      return { success: res.ok && data.success, message: data.message || data.error };
    } catch (e: any) {
      return { success: false, message: e.message || "Failed to reset attendance" };
    }
  };

  const resetDatabaseToSeed = async (): Promise<{ success: boolean; message: string }> => {
    setIsResetting(true);
    try {
      const res = await fetch("/api/reset-data", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        await refreshData();
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || "Reset failed" };
      }
    } catch (e: any) {
      console.error("Reset database error:", e);
      return { success: false, message: e.message || "Failed to reset database" };
    } finally {
      setIsResetting(false);
    }
  };

  const saveAttendance = async (
    batchId: string,
    date: string,
    dayName: string,
    records: { studentId: string; status: AttendanceStatus; note?: string }[],
    topicCovered: string,
    homework?: string,
    substituteTeacherName?: string
  ): Promise<{ success: boolean; message: string; isUpdate: boolean }> => {
    const effectiveTeacherName = substituteTeacherName || currentUser?.name || "Teacher";
    const isSubstitute = !!substituteTeacherName;

    const newAttendanceRecords: AttendanceRecord[] = records.map((r) => ({
      id: `att-${Date.now()}-${r.studentId}`,
      studentId: r.studentId,
      batchId,
      teacherId: currentUser?.id,
      substituteTeacherName,
      date,
      dayName,
      status: r.status,
      note: r.note,
      createdAt: new Date().toISOString(),
    }));

    setAttendances((prev) => {
      const filtered = prev.filter(
        (a) => !(a.batchId === batchId && a.date === date)
      );
      return [...filtered, ...newAttendanceRecords];
    });

    const presentCount = records.filter((r) => r.status === "PRESENT").length;
    const absentCount = records.filter((r) => r.status === "ABSENT").length;
    const excusedCount = records.filter((r) => r.status === "EXCUSED").length;

    const newLog: ClassLog = {
      id: `log-${Date.now()}`,
      batchId,
      teacherId: currentUser?.id,
      teacherName: effectiveTeacherName,
      isSubstitute,
      date,
      dayName,
      topicCovered,
      homework,
      presentCount,
      absentCount,
      excusedCount,
      totalStudents: records.length,
      submittedAt: new Date().toISOString(),
    };

    setClassLogs((prev) => {
      const filtered = prev.filter(
        (l) => !(l.batchId === batchId && l.date === date)
      );
      return [...filtered, newLog];
    });

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          date,
          dayName,
          teacherId: currentUser?.id,
          substituteTeacherName,
          topicCovered,
          homework,
          records,
        }),
      });
      const data = await res.json();
      return {
        success: true,
        message: data.message || "উপস্থিতি ও ক্লাস লগ ডেটাবেসে সফলভাবে সংরক্ষিত হয়েছে!",
        isUpdate: data.isUpdate || false,
      };
    } catch (e) {
      console.error("Attendance API fallback to local state:", e);
      return {
        success: true,
        message: "উপস্থিতি সফলভাবে গ্রহণ করা হয়েছে (Local State)",
        isUpdate: false,
      };
    }
  };

  const shiftStudentBatch = async (
    studentId: string,
    newBatchId: string,
    reason: string
  ): Promise<boolean> => {
    const student = students.find((s) => s.id === studentId);
    const targetBatch = batches.find((b) => b.id === newBatchId);
    if (!student || !targetBatch) return false;

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            batchId: newBatchId,
            batchName: targetBatch.name,
          };
        }
        return s;
      })
    );

    try {
      await fetch(`/api/students/${studentId}/shift-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newBatchId, reason }),
      });
      return true;
    } catch (e) {
      console.error("Shift batch backend error:", e);
      return false;
    }
  };

  const updateStudentMilestone = async (
    studentId: string,
    milestone: StudentMilestone
  ): Promise<boolean> => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            milestoneStage: milestone.stage,
            interviewDate: milestone.interviewDate,
            interviewTime: milestone.interviewTime,
            interviewCompany: milestone.interviewCompany,
            interviewPlatform: milestone.interviewPlatform,
            coeNumber: milestone.coeNumber,
            coeResultDate: milestone.coeResultDate,
            visaIssueDate: milestone.visaIssueDate,
            visaStatusNotes: milestone.visaStatusNotes,
          };
        }
        return s;
      })
    );

    try {
      await fetch(`/api/students/${studentId}/milestone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(milestone),
      });
      return true;
    } catch (e) {
      console.error("Milestone update backend error:", e);
      return false;
    }
  };

  const updateStudentDocuments = async (
    studentId: string,
    documents: Record<string, StudentDocumentItem>
  ): Promise<boolean> => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            documents,
          };
        }
        return s;
      })
    );

    try {
      await fetch(`/api/students/${studentId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents }),
      });
      return true;
    } catch (e) {
      console.error("Documents update backend error:", e);
      return false;
    }
  };

  const addStudent = (studentData: Omit<Student, "id" | "joinedDate">) => {
    const newStudent: Student = {
      ...studentData,
      id: `s-${Date.now()}`,
    };
    setStudents((prev) => [...prev, newStudent]);
  };

  const updateStudent = async (updatedStudent: Student): Promise<boolean> => {
    const batch = batches.find((b) => b.id === updatedStudent.batchId);
    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? { ...updatedStudent, batchName: batch?.name || updatedStudent.batchName } : s))
    );

    try {
      await fetch(`/api/students/${updatedStudent.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updatedStudent.name,
          studentIdCode: updatedStudent.studentIdCode,
          mobileNumber: updatedStudent.mobileNumber,
          guardianNumber: updatedStudent.guardianNumber,
          batchId: updatedStudent.batchId,
          batchName: batch?.name || updatedStudent.batchName,
          status: updatedStudent.status,
          refInfo: updatedStudent.refInfo,
        }),
      });
      return true;
    } catch (e) {
      console.error("Update student backend error:", e);
      return false;
    }
  };

  const deleteStudent = async (studentId: string): Promise<boolean> => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    try {
      await fetch(`/api/students/${studentId}`, { method: "DELETE" });
      return true;
    } catch (e) {
      console.error("Delete student backend error:", e);
      return false;
    }
  };

  const addTeacher = async (teacherData: {
    name: string;
    username: string;
    email?: string;
    phone?: string;
    password?: string;
    assignedBatchIds?: string[];
    assignedDays?: string[];
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teacherData),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setUsers((prev) => [...prev, data.data]);
        return { success: true };
      } else {
        return { success: false, error: data.error || "শিক্ষক যুক্ত করতে সমস্যা হয়েছে" };
      }
    } catch (e: any) {
      return { success: false, error: e.message || "সার্ভার এরর" };
    }
  };

  const updateTeacher = async (
    updatedTeacher: User & { password?: string }
  ): Promise<boolean> => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedTeacher.id ? updatedTeacher : u))
    );

    try {
      const res = await fetch(`/api/teachers/${updatedTeacher.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updatedTeacher.name,
          phone: updatedTeacher.phone,
          email: updatedTeacher.email,
          password: updatedTeacher.password,
          assignedBatchIds: updatedTeacher.assignedBatchIds,
          assignedDays: updatedTeacher.assignedDays,
          isActive: updatedTeacher.isActive,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return true;
      }
      return false;
    } catch (e) {
      console.error("Update teacher backend error:", e);
      return false;
    }
  };

  const deleteTeacher = async (teacherId: string): Promise<boolean> => {
    setUsers((prev) => prev.filter((u) => u.id !== teacherId));
    try {
      const res = await fetch(`/api/teachers/${teacherId}`, { method: "DELETE" });
      const data = await res.json();
      return res.ok && data.success;
    } catch (e) {
      console.error("Delete teacher error:", e);
      return false;
    }
  };

  const addBatch = (batchData: Omit<Batch, "id">) => {
    const newBatch: Batch = {
      ...batchData,
      id: `b-${Date.now()}`,
    };
    setBatches((prev) => [...prev, newBatch]);
  };

  const updateBatch = async (updatedBatch: Batch): Promise<boolean> => {
    setBatches((prev) =>
      prev.map((b) => (b.id === updatedBatch.id ? updatedBatch : b))
    );

    try {
      await fetch(`/api/batches/${updatedBatch.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updatedBatch.name,
          scheduleDays: updatedBatch.scheduleDays,
          timeSlot: updatedBatch.timeSlot,
          status: updatedBatch.status,
          estimatedEndDate: updatedBatch.estimatedEndDate,
          targetTotalClasses: updatedBatch.targetTotalClasses,
          completedClasses: updatedBatch.completedClasses,
        }),
      });
      return true;
    } catch (e) {
      console.error("Update batch backend error:", e);
      return false;
    }
  };

  const toggleBatchStatus = async (
    batchId: string,
    newStatus: "RUNNING" | "COMPLETED"
  ): Promise<boolean> => {
    setBatches((prev) =>
      prev.map((b) => (b.id === batchId ? { ...b, status: newStatus } : b))
    );

    try {
      await fetch(`/api/batches/${batchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      return true;
    } catch (e) {
      console.error("Toggle batch status backend error:", e);
      return false;
    }
  };

  const returnToSuperAdmin = () => {
    const adminUser = users.find((u) => u.role === "SUPER_ADMIN" && u.username === "sadif609") ||
      users.find((u) => u.role === "SUPER_ADMIN");
    if (adminUser) {
      setCurrentUser(adminUser);
      localStorage.setItem("mjli_user", JSON.stringify(adminUser));
    }
  };

  const addFollowUpLog = (logData: Omit<FollowUpCallLog, "id" | "calledAt">) => {
    const newLog: FollowUpCallLog = {
      ...logData,
      id: `call-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      calledAt: new Date().toISOString(),
    };

    setFollowUpLogs((prev) => {
      const updated = [newLog, ...prev.filter((l) => !(l.studentId === logData.studentId && l.resolutionStatus !== "PENDING"))];
      try {
        localStorage.setItem("mjli_call_logs", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const resolveIrregularStudent = async (
    studentId: string,
    resolution: "RESOLVED" | "DROPPED",
    note?: string
  ): Promise<boolean> => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return false;

    // If marked as DROPPED, update student status to INACTIVE / DROPPED
    if (resolution === "DROPPED") {
      await updateStudent({
        ...student,
        status: "INACTIVE",
        refInfo: note ? `ড্রপআউট নোট: ${note}` : student.refInfo,
      });
    }

    // Add resolution call log entry
    const newLog: FollowUpCallLog = {
      id: `call-res-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      studentCode: student.studentIdCode,
      batchName: student.batchName,
      guardianNumber: student.guardianNumber,
      calledBy: currentUser?.name || "Admin",
      calledAt: new Date().toISOString(),
      callStatus: "CONNECTED",
      guardianResponse: resolution === "DROPPED" ? "DROPPED" : "WILL_RESUME",
      notes: note || (resolution === "DROPPED" ? "কোর্স বাতিল / ড্রপআউট হিসেবে চিহ্নিত করা হয়েছে" : "অভিভাবকের সাথে কথা সম্পন্ন, ক্লাসে নিয়মিত উপস্থিত থাকবেন"),
      resolutionStatus: resolution,
    };

    setFollowUpLogs((prev) => {
      const updated = [newLog, ...prev.filter((l) => l.studentId !== studentId)];
      try {
        localStorage.setItem("mjli_call_logs", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    return true;
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        batches,
        students,
        attendances,
        classLogs,
        isLoading,
        isResetting,
        login,
        loginAs,
        logout,
        getStudentSummary,
        getBatchStudents,
        getTeacherBatches,
        isAttendanceSubmittedForDate,
        getClassLogForDate,
        getConsecutiveAbsentsForStudent,
        deleteAttendanceForDate,
        saveAttendance,
        shiftStudentBatch,
        updateStudentMilestone,
        updateStudentDocuments,
        addStudent,
        updateStudent,
        deleteStudent,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        addBatch,
        updateBatch,
        toggleBatchStatus,
        resetDatabaseToSeed,
        refreshData,
        returnToSuperAdmin,
        followUpLogs,
        addFollowUpLog,
        resolveIrregularStudent,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
