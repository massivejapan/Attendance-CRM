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
} from "lucide-react";

interface AttendanceSheetProps {
  onSelectStudent?: (studentId: string) => void;
}

export const AttendanceSheet: React.FC<AttendanceSheetProps> = ({
  onSelectStudent,
}) => {
  const {
    currentUser,
    batches,
    getTeacherBatches,
    getBatchStudents,
    getStudentSummary,
    isAttendanceSubmittedForDate,
    getClassLogForDate,
    saveAttendance,
  } = useApp();

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
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const isAlreadySubmitted = selectedBatchId
    ? isAttendanceSubmittedForDate(selectedBatchId, selectedDate)
    : false;

  useEffect(() => {
    if (!selectedBatchId) return;

    const existingLog = getClassLogForDate(selectedBatchId, selectedDate);
    if (existingLog) {
      setTopicCovered(existingLog.topicCovered || "");
      setHomework(existingLog.homework || "");
      if (existingLog.isSubstitute && existingLog.teacherName) {
        setIsSubstitute(true);
        setSubstituteName(existingLog.teacherName);
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
      initialMap[s.id] = {
        status: "PRESENT",
        note: "",
      };
    });

    setAttendanceMap(initialMap);
    setIsEditMode(false);
  }, [selectedBatchId, selectedDate, students.length]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
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

    const result = await saveAttendance(
      selectedBatchId,
      selectedDate,
      dayName,
      records,
      topicCovered,
      homework,
      isSubstitute ? substituteName : undefined
    );

    setToastMessage({
      type: "success",
      text: result.message,
    });

    setIsEditMode(false);
    setTimeout(() => setToastMessage(null), 4000);
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

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl flex items-center justify-between text-xs font-semibold shadow-sm ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Clean Top Bar: Batch Selection & Date */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
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
                <span>সম্পন্ন ব্যাচ অন্তর্ভুক্ত করুন</span>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {availableBatches.length > 0 ? (
                availableBatches.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBatchId(b.id)}
                    className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all border flex items-center gap-1.5 ${
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
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        selectedBatchId === b.id
                          ? "bg-white/20 text-white"
                          : b.daysRemaining <= 45
                          ? "bg-[#FFF4EE] text-[#F26622]"
                          : "bg-emerald-50 text-emerald-700"
                      }`}>
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
                ক্লাসের তারিখ
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#F26622]"
                />
                <span className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
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
              onChange={(e) => setSubstituteName(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs w-64 focus:outline-none focus:border-[#F26622]"
            />
          )}
        </div>
      </div>

      {/* Duplicate / Existing Attendance Notification */}
      {isAlreadySubmitted && !isEditMode && (
        <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#662C90]" />
            <span>
              <strong>{currentBatch?.name}</strong>-এর {selectedDate} তারিখের
              হাজিরা ইতিমধ্যে সংরক্ষিত আছে।
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsEditMode(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 flex items-center gap-1 shadow-sm"
          >
            <FileEdit className="w-3.5 h-3.5" />
            এডিট করুন (Edit)
          </button>
        </div>
      )}

      {/* Clean Quick Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">মোট শিক্ষার্থী</p>
            <p className="text-lg font-bold text-slate-800">{students.length}</p>
          </div>
          <span className="text-xs font-semibold text-slate-400">জন</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-emerald-600">উপস্থিত (Present)</p>
            <p className="text-lg font-bold text-emerald-700">{presentCount}</p>
          </div>
          <span className="text-xs font-bold text-emerald-600">
            {students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0}%
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-rose-600">অনুপস্থিত (Absent)</p>
            <p className="text-lg font-bold text-rose-700">{absentCount}</p>
          </div>
          <span className="text-xs font-bold text-rose-600">{absentCount}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-amber-600">ছুটি (Leave)</p>
            <p className="text-lg font-bold text-amber-700">{excusedCount}</p>
          </div>
          <span className="text-xs font-bold text-amber-600">{excusedCount}</span>
        </div>
      </div>

      {/* Main Student Attendance Table (Ultra Clean, No messy nested boxes) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Search & Fast Action */}
        <div className="p-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="শিক্ষার্থীর নাম বা আইডি..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-[#F26622]"
            />
          </div>

          <button
            type="button"
            onClick={markAllPresent}
            disabled={isAlreadySubmitted && !isEditMode}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1 self-start sm:self-auto disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            সবাই উপস্থিত মার্ক করুন
          </button>
        </div>

        {/* Clean Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">নং</th>
                <th className="py-3 px-4">আইডি ও নাম</th>
                <th className="py-3 px-4">উপস্থিতি স্ট্যাটাস</th>
                <th className="py-3 px-4">অনুপস্থিতির কারণ (Note)</th>
                <th className="py-3 px-4 text-right">রেকর্ড</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, idx) => {
                  const summary = getStudentSummary(student.id);
                  const currentStatus =
                    attendanceMap[student.id]?.status || "PRESENT";
                  const currentNote = attendanceMap[student.id]?.note || "";
                  const hasConsecutiveAbsents =
                    summary && summary.consecutiveAbsents > 0;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-4 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() =>
                            onSelectStudent && onSelectStudent(student.id)
                          }
                          className="text-left group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-semibold text-slate-600">
                              #{student.studentIdCode}
                            </span>
                            <span className="font-bold text-slate-900 group-hover:text-[#F26622] transition-colors">
                              {student.name}
                            </span>
                          </div>
                          {student.guardianNumber && (
                            <p className="text-[10px] text-slate-400">
                              অভিভাবক: {student.guardianNumber}
                            </p>
                          )}
                        </button>
                      </td>

                      {/* Clean 3-Button Toggle */}
                      <td className="py-3 px-4">
                        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 gap-0.5">
                          <button
                            type="button"
                            disabled={isAlreadySubmitted && !isEditMode}
                            onClick={() =>
                              handleStatusChange(student.id, "PRESENT")
                            }
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                              currentStatus === "PRESENT"
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                            } disabled:cursor-not-allowed`}
                          >
                            উপস্থিত (P)
                          </button>

                          <button
                            type="button"
                            disabled={isAlreadySubmitted && !isEditMode}
                            onClick={() =>
                              handleStatusChange(student.id, "ABSENT")
                            }
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                              currentStatus === "ABSENT"
                                ? "bg-rose-600 text-white shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                            } disabled:cursor-not-allowed`}
                          >
                            অনুপস্থিত (A)
                          </button>

                          <button
                            type="button"
                            disabled={isAlreadySubmitted && !isEditMode}
                            onClick={() =>
                              handleStatusChange(student.id, "EXCUSED")
                            }
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                              currentStatus === "EXCUSED"
                                ? "bg-amber-500 text-white shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                            } disabled:cursor-not-allowed`}
                          >
                            ছুটি (E)
                          </button>
                        </div>
                      </td>

                      {/* Clean Note / Absent Warning */}
                      <td className="py-3 px-4 min-w-[220px]">
                        <div className="flex items-center gap-2">
                          {hasConsecutiveAbsents && (
                            <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1 flex-shrink-0">
                              <AlertTriangle className="w-3 h-3" />
                              {summary.consecutiveAbsents} ক্লাস মিস
                            </span>
                          )}
                          <input
                            type="text"
                            placeholder="কারণ লিখুন (ঐচ্ছিক)..."
                            value={currentNote}
                            disabled={isAlreadySubmitted && !isEditMode}
                            onChange={(e) =>
                              handleNoteChange(student.id, e.target.value)
                            }
                            className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-[#F26622] text-slate-700 disabled:bg-slate-50"
                          />
                        </div>
                      </td>

                      {/* Overall Stats */}
                      <td className="py-3 px-4 text-right">
                        {summary ? (
                          <div className="text-right">
                            <span className="font-bold text-slate-800">
                              {summary.attendancePercentage}%
                            </span>
                            <p className="text-[10px] text-slate-400">
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
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    কোনো শিক্ষার্থী পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Class Topic & Syllabus Notes (Clean Form) */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <BookOpen className="w-4 h-4 text-[#F26622]" />
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
              আজকে ক্লাসে কী পড়ানো হয়েছে ও হোমওয়ার্ক (Class Log)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                পড়ানো বিষয় (Topic Covered) *
              </label>
              <textarea
                rows={2}
                required
                disabled={isAlreadySubmitted && !isEditMode}
                placeholder="আজকে যা পড়ানো হলো..."
                value={topicCovered}
                onChange={(e) => setTopicCovered(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#F26622] disabled:bg-slate-50 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                আগামী ক্লাসের পড়া (Homework)
              </label>
              <textarea
                rows={2}
                disabled={isAlreadySubmitted && !isEditMode}
                placeholder="আগামী ক্লাসের কাজ..."
                value={homework}
                onChange={(e) => setHomework(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#F26622] disabled:bg-slate-50 text-slate-800"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            {isAlreadySubmitted && !isEditMode ? (
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className="px-4 py-2 rounded-lg font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                হাজিরা সংশোধন করুন (Edit)
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg font-bold text-xs bg-[#F26622] hover:bg-[#D95314] text-white shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {isAlreadySubmitted ? "আপডেট করুন" : "হাজিরা সাবমিট করুন"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
