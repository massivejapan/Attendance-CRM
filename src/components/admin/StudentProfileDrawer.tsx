"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { MilestoneStage, StudentMilestone } from "@/types";
import {
  Phone,
  MessageSquare,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
  GraduationCap,
  Calendar,
  Save,
  Edit,
} from "lucide-react";

interface StudentProfileDrawerProps {
  studentId: string | null;
  onClose: () => void;
}

export const StudentProfileDrawer: React.FC<StudentProfileDrawerProps> = ({
  studentId,
  onClose,
}) => {
  const {
    students,
    batches,
    getStudentSummary,
    attendances,
    shiftStudentBatch,
    updateStudentMilestone,
  } = useApp();

  const student = studentId ? students.find((s) => s.id === studentId) : null;

  // ALL Hooks must be unconditionally called at the top
  const [activeTab, setActiveTab] = useState<"CAREER" | "ATTENDANCE">("CAREER");
  const [isShiftingBatch, setIsShiftingBatch] = useState(false);
  const [targetBatchId, setTargetBatchId] = useState("");
  const [shiftReason, setShiftReason] = useState("");
  const [isEditingMilestone, setIsEditingMilestone] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [milestoneStage, setMilestoneStage] = useState<MilestoneStage>("LANGUAGE_COURSE");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("11:00 AM");
  const [interviewCompany, setInterviewCompany] = useState("");
  const [interviewPlatform, setInterviewPlatform] = useState("Zoom Online");
  const [coeNumber, setCoeNumber] = useState("");
  const [coeResultDate, setCoeResultDate] = useState("");
  const [visaIssueDate, setVisaIssueDate] = useState("");
  const [visaStatusNotes, setVisaStatusNotes] = useState("");

  // Sync form states whenever selected student changes
  useEffect(() => {
    if (student) {
      const ms = student.milestone || { stage: student.milestoneStage || "LANGUAGE_COURSE" };
      setMilestoneStage((ms.stage as MilestoneStage) || (student.milestoneStage as MilestoneStage) || "LANGUAGE_COURSE");
      setInterviewDate(ms.interviewDate || student.interviewDate || "");
      setInterviewTime(ms.interviewTime || student.interviewTime || "11:00 AM");
      setInterviewCompany(ms.interviewCompany || student.interviewCompany || "");
      setInterviewPlatform(ms.interviewPlatform || student.interviewPlatform || "Zoom Online");
      setCoeNumber(ms.coeNumber || student.coeNumber || "");
      setCoeResultDate(ms.coeResultDate || student.coeResultDate || "");
      setVisaIssueDate(ms.visaIssueDate || student.visaIssueDate || "");
      setVisaStatusNotes(ms.visaStatusNotes || student.visaStatusNotes || "");
      setIsEditingMilestone(false);
      setIsShiftingBatch(false);
      setFeedback(null);
    }
  }, [student]);

  if (!studentId || !student) return null;

  const summary = getStudentSummary(studentId);
  const studentRecords = attendances
    .filter((a) => a.studentId === studentId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleBatchShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBatchId) return;

    const success = await shiftStudentBatch(
      studentId,
      targetBatchId,
      shiftReason || "ব্যাচ স্থানান্তর"
    );

    if (success) {
      setFeedback("শিক্ষার্থীকে নতুন ব্যাচে স্থানান্তর করা হয়েছে!");
      setIsShiftingBatch(false);
      setShiftReason("");
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleSaveMilestone = async (e: React.FormEvent) => {
    e.preventDefault();

    await updateStudentMilestone(studentId, {
      stage: milestoneStage,
      interviewDate: interviewDate || undefined,
      interviewTime: interviewTime || undefined,
      interviewCompany: interviewCompany || undefined,
      interviewPlatform: interviewPlatform || undefined,
      coeNumber: coeNumber || undefined,
      coeResultDate: coeResultDate || undefined,
      visaIssueDate: visaIssueDate || undefined,
      visaStatusNotes: visaStatusNotes || undefined,
    });

    setIsEditingMilestone(false);
    setFeedback("ক্যারিয়ার ও ভিসা তথ্য আপডেট করা হয়েছে!");
    setTimeout(() => setFeedback(null), 3000);
  };

  const stageLabels: Record<MilestoneStage, string> = {
    LANGUAGE_COURSE: "ভাষা কোর্স চলমান",
    INTERVIEW_SCHEDULED: "ইন্টারভিউ নির্ধারিত (Interview Scheduled)",
    INTERVIEW_PASSED: "ইন্টারভিউ পাস (Passed)",
    COE_PROCESSING: "COE প্রসেসিং",
    COE_APPROVED: "COE অনুমোদিত (Approved)",
    VISA_PROCESSING: "ভিসা আবেদন জমা",
    VISA_APPROVED: "ভিসা অনুমোদিত (Visa Approved)",
    FLIGHT_READY: "ফ্লাইট কনফার্ম (Flight Ready)",
    REJECTED: "প্রত্যাখ্যাত",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-lg bg-white h-full shadow-xl overflow-y-auto flex flex-col border-l border-slate-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 bg-white sticky top-0 z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                #{student.studentIdCode}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  student.status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {student.status === "ACTIVE" ? "নিয়মিত শিক্ষার্থী" : "নিষ্ক্রিয়"}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{student.name}</h2>
            <p className="text-xs text-slate-500 font-medium">
              বর্তমান ব্যাচ: <strong className="text-slate-800">{student.batchName || "অ্যাসাইন নেই"}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="m-5 mb-0 p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {feedback}
          </div>
        )}

        {/* Quick Actions Bar */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-2 text-xs">
          {student.guardianNumber && (
            <a
              href={`tel:${student.guardianNumber}`}
              className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              অভিভাবককে কল ({student.guardianNumber})
            </a>
          )}

          {student.mobileNumber && (
            <a
              href={`tel:${student.mobileNumber}`}
              className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
            >
              <Phone className="w-3.5 h-3.5" />
              শিক্ষার্থীকে কল
            </a>
          )}

          <button
            type="button"
            onClick={() => setShowCertModal(true)}
            className="px-3 py-2 rounded-lg bg-[#FFF4EE] text-[#F26622] hover:bg-[#FED7AA]/40 font-bold flex items-center gap-1.5 transition-colors border border-[#FED7AA]"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            অফিসিয়াল হাজিরা সনদপত্র (PDF)
          </button>

          <button
            type="button"
            onClick={() => setIsShiftingBatch(!isShiftingBatch)}
            className="px-3 py-2 rounded-lg bg-[#F7F2FA] text-[#662C90] hover:bg-[#E9D8FD] font-bold flex items-center gap-1.5 transition-colors border border-[#E9D8FD]"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            ব্যাচ স্থানান্তর (Shift)
          </button>
        </div>

        {/* Batch Shift Dropdown Panel */}
        {isShiftingBatch && (
          <form
            onSubmit={handleBatchShift}
            className="m-5 p-4 rounded-xl border border-[#662C90]/30 bg-[#F7F2FA]/40 space-y-3 text-xs"
          >
            <div className="flex items-center justify-between border-b border-[#662C90]/10 pb-2">
              <span className="font-bold text-[#662C90] flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5" />
                শিক্ষার্থীকে অন্য ব্যাচে স্থানান্তর করুন
              </span>
              <button
                type="button"
                onClick={() => setIsShiftingBatch(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                নতুন ব্যাচ নির্বাচন করুন *
              </label>
              <select
                required
                value={targetBatchId}
                onChange={(e) => setTargetBatchId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:border-[#662C90]"
              >
                <option value="">-- ব্যাচ বাছাই করুন --</option>
                <optgroup label="চলমান ব্যাচসমূহ (Running Batches)">
                  {batches
                    .filter((b) => b.id !== student.batchId && b.status === "RUNNING")
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.scheduleDays})
                      </option>
                    ))}
                </optgroup>
                <optgroup label="সম্পন্ন ব্যাচসমূহ (Completed Batches)">
                  {batches
                    .filter((b) => b.id !== student.batchId && b.status === "COMPLETED")
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.scheduleDays})
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                স্থানান্তরের কারণ (Reason for Transfer)
              </label>
              <input
                type="text"
                placeholder="যেমন: টাইমিং সমস্যা, লেভেল আপগ্রেড ইত্যাদি..."
                value={shiftReason}
                onChange={(e) => setShiftReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#662C90]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsShiftingBatch(false)}
                className="px-3 py-1.5 rounded-lg font-bold text-slate-600 hover:bg-slate-100"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg font-bold bg-[#662C90] text-white hover:bg-[#532376] shadow-sm"
              >
                স্থানান্তর নিশ্চিত করুন
              </button>
            </div>
          </form>
        )}

        {/* Batch Shift History Log */}
        {student.batchHistory && student.batchHistory.length > 0 && (
          <div className="mx-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px] uppercase tracking-wide">
              <History className="w-3.5 h-3.5 text-slate-400" />
              ব্যাচ স্থানান্তরের পূর্ববর্তী রেকর্ড:
            </span>
            <div className="space-y-1">
              {student.batchHistory.map((h, i) => (
                <div key={i} className="text-slate-600 text-[11px]">
                  • <strong>{h.fromBatch || h.fromBatchName || "N/A"}</strong> ➔ <strong>{h.toBatch || h.toBatchName}</strong> ({h.date}) — <em>{h.reason}</em>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attendance KPI Summary */}
        <div className="p-5 border-b border-slate-100">
          <span className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
            হাজিরা অগ্রগতি সারসংক্ষেপ
          </span>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-[10px] text-slate-500 font-semibold">মোট ক্লাস</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {summary?.totalClasses || 0}
              </p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
              <p className="text-[10px] text-emerald-700 font-semibold">উপস্থিত</p>
              <p className="text-base font-bold text-emerald-800 mt-0.5">
                {summary?.presentCount || 0}
              </p>
            </div>
            <div className="bg-rose-50 p-3 rounded-lg border border-rose-100">
              <p className="text-[10px] text-rose-700 font-semibold">অনুপস্থিত</p>
              <p className="text-base font-bold text-rose-800 mt-0.5">
                {summary?.absentCount || 0}
              </p>
            </div>
            <div className="bg-[#FFF4EE] p-3 rounded-lg border border-[#FED7AA]">
              <p className="text-[10px] text-[#F26622] font-semibold">শতাংশ</p>
              <p className="text-base font-bold text-[#F26622] mt-0.5">
                {summary?.attendancePercentage || 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white sticky top-[80px] z-10 px-5 gap-4">
          <button
            onClick={() => setActiveTab("CAREER")}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "CAREER"
                ? "border-[#F26622] text-[#F26622]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            ক্যারিয়ার, ইন্টারভিউ ও ভিসা ট্র্যাকিং
          </button>
          <button
            onClick={() => setActiveTab("ATTENDANCE")}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "ATTENDANCE"
                ? "border-[#662C90] text-[#662C90]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Calendar className="w-4 h-4" />
            পূর্বের হাজিরার ইতিহাস
          </button>
        </div>

        {/* Tab 1: Career, Interview & Visa Tracking */}
        {activeTab === "CAREER" && (
          <div className="p-5 space-y-5 flex-1 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-700 uppercase tracking-wide">
                ক্যারিয়ার মাইলস্টোন পর্যায়
              </span>
              <button
                type="button"
                onClick={() => setIsEditingMilestone(!isEditingMilestone)}
                className="font-bold text-[#F26622] hover:text-[#D95314] flex items-center gap-1"
              >
                <Edit className="w-3.5 h-3.5" />
                {isEditingMilestone ? "বাতিল" : "তথ্য এডিট করুন"}
              </button>
            </div>

            {/* Stage Badge Visualizer */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <p className="text-[11px] text-slate-500 font-medium">বর্তমান স্ট্যাটাস:</p>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F26622] animate-pulse" />
                <h3 className="font-bold text-sm text-slate-900">
                  {stageLabels[milestoneStage] || milestoneStage}
                </h3>
              </div>
            </div>

            {isEditingMilestone ? (
              /* Edit Form */
              <form onSubmit={handleSaveMilestone} className="space-y-4 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    মাইলস্টোন স্টেজ পরিবর্তন করুন
                  </label>
                  <select
                    value={milestoneStage}
                    onChange={(e) => setMilestoneStage(e.target.value as MilestoneStage)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:border-[#F26622]"
                  >
                    {Object.entries(stageLabels).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wide block">
                    ইন্টারভিউ তথ্য (Interview Details)
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        ইন্টারভিউ তারিখ
                      </label>
                      <input
                        type="date"
                        value={interviewDate}
                        onChange={(e) => setInterviewDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        সময়
                      </label>
                      <input
                        type="text"
                        placeholder="11:30 AM"
                        value={interviewTime}
                        onChange={(e) => setInterviewTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      কোম্পানি / প্রতিষ্ঠানের নাম
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: Tokyo Care Support Co., Ltd."
                      value={interviewCompany}
                      onChange={(e) => setInterviewCompany(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      প্ল্যাটফর্ম / মাধ্যম
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: Zoom / Google Meet / সরাসরি অফিস"
                      value={interviewPlatform}
                      onChange={(e) => setInterviewPlatform(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wide block">
                    COE ও ভিসা তথ্য (COE & Visa Status)
                  </span>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      COE নম্বর / রেফারেন্স
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: COE-2026-TK890"
                      value={coeNumber}
                      onChange={(e) => setCoeNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        COE ফলাফল তারিখ
                      </label>
                      <input
                        type="date"
                        value={coeResultDate}
                        onChange={(e) => setCoeResultDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        ভিসা ইস্যু তারিখ
                      </label>
                      <input
                        type="date"
                        value={visaIssueDate}
                        onChange={(e) => setVisaIssueDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      ভিসা ও ট্র্যাকিং নোট
                    </label>
                    <textarea
                      rows={2}
                      placeholder="ভিসা স্ট্যাটাস বা ফ্লাইট সম্পর্কিত অতিরিক্ত নোট..."
                      value={visaStatusNotes}
                      onChange={(e) => setVisaStatusNotes(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingMilestone(false)}
                    className="px-4 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-100"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg font-bold bg-[#F26622] hover:bg-[#D95314] text-white shadow-sm flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    তথ্য সংরক্ষণ করুন
                  </button>
                </div>
              </form>
            ) : (
              /* View Only Mode */
              <div className="space-y-4">
                {interviewDate && (
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                    <span className="text-[11px] font-bold text-[#F26622] uppercase tracking-wide block">
                      নির্ধারিত ইন্টারভিউ তথ্য
                    </span>
                    <div className="space-y-1 text-slate-700">
                      <p>
                        <strong>কোম্পানি:</strong> {interviewCompany || "অ্যাসাইন হয়নি"}
                      </p>
                      <p>
                        <strong>তারিখ ও সময়:</strong> {interviewDate} • {interviewTime}
                      </p>
                      <p>
                        <strong>প্ল্যাটফর্ম:</strong> {interviewPlatform}
                      </p>
                    </div>
                  </div>
                )}

                {(coeNumber || coeResultDate || visaIssueDate || visaStatusNotes) && (
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                    <span className="text-[11px] font-bold text-[#662C90] uppercase tracking-wide block">
                      COE ও ভিসা বিবরণ
                    </span>
                    <div className="space-y-1 text-slate-700">
                      {coeNumber && (
                        <p>
                          <strong>COE নম্বর:</strong> {coeNumber}
                        </p>
                      )}
                      {coeResultDate && (
                        <p>
                          <strong>COE ফলাফল:</strong> {coeResultDate}
                        </p>
                      )}
                      {visaIssueDate && (
                        <p>
                          <strong>ভিসা ইস্যু:</strong> {visaIssueDate}
                        </p>
                      )}
                      {visaStatusNotes && (
                        <p className="italic text-slate-500 pt-1">"{visaStatusNotes}"</p>
                      )}
                    </div>
                  </div>
                )}

                {!interviewDate && !coeNumber && (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                    <p className="text-slate-500 font-medium">
                      কোনো ইন্টারভিউ বা ভিসা শিডিউল এখনো যোগ করা হয়নি।
                    </p>
                    <button
                      onClick={() => setIsEditingMilestone(true)}
                      className="px-4 py-1.5 rounded-lg bg-[#F26622] text-white font-bold text-xs"
                    >
                      + ইন্টারভিউ / ভিসা শিডিউল যুক্ত করুন
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Attendance History */}
        {activeTab === "ATTENDANCE" && (
          <div className="p-5 space-y-3 flex-1 overflow-y-auto text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wide block">
              সাম্প্রতিক ক্লাসের হাজিরার লগ ({studentRecords.length}টি রেকর্ড)
            </span>

            <div className="divide-y divide-slate-100">
              {studentRecords.length > 0 ? (
                studentRecords.map((rec) => (
                  <div key={rec.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800">
                        {rec.date} ({rec.dayName || "Class"})
                      </span>
                      {rec.note && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">
                          নোট: "{rec.note}"
                        </p>
                      )}
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded font-bold text-[11px] border ${
                        rec.status === "PRESENT"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : rec.status === "ABSENT"
                          ? "bg-rose-50 text-rose-800 border-rose-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {rec.status === "PRESENT"
                        ? "উপস্থিত"
                        : rec.status === "ABSENT"
                        ? "অনুপস্থিত"
                        : "ছুটি / পরিবর্তিত"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 py-6 text-center">
                  এই শিক্ষার্থীর কোনো পূর্ববর্তী হাজিরার ডাটা পাওয়া যায়নি।
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Official Japanese Embassy Standard Attendance Certificate Modal */}
      {showCertModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 my-8">
            {/* Print Friendly Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#662C90] text-white flex items-center justify-center font-black text-xl shadow-sm">
                  MJLI
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    MASSIVE JAPAN LANGUAGE INSTITUTE
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    日本語研修センター • JAPANESE LANGUAGE TRAINING CENTER
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-[#F26622] hover:bg-[#D95314] text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5"
                >
                  🖨️ প্রিন্ট / PDF সংরক্ষণ
                </button>
                <button
                  type="button"
                  onClick={() => setShowCertModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Certificate Title */}
            <div className="text-center py-2 space-y-1">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide border-b-2 border-slate-900 inline-block pb-1">
                ATTENDANCE CERTIFICATE / 出席証明書
              </h2>
              <p className="text-xs text-slate-500">
                Official Course Attendance & Career Progression Record
              </p>
            </div>

            {/* Student Info Box */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Student Name</span>
                <strong className="text-slate-900 text-sm">{student.name}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Student ID Code</span>
                <strong className="font-mono text-slate-900 text-sm">#{student.studentIdCode}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Batch</span>
                <strong className="text-slate-800">{student.batchName || "N/A"}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Number</span>
                <strong className="text-slate-800">{student.mobileNumber || "N/A"}</strong>
              </div>
            </div>

            {/* Attendance Performance Grid */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Total Classes</span>
                <span className="text-lg font-black text-slate-800">{summary?.totalClasses || 0}</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-700 block uppercase">Present Days</span>
                <span className="text-lg font-black text-emerald-700">{summary?.presentCount || 0}</span>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
                <span className="text-[10px] font-bold text-rose-700 block uppercase">Absent Days</span>
                <span className="text-lg font-black text-rose-700">{summary?.absentCount || 0}</span>
              </div>
              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200">
                <span className="text-[10px] font-bold text-[#662C90] block uppercase">Attendance Rate</span>
                <span className="text-lg font-black text-[#662C90]">{summary?.attendancePercentage || 100}%</span>
              </div>
            </div>

            {/* Career & Visa Status */}
            <div className="p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                Current Career Milestone & Visa Stage
              </span>
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#662C90] text-sm">
                  {stageLabels[milestoneStage] || "ভাষা কোর্স চলমান"}
                </span>
                {student.milestone?.coeNumber && (
                  <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    COE: {student.milestone.coeNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Official Verification Signatures */}
            <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-center">
              <div className="space-y-1">
                <div className="h-10 border-b border-dashed border-slate-300 w-3/4 mx-auto" />
                <p className="font-bold text-slate-700">Lead Japanese Instructor</p>
                <p className="text-[10px] text-slate-400">Massive Japan Language Institute</p>
              </div>
              <div className="space-y-1">
                <div className="h-10 border-b border-dashed border-slate-300 w-3/4 mx-auto" />
                <p className="font-bold text-slate-700">Director / Academic Seal</p>
                <p className="text-[10px] text-slate-400">Authorized Signature & Stamp</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
