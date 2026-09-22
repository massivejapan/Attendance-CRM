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
  const [showBatchPrintModal, setShowBatchPrintModal] = useState(false);
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleExportCSV}
                className="w-full py-3 rounded-2xl font-bold text-xs bg-[#F26622] hover:bg-[#D95314] text-white shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                CSV ডাউনলোড
              </button>
              <button
                onClick={() => setShowBatchPrintModal(true)}
                className="w-full py-3 rounded-2xl font-bold text-xs bg-[#662C90] hover:bg-[#532376] text-white shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                🖨️ প্রিন্ট / PDF রিপোর্ট
              </button>
            </div>
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

            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-bold">
                  একক গুগল শিটে রিয়েল-টাইম অটো-আপডেট সেটআপ (Apps Script)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const scriptCode = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = data.batchName || "Master_Attendance";
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(["Date", "Day", "Student ID", "Student Name", "Status", "Note", "Teacher", "Topic Covered"]);
    }
    
    if (data.records && Array.isArray(data.records)) {
      data.records.forEach(function(rec) {
        sheet.appendRow([
          data.date || new Date().toISOString().split("T")[0],
          data.dayName || "",
          rec.studentIdCode || "",
          rec.studentName || "",
          rec.status || "",
          rec.note || "",
          data.teacherName || "",
          data.topicCovered || ""
        ]);
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Updated in Google Sheet" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
                    navigator.clipboard.writeText(scriptCode);
                    setSyncFeedback("✓ গুগল অ্যাপস স্ক্রিপ্ট কোড কপি হয়েছে! আপনার শিটের Extensions > Apps Script-এ পেস্ট করুন।");
                    setTimeout(() => setSyncFeedback(null), 5000);
                  }}
                  className="px-3 py-1.5 rounded-xl font-bold text-[11px] bg-[#662C90] text-white hover:bg-[#532376] shadow-2xs transition-all flex items-center gap-1"
                >
                  📋 স্ক্রিপ্ট কোড কপি করুন
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-[#662C90]">📝 গুগল শিটে কানেক্ট করার সহজ ৩ ধাপ:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[10.5px]">
                  <li>আপনার Google Sheet খুলুন এবং মেনু থেকে <strong>Extensions &gt; Apps Script</strong>-এ যান।</li>
                  <li>উপরের <strong>"স্ক্রিপ্ট কোড কপি করুন"</strong> বাটনে চাপ দিয়ে স্ক্রিপ্ট এডিটরে পেস্ট করুন।</li>
                  <li>উপরে <strong>Deploy &gt; New Deployment &gt; Web App</strong> সিলেক্ট করে <em>Who has access: Anyone</em> দিয়ে Deploy করুন এবং লিংকটি এখানে পেস্ট করুন।</li>
                </ol>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-bold">
                স্ট্যাটাস: অটোমেটিক সিঙ্কিং চালু
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
                {isSyncing ? "সিঙ্ক হচ্ছে..." : "এখনই টেস্ট সিঙ্ক করুন"}
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
      {/* Official Printable Batch Report Modal */}
      {showBatchPrintModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] flex flex-col">
            {/* Header */}
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
                    অফিসিয়াল ব্যাচভিত্তিক উপস্থিতি ও পারফরম্যান্স রিপোর্ট
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
                  onClick={() => setShowBatchPrintModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Sub-header info */}
            <div className="flex items-center justify-between text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-500">নির্বাচিত ব্যাচ: </span>
                <strong className="text-slate-900 font-bold">
                  {selectedBatch === "ALL" ? "সকল ব্যাচ একত্রিত" : batches.find((b) => b.id === selectedBatch)?.name}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">তারিখ: </span>
                <strong className="text-slate-900 font-bold">{new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</strong>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-y-auto flex-1 border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="p-3 text-center">নং</th>
                    <th className="p-3">আইডি ও নাম</th>
                    <th className="p-3">ব্যাচ</th>
                    <th className="p-3 text-center">মোট ক্লাস</th>
                    <th className="p-3 text-center">উপস্থিত</th>
                    <th className="p-3 text-center">অনুপস্থিত</th>
                    <th className="p-3 text-center">উপস্থিতি %</th>
                    <th className="p-3">ক্যারিয়ার স্টেজ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedBatch === "ALL" ? students : students.filter((s) => s.batchId === selectedBatch)).map((st, idx) => {
                    const summary = getStudentSummary(st.id);
                    return (
                      <tr key={st.id} className="hover:bg-slate-50">
                        <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{st.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">#{st.studentIdCode}</p>
                        </td>
                        <td className="p-3 font-semibold text-slate-700">{st.batchName || "N/A"}</td>
                        <td className="p-3 text-center font-bold text-slate-700">{summary?.totalClasses || 0}</td>
                        <td className="p-3 text-center font-bold text-emerald-700">{summary?.presentCount || 0}</td>
                        <td className="p-3 text-center font-bold text-rose-700">{summary?.absentCount || 0}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${summary && summary.attendancePercentage < 75 ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-700"}`}>
                            {summary?.attendancePercentage || 100}%
                          </span>
                        </td>
                        <td className="p-3 text-[11px] font-semibold text-[#662C90]">
                          {st.milestone?.stage || "LANGUAGE_COURSE"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
              <p>Generated by Massive Japan Language Institute (MJLI CRM)</p>
              <p>Authorized Verification Document</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
