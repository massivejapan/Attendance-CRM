"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { AttendanceStatus } from "@/types";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileEdit,
  AlertCircle,
  Check,
  Search,
  BookOpen,
  Send,
  Trash2,
  ShieldCheck,
  Sparkles,
  Users,
  RotateCcw,
  Phone,
  MessageSquare,
} from "lucide-react";
import { openWhatsApp, getWhatsAppAbsentNotice } from "@/lib/utils";

interface AttendanceSheetProps {
  onSelectStudent?: (studentId: string) => void;
}

export const AttendanceSheet: React.FC<AttendanceSheetProps> = ({
  onSelectStudent,
}) => {
  const {
    currentUser,
    batches,
    attendances,
    getTeacherBatches,
    getBatchStudents,
    getStudentSummary,
    getConsecutiveAbsentsForStudent,
    isAttendanceSubmittedForDate,
    getClassLogForDate,
    deleteAttendanceForDate,
    saveAttendance,
  } = useApp();

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const [showAllBatches, setShowAllBatches] = useState(false);

  const teacherAssignedBatches = currentUser
    ? getTeacherBatches(currentUser.id)
    : [];

  const availableBatches = showAllBatches
    ? teacherAssignedBatches
    : teacherAssignedBatches.filter((b) => b.status === "RUNNING");

  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    availableBatches[0]?.id || teacherAssignedBatches[0]?.id || ""
  );

  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  };
  const [dayName, setDayName] = useState<string>(getDayName(todayStr));

  useEffect(() => {
    setDayName(getDayName(selectedDate));
  }, [selectedDate]);

  useEffect(() => {
    if (
      availableBatches.length > 0 &&
      !availableBatches.some((b) => b.id === selectedBatchId)
    ) {
      setSelectedBatchId(availableBatches[0].id);
    }
  }, [currentUser, availableBatches, selectedBatchId]);

  const currentBatch = batches.find((b) => b.id === selectedBatchId);
  const students = selectedBatchId ? getBatchStudents(selectedBatchId) : [];

  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { status: AttendanceStatus; note: string }>
  >({});

  const [topicCovered, setTopicCovered] = useState<string>("");
  const [homework, setHomework] = useState<string>("");
  const [isSubstitute, setIsSubstitute] = useState<boolean>(false);
  const [substituteName, setSubstituteName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const isAlreadySubmitted = selectedBatchId
    ? isAttendanceSubmittedForDate(selectedBatchId, selectedDate)
    : false;

  const existingLog = selectedBatchId
    ? getClassLogForDate(selectedBatchId, selectedDate)
    : undefined;

  // Load attendance state for selected batch & date
  useEffect(() => {
    if (!selectedBatchId) return;

    const log = getClassLogForDate(selectedBatchId, selectedDate);
    if (log) {
      setTopicCovered(log.topicCovered || "");
      setHomework(log.homework || "");
      if (log.isSubstitute && log.teacherName) {
        setIsSubstitute(true);
        setSubstituteName(log.teacherName);
      } else {
        setIsSubstitute(false);
        setSubstituteName("");
      }
    } else {
      setTopicCovered("");
      setHomework("");
      setIsSubstitute(false);
      setSubstituteName("");
    }

    const initialMap: Record<
      string,
      { status: AttendanceStatus; note: string }
    > = {};

    students.forEach((s) => {
      // Find existing record if already taken
      const existingRec = attendances.find(
        (a) =>
          a.batchId === selectedBatchId &&
          a.date === selectedDate &&
          a.studentId === s.id
      );

      initialMap[s.id] = {
        status: existingRec ? existingRec.status : "PRESENT",
        note: existingRec?.note || "",
      };
    });

    setAttendanceMap(initialMap);
    setIsEditMode(false);
  }, [selectedBatchId, selectedDate, students.length, attendances.length]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => {
      const currentNote = prev[studentId]?.note || "";
      // If setting to Absent and note is empty, give a subtle hint or preserve note
      return {
        ...prev,
        [studentId]: {
          status,
          note: currentNote,
        },
      };
    });
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note,
      },
    }));
  };

  const handleQuickNoteTag = (studentId: string, tag: string) => {
    setAttendanceMap((prev) => {
      const oldNote = prev[studentId]?.note || "";
      const newNote = oldNote ? `${oldNote}, ${tag}` : tag;
      return {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          note: newNote,
        },
      };
    });
  };

  const markAllPresent = () => {
    setAttendanceMap((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => {
        updated[id] = { ...updated[id], status: "PRESENT" };
      });
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBatchId) {
      setToastMessage({ type: "error", text: "অনুগ্রহ করে একটি ব্যাচ সিলেক্ট করুন!" });
      return;
    }

    if (!topicCovered.trim()) {
      setToastMessage({
        type: "error",
        text: "আজকে কী পড়ানো হয়েছে (Topic / Syllabus) নোটটি অবশ্যই লিখুন!",
      });
      return;
    }

    const records = Object.entries(attendanceMap).map(([studentId, data]) => ({
      studentId,
      status: data.status,
      note: data.note,
    }));

    // Optimistic UI: Show Success Modal instantly! (0ms lag)
    setShowSuccessModal(true);
    setIsEditMode(false);
    setIsSubmitting(true);

    saveAttendance(
      selectedBatchId,
      selectedDate,
      dayName,
      records,
      topicCovered.trim(),
      homework.trim(),
      isSubstitute ? substituteName.trim() : undefined
    )
      .then((result) => {
        setIsSubmitting(false);
        if (result.success) {
          setToastMessage({
            type: "success",
            text: result.message,
          });
          setTimeout(() => setToastMessage(null), 5000);
        } else {
          setToastMessage({
            type: "error",
            text: result.message || "হাজিরা সংরক্ষণ করতে সমস্যা হয়েছে",
          });
        }
      })
      .catch((err) => {
        setIsSubmitting(false);
        console.error("Save attendance error:", err);
      });
  };

  // Super Admin 1-Click Reset / Delete Attendance for this date
  const handleResetDayAttendance = async () => {
    if (!selectedBatchId) return;
    setIsSubmitting(true);
    const result = await deleteAttendanceForDate(selectedBatchId, selectedDate);
    setIsSubmitting(false);
    setShowResetConfirm(false);

    if (result.success) {
      // Re-initialize map to PRESENT
      const cleanMap: Record<string, { status: AttendanceStatus; note: string }> = {};
      students.forEach((s) => {
        cleanMap[s.id] = { status: "PRESENT", note: "" };
      });
      setAttendanceMap(cleanMap);
      setTopicCovered("");
      setHomework("");
      setIsEditMode(false);

      setToastMessage({
        type: "success",
        text: `✓ ${currentBatch?.name}-এর ${selectedDate} তারিখের হাজিরা সফলভাবে রিসেট হয়েছে! এখন শিক্ষক পুনরায় নতুন করে হাজিরা দিতে পারবেন।`,
      });
      setTimeout(() => setToastMessage(null), 5000);
    } else {
      setToastMessage({
        type: "error",
        text: result.message || "হাজিরা রিসেট করতে সমস্যা হয়েছে",
      });
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentIdCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = Object.values(attendanceMap).filter(
    (a) => a.status === "PRESENT"
  ).length;
  const absentCount = Object.values(attendanceMap).filter(
    (a) => a.status === "ABSENT"
  ).length;
  const excusedCount = Object.values(attendanceMap).filter(
    (a) => a.status === "EXCUSED"
  ).length;

  const isLocked = isAlreadySubmitted && !isEditMode;

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold shadow-md animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === "success"
              ? "bg-emerald-600 text-white border border-emerald-700"
              : "bg-rose-600 text-white border border-rose-700"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-white" />
            ) : (
              <AlertCircle className="w-5 h-5 text-white" />
            )}
            <span className="text-sm">{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/80 hover:text-white font-bold text-base px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Bar: Batch Selection & Date */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Batch Selector */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                চলমান ব্যাচ নির্বাচন (Active Batches: {availableBatches.length}টি)
              </span>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAllBatches}
                  onChange={(e) => setShowAllBatches(e.target.checked)}
                  className="rounded text-[#662C90] focus:ring-[#662C90]"
                />
                <span>সম্পন্ন ব্যাচ দেখুন</span>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {availableBatches.length > 0 ? (
                availableBatches.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBatchId(b.id)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all border flex items-center gap-1.5 ${
                      selectedBatchId === b.id
                        ? "bg-[#662C90] text-white border-[#662C90] shadow-sm"
                        : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    <span>{b.name}</span>
                    <span className="text-[10px] font-normal opacity-80">
                      ({b.scheduleDays})
                    </span>
                    {b.status === "RUNNING" && b.daysRemaining !== undefined && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                          selectedBatchId === b.id
                            ? "bg-white/20 text-white"
                            : b.daysRemaining <= 45
                            ? "bg-[#FFF4EE] text-[#F26622]"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        আর {b.daysRemaining}d
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <p className="text-xs text-amber-700 font-medium">
                  আপনার অ্যাকাউন্টে কোনো ব্যাচ নির্ধারিত নেই।
                </p>
              )}
            </div>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <div>
              <span className="block text-xs font-bold text-slate-500 mb-1">
                ক্লাসের তারিখ (Class Date)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#F26622]"
                />
                <span className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {dayName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Proxy Teacher Switch */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
            <input
              type="checkbox"
              checked={isSubstitute}
              disabled={isLocked}
              onChange={(e) => setIsSubstitute(e.target.checked)}
              className="rounded border-slate-300 text-[#F26622] focus:ring-[#F26622]"
            />
            <span>অন্য শিক্ষকের পরিবর্তে ক্লাস নিয়েছেন (Substitute Teacher)</span>
          </label>

          {isSubstitute && (
            <input
              type="text"
              placeholder="শিক্ষকের নাম লিখুন..."
              value={substituteName}
              disabled={isLocked}
              onChange={(e) => setSubstituteName(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs w-64 focus:outline-none focus:border-[#F26622] disabled:bg-slate-50"
            />
          )}
        </div>
      </div>

      {/* Already Submitted Warning Banner & Controls */}
      {isAlreadySubmitted && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
            isEditMode
              ? "bg-amber-50/80 border-amber-200 text-amber-900"
              : "bg-purple-50/70 border-purple-200 text-purple-900"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-900">
                {currentBatch?.name}-এর {selectedDate} ({dayName}) তারিখের হাজিরা ইতোমধ্যে গৃহীত হয়েছে!
              </p>
              <p className="text-slate-600 text-[11px] mt-0.5">
                {existingLog?.teacherName && (
                  <span>শিক্ষক: <strong>{existingLog.teacherName}</strong> | </span>
                )}
                পড়ানো হয়েছে: &quot;{existingLog?.topicCovered || "সিলেবাস নোট দেওয়া হয়েছে"}&quot;
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isLocked ? (
              <>
                {/* Super Admin Edit or Unlock */}
                {isSuperAdmin ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditMode(true)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#662C90] hover:bg-[#532376] text-white shadow-xs flex items-center gap-1.5 transition-all"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      হাজিরা সংশোধন (Edit)
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex items-center gap-1.5 transition-all"
                      title="এই দিনের হাজিরা রিসেট করুন যেন শিক্ষক পুনরায় দিতে পারে"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      হাজিরা রিসেট
                    </button>
                  </>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 font-bold text-[11px]">
                    🔒 হাজিরা লক করা (View Only)
                  </span>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-amber-200 text-amber-900 font-bold text-[11px]">
                  ✍️ সম্পাদনা মোড সক্রিয়
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditMode(false)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  বাতিল
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clean Quick Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400">মোট শিক্ষার্থী</p>
            <p className="text-xl font-black text-slate-800">{students.length}</p>
          </div>
          <span className="text-xs font-bold text-slate-400">জন</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-600">উপস্থিত (Present)</p>
            <p className="text-xl font-black text-emerald-700">{presentCount}</p>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            {students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0}%
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-rose-600">অনুপস্থিত (Absent)</p>
            <p className="text-xl font-black text-rose-700">{absentCount}</p>
          </div>
          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
            {absentCount} জন
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-amber-600">ছুটি (Leave)</p>
            <p className="text-xl font-black text-amber-700">{excusedCount}</p>
          </div>
          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            {excusedCount} জন
          </span>
        </div>
      </div>

      {/* Main Student Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Search & Fast Action */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="শিক্ষার্থীর নাম বা আইডি দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#F26622] font-medium"
            />
          </div>

          <button
            type="button"
            onClick={markAllPresent}
            disabled={isLocked}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-40"
          >
            <Check className="w-4 h-4" />
            সবাইকে এক ক্লিকে উপস্থিত মার্ক করুন
          </button>
        </div>

        {/* Attendance Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">নং</th>
                <th className="py-3 px-4">শিক্ষার্থীর আইডি ও নাম</th>
                <th className="py-3 px-4">আজকের উপস্থিতি (Status)</th>
                <th className="py-3 px-4">অনুপস্থিতি ট্র্যাকিং ও কারণ (Note)</th>
                <th className="py-3 px-4 text-right">সামগ্রিক রেকর্ড</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, idx) => {
                  const summary = getStudentSummary(student.id);
                  const currentStatus = attendanceMap[student.id]?.status || "PRESENT";
                  const currentNote = attendanceMap[student.id]?.note || "";

                  // Accurate consecutive absents calculation prior to selected date
                  const pastConsecutive = getConsecutiveAbsentsForStudent(student.id, selectedDate);
                  
                  // Total consecutive missed if marked absent today
                  const totalMissedWithToday = currentStatus === "ABSENT" ? pastConsecutive + 1 : pastConsecutive;

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        currentStatus === "ABSENT"
                          ? "bg-rose-50/20"
                          : currentStatus === "EXCUSED"
                          ? "bg-amber-50/20"
                          : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center text-slate-400 font-bold">
                        {idx + 1}
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() =>
                            onSelectStudent && onSelectStudent(student.id)
                          }
                          className="text-left group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                              #{student.studentIdCode}
                            </span>
                            <span className="font-bold text-slate-900 group-hover:text-[#F26622] transition-colors">
                              {student.name}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {summary && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${summary.attendancePercentage < 75 ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-700"}`}>
                                মোট উপস্থিতি: {summary.presentCount} দিন ({summary.attendancePercentage}%)
                              </span>
                            )}
                            {student.guardianNumber && (
                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <a
                                  href={`tel:${student.guardianNumber}`}
                                  className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-0.5 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200"
                                  title="অভিভাবককে কল করুন"
                                >
                                  <Phone className="w-2.5 h-2.5 text-emerald-600" />
                                  {student.guardianNumber}
                                </a>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openWhatsApp(
                                      student.guardianNumber,
                                      getWhatsAppAbsentNotice(
                                        student.name,
                                        currentBatch?.name,
                                        totalMissedWithToday
                                      )
                                    )
                                  }
                                  className="text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300 shadow-2xs"
                                  title="হোয়াটসঅ্যাপে মেসেজ পাঠান"
                                >
                                  <MessageSquare className="w-2.5 h-2.5 text-emerald-600" />
                                  WhatsApp
                                </button>
                              </div>
                            )}
                          </div>
                        </button>
                      </td>

                      {/* 3-Button Toggle */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-50 gap-1">
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() =>
                              handleStatusChange(student.id, "PRESENT")
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              currentStatus === "PRESENT"
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            } disabled:cursor-not-allowed`}
                          >
                            উপস্থিত (P)
                          </button>

                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() =>
                              handleStatusChange(student.id, "ABSENT")
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              currentStatus === "ABSENT"
                                ? "bg-rose-600 text-white shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            } disabled:cursor-not-allowed`}
                          >
                            অনুপস্থিত (A)
                          </button>

                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() =>
                              handleStatusChange(student.id, "EXCUSED")
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              currentStatus === "EXCUSED"
                                ? "bg-amber-500 text-white shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            } disabled:cursor-not-allowed`}
                          >
                            ছুটি (E)
                          </button>
                        </div>
                      </td>

                      {/* Note & Consecutive Absence Warning Badges */}
                      <td className="py-3.5 px-4 min-w-[280px]">
                        <div className="space-y-1.5">
                          {/* Alert Badge for Missed Classes */}
                          {currentStatus === "ABSENT" && (
                            <div className="flex items-center gap-1.5">
                              {totalMissedWithToday === 1 ? (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  আজ ১ম ক্লাস মিস
                                </span>
                              ) : totalMissedWithToday === 2 ? (
                                <span className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-orange-600" />
                                  ⚠️ বিগত ১টি সহ মোট ২টি ক্লাস মিস (সতর্কতা)
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                  🚨 বিগত {pastConsecutive}টি সহ মোট {totalMissedWithToday}টি ক্লাস মিস! (জরুরি ফলোআপ)
                                </span>
                              )}
                            </div>
                          )}

                          {currentStatus === "PRESENT" && pastConsecutive > 0 && (
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded inline-block">
                              পূর্ববর্তী {pastConsecutive}টি ক্লাস মিস ছিল (আজ উপস্থিত)
                            </span>
                          )}

                          {/* Note Input & Quick Chips */}
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="অনুপস্থিতির কারণ লিখুন (ঐচ্ছিক)..."
                              value={currentNote}
                              disabled={isLocked}
                              onChange={(e) =>
                                handleNoteChange(student.id, e.target.value)
                              }
                              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#F26622] text-slate-800 disabled:bg-slate-50 font-medium"
                            />
                          </div>

                          {/* Quick Reason Chips when Absent/Excused */}
                          {(currentStatus === "ABSENT" || currentStatus === "EXCUSED") && !isLocked && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {["অসুস্থ", "ফোন রিসিভ করেনি", "দেরি হয়েছে", "জরুরি কাজ"].map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => handleQuickNoteTag(student.id, tag)}
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
                                >
                                  +{tag}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Overall Stats */}
                      <td className="py-3.5 px-4 text-right">
                        {summary ? (
                          <div className="text-right">
                            <span className="font-extrabold text-slate-800">
                              {summary.attendancePercentage}%
                            </span>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              {summary.presentCount}/{summary.totalClasses} দিন
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                    কোনো শিক্ষার্থী পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Class Topic & Syllabus Notes Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-[#FFF4EE] text-[#F26622] flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                আজকে ক্লাসে কী পড়ানো হয়েছে ও হোমওয়ার্ক (Class Log & Syllabus)
              </h3>
              <p className="text-[11px] text-slate-500">
                এই নোটটি ক্লাস হিস্ট্রি ও সুপার অ্যাডমিন ট্র্যাকিংয়ে স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে।
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                পড়ানো বিষয় / সিলেবাস (Topic Covered) *
              </label>
              <textarea
                rows={2}
                required
                disabled={isLocked}
                placeholder="যেমন: অধ্যায় ৪ — গ্রামার অনুশীলন ও শব্দার্থ রিভিশন সম্পন্ন..."
                value={topicCovered}
                onChange={(e) => setTopicCovered(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#F26622] disabled:bg-slate-50 text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                আগামী ক্লাসের পড়া (Homework)
              </label>
              <textarea
                rows={2}
                disabled={isLocked}
                placeholder="যেমন: পৃষ্ঠা ৪২ এর ১-১০ পর্যন্ত লিখে আনা..."
                value={homework}
                onChange={(e) => setHomework(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#F26622] disabled:bg-slate-50 text-slate-800 font-medium"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            {isLocked ? (
              isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => setIsEditMode(true)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#662C90] hover:bg-[#532376] text-white shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  হাজিরা সংশোধন করুন (Edit Attendance)
                </button>
              )
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-7 py-3 rounded-xl font-bold text-xs bg-[#F26622] hover:bg-[#D95314] text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-50 active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    সংরক্ষণ করা হচ্ছে...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {isAlreadySubmitted ? "পরিবর্তন সংরক্ষণ করুন" : "হাজিরা সাবমিট করুন (Submit Attendance)"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Prominent Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="text-center">
              <h3 className="font-black text-slate-900 text-lg sm:text-xl">
                হাজিরা সফলভাবে সংরক্ষিত হয়েছে!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                <strong>{currentBatch?.name}</strong>-এর {selectedDate} ({dayName}) তারিখের ক্লাস লগ ও উপস্থিতি ডাটাবেসে সেভ হয়েছে।
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-xs">
                <p className="text-[10px] font-bold text-emerald-600">উপস্থিত</p>
                <p className="text-base font-black text-emerald-700">{presentCount}</p>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-xs">
                <p className="text-[10px] font-bold text-rose-600">অনুপস্থিত</p>
                <p className="text-base font-black text-rose-700">{absentCount}</p>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-xs">
                <p className="text-[10px] font-bold text-amber-600">ছুটি</p>
                <p className="text-base font-black text-amber-700">{excusedCount}</p>
              </div>
            </div>

            {/* Absentee Follow-up & Parent Notification Actions */}
            {absentCount > 0 && (
              <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 text-xs space-y-2.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-rose-800 flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    অনুপস্থিত শিক্ষার্থীদের অভিভাবক নোটিফিকেশন ({absentCount} জন)
                  </span>
                  <span className="text-[10px] font-bold text-rose-600 bg-white px-2 py-0.5 rounded-md border border-rose-200">
                    ১-ক্লিক বার্তা
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {students
                    .filter((s) => attendanceMap[s.id]?.status === "ABSENT")
                    .map((s) => {
                      const cleanPhone = (s.guardianNumber || s.mobileNumber || "").replace(/[^0-9]/g, "");
                      const intlPhone = cleanPhone.startsWith("88") ? cleanPhone : `88${cleanPhone}`;
                      const msgText = encodeURIComponent(
                        `আসসালামু আলাইকুম। ম্যাসিভ জাপান ল্যাঙ্গুয়েজ ইনস্টিটিউট (MJLI) থেকে জানানো যাচ্ছে যে, আপনার সন্তান ${s.name} (ব্যাচ: ${currentBatch?.name || ""}) আজকের ক্লাসে (${selectedDate}) অনুপস্থিত। নিয়মিত উপস্থিতি নিশ্চিত করার অনুরোধ করা হচ্ছে। বিস্তারিত জানতে যোগাযোগ করুন।`
                      );

                      return (
                        <div
                          key={s.id}
                          className="p-2.5 rounded-xl bg-white border border-rose-100 flex items-center justify-between shadow-2xs"
                        >
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{s.name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {s.guardianNumber || "অভিভাবকের নম্বর নেই"}
                            </p>
                          </div>

                          {s.guardianNumber ? (
                            <div className="flex items-center gap-1.5">
                              {/* WhatsApp 1-Click Action */}
                              <a
                                href={`https://wa.me/${intlPhone}?text=${msgText}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs"
                                title="হোয়াটসঅ্যাপে পাঠান"
                              >
                                WhatsApp
                              </a>
                              {/* Direct Device SMS Action */}
                              <a
                                href={`sms:${s.guardianNumber}?body=${msgText}`}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs"
                                title="সাধারণ এসএমএস পাঠান"
                              >
                                SMS
                              </a>
                              {/* Call Action */}
                              <a
                                href={`tel:${s.guardianNumber}`}
                                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px]"
                                title="সরাসরি কল দিন"
                              >
                                📞
                              </a>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">নম্বর নেই</span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {topicCovered && (
              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 text-xs">
                <p className="font-extrabold text-[#662C90] text-[11px] mb-0.5">পড়ানো বিষয়:</p>
                <p className="text-slate-700 font-medium line-clamp-2">{topicCovered}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 rounded-xl bg-[#662C90] hover:bg-[#532376] text-white font-extrabold text-xs shadow-md transition-all"
            >
              ঠিক আছে (Done)
            </button>
          </div>
        </div>
      )}

      {/* Super Admin Reset Day Attendance Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-black text-slate-900 text-base">
                আজকের হাজিরা রিসেট করবেন?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                আপনি কি <strong>{currentBatch?.name}</strong>-এর <strong>{selectedDate}</strong> তারিখের উপস্থিতি ও ক্লাস লগ মুছে ফেলতে চান?
              </p>
              <p className="text-[11px] text-amber-700 font-bold bg-amber-50 p-2 rounded-xl border border-amber-200 mt-2">
                ⚠️ এটি রিসেট করলে শিক্ষক পুনরায় নতুন করে ওই দিনের হাজিরা সাবমিট করতে পারবেন।
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleResetDayAttendance}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-xs text-white shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? "রিসেট হচ্ছে..." : "হ্যাঁ, রিসেট করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
