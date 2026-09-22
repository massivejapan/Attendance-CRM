"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  MilestoneStage,
  StudentMilestone,
  StudentDocumentItem,
  STANDARD_VISA_DOCUMENTS,
} from "@/types";
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
  Printer,
  FileCheck,
  FileText,
  AlertCircle,
  Check,
  User,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import {
  openWhatsApp,
  getWhatsAppAbsentNotice,
  getWhatsAppGeneralMsg,
  formatDate,
} from "@/lib/utils";

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
    updateStudentDocuments,
    currentUser,
  } = useApp();

  const student = studentId ? students.find((s) => s.id === studentId) : null;

  // Tabs
  const [activeTab, setActiveTab] = useState<"DOCUMENTS" | "CAREER" | "ATTENDANCE">("DOCUMENTS");
  const [isShiftingBatch, setIsShiftingBatch] = useState(false);
  const [targetBatchId, setTargetBatchId] = useState("");
  const [shiftReason, setShiftReason] = useState("");
  const [isEditingMilestone, setIsEditingMilestone] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showPrintSummaryModal, setShowPrintSummaryModal] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Career form states
  const [milestoneStage, setMilestoneStage] = useState<MilestoneStage>("LANGUAGE_COURSE");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("11:00 AM");
  const [interviewCompany, setInterviewCompany] = useState("");
  const [interviewPlatform, setInterviewPlatform] = useState("Zoom Online");
  const [coeNumber, setCoeNumber] = useState("");
  const [coeResultDate, setCoeResultDate] = useState("");
  const [visaIssueDate, setVisaIssueDate] = useState("");
  const [visaStatusNotes, setVisaStatusNotes] = useState("");

  // Documents Checklist State (Record<docId, StudentDocumentItem>)
  const [docMap, setDocMap] = useState<Record<string, StudentDocumentItem>>({});
  const [isSavingDocs, setIsSavingDocs] = useState(false);

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

      // Initialize Documents Checklist from student.documents or defaults
      const existingDocs = student.documents || {};
      const initialized: Record<string, StudentDocumentItem> = {};

      STANDARD_VISA_DOCUMENTS.forEach((doc) => {
        if (existingDocs[doc.id]) {
          initialized[doc.id] = {
            ...existingDocs[doc.id],
            title: doc.title,
          };
        } else {
          initialized[doc.id] = {
            id: doc.id,
            title: doc.title,
            isSubmitted: false,
            receivedDate: undefined,
            receivedBy: undefined,
            status: "PENDING",
            note: "",
          };
        }
      });

      setDocMap(initialized);
    }
  }, [student]);

  if (!studentId || !student) return null;

  const summary = getStudentSummary(studentId);
  const studentRecords = attendances
    .filter((a) => a.studentId === studentId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Document Toggle Handler with Auto Date
  const handleToggleDoc = (docId: string, currentChecked: boolean) => {
    const today = new Date().toISOString().split("T")[0];
    const newChecked = !currentChecked;

    setDocMap((prev) => {
      const current = prev[docId];
      return {
        ...prev,
        [docId]: {
          ...current,
          isSubmitted: newChecked,
          receivedDate: newChecked ? current?.receivedDate || today : undefined,
          receivedBy: newChecked ? current?.receivedBy || currentUser?.name || currentUser?.username || "" : undefined,
          status: newChecked ? (current?.status === "CORRECTION_NEEDED" ? "CORRECTION_NEEDED" : "OK") : "PENDING",
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  const handleDocFieldChange = (
    docId: string,
    field: "receivedDate" | "receivedBy" | "status" | "note",
    value: any
  ) => {
    setDocMap((prev) => {
      const current = prev[docId];
      return {
        ...prev,
        [docId]: {
          ...current,
          [field]: value,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  const handleSaveDocuments = async () => {
    setIsSavingDocs(true);
    const success = await updateStudentDocuments(student.id, docMap);
    setIsSavingDocs(false);
    if (success) {
      setFeedback("✓ ডকুমেন্টস চেকলিস্ট ও নোট সফলভাবে সংরক্ষিত হয়েছে!");
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback("ডকুমেন্টস সংরক্ষণ করতে সমস্যা হয়েছে!");
      setTimeout(() => setFeedback(null), 3500);
    }
  };

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

  // Document Stats
  const totalDocsCount = STANDARD_VISA_DOCUMENTS.length;
  const submittedDocsCount = Object.values(docMap).filter((d) => d.isSubmitted).length;
  const correctionNeededCount = Object.values(docMap).filter((d) => d.status === "CORRECTION_NEEDED").length;
  const docProgressPct = Math.round((submittedDocsCount / totalDocsCount) * 100);

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
        <div className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-200 bg-white sticky top-0 z-20 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                  #{student.studentIdCode}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    student.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {student.status === "ACTIVE" ? "সক্রিয় শিক্ষার্থী" : "নিষ্ক্রিয়"}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-[#662C90] border border-purple-200">
                  {student.batchName || "ব্যাচ নির্ধারিত নেই"}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">{student.name}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPrintSummaryModal(true)}
                title="প্রোফাইল ও রিপোর্ট সামারি প্রিন্ট করুন"
                className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#662C90] font-bold text-xs flex items-center gap-1.5 border border-purple-200 shadow-2xs"
              >
                <Printer className="w-4 h-4" />
                <span>প্রিন্ট সামারি</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Feedback Alert */}
          {feedback && (
            <div className="m-5 mb-0 p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {feedback}
            </div>
          )}

          {/* Quick Actions Bar */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-2 text-xs">
            {student.guardianNumber && (
              <>
                <a
                  href={`tel:${student.guardianNumber}`}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  অভিভাবক: {student.guardianNumber}
                </a>

                <button
                  type="button"
                  onClick={() =>
                    openWhatsApp(
                      student.guardianNumber,
                      summary && summary.consecutiveAbsents > 0
                        ? getWhatsAppAbsentNotice(
                            student.name,
                            student.batchName,
                            summary.consecutiveAbsents
                          )
                        : getWhatsAppGeneralMsg(student.name, student.batchName)
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1.5 border border-emerald-300 shadow-2xs transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  অভিভাবক WhatsApp
                </button>
              </>
            )}

            {student.mobileNumber && (
              <>
                <a
                  href={`tel:${student.mobileNumber}`}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
                >
                  <Phone className="w-3.5 h-3.5" />
                  শিক্ষার্থী: {student.mobileNumber}
                </a>
                <button
                  type="button"
                  onClick={() =>
                    openWhatsApp(
                      student.mobileNumber,
                      getWhatsAppGeneralMsg(student.name, student.batchName)
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  WhatsApp
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setIsShiftingBatch(!isShiftingBatch)}
              className="px-3 py-1.5 rounded-lg bg-[#F7F2FA] text-[#662C90] hover:bg-[#E9D8FD] font-bold flex items-center gap-1.5 transition-colors border border-[#E9D8FD]"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              ব্যাচ স্থানান্তর
            </button>
          </div>

          {/* Batch Shift Panel */}
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
                <label className="block text-slate-700 font-bold mb-1">
                  নতুন ব্যাচ নির্বাচন করুন:
                </label>
                <select
                  value={targetBatchId}
                  onChange={(e) => setTargetBatchId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">-- ব্যাচ সিলেক্ট করুন --</option>
                  {batches
                    .filter((b) => b.id !== student.batchId)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.scheduleDays} • {b.timeSlot})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  স্থানান্তরের কারণ:
                </label>
                <input
                  type="text"
                  placeholder="যেমন: টাইমিং সমস্যা / প্র্যাকটিক্যাল শিডিউল"
                  value={shiftReason}
                  onChange={(e) => setShiftReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsShiftingBatch(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#662C90] text-white font-bold"
                >
                  স্থানান্তর নিশ্চিত করুন
                </button>
              </div>
            </form>
          )}

          {/* KPI Attendance Highlight Box */}
          <div className="p-5 pb-3">
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">উপস্থিতির হার</span>
                <p
                  className={`text-lg font-black mt-0.5 ${
                    summary && summary.attendancePercentage >= 75
                      ? "text-emerald-700"
                      : "text-rose-600"
                  }`}
                >
                  {summary ? `${summary.attendancePercentage}%` : "0%"}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold">
                  {summary?.presentCount}/{summary?.totalClasses} ক্লাস
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">টানা অনুপস্থিত</span>
                <p
                  className={`text-lg font-black mt-0.5 ${
                    summary && summary.consecutiveAbsents > 0 ? "text-rose-600" : "text-emerald-700"
                  }`}
                >
                  {summary?.consecutiveAbsents || 0} দিন
                </p>
                <p className="text-[10px] text-slate-500 font-semibold">
                  {summary && summary.consecutiveAbsents >= 2 ? "⚠️ সতর্কবার্তা" : "স্বাভাবিক"}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">ভিসা ডকুমেন্টস</span>
                <p className="text-lg font-black text-[#662C90] mt-0.5">
                  {submittedDocsCount}/{totalDocsCount}
                </p>
                <p className="text-[10px] text-[#662C90] font-bold">
                  {docProgressPct}% জমা
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-5 border-b border-slate-200 flex gap-2">
            <button
              onClick={() => setActiveTab("DOCUMENTS")}
              className={`py-2.5 px-3 border-b-2 font-black text-xs transition-colors flex items-center gap-1.5 ${
                activeTab === "DOCUMENTS"
                  ? "border-[#662C90] text-[#662C90]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>ভিসা ডকুমেন্টস চেকলিস্ট ({submittedDocsCount}/{totalDocsCount})</span>
            </button>

            <button
              onClick={() => setActiveTab("CAREER")}
              className={`py-2.5 px-3 border-b-2 font-black text-xs transition-colors flex items-center gap-1.5 ${
                activeTab === "CAREER"
                  ? "border-[#662C90] text-[#662C90]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>ক্যারিয়ার ও ভিসা স্ট্যাটাস</span>
            </button>

            <button
              onClick={() => setActiveTab("ATTENDANCE")}
              className={`py-2.5 px-3 border-b-2 font-black text-xs transition-colors flex items-center gap-1.5 ${
                activeTab === "ATTENDANCE"
                  ? "border-[#662C90] text-[#662C90]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <History className="w-4 h-4" />
              <span>হাজিরা হিস্ট্রি ({studentRecords.length})</span>
            </button>
          </div>

          {/* TAB 1: DOCUMENTS CHECKLIST */}
          {activeTab === "DOCUMENTS" && (
            <div className="p-5 space-y-4 flex-1">
              {/* Progress Summary Header */}
              <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <h3 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-[#662C90]" />
                      জাপান স্কুল ও ভিসা ডকুমেন্টস চেকলিস্ট
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      টিক দিলে স্বয়ংক্রিয়ভাবে জমা দেওয়ার তারিখ ও রিসিভার সেট হবে। প্রয়োজনে নোট ও সংশোধন স্ট্যাটাস লিখুন।
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveDocuments}
                    disabled={isSavingDocs}
                    className="px-3.5 py-2 rounded-xl bg-[#662C90] hover:bg-[#522375] text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 shrink-0"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSavingDocs ? "সংরক্ষণ হচ্ছে..." : "চেকলিস্ট সেভ করুন"}
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                    <span>ডকুমেন্ট জমা সম্পন্ন: {submittedDocsCount} / {totalDocsCount}টি</span>
                    <span className="text-[#662C90]">{docProgressPct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#662C90] to-[#F26622] h-full transition-all duration-300 rounded-full"
                      style={{ width: `${docProgressPct}%` }}
                    />
                  </div>
                </div>

                {correctionNeededCount > 0 && (
                  <p className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    {correctionNeededCount}টি ডকুমেন্টে সংশোধন প্রয়োজন!
                  </p>
                )}
              </div>

              {/* Document Items List */}
              <div className="space-y-3">
                {STANDARD_VISA_DOCUMENTS.map((doc, idx) => {
                  const item = docMap[doc.id] || {
                    id: doc.id,
                    title: doc.title,
                    isSubmitted: false,
                    status: "PENDING",
                    note: "",
                  };

                  return (
                    <div
                      key={doc.id}
                      className={`p-3.5 rounded-2xl border transition-all text-xs space-y-2.5 ${
                        item.isSubmitted
                          ? item.status === "CORRECTION_NEEDED"
                            ? "bg-amber-50/40 border-amber-300"
                            : "bg-emerald-50/30 border-emerald-200"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {/* Top Row: Checkbox, Title, Status */}
                      <div className="flex items-start justify-between gap-3">
                        <label className="flex items-start gap-2.5 cursor-pointer select-none flex-1">
                          <input
                            type="checkbox"
                            checked={item.isSubmitted}
                            onChange={() => handleToggleDoc(doc.id, item.isSubmitted)}
                            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#662C90] focus:ring-[#662C90]"
                          />
                          <div>
                            <span className="font-extrabold text-slate-900 block leading-tight">
                              {idx + 1}. {doc.title}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              ক্যাটাগরি: {doc.category}
                            </span>
                          </div>
                        </label>

                        {/* Status Select */}
                        {item.isSubmitted && (
                          <select
                            value={item.status || "OK"}
                            onChange={(e) =>
                              handleDocFieldChange(doc.id, "status", e.target.value)
                            }
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg border outline-none ${
                              item.status === "CORRECTION_NEEDED"
                                ? "bg-amber-100 text-amber-900 border-amber-300 font-black"
                                : "bg-emerald-100 text-emerald-900 border-emerald-300"
                            }`}
                          >
                            <option value="OK">✓ সঠিক আছে (OK)</option>
                            <option value="CORRECTION_NEEDED">⚠️ সংশোধন প্রয়োজন</option>
                            <option value="PENDING">বাকি (Pending)</option>
                          </select>
                        )}
                      </div>

                      {/* Detail Fields when Checked */}
                      {item.isSubmitted && (
                        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <label className="text-slate-500 font-semibold block mb-0.5">
                              জমার তারিখ (Date):
                            </label>
                            <input
                              type="date"
                              value={item.receivedDate || ""}
                              onChange={(e) =>
                                handleDocFieldChange(doc.id, "receivedDate", e.target.value)
                              }
                              className="w-full px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-slate-500 font-semibold block mb-0.5">
                              রিসিভ করেছেন কে (Received By):
                            </label>
                            <input
                              type="text"
                              placeholder="রিসিভারের নাম লিখুন..."
                              value={item.receivedBy || ""}
                              onChange={(e) =>
                                handleDocFieldChange(doc.id, "receivedBy", e.target.value)
                              }
                              className="w-full px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs"
                            />
                          </div>

                          {/* Editable Correction Note */}
                          <div className="sm:col-span-2">
                            <label className="text-slate-500 font-semibold block mb-0.5">
                              নোট / সংশোধনের বিবরণ (Editable Correction Note):
                            </label>
                            <input
                              type="text"
                              placeholder="যেমন: নামের বানান ভুল আছে, নতুন অনুবাদ কপি জমা দিতে হবে..."
                              value={item.note || ""}
                              onChange={(e) =>
                                handleDocFieldChange(doc.id, "note", e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 font-medium"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Sticky Save Button */}
              <div className="pt-4 border-t border-slate-200 flex justify-end sticky bottom-0 bg-white/95 backdrop-blur-xs py-3">
                <button
                  type="button"
                  onClick={handleSaveDocuments}
                  disabled={isSavingDocs}
                  className="px-6 py-2.5 rounded-xl bg-[#662C90] hover:bg-[#522375] text-white font-extrabold text-xs shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSavingDocs ? "সংরক্ষণ হচ্ছে..." : "সকল ডকুমেন্টস চেকলিস্ট সংরক্ষণ করুন"}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CAREER & VISA MILESTONE */}
          {activeTab === "CAREER" && (
            <div className="p-5 space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  জাপান ক্যারিয়ার ও প্রসেসিং স্ট্যাটাস
                </h3>
                {!isEditingMilestone && (
                  <button
                    type="button"
                    onClick={() => setIsEditingMilestone(true)}
                    className="text-xs font-bold text-[#662C90] hover:underline flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    স্ট্যাটাস এডিট করুন
                  </button>
                )}
              </div>

              {isEditingMilestone ? (
                <form onSubmit={handleSaveMilestone} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      বর্তমান মাইলস্টোন স্টেজ (Current Stage) *
                    </label>
                    <select
                      value={milestoneStage}
                      onChange={(e) => setMilestoneStage(e.target.value as MilestoneStage)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-[#662C90]"
                    >
                      {Object.entries(stageLabels).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        ইন্টারভিউ তারিখ (Date)
                      </label>
                      <input
                        type="date"
                        value={interviewDate}
                        onChange={(e) => setInterviewDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        ইন্টারভিউ সময় (Time)
                      </label>
                      <input
                        type="text"
                        placeholder="11:00 AM"
                        value={interviewTime}
                        onChange={(e) => setInterviewTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        জাপানি কোম্পানি / স্কুল নাম
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: Tokyo Care Support Co."
                        value={interviewCompany}
                        onChange={(e) => setInterviewCompany(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        ইন্টারভিউ প্ল্যাটফর্ম
                      </label>
                      <input
                        type="text"
                        placeholder="Zoom / Teams / Physical"
                        value={interviewPlatform}
                        onChange={(e) => setInterviewPlatform(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        COE নম্বর (যদি থাকে)
                      </label>
                      <input
                        type="text"
                        placeholder="COE-2026-XXXX"
                        value={coeNumber}
                        onChange={(e) => setCoeNumber(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        COE রেজাল্ট তারিখ
                      </label>
                      <input
                        type="date"
                        value={coeResultDate}
                        onChange={(e) => setCoeResultDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ভিসা ও স্পনসর নোট (Notes):
                    </label>
                    <textarea
                      rows={2}
                      placeholder="অতিরিক্ত তথ্য..."
                      value={visaStatusNotes}
                      onChange={(e) => setVisaStatusNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingMilestone(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#662C90] text-white font-bold shadow-sm"
                    >
                      সংরক্ষণ করুন
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-1">
                    <span className="text-[10px] font-bold text-purple-700 uppercase">বর্তমান পর্যায়</span>
                    <p className="text-sm font-black text-[#662C90]">
                      {stageLabels[milestoneStage] || milestoneStage}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <h4 className="font-extrabold text-slate-900 border-b border-slate-200 pb-1.5">
                      ইন্টারভিউ ও প্রসেসিং তথ্য
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">কোম্পানি:</span>
                        <strong className="text-slate-800">{interviewCompany || "নির্ধারিত হয়নি"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">তারিখ ও সময়:</span>
                        <strong className="text-slate-800">
                          {interviewDate ? `${interviewDate} (${interviewTime})` : "শীঘ্রই"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">প্ল্যাটফর্ম:</span>
                        <strong className="text-slate-800">{interviewPlatform || "Online"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">COE স্ট্যাটাস:</span>
                        <strong className="text-slate-800">{coeNumber || "প্রসেসিংয়ে রয়েছে"}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ATTENDANCE HISTORY */}
          {activeTab === "ATTENDANCE" && (
            <div className="p-5 space-y-3 flex-1">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                বিগত ক্লাসের উপস্থিতি রেকর্ড ({studentRecords.length}টি ক্লাস)
              </h3>

              <div className="divide-y divide-slate-100 text-xs">
                {studentRecords.length > 0 ? (
                  studentRecords.map((rec) => (
                    <div key={rec.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{formatDate(rec.date)}</p>
                        {rec.note && <p className="text-[11px] text-slate-500 italic">"{rec.note}"</p>}
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          rec.status === "PRESENT"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : rec.status === "ABSENT"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {rec.status === "PRESENT" ? "উপস্থিত (P)" : rec.status === "ABSENT" ? "অনুপস্থিত (A)" : "ছুটি (E)"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-6 text-slate-400">কোনো রেকর্ড পাওয়া যায়নি।</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PRINTABLE OFFICIAL STUDENT PROFILE SUMMARY REPORT MODAL */}
      {showPrintSummaryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto space-y-6 print:p-0 print:border-none print:shadow-none">
            {/* Print Header Bar (Hidden in Print) */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#662C90]" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  অফিসিয়াল শিক্ষার্থী প্রোফাইল ও ডকুমেন্টস সামারি রিপোর্ট
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-[#662C90] hover:bg-[#522375] text-white font-extrabold text-xs shadow-md flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  প্রিন্ট করুন (Print Report)
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintSummaryModal(false)}
                  className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Document Sheet Content */}
            <div className="p-6 border border-slate-200 rounded-2xl bg-white space-y-6 print:border-none print:p-0">
              {/* Institution Header */}
              <div className="text-center border-b-2 border-slate-800 pb-4">
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  <span className="text-[#F26622]">MASSIVE</span>{" "}
                  <span className="text-[#662C90]">JAPAN LANGUAGE INSTITUTE</span>
                </h1>
                <p className="text-xs font-semibold text-slate-600">
                  স্মার্ট অ্যাকাডেমিক হাজিরা, ক্যারিয়ার ও ভিসা ডকুমেন্টস ট্র্যাকিং সামারি
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  তারিখ: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>

              {/* Student Personal Info Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block">শিক্ষার্থীর নাম:</span>
                  <strong className="text-slate-900 text-sm font-black">{student.name}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">স্টুডেন্ট আইডি:</span>
                  <strong className="text-[#662C90] font-mono text-sm font-bold">#{student.studentIdCode}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">ব্যাচ ও শিডিউল:</span>
                  <strong className="text-slate-800">{student.batchName || "N/A"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">স্ট্যাটাস:</span>
                  <strong className="text-emerald-700">{student.status === "ACTIVE" ? "সক্রিয় শিক্ষার্থী" : "নিষ্ক্রিয়"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">শিক্ষার্থীর ফোন:</span>
                  <strong className="text-slate-800 font-mono">{student.mobileNumber || "N/A"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">অভিভাবকের ফোন:</span>
                  <strong className="text-slate-800 font-mono">{student.guardianNumber || "N/A"}</strong>
                </div>
              </div>

              {/* Attendance & Milestone Summary */}
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">উপস্থিতির হার</span>
                  <p className="text-lg font-black text-emerald-700 mt-1">{summary?.attendancePercentage}%</p>
                  <p className="text-[10px] text-slate-500">মোট উপস্থিত: {summary?.presentCount}/{summary?.totalClasses} দিন</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">টানা অনুপস্থিতি</span>
                  <p className="text-lg font-black text-slate-800 mt-1">{summary?.consecutiveAbsents || 0} দিন</p>
                  <p className="text-[10px] text-slate-500">বর্তমান অবস্থা</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">ভিসা মাইলস্টোন</span>
                  <p className="text-sm font-black text-[#662C90] mt-1">{stageLabels[milestoneStage] || milestoneStage}</p>
                </div>
              </div>

              {/* Complete Visa Documents Checklist Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase">
                    জাপান ভিসা ও COE ডকুমেন্টস চেকলিস্ট রিপোর্ট ({submittedDocsCount}/{totalDocsCount} জমা)
                  </h3>
                </div>

                <table className="w-full text-left border-collapse border border-slate-200 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase border-b border-slate-200">
                      <th className="p-2 border-r border-slate-200 text-center w-8">নং</th>
                      <th className="p-2 border-r border-slate-200">ডকুমেন্টের বিবরণ</th>
                      <th className="p-2 border-r border-slate-200 text-center w-24">জমা অবস্থা</th>
                      <th className="p-2 border-r border-slate-200 text-center w-28">তারিখ ও রিসিভার</th>
                      <th className="p-2">সংশোধন ও নোট (Remarks)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {STANDARD_VISA_DOCUMENTS.map((doc, idx) => {
                      const item = docMap[doc.id] || {
                        isSubmitted: false,
                        status: "PENDING",
                        note: "",
                      };

                      return (
                        <tr key={doc.id} className={item.isSubmitted ? "bg-white" : "bg-slate-50/50"}>
                          <td className="p-2 text-center text-slate-400 font-bold border-r border-slate-200">
                            {idx + 1}
                          </td>
                          <td className="p-2 font-bold text-slate-800 border-r border-slate-200">
                            {doc.title}
                          </td>
                          <td className="p-2 text-center border-r border-slate-200">
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                item.isSubmitted
                                  ? item.status === "CORRECTION_NEEDED"
                                    ? "bg-amber-100 text-amber-900"
                                    : "bg-emerald-100 text-emerald-900"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              {item.isSubmitted ? (item.status === "CORRECTION_NEEDED" ? "সংশোধন লাগবে" : "✓ জমা আছে") : "জমা নেই"}
                            </span>
                          </td>
                          <td className="p-2 text-center text-slate-600 border-r border-slate-200 font-mono text-[10px]">
                            {item.isSubmitted ? `${item.receivedDate || "N/A"}${item.receivedBy ? ` (${item.receivedBy})` : ""}` : "-"}
                          </td>
                          <td className="p-2 text-slate-700 italic">
                            {item.note || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Official Seal & Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs text-slate-600">
                <div>
                  <div className="border-t border-slate-400 w-48 mx-auto mb-1 pt-1 font-bold">
                    কাউন্সেলর / প্রস্তুতকারী স্বাক্ষর
                  </div>
                  <p className="text-[10px] text-slate-400">Academic & Visa Officer</p>
                </div>
                <div>
                  <div className="border-t border-slate-400 w-48 mx-auto mb-1 pt-1 font-bold">
                    কর্তৃপক্ষের অনুমোদন ও সিল
                  </div>
                  <p className="text-[10px] text-slate-400">Authorized Signature & Seal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
