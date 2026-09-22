"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Batch, FollowUpCallLog, CallStatus, GuardianResponse } from "@/types";
import {
  Users,
  GraduationCap,
  Briefcase,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  Phone,
  Clock,
  ChevronRight,
  Calendar,
  Sparkles,
  Search,
  MessageSquare,
  CheckCircle2,
  XCircle,
  History,
  PhoneCall,
  UserX,
  UserCheck,
  Check,
  RotateCcw,
} from "lucide-react";
import {
  openWhatsApp,
  getWhatsAppAbsentNotice,
  formatDate,
} from "@/lib/utils";

interface DashboardOverviewProps {
  onSelectStudent: (studentId: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onSelectStudent,
  onNavigateToTab,
}) => {
  const {
    students,
    batches,
    users,
    classLogs,
    getStudentSummary,
    currentUser,
    followUpLogs,
    addFollowUpLog,
    resolveIrregularStudent,
  } = useApp();

  const [drilldownType, setDrilldownType] = useState<
    | "STUDENTS"
    | "BATCHES"
    | "CLASSES"
    | "ABSENTEES"
    | "INTERVIEWS"
    | "BATCH_DETAIL"
    | "BATCH_COMPLETIONS"
    | "TOP_STUDENTS"
    | "CALL_HISTORY"
    | null
  >(null);
  const [activeBatchModal, setActiveBatchModal] = useState<Batch | null>(null);
  const [modalSearch, setModalSearch] = useState("");
  const [batchGridFilter, setBatchGridFilter] = useState<"RUNNING" | "COMPLETED" | "ALL">("RUNNING");
  const [absentFilter, setAbsentFilter] = useState<"ALL" | "PENDING" | "CALLED" | "RESOLVED">("ALL");

  // Call Logging Modal State
  const [selectedStudentForCall, setSelectedStudentForCall] = useState<{
    id: string;
    name: string;
    code: string;
    batchName?: string;
    guardianNumber?: string;
    consecutiveAbsents: number;
  } | null>(null);

  const [callerName, setCallerName] = useState(currentUser?.name || "Academic Staff");
  const [callStatus, setCallStatus] = useState<CallStatus>("CONNECTED");
  const [guardianResponse, setGuardianResponse] = useState<GuardianResponse>("WILL_RESUME");
  const [callNotes, setCallNotes] = useState("");
  const [isSubmittingCall, setIsSubmittingCall] = useState(false);

  const totalStudents = students.filter((s) => s.status === "ACTIVE").length;
  const runningBatches = batches.filter((b) => b.status === "RUNNING");
  const completedBatches = batches.filter((b) => b.status === "COMPLETED");
  const activeTeachers = users.filter((u) => u.role === "TEACHER" && u.isActive).length;

  const interviewScheduledStudents = students.filter(
    (s) =>
      s.milestone?.stage === "INTERVIEW_SCHEDULED" ||
      s.milestoneStage === "INTERVIEW_SCHEDULED" ||
      s.milestone?.interviewDate
  );

  // Batches finishing soon (sorted by daysRemaining)
  const endingSoonBatches = runningBatches
    .filter((b) => b.estimatedEndDate)
    .sort((a, b) => (a.daysRemaining || 999) - (b.daysRemaining || 999));

  // Critical Absentees & Irregular Students
  const allIrregularStudents = students
    .filter((s) => s.status === "ACTIVE")
    .map((s) => {
      const summary = getStudentSummary(s.id);
      const latestCall = followUpLogs.find((l) => l.studentId === s.id);
      return {
        student: s,
        summary,
        latestCall,
      };
    })
    .filter(
      (item) =>
        item.summary &&
        (item.summary.consecutiveAbsents >= 1 || item.summary.attendancePercentage < 75)
    )
    .sort((a, b) => {
      // Put unresolved/pending first, then by consecutive absents desc
      const isResolvedA = a.latestCall?.resolutionStatus === "RESOLVED" ? 1 : 0;
      const isResolvedB = b.latestCall?.resolutionStatus === "RESOLVED" ? 1 : 0;
      if (isResolvedA !== isResolvedB) return isResolvedA - isResolvedB;

      const absA = a.summary?.consecutiveAbsents || 0;
      const absB = b.summary?.consecutiveAbsents || 0;
      return absB - absA;
    });

  // Filtered irregular list based on call tracking tabs
  const filteredIrregularList = allIrregularStudents.filter((item) => {
    const resStatus = item.latestCall?.resolutionStatus;
    if (absentFilter === "PENDING") {
      return !item.latestCall || (resStatus === "PENDING" && item.latestCall.callStatus === "NO_ANSWER");
    }
    if (absentFilter === "CALLED") {
      return item.latestCall && resStatus === "PENDING" && item.latestCall.callStatus === "CONNECTED";
    }
    if (absentFilter === "RESOLVED") {
      return resStatus === "RESOLVED";
    }
    return true;
  });

  // Regular & Star Performers (Interview Priority Candidates)
  const topRegularStudents = students
    .filter((s) => s.status === "ACTIVE")
    .map((s) => ({
      student: s,
      summary: getStudentSummary(s.id),
    }))
    .filter(
      (item) =>
        item.summary &&
        item.summary.attendancePercentage >= 85 &&
        item.summary.consecutiveAbsents === 0
    )
    .sort((a, b) => {
      const pctA = a.summary?.attendancePercentage || 0;
      const pctB = b.summary?.attendancePercentage || 0;
      if (pctB !== pctA) return pctB - pctA;
      return (b.summary?.presentCount || 0) - (a.summary?.presentCount || 0);
    });

  const displayedGridBatches = batches.filter((b) => {
    if (batchGridFilter === "ALL") return true;
    return b.status === batchGridFilter;
  });

  // Handle Call Log Submission
  const handleSaveCallLog = (resolution: "PENDING" | "RESOLVED" | "DROPPED") => {
    if (!selectedStudentForCall) return;
    setIsSubmittingCall(true);

    if (resolution === "DROPPED" || resolution === "RESOLVED") {
      resolveIrregularStudent(
        selectedStudentForCall.id,
        resolution,
        callNotes || `অভিভাবক ফিডব্যাক: ${guardianResponse}`
      );
    } else {
      addFollowUpLog({
        studentId: selectedStudentForCall.id,
        studentName: selectedStudentForCall.name,
        studentCode: selectedStudentForCall.code,
        batchName: selectedStudentForCall.batchName,
        guardianNumber: selectedStudentForCall.guardianNumber,
        calledBy: callerName,
        callStatus,
        guardianResponse,
        notes: callNotes,
        resolutionStatus: "PENDING",
      });
    }

    setIsSubmittingCall(false);
    setSelectedStudentForCall(null);
    setCallNotes("");
  };

  return (
    <div className="space-y-6">
      {/* Clean KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <button
          type="button"
          onClick={() => setDrilldownType("STUDENTS")}
          className="text-left bg-white p-5 rounded-2xl border border-slate-200 hover:border-purple-300 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              মোট শিক্ষার্থী
            </span>
            <Users className="w-4 h-4 text-[#662C90]" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {totalStudents} <span className="text-xs font-normal text-slate-400">জন</span>
          </p>
          <p className="text-[11px] text-[#662C90] font-bold mt-1">
            বিস্তারিত তালিকা দেখুন →
          </p>
        </button>

        {/* Running Batches */}
        <button
          type="button"
          onClick={() => setDrilldownType("BATCHES")}
          className="text-left bg-white p-5 rounded-2xl border border-slate-200 hover:border-purple-300 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              চলমান ব্যাচ
            </span>
            <GraduationCap className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {runningBatches.length} <span className="text-xs font-normal text-slate-400">টি</span>
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {activeTeachers} জন শিক্ষক নিয়োজিত
          </p>
        </button>

        {/* Upcoming Interviews */}
        <button
          type="button"
          onClick={() => setDrilldownType("INTERVIEWS")}
          className="text-left bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#F26622] hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              ইন্টারভিউ নির্ধারিত
            </span>
            <Briefcase className="w-4 h-4 text-[#F26622]" />
          </div>
          <p className="text-2xl font-black text-[#F26622] mt-2">
            {interviewScheduledStudents.length}{" "}
            <span className="text-xs font-normal text-slate-400">জন</span>
          </p>
          <p className="text-[11px] text-[#F26622] font-bold mt-1">
            রিমাইন্ডার শিডিউল দেখুন →
          </p>
        </button>

        {/* Absent Watchlist */}
        <button
          type="button"
          onClick={() => setDrilldownType("ABSENTEES")}
          className="text-left bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 hover:border-rose-400 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wide">
              অনুপস্থিতির অ্যালার্ট
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">
            {allIrregularStudents.length} <span className="text-xs font-normal text-slate-400">জন</span>
          </p>
          <p className="text-[11px] text-rose-600 font-bold mt-1">
            কল ট্র্যাকিং ও ফলোআপ →
          </p>
        </button>
      </div>

      {/* NEW: Batch Completion Countdown */}
      <div className="bg-white rounded-2xl p-5 border border-amber-200 bg-amber-50/30 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/70 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-300">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                কোর্স সমাপ্তির আনুমানিক তারিখ ও নতুন ব্যাচ প্রিপারেশন ট্র্যাকার
              </h2>
              <p className="text-[11px] text-slate-500">
                চলমান ব্যাচগুলোর কোর্স সমাপ্তির কাউন্টডাউন — সময়মতো নতুন ব্যাচের ভর্তি ও শিডিউলিং প্রস্তুত করুন।
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab("batches")}
            className="text-xs font-extrabold text-[#662C90] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            ব্যাচ শিডিউল পরিচালনা <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {endingSoonBatches.map((b) => {
            const stCount = students.filter((s) => s.batchId === b.id && s.status === "ACTIVE").length;
            const isUrgent = b.daysRemaining !== undefined && b.daysRemaining <= 45;

            return (
              <div
                key={b.id}
                onClick={() => {
                  setActiveBatchModal(b);
                  setDrilldownType("BATCH_DETAIL");
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                  isUrgent
                    ? "bg-white border-[#F26622]/40 shadow-xs hover:border-[#F26622]"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-xs">{b.name}</h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {stCount} জন
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">সম্ভাব্য শেষ:</span>
                  <strong className="text-slate-800 font-bold font-mono">{b.estimatedEndDate || "TBD"}</strong>
                </div>

                {b.daysRemaining !== undefined && (
                  <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">বাকি আছে</span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isUrgent
                          ? "bg-[#FFF4EE] text-[#F26622] border border-[#FED7AA]"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {b.daysRemaining} দিন
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* NEW: CRITICAL IRREGULAR STUDENTS FOLLOW-UP & CALL TRACKING MODULE */}
      <div className="bg-white rounded-2xl p-5 border border-rose-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-200">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                অনিয়মিত শিক্ষার্থী ও অভিভাবক কল ট্র্যাকিং (Call Follow-Up Queue)
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black">
                  মোট {allIrregularStudents.length} জন
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                টানা ক্লাস মিস করা শিক্ষার্থীদের অভিভাবকের সাথে কথা বলে কল রেজাল্ট রেকর্ড করুন ও ড্রপআউট বা নিয়মিত হিসেবে রেজলভ করুন।
              </p>
            </div>
          </div>

          {/* Action Tabs & History View */}
          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
            <button
              onClick={() => setAbsentFilter("ALL")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                absentFilter === "ALL"
                  ? "bg-rose-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              সব ({allIrregularStudents.length})
            </button>
            <button
              onClick={() => setAbsentFilter("PENDING")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                absentFilter === "PENDING"
                  ? "bg-amber-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              কল বাকি
            </button>
            <button
              onClick={() => setAbsentFilter("CALLED")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                absentFilter === "CALLED"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              কল সম্পন্ন
            </button>
            <button
              onClick={() => setAbsentFilter("RESOLVED")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                absentFilter === "RESOLVED"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              সমাধানকৃত
            </button>
            <button
              onClick={() => setDrilldownType("CALL_HISTORY")}
              className="px-3 py-1 rounded-xl text-xs font-bold bg-purple-50 text-[#662C90] border border-purple-200 hover:bg-purple-100 flex items-center gap-1"
            >
              <History className="w-3.5 h-3.5" />
              কল হিস্ট্রি
            </button>
          </div>
        </div>

        {/* Irregular Students Table / Card List */}
        <div className="divide-y divide-slate-100 text-xs">
          {filteredIrregularList.length > 0 ? (
            filteredIrregularList.slice(0, 10).map(({ student, summary, latestCall }, idx) => {
              const isResolved = latestCall?.resolutionStatus === "RESOLVED";
              const isCalled = latestCall && latestCall.callStatus === "CONNECTED";

              return (
                <div
                  key={student.id}
                  className={`py-3.5 px-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                    isResolved
                      ? "bg-emerald-50/40"
                      : idx % 2 === 0
                      ? "bg-white"
                      : "bg-slate-50/50"
                  }`}
                >
                  {/* Left: Serial, Student & Status Info */}
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-black text-xs shrink-0">
                      {idx + 1}
                    </span>

                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-black text-xs border border-rose-200 shrink-0">
                      {summary?.consecutiveAbsents}d
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectStudent(student.id)}
                          className="font-extrabold text-slate-900 hover:text-[#F26622] text-xs text-left"
                        >
                          {student.name}
                        </button>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                          #{student.studentIdCode}
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.2 rounded">
                          {student.batchName || "ব্যাচ নির্ধারিত নেই"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span>মোট উপস্থিতি: <strong>{summary?.attendancePercentage}%</strong> ({summary?.presentCount} দিন)</span>
                        {student.guardianNumber && (
                          <span className="font-mono font-medium text-slate-600">
                            📞 অভিভাবক: {student.guardianNumber}
                          </span>
                        )}
                        {/* Call Status Badge */}
                        {latestCall ? (
                          <span
                            className={`px-2 py-0.2 rounded-full font-bold text-[10px] ${
                              latestCall.resolutionStatus === "RESOLVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : latestCall.callStatus === "CONNECTED"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {latestCall.resolutionStatus === "RESOLVED"
                              ? "✓ কথা সম্পন্ন (নিয়মিত থাকবে)"
                              : latestCall.callStatus === "CONNECTED"
                              ? `📞 কল হয়েছে: ${latestCall.notes || "ফলোআপ চলছে"}`
                              : "⚠️ ফোন রিসিভ করেনি"}
                          </span>
                        ) : (
                          <span className="px-2 py-0.2 rounded-full font-bold text-[10px] bg-rose-100 text-rose-700">
                            🔴 কোনো কল করা হয়নি
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pl-9 md:pl-0">
                    {/* Direct Call Button */}
                    {student.guardianNumber && (
                      <a
                        href={`tel:${student.guardianNumber}`}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold border border-slate-200 flex items-center gap-1"
                        title="সরাসরি ফোন কল করুন"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        কল
                      </a>
                    )}

                    {/* Direct WhatsApp Message Button */}
                    {student.guardianNumber && (
                      <button
                        type="button"
                        onClick={() =>
                          openWhatsApp(
                            student.guardianNumber,
                            getWhatsAppAbsentNotice(
                              student.name,
                              student.batchName,
                              summary?.consecutiveAbsents || 1
                            )
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold border border-emerald-200 flex items-center gap-1 shadow-2xs"
                        title="অভিভাবককে হোয়াটসঅ্যাপ নোটিশ পাঠান"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        WhatsApp
                      </button>
                    )}

                    {/* Log Call & Discussion Button */}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedStudentForCall({
                          id: student.id,
                          name: student.name,
                          code: student.studentIdCode,
                          batchName: student.batchName,
                          guardianNumber: student.guardianNumber,
                          consecutiveAbsents: summary?.consecutiveAbsents || 1,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-[#662C90] text-white hover:bg-[#522375] text-xs font-bold flex items-center gap-1 shadow-xs"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      কল রেকর্ড / রেজাল্ট
                    </button>

                    {/* Fast Resolve Regular */}
                    {!isResolved && (
                      <button
                        type="button"
                        onClick={() =>
                          resolveIrregularStudent(
                            student.id,
                            "RESOLVED",
                            "অভিভাবক নিশ্চিত করেছেন নিয়মিত ক্লাসে উপস্থিত থাকবেন।"
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold flex items-center gap-1 shadow-xs"
                        title="নিয়মিত হিসেবে চিহ্নিত করুন (তালিকা থেকে সরিয়ে দিন)"
                      >
                        <Check className="w-3.5 h-3.5" />
                        নিয়মিত
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              বর্তমানে এই ফিল্টারে কোনো অনিয়মিত শিক্ষার্থী নেই।
            </div>
          )}
        </div>
      </div>

      {/* Star Performers / Regular Students */}
      <div className="bg-white rounded-2xl p-5 border border-purple-200 bg-purple-50/20 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#662C90] flex items-center justify-center border border-purple-200">
              <Sparkles className="w-4 h-4 text-[#662C90]" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                🌟 নিয়মিত শিক্ষার্থী ও ইন্টারভিউ অগ্রাধিকার তালিকা
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#662C90]">
                  {topRegularStudents.length} জন প্রস্তুত
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                টানা উপস্থিতি ও ৮৫%-১০০% ক্লাসে উপস্থিত শিক্ষার্থীদের তালিকা — আসন্ন ইন্টারভিউ ও ভিসার জন্য শীর্ষ অগ্রাধিকার দিন।
              </p>
            </div>
          </div>

          <button
            onClick={() => setDrilldownType("TOP_STUDENTS")}
            className="text-xs font-extrabold text-[#662C90] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            সম্পূর্ণ অগ্রাধিকার তালিকা দেখুন ({topRegularStudents.length}) →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {topRegularStudents.slice(0, 4).map(({ student, summary }, rank) => (
            <div
              key={student.id}
              onClick={() => onSelectStudent(student.id)}
              className="p-3.5 rounded-xl border border-purple-100 bg-white hover:border-[#662C90] transition-all cursor-pointer space-y-2 shadow-2xs group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-black border border-amber-300">
                    #{rank + 1}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-xs group-hover:text-[#662C90] transition-colors truncate max-w-[120px]">
                    {student.name}
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  #{student.studentIdCode}
                </span>
              </div>

              <div className="text-[11px] space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span>ব্যাচ:</span>
                  <strong className="text-slate-700 font-semibold">{student.batchName || "N/A"}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>উপস্থিত ক্লাস:</span>
                  <strong className="text-emerald-700 font-bold">{summary?.presentCount} দিন ({summary?.attendancePercentage}%)</strong>
                </div>
              </div>

              <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#662C90] bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {student.milestone?.stage || student.milestoneStage || "কোর্স চলমান"}
                </span>
                <span className="text-[10px] font-bold text-[#F26622] group-hover:underline">
                  প্রোফাইল →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Batch Live Status Grid */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              ব্যাচভিত্তিক আজকের উপস্থিতি ও সিলেবাস
            </h2>
            <p className="text-[11px] text-slate-500">
              চলমান ও সম্পন্ন ব্যাচগুলোর বর্তমান সার্বিক অবস্থা।
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setBatchGridFilter("RUNNING")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                batchGridFilter === "RUNNING"
                  ? "bg-[#662C90] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              চলমান ব্যাচ ({runningBatches.length})
            </button>
            <button
              onClick={() => setBatchGridFilter("COMPLETED")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                batchGridFilter === "COMPLETED"
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              সম্পন্ন ({completedBatches.length})
            </button>
            <button
              onClick={() => setBatchGridFilter("ALL")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                batchGridFilter === "ALL"
                  ? "bg-[#F26622] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              সকল ({batches.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayedGridBatches.map((batch) => {
            const batchStudents = students.filter(
              (s) => s.batchId === batch.id && (batch.status === "COMPLETED" ? true : s.status === "ACTIVE")
            );
            const latestLog = classLogs
              .filter((cl) => cl.batchId === batch.id)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

            return (
              <div
                key={batch.id}
                onClick={() => {
                  setActiveBatchModal(batch);
                  setDrilldownType("BATCH_DETAIL");
                }}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-purple-300 transition-colors cursor-pointer space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-slate-900">{batch.name}</h3>
                    {batch.status === "RUNNING" && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {batchStudents.length} জন
                  </span>
                </div>

                {latestLog ? (
                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">
                        শিক্ষক: {latestLog.teacherName}
                      </span>
                      <span className="font-bold text-emerald-700">
                        {latestLog.presentCount}/{latestLog.totalStudents} উপস্থিত
                      </span>
                    </div>
                    <p className="text-slate-600 line-clamp-1 italic">
                      "{latestLog.topicCovered}"
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-400 text-[11px] pt-1">ক্লাসের ডাটা নেই</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CALL LOGGING MODAL */}
      {selectedStudentForCall && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#662C90] flex items-center justify-center font-bold">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    অভিভাবক কল ফলোআপ রেকর্ড
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedStudentForCall.name} (#{selectedStudentForCall.code}) • {selectedStudentForCall.batchName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentForCall(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 text-base"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Guardian Info & Quick Action */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">অভিভাবকের নম্বর:</span>
                  <strong className="text-slate-900 font-mono text-xs">
                    {selectedStudentForCall.guardianNumber || "নম্বর দেওয়া নেই"}
                  </strong>
                </div>

                <div className="flex items-center gap-2">
                  {selectedStudentForCall.guardianNumber && (
                    <a
                      href={`tel:${selectedStudentForCall.guardianNumber}`}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                    >
                      <Phone className="w-3.5 h-3.5" /> কল
                    </a>
                  )}

                  {selectedStudentForCall.guardianNumber && (
                    <button
                      type="button"
                      onClick={() =>
                        openWhatsApp(
                          selectedStudentForCall.guardianNumber,
                          getWhatsAppAbsentNotice(
                            selectedStudentForCall.name,
                            selectedStudentForCall.batchName,
                            selectedStudentForCall.consecutiveAbsents
                          )
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold text-xs flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
                    </button>
                  )}
                </div>
              </div>

              {/* Form Inputs */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">কল করেছেন কে (Caller Name):</label>
                <input
                  type="text"
                  value={callerName}
                  onChange={(e) => setCallerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">কল স্ট্যাটাস:</label>
                  <select
                    value={callStatus}
                    onChange={(e) => setCallStatus(e.target.value as CallStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    <option value="CONNECTED">কথা হয়েছে (Connected)</option>
                    <option value="NO_ANSWER">ফোন ধরেনি (No Answer)</option>
                    <option value="BUSY">ব্যস্ত ছিল (Busy)</option>
                    <option value="WRONG_NUMBER">ভুল নম্বর (Wrong Number)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">অভিভাবকের মতামত:</label>
                  <select
                    value={guardianResponse}
                    onChange={(e) => setGuardianResponse(e.target.value as GuardianResponse)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    <option value="WILL_RESUME">নিয়মিত ক্লাসে ফিরবে</option>
                    <option value="BATCH_CHANGE">ব্যাচ পরিবর্তন চান</option>
                    <option value="DROPPED">কোর্স বাতিল / ড্রপআউট</option>
                    <option value="NEEDS_TIME">সিদ্ধান্ত নিতে সময় নিচ্ছেন</option>
                    <option value="OTHER">অন্যান্য কারণ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">কথোপকথনের বিস্তারিত নোট (Note):</label>
                <textarea
                  rows={2}
                  placeholder="যেমন: শিক্ষার্থী অসুস্থ ছিল, আগামী রবিবার থেকে আসবে..."
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium resize-none"
                />
              </div>
            </div>

            {/* Action Buttons for Resolution */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                disabled={isSubmittingCall}
                onClick={() => handleSaveCallLog("PENDING")}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                💾 শুধু কল লগ সংরক্ষণ করুন
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSubmittingCall}
                  onClick={() => handleSaveCallLog("DROPPED")}
                  className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 flex items-center gap-1"
                >
                  <UserX className="w-3.5 h-3.5" />
                  ড্রপআউট / তালিকা থেকে বাদ
                </button>

                <button
                  type="button"
                  disabled={isSubmittingCall}
                  onClick={() => handleSaveCallLog("RESOLVED")}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  নিয়মিত চিহ্নিত ও রেজলভ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CALL HISTORY MODAL */}
      {drilldownType === "CALL_HISTORY" && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 max-h-[85vh] flex flex-col animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#662C90]" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  অভিভাবক কল ট্র্যাকিং হিস্ট্রি ({followUpLogs.length}টি রেকর্ড)
                </h3>
              </div>
              <button
                onClick={() => setDrilldownType(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 text-xs space-y-2">
              {followUpLogs.length > 0 ? (
                followUpLogs.map((log) => (
                  <div key={log.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 font-bold">{log.studentName}</strong>
                        <span className="font-mono text-slate-400 text-[10px]">#{log.studentCode}</span>
                        <span className="text-slate-500 text-[10px]">({log.batchName || "N/A"})</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          log.resolutionStatus === "RESOLVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : log.resolutionStatus === "DROPPED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {log.resolutionStatus === "RESOLVED"
                          ? "✓ সমাধান হয়েছে"
                          : log.resolutionStatus === "DROPPED"
                          ? "🚫 ড্রপআউট"
                          : "⏳ ফলোআপ বাকি"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span>কল করেছেন: <strong>{log.calledBy}</strong></span>
                      <span>তারিখ: {formatDate(log.calledAt)}</span>
                      <span>স্ট্যাটাস: {log.callStatus}</span>
                      {log.guardianNumber && <span>📞 {log.guardianNumber}</span>}
                    </div>

                    {log.notes && (
                      <p className="p-2 bg-slate-50 rounded-lg text-slate-700 italic border border-slate-100 mt-1">
                        "{log.notes}"
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  এখনো কোনো কল হিস্ট্রি সংরক্ষিত হয়নি।
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Drill-down Modals */}
      {drilldownType && drilldownType !== "CALL_HISTORY" && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 max-h-[85vh] flex flex-col animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">
                  {drilldownType === "STUDENTS" && `শিক্ষার্থী তালিকা (${students.length} জন)`}
                  {drilldownType === "BATCHES" && `ব্যাচ তালিকা (${batches.length}টি ব্যাচ)`}
                  {drilldownType === "ABSENTEES" && `অনুপস্থিতি ও ফলোআপ তালিকা (${allIrregularStudents.length} জন)`}
                  {drilldownType === "INTERVIEWS" && `জাপান ইন্টারভিউ শিডিউল (${interviewScheduledStudents.length} জন)`}
                  {drilldownType === "TOP_STUDENTS" && "🌟 নিয়মিত ও সেরা শিক্ষার্থী তালিকা"}
                  {drilldownType === "BATCH_DETAIL" && `ব্যাচ ডিটেইলস: ${activeBatchModal?.name}`}
                </h3>
              </div>
              <button
                onClick={() => {
                  setDrilldownType(null);
                  setActiveBatchModal(null);
                }}
                className="text-slate-400 hover:text-slate-700 font-bold text-base p-1"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 text-xs space-y-4 pr-1">
              {/* BATCH DETAIL DRILLDOWN */}
              {drilldownType === "BATCH_DETAIL" && activeBatchModal && (
                <div className="space-y-4">
                  {/* Batch Summary Card */}
                  <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#662C90] text-sm">
                          {activeBatchModal.name}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            activeBatchModal.status === "RUNNING"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {activeBatchModal.status === "RUNNING" ? "● চলমান ব্যাচ" : "সম্পন্ন"}
                        </span>
                      </div>
                      <span className="font-bold text-slate-600 bg-white px-3 py-1 rounded-xl border border-purple-100 shadow-2xs">
                        মোট শিক্ষার্থী: {students.filter((s) => s.batchId === activeBatchModal.id).length} জন
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1">
                      <div>
                        <span className="text-slate-400 block">ক্লাসের দিন:</span>
                        <strong>{activeBatchModal.scheduleDays || "নিয়মিত"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">ক্লাস সময়:</span>
                        <strong>{activeBatchModal.timeSlot || "নির্ধারিত সময়"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">সম্পন্ন ক্লাস:</span>
                        <strong className="text-[#662C90]">
                          {activeBatchModal.completedClasses} / {activeBatchModal.targetTotalClasses} টি
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Batch Students Section */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 flex items-center justify-between">
                      <span>এই ব্যাচের শিক্ষার্থী তালিকা ({students.filter((s) => s.batchId === activeBatchModal.id).length} জন)</span>
                    </h4>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                      {students
                        .filter((s) => s.batchId === activeBatchModal.id)
                        .map((st) => {
                          const summary = getStudentSummary(st.id);
                          return (
                            <div
                              key={st.id}
                              className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <strong className="text-slate-900 font-bold">{st.name}</strong>
                                  <span className="font-mono text-[10px] text-slate-400">#{st.studentIdCode}</span>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                  {st.mobileNumber && <span>📞 {st.mobileNumber}</span>}
                                  {summary && (
                                    <span
                                      className={`font-bold ${
                                        summary.attendancePercentage >= 80
                                          ? "text-emerald-700"
                                          : summary.attendancePercentage >= 60
                                          ? "text-amber-700"
                                          : "text-rose-700"
                                      }`}
                                    >
                                      উপস্থিতি: {summary.attendancePercentage}% ({summary.presentCount}/{summary.totalClasses})
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setDrilldownType(null);
                                  setActiveBatchModal(null);
                                  onSelectStudent(st.id);
                                }}
                                className="px-3 py-1.5 rounded-xl font-bold bg-[#662C90] text-white hover:bg-[#522375] transition-all text-xs"
                              >
                                প্রোফাইল ও ডকুমেন্টস →
                              </button>
                            </div>
                          );
                        })}

                      {students.filter((s) => s.batchId === activeBatchModal.id).length === 0 && (
                        <div className="p-4 text-center text-slate-400">
                          এই ব্যাচে কোনো সক্রিয় শিক্ষার্থী নেই।
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Batch Class Logs History */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800">সাম্প্রতিক ক্লাসের সিলেবাস ও হাজিরা লগ</h4>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                      {classLogs
                        .filter((cl) => cl.batchId === activeBatchModal.id)
                        .slice(0, 5)
                        .map((cl) => (
                          <div key={cl.id} className="p-3 space-y-1 hover:bg-slate-50">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-900">
                                {formatDate(cl.date)} ({cl.dayName})
                              </span>
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                {cl.presentCount}/{cl.totalStudents} জন উপস্থিত
                              </span>
                            </div>
                            <p className="text-slate-600 italic">"{cl.topicCovered}"</p>
                            {cl.homework && (
                              <p className="text-[11px] text-slate-500">
                                <strong>হোমওয়ার্ক:</strong> {cl.homework}
                              </p>
                            )}
                          </div>
                        ))}

                      {classLogs.filter((cl) => cl.batchId === activeBatchModal.id).length === 0 && (
                        <div className="p-4 text-center text-slate-400">
                          এখনো এই ব্যাচের কোনো ক্লাসের হাজিরা নেওয়া হয়নি।
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* BATCHES LIST */}
              {drilldownType === "BATCHES" && (
                <div className="divide-y divide-slate-100">
                  {batches.map((b) => {
                    const count = students.filter((s) => s.batchId === b.id).length;
                    return (
                      <div
                        key={b.id}
                        className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 text-xs">{b.name}</p>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                b.status === "RUNNING"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {b.status === "RUNNING" ? "চলমান" : "সম্পন্ন"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            দিন: {b.scheduleDays || "নিয়মিত"} • সময়: {b.timeSlot || "N/A"} • ক্লাস: {b.completedClasses}/{b.targetTotalClasses}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg text-xs">
                            {count} জন
                          </span>
                          <button
                            onClick={() => {
                              setActiveBatchModal(b);
                              setDrilldownType("BATCH_DETAIL");
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#662C90] text-white font-bold text-xs"
                          >
                            ডিটেইলস
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* STUDENTS DRILLDOWN */}
              {drilldownType === "STUDENTS" && (
                <div className="divide-y divide-slate-100">
                  {students.map((st) => (
                    <div
                      key={st.id}
                      className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{st.name}</p>
                        <p className="text-[11px] text-slate-400">
                          #{st.studentIdCode} • {st.batchName || "N/A"} • {st.mobileNumber || "ফোন নেই"}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setDrilldownType(null);
                          onSelectStudent(st.id);
                        }}
                        className="text-[#662C90] font-bold hover:underline"
                      >
                        প্রোফাইল ও ডকুমেন্টস →
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* ABSENTEES DRILLDOWN */}
              {drilldownType === "ABSENTEES" && (
                <div className="divide-y divide-slate-100">
                  {allIrregularStudents.map(({ student: st, summary, latestCall }) => (
                    <div
                      key={st.id}
                      className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 text-xs">{st.name}</p>
                          <span className="text-[10px] font-mono text-slate-400">#{st.studentIdCode}</span>
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-rose-100 text-rose-800">
                            {summary?.consecutiveAbsents} দিন অনুপস্থিত
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          ব্যাচ: {st.batchName || "N/A"} • অভিভাবক: {st.guardianNumber || "দেওয়া নেই"}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setDrilldownType(null);
                          onSelectStudent(st.id);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#662C90] text-white font-bold text-xs"
                      >
                        প্রোফাইল
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* INTERVIEWS DRILLDOWN */}
              {drilldownType === "INTERVIEWS" && (
                <div className="divide-y divide-slate-100">
                  {interviewScheduledStudents.length > 0 ? (
                    interviewScheduledStudents.map((st) => (
                      <div
                        key={st.id}
                        className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 text-xs">{st.name}</p>
                            <span className="text-[10px] font-mono text-slate-400">#{st.studentIdCode}</span>
                            <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-purple-100 text-[#662C90]">
                              {st.milestoneStage || "ইন্টারভিউ শিডিউলড"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            ইন্টারভিউ তারিখ: <strong>{st.interviewDate || "নির্ধারিত নয়"}</strong> ({st.interviewTime || ""}) • কোম্পানি: {st.interviewCompany || "N/A"}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setDrilldownType(null);
                            onSelectStudent(st.id);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#662C90] text-white font-bold text-xs"
                        >
                          প্রোফাইল
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-400">
                      এখনো কোনো শিক্ষার্থীর ইন্টারভিউ শিডিউল সেট করা নেই।
                    </div>
                  )}
                </div>
              )}

              {/* TOP STUDENTS DRILLDOWN */}
              {drilldownType === "TOP_STUDENTS" && (
                <div className="divide-y divide-slate-100">
                  {topRegularStudents.map(({ student: st, summary }, rank) => (
                    <div
                      key={st.id}
                      className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-purple-100 text-[#662C90] flex items-center justify-center font-bold text-xs">
                          #{rank + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 text-xs">{st.name}</p>
                            <span className="text-[10px] font-mono text-slate-400">
                              #{st.studentIdCode}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            ব্যাচ: {st.batchName || "N/A"} • মোট উপস্থিতি: <strong className="text-emerald-700 font-bold">{summary?.presentCount} দিন ({summary?.attendancePercentage}%)</strong>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setDrilldownType(null);
                          onSelectStudent(st.id);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#662C90] hover:bg-[#522375] text-white font-bold text-xs"
                      >
                        প্রোফাইল ও ক্যারিয়ার
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
