"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Batch } from "@/types";
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
} from "lucide-react";

interface DashboardOverviewProps {
  onSelectStudent: (studentId: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onSelectStudent,
  onNavigateToTab,
}) => {
  const { students, batches, users, classLogs, getStudentSummary } = useApp();

  const [drilldownType, setDrilldownType] = useState<
    "STUDENTS" | "BATCHES" | "CLASSES" | "ABSENTEES" | "INTERVIEWS" | "BATCH_DETAIL" | "BATCH_COMPLETIONS" | null
  >(null);
  const [activeBatchModal, setActiveBatchModal] = useState<Batch | null>(null);
  const [modalSearch, setModalSearch] = useState("");
  const [batchGridFilter, setBatchGridFilter] = useState<"RUNNING" | "COMPLETED" | "ALL">("RUNNING");

  const totalStudents = students.filter((s) => s.status === "ACTIVE").length;
  const runningBatches = batches.filter((b) => b.status === "RUNNING");
  const completedBatches = batches.filter((b) => b.status === "COMPLETED");
  const activeTeachers = users.filter((u) => u.role === "TEACHER" && u.isActive).length;

  const interviewScheduledStudents = students.filter(
    (s) =>
      s.milestone?.stage === "INTERVIEW_SCHEDULED" ||
      s.milestone?.interviewDate
  );
  const coeApprovedStudents = students.filter(
    (s) => s.milestone?.stage === "COE_APPROVED"
  );
  const visaApprovedStudents = students.filter(
    (s) =>
      s.milestone?.stage === "VISA_APPROVED" ||
      s.milestone?.stage === "FLIGHT_READY"
  );

  // Batches finishing soon (sorted by daysRemaining)
  const endingSoonBatches = runningBatches
    .filter((b) => b.estimatedEndDate)
    .sort((a, b) => (a.daysRemaining || 999) - (b.daysRemaining || 999));

  const criticalAbsentees = students
    .map((s) => ({
      student: s,
      summary: getStudentSummary(s.id),
    }))
    .filter(
      (item) =>
        item.summary &&
        (item.summary.consecutiveAbsents >= 1 ||
          item.summary.attendancePercentage < 75)
    )
    .sort((a, b) => {
      const absA = a.summary?.consecutiveAbsents || 0;
      const absB = b.summary?.consecutiveAbsents || 0;
      return absB - absA;
    });

  const displayedGridBatches = batches.filter((b) => {
    if (batchGridFilter === "ALL") return true;
    return b.status === batchGridFilter;
  });

  return (
    <div className="space-y-6">
      {/* Clean KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <button
          type="button"
          onClick={() => setDrilldownType("STUDENTS")}
          className="text-left bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              মোট শিক্ষার্থী
            </span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {totalStudents} <span className="text-xs font-normal text-slate-400">জন</span>
          </p>
          <p className="text-[11px] text-[#662C90] font-semibold mt-1">
            বিস্তারিত তালিকা দেখুন →
          </p>
        </button>

        {/* Running Batches */}
        <button
          type="button"
          onClick={() => setDrilldownType("BATCHES")}
          className="text-left bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              চলমান ব্যাচ
            </span>
            <GraduationCap className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
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
          className="text-left bg-white p-5 rounded-xl border border-slate-200 hover:border-[#F26622] hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              ইন্টারভিউ নির্ধারিত
            </span>
            <Briefcase className="w-4 h-4 text-[#F26622]" />
          </div>
          <p className="text-2xl font-bold text-[#F26622] mt-2">
            {interviewScheduledStudents.length}{" "}
            <span className="text-xs font-normal text-slate-400">জন</span>
          </p>
          <p className="text-[11px] text-[#F26622] font-semibold mt-1">
            রিমাইন্ডার শিডিউল দেখুন →
          </p>
        </button>

        {/* Absent Watchlist */}
        <button
          type="button"
          onClick={() => setDrilldownType("ABSENTEES")}
          className="text-left bg-white p-5 rounded-xl border border-slate-200 hover:border-rose-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              অনুপস্থিতির অ্যালার্ট
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">
            {criticalAbsentees.length} <span className="text-xs font-normal text-slate-400">জন</span>
          </p>
          <p className="text-[11px] text-rose-600 font-semibold mt-1">
            অভিভাবক যোগাযোগের তালিকা →
          </p>
        </button>
      </div>

      {/* NEW: Batch Completion Countdown & New Batch Preparation Noticeboard */}
      <div className="bg-white rounded-2xl p-5 border border-amber-200 bg-amber-50/40 shadow-sm space-y-3">
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
            const progressPct = Math.min(
              100,
              Math.round(((b.completedClasses || 0) / (b.targetTotalClasses || 72)) * 100)
            );
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
                    ? "bg-white border-[#F26622]/40 shadow-sm hover:border-[#F26622]"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-xs">{b.name}</h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {stCount} জন
                  </span>
                </div>

                <div className="text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>সম্ভাব্য শেষ:</span>
                    <strong className="text-slate-800">{b.estimatedEndDate}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>ক্লাস সম্পন্ন:</span>
                    <strong className="text-slate-700">{b.completedClasses || 0}/{b.targetTotalClasses || 72}</strong>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                    <div
                      className={`h-full ${isUrgent ? "bg-[#F26622]" : "bg-[#662C90]"}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span
                    className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-lg w-full text-center ${
                      isUrgent
                        ? "bg-[#FFF4EE] text-[#F26622] border border-[#FED7AA]"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {b.daysRemaining !== undefined
                      ? `⏳ আর ${b.daysRemaining} দিন বাকি ${isUrgent ? "(প্রিপারেশন নিন)" : ""}`
                      : `${progressPct}% সম্পন্ন`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Interviews Reminder Widget */}
      {interviewScheduledStudents.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F26622] animate-pulse" />
              <h2 className="text-sm font-bold text-slate-900">
                আসন্ন ইন্টারভিউ শিডিউল ও রিমাইন্ডার ({interviewScheduledStudents.length} জন)
              </h2>
            </div>
            <button
              onClick={() => setDrilldownType("INTERVIEWS")}
              className="text-xs font-bold text-[#F26622] hover:underline"
            >
              সব দেখুন →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {interviewScheduledStudents.slice(0, 3).map((st) => (
              <div
                key={st.id}
                onClick={() => onSelectStudent(st.id)}
                className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-[#F26622] transition-colors cursor-pointer space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{st.name}</span>
                  <span className="text-[10px] font-bold text-[#F26622] bg-[#FFF4EE] px-2 py-0.5 rounded border border-[#FED7AA]">
                    {st.milestone?.interviewDate}
                  </span>
                </div>
                <p className="text-slate-600 font-medium line-clamp-1">
                  {st.milestone?.interviewCompany || "Client Interview"}
                </p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {st.milestone?.interviewTime} ({st.milestone?.interviewPlatform})
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clean Batch Live Status Grid */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              ব্যাচভিত্তিক আজকের উপস্থিতি ও সিলেবাস
            </h2>
            <p className="text-[11px] text-slate-500">
              শুধুমাত্র চলমান সক্রিয় ব্যাচগুলো ডিফল্টভাবে প্রদর্শিত হচ্ছে।
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
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )[0];

            return (
              <div
                key={batch.id}
                onClick={() => {
                  setActiveBatchModal(batch);
                  setDrilldownType("BATCH_DETAIL");
                }}
                className="p-4 rounded-lg border border-slate-200 bg-white hover:border-slate-400 transition-colors cursor-pointer space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-slate-900">{batch.name}</h3>
                    {batch.status === "RUNNING" && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
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

      {/* Critical Absentee Watchlist */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              অনুপস্থিতির তালিকা (Absentee Watchlist)
            </h2>
            <p className="text-[11px] text-slate-500">
              গত ক্লাসে অনুপস্থিত অথবা ৭৫% এর কম উপস্থিতি থাকা শিক্ষার্থীদের তালিকা
            </p>
          </div>
          <button
            onClick={() => setDrilldownType("ABSENTEES")}
            className="text-xs font-bold text-rose-600 hover:underline"
          >
            সব দেখুন ({criticalAbsentees.length}) →
          </button>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {criticalAbsentees.slice(0, 5).map(({ student, summary }) => (
            <div
              key={student.id}
              className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs border border-rose-100">
                  {summary?.consecutiveAbsents}d
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{student.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      #{student.studentIdCode}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    ব্যাচ: {student.batchName} • উপস্থিতি: {summary?.attendancePercentage}%
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {student.guardianNumber && (
                  <a
                    href={`tel:${student.guardianNumber}`}
                    className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    অভিভাবককে কল
                  </a>
                )}
                <button
                  onClick={() => onSelectStudent(student.id)}
                  className="text-xs font-bold text-[#662C90] hover:underline"
                >
                  প্রোফাইল
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drill-down Modals */}
      {drilldownType && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {drilldownType === "STUDENTS" && "শিক্ষার্থী তালিকা"}
                {drilldownType === "BATCHES" && "ব্যাচ তালিকা"}
                {drilldownType === "ABSENTEES" && "অনুপস্থিতি অ্যালার্ট তালিকা"}
                {drilldownType === "INTERVIEWS" && "ইন্টারভিউ শিডিউল"}
                {drilldownType === "BATCH_DETAIL" && activeBatchModal?.name}
              </h3>
              <button
                onClick={() => {
                  setDrilldownType(null);
                  setActiveBatchModal(null);
                }}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 text-xs">
              {drilldownType === "BATCHES" &&
                batches.map((b) => (
                  <div
                    key={b.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{b.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {b.scheduleDays} • {b.timeSlot}
                      </p>
                    </div>
                    <span className="font-bold px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
                      {b.status === "RUNNING" ? "চলমান" : "সম্পন্ন"}
                    </span>
                  </div>
                ))}

              {drilldownType === "INTERVIEWS" &&
                interviewScheduledStudents.map((st) => (
                  <div
                    key={st.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{st.name}</p>
                      <p className="text-[11px] text-slate-500">
                        কোম্পানি: {st.milestone?.interviewCompany} • তারিখ: {st.milestone?.interviewDate}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setDrilldownType(null);
                        onSelectStudent(st.id);
                      }}
                      className="px-3 py-1 rounded bg-[#662C90] text-white font-bold text-xs"
                    >
                      প্রোফাইল
                    </button>
                  </div>
                ))}

              {drilldownType === "ABSENTEES" &&
                criticalAbsentees.map(({ student, summary }) => (
                  <div
                    key={student.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{student.name}</p>
                      <p className="text-[11px] text-slate-500">
                        ব্যাচ: {student.batchName} • টানা অনুপস্থিত: {summary?.consecutiveAbsents} দিন
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {student.guardianNumber && (
                        <a
                          href={`tel:${student.guardianNumber}`}
                          className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-xs"
                        >
                          কল করুন
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setDrilldownType(null);
                          onSelectStudent(student.id);
                        }}
                        className="px-3 py-1 rounded bg-[#662C90] text-white font-bold text-xs"
                      >
                        প্রোফাইল
                      </button>
                    </div>
                  </div>
                ))}

              {drilldownType === "STUDENTS" &&
                students.map((st) => (
                  <div
                    key={st.id}
                    className="py-2.5 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{st.name}</p>
                      <p className="text-[11px] text-slate-400">
                        #{st.studentIdCode} • {st.batchName || "N/A"}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setDrilldownType(null);
                        onSelectStudent(st.id);
                      }}
                      className="text-[#662C90] font-bold"
                    >
                      প্রোফাইল →
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
