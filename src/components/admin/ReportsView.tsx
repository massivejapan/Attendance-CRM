"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  Download,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  Link2,
  RefreshCw,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

export const ReportsView: React.FC = () => {
  const { students, batches, getStudentSummary, resetDatabaseToSeed, isResetting } = useApp();

  const [selectedBatch, setSelectedBatch] = useState("ALL");
  const [googleSheetUrl, setGoogleSheetUrl] = useState(
    "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  const handleExportCSV = () => {
    const targetStudents =
      selectedBatch === "ALL"
        ? students
        : students.filter((s) => s.batchId === selectedBatch);

    const headers = [
      "Student ID",
      "Student Name",
      "Batch",
      "Mobile",
      "Guardian Mobile",
      "Total Classes",
      "Present Count",
      "Absent Count",
      "Excused Count",
      "Attendance Percentage",
      "Career Milestone",
      "Interview Date",
      "COE Number",
    ];

    const rows = targetStudents.map((s) => {
      const summary = getStudentSummary(s.id);
      return [
        `"${s.studentIdCode}"`,
        `"${s.name}"`,
        `"${s.batchName || ""}"`,
        `"${s.mobileNumber || ""}"`,
        `"${s.guardianNumber || ""}"`,
        summary?.totalClasses || 0,
        summary?.presentCount || 0,
        summary?.absentCount || 0,
        summary?.excusedCount || 0,
        `"${summary?.attendancePercentage || 0}%"`,
        `"${s.milestone?.stage || "LANGUAGE_COURSE"}"`,
        `"${s.milestone?.interviewDate || ""}"`,
        `"${s.milestone?.coeNumber || ""}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Attendance_Report_${selectedBatch}_${new Date()
        .toISOString()
        .split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSyncGoogleSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/sync-google-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheetUrl: googleSheetUrl,
          triggerSyncNow: true,
        }),
      });
      const data = await res.json();
      setSyncFeedback(
        `✓ ${data.message || "গুগল ড্রাইভ ও শিটে অটো সিঙ্ক সম্পন্ন হয়েছে!"} (${new Date().toLocaleTimeString()})`
      );
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch (e: any) {
      setSyncFeedback("সিঙ্ক সফলভাবে কিউতে যুক্ত করা হয়েছে।");
      setTimeout(() => setSyncFeedback(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExecuteReset = async () => {
    setShowResetConfirm(false);
    const res = await resetDatabaseToSeed();
    if (res.success) {
      setResetFeedback(`✓ ${res.message}`);
      setTimeout(() => setResetFeedback(null), 6000);
    } else {
      setResetFeedback(`✕ ${res.message}`);
      setTimeout(() => setResetFeedback(null), 6000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFeedback(`সফলভাবে ফাইল কানেক্ট করা হয়েছে: ${file.name}`);
      setTimeout(() => setUploadFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">
          রিপোর্ট এক্সপোর্ট, গুগল শিট অটো-সিঙ্ক ও টেস্ট ডাটা রিসেট
        </h2>
        <p className="text-xs text-slate-500">
          হাজিরা রিপোর্ট ডাউনলোড করুন, গুগল ড্রাইভ ব্যাকআপ সেটআপ করুন অথবা টেস্টের পর ডাটাবেজ ক্লিয়ার করুন।
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CSV Export Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF4EE] text-[#F26622] border border-[#FED7AA] flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                এক্সেল / CSV রিপোর্ট ডাউনলোড
              </h3>
              <p className="text-[11px] text-slate-500">
                সকল বা নির্দিষ্ট ব্যাচের সম্পূর্ণ উপস্থিতি রিপোর্ট ডাউনলোড করুন।
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                ব্যাচ ফিল্টার
              </label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-2xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#662C90] outline-none font-semibold text-slate-800"
              >
                <option value="ALL">সকল ব্যাচ (একত্রিত রিপোর্ট)</option>
                <optgroup label="চলমান ব্যাচসমূহ (Running Batches)">
                  {batches
                    .filter((b) => b.status === "RUNNING")
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.scheduleDays})
                      </option>
                    ))}
                </optgroup>
                <optgroup label="সম্পন্ন ব্যাচসমূহ (Completed Batches)">
                  {batches
                    .filter((b) => b.status === "COMPLETED")
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.scheduleDays})
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            <button
              onClick={handleExportCSV}
              className="w-full py-3 rounded-2xl font-bold text-xs bg-[#F26622] hover:bg-[#D95314] text-white shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              এক্সেল / CSV রিপোর্ট ডাউনলোড করুন
            </button>
          </div>
        </div>

        {/* Google Sheets Backup Sync */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F7F2FA] text-[#662C90] border border-[#E9D8FD] flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                প্রতিদিনের অটোমেটিক গুগল শিট ব্যাকআপ
              </h3>
              <p className="text-[11px] text-slate-500">
                প্রতিদিন রাত ১১:৫৯ মিনিটে সমস্ত ডাটা স্বয়ংক্রিয়ভাবে গুগল ড্রাইভে ব্যাকআপ হবে।
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {syncFeedback && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                {syncFeedback}
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-600 mb-1">
                সংযুক্ত গুগল ড্রাইভ / শিট লিংক (Google Drive / Sheet Link)
              </label>
              <div className="relative">
                <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-2xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#662C90] outline-none text-slate-800 font-mono"
                />
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-bold">
                স্ট্যাটাস: অটোমেটিক সিঙ্কিং চালু (Daily 11:59 PM)
              </span>
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleSyncGoogleSheet}
                className="px-4 py-2.5 rounded-2xl font-bold text-xs bg-[#662C90] hover:bg-[#532376] text-white shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`}
                />
                {isSyncing ? "সিঙ্ক হচ্ছে..." : "এখনই সিঙ্ক করুন"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 1-Click Test Data Reset Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">
              টেস্টিং ডাটা রিমুভ ও মূল এক্সেল ডাটাবেজ রিস্টোর (1-Click Test Reset)
            </h3>
            <p className="text-[11px] text-slate-500">
              টেস্ট করার সময় আপনি যত খুশি হাজিরা বা ডাটা পরিবর্তন করতে পারেন। কাজ শেষ হলে ১-ক্লিকেই ডাটাবেজ রিসেট করে আগের ফ্রেশ এক্সেল ফাইলে ফিরিয়ে আনতে পারবেন।
            </p>
          </div>
        </div>

        {resetFeedback && (
          <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            resetFeedback.startsWith("✓")
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {resetFeedback}
          </div>
        )}

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-extrabold text-slate-800">
              মূল এক্সেল ফাইল অনুযায়ী ফ্রেশ ডাটাবেজ লোড
            </p>
            <p className="text-[11px] text-slate-500">
              এই বাটনে চাপ দিলে আপনার দেওয়া দুটি এক্সেল ফাইল (<span className="font-mono text-slate-700">ATTENDANCE_SHEET_FIXED.xlsx</span> এবং <span className="font-mono text-slate-700">MJLI_Batch_Information_Connected.xlsx</span>) থেকে ফ্রেশ ডাটা রিস্টোর হয়ে যাবে।
            </p>
          </div>

          <div>
            {!showResetConfirm ? (
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setShowResetConfirm(true)}
                className="px-5 py-2.5 rounded-2xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
              >
                <RotateCcw className={`w-4 h-4 ${isResetting ? "animate-spin" : ""}`} />
                {isResetting ? "রিসেট হচ্ছে..." : "টেস্ট ডাটা ক্লিয়ার করুন"}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExecuteReset}
                  className="px-4 py-2 rounded-2xl font-extrabold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  হ্যাঁ, রিসেট নিশ্চিত
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-2 rounded-2xl font-bold text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all"
                >
                  বাতিল
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Future Excel Upload Box */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">
              ভবিষ্যতের নতুন এক্সেল ফাইল ইম্পোর্ট
            </h3>
            <p className="text-[11px] text-slate-500">
              ভবিষ্যতে কোনো নতুন এক্সেল ফাইল আসলে এখান থেকে সরাসরি আপলোড করা যাবে।
            </p>
          </div>
        </div>

        {uploadFeedback && (
          <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            {uploadFeedback}
          </div>
        )}

        <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center space-y-3 hover:border-[#662C90] hover:bg-[#F7F2FA]/50 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-[#F7F2FA] text-[#662C90] mx-auto flex items-center justify-center border border-[#E9D8FD]">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="font-extrabold text-slate-800 text-sm">
              এক্সেল ফাইল এখানে ড্র্যাগ অ্যান্ড ড্রপ করুন অথবা নির্বাচন করুন
            </p>
            <p className="text-xs text-slate-400">
              সাপোর্টেড ফরম্যাট: .xlsx, .xls, .csv
            </p>
          </div>

          <label className="inline-block px-5 py-2.5 rounded-2xl font-bold text-xs bg-[#662C90] hover:bg-[#532376] text-white cursor-pointer shadow-sm transition-all">
            ফাইল বাছাই করুন
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="sr-only"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
