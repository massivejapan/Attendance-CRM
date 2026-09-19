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
  loginAs: (userId: string) => void;
  logout: () => void;
  getStudentSummary: (studentId: string) => StudentAttendanceSummary | null;
  getBatchStudents: (batchId: string) => Student[];
  getTeacherBatches: (teacherId: string) => Batch[];
  isAttendanceSubmittedForDate: (batchId: string, date: string) => boolean;
  getClassLogForDate: (batchId: string, date: string) => ClassLog | undefined;
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
  addStudent: (student: Omit<Student, "id" | "joinedDate">) => void;
  updateStudent: (student: Student) => Promise<boolean>;
  deleteStudent: (studentId: string) => Promise<boolean>;
  addTeacher: (teacher: Omit<User, "id" | "createdAt">) => void;
  updateTeacher: (teacher: User) => Promise<boolean>;
  addBatch: (batch: Omit<Batch, "id">) => void;
  updateBatch: (batch: Batch) => Promise<boolean>;
  toggleBatchStatus: (batchId: string, newStatus: "RUNNING" | "COMPLETED") => Promise<boolean>;
  resetDatabaseToSeed: () => Promise<{ success: boolean; message: string }>;
  refreshData: () => Promise<void>;
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
  const [currentUser, setCurrentUser] = useState<User | null>(initialUsers[0]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);

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
            if (!prev) return json.data.users?.[0] || null;
            const match = json.data.users?.find((u: User) => u.id === prev.id || u.username === prev.username);
            return match || prev;
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

    let consecutiveAbsents = student.consecutiveAbsents ?? 0;
    if (studentRecords.length > 0) {
      consecutiveAbsents = 0;
      for (const rec of studentRecords) {
        if (rec.status === "OFF_DAY" || rec.status === "BATCH_CHANGED") continue;
        if (rec.status === "ABSENT") {
          consecutiveAbsents++;
        } else {
          break;
        }
      }
    }

    const lastClassStatus = studentRecords.length > 0 ? studentRecords[0].status : undefined;

    const recentNotes = studentRecords
      .filter((a) => a.note && a.note.trim() !== "")
      .map((a) => ({ date: a.date, note: a.note! }));

    return {
      student,
      totalClasses,
      presentCount,
      absentCount,
      excusedCount,
      attendancePercentage,
      consecutiveAbsents,
      lastClassStatus,
      recentNotes,
    };
  };

  const saveAttendance = async (
    batchId: string,
    date: string,
    dayName: string,
    records: { studentId: string; status: AttendanceStatus; note?: string }[],
    topicCovered: string,
    homework?: string,
    substituteTeacherName?: string
  ) => {
    const existingIndex = attendances.findIndex(
      (a) => a.batchId === batchId && a.date === date
    );
    const isUpdate =
      existingIndex !== -1 ||
      classLogs.some((cl) => cl.batchId === batchId && cl.date === date);

    const currentTeacherId = currentUser?.id || "usr-admin-1";
    const teacherName = substituteTeacherName || currentUser?.name || "Teacher";

    // Optimistic UI state update
    const remainingRecords = attendances.filter(
      (a) => !(a.batchId === batchId && a.date === date)
    );

    const newRecords: AttendanceRecord[] = records.map((r, idx) => ({
      id: `att-${Date.now()}-${idx}`,
      studentId: r.studentId,
      batchId,
      teacherId: currentTeacherId,
      substituteTeacherName,
      date,
      dayName,
      status: r.status,
      note: r.note,
      createdAt: new Date().toISOString(),
      updatedAt: isUpdate ? new Date().toISOString() : undefined,
    }));

    setAttendances([...remainingRecords, ...newRecords]);

    const presentCount = records.filter((r) => r.status === "PRESENT").length;
    const absentCount = records.filter((r) => r.status === "ABSENT").length;
    const excusedCount = records.filter((r) => r.status === "EXCUSED").length;

    const remainingLogs = classLogs.filter(
      (cl) => !(cl.batchId === batchId && cl.date === date)
    );

    const newLog: ClassLog = {
      id: `log-${Date.now()}`,
      batchId,
      teacherId: currentTeacherId,
      teacherName: teacherName,
      isSubstitute: !!substituteTeacherName,
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

    setClassLogs([...remainingLogs, newLog]);

    // Async Backend Persistence
    try {
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          teacherId: currentTeacherId,
          teacherName,
          isSubstitute: !!substituteTeacherName,
          date,
          dayName,
          records,
          topicCovered,
          homework,
        }),
      });
    } catch (e) {
      console.error("Backend attendance sync failed:", e);
    }

    return {
      success: true,
      message: isUpdate
        ? "হাজিরা সফলভাবে আপডেট করা হয়েছে!"
        : "হাজিরা ও সিলেবাস লগ সফলভাবে সংরক্ষিত হয়েছে!",
      isUpdate,
    };
  };

  const shiftStudentBatch = async (
    studentId: string,
    newBatchId: string,
    reason: string
  ): Promise<boolean> => {
    const student = students.find((s) => s.id === studentId);
    const targetBatch = batches.find((b) => b.id === newBatchId);
    if (!student || !targetBatch || student.batchId === newBatchId) return false;

    const fromBatchName = student.batchName || "অ্যাসাইন নেই";
    const toBatchName = targetBatch.name;

    // Optimistic UI update
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const history = s.batchHistory || [];
          return {
            ...s,
            batchId: newBatchId,
            batchName: toBatchName,
            batchHistory: [
              ...history,
              {
                fromBatch: fromBatchName,
                toBatch: toBatchName,
                date: new Date().toISOString().split("T")[0],
                reason,
              },
            ],
          };
        }
        return s;
      })
    );

    // Backend Persistence
    try {
      await fetch(`/api/students/${studentId}/shift-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newBatchId,
          newBatchName: toBatchName,
          reason,
          transferredBy: currentUser?.name || "Admin",
        }),
      });
    } catch (e) {
      console.error("Shift batch backend error:", e);
    }

    return true;
  };

  const updateStudentMilestone = async (
    studentId: string,
    milestone: StudentMilestone
  ): Promise<boolean> => {
    // Optimistic UI update
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
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
              milestone: {
                ...milestone,
                updatedAt: new Date().toISOString().split("T")[0],
              },
            }
          : s
      )
    );

    // Backend Persistence
    try {
      await fetch(`/api/students/${studentId}/milestone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneStage: milestone.stage,
          interviewDate: milestone.interviewDate || null,
          interviewTime: milestone.interviewTime || null,
          interviewCompany: milestone.interviewCompany || null,
          interviewPlatform: milestone.interviewPlatform || null,
          coeNumber: milestone.coeNumber || null,
          coeResultDate: milestone.coeResultDate || null,
          visaIssueDate: milestone.visaIssueDate || null,
          visaStatusNotes: milestone.visaStatusNotes || null,
        }),
      });
    } catch (e) {
      console.error("Milestone update backend error:", e);
    }

    return true;
  };

  // 1-Click Test Data Reset function
  const resetDatabaseToSeed = async (): Promise<{ success: boolean; message: string }> => {
    setIsResetting(true);
    try {
      const res = await fetch("/api/reset-data", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        await refreshData();
        return {
          success: true,
          message: "ডাটাবেজ সফলভাবে রিসেট হয়ে মূল এক্সেল ফাইলে ফিরে এসেছে!",
        };
      } else {
        return {
          success: false,
          message: json.error || "ডাটাবেজ রিসেট করতে সমস্যা হয়েছে।",
        };
      }
    } catch (e: any) {
      return {
        success: false,
        message: e.message || "রিসেট ব্যর্থ হয়েছে।",
      };
    } finally {
      setIsResetting(false);
    }
  };

  const loginAs = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addStudent = (studentData: Omit<Student, "id" | "joinedDate">) => {
    const batch = batches.find((b) => b.id === studentData.batchId);
    const newStudent: Student = {
      ...studentData,
      id: `s-${Date.now()}`,
      batchName: batch?.name,
      joinedDate: new Date().toISOString().split("T")[0],
      milestone: {
        stage: "LANGUAGE_COURSE",
      },
    };
    setStudents((prev) => [...prev, newStudent]);
  };

  const updateStudent = async (updatedStudent: Student): Promise<boolean> => {
    const batch = batches.find((b) => b.id === updatedStudent.batchId);
    setStudents((prev) =>
      prev.map((s) =>
        s.id === updatedStudent.id
          ? { ...updatedStudent, batchName: batch?.name || s.batchName }
          : s
      )
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

  const addTeacher = (teacherData: Omit<User, "id" | "createdAt">) => {
    const newTeacher: User = {
      ...teacherData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setUsers((prev) => [...prev, newTeacher]);
  };

  const updateTeacher = async (updatedTeacher: User): Promise<boolean> => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedTeacher.id ? updatedTeacher : u))
    );

    try {
      await fetch(`/api/teachers/${updatedTeacher.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updatedTeacher.name,
          phone: updatedTeacher.phone,
          email: updatedTeacher.email,
          assignedBatchIds: updatedTeacher.assignedBatchIds,
          assignedDays: updatedTeacher.assignedDays,
          isActive: updatedTeacher.isActive,
        }),
      });
      return true;
    } catch (e) {
      console.error("Update teacher backend error:", e);
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
        loginAs,
        logout,
        getStudentSummary,
        getBatchStudents,
        getTeacherBatches,
        isAttendanceSubmittedForDate,
        getClassLogForDate,
        saveAttendance,
        shiftStudentBatch,
        updateStudentMilestone,
        addStudent,
        updateStudent,
        deleteStudent,
        addTeacher,
        updateTeacher,
        addBatch,
        updateBatch,
        toggleBatchStatus,
        resetDatabaseToSeed,
        refreshData,
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
