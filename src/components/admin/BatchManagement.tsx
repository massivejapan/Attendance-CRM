"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  GraduationCap,
  Plus,
  Users,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Search,
} from "lucide-react";

interface BatchManagementProps {
  onSelectStudent: (studentId: string) => void;
}

export const BatchManagement: React.FC<BatchManagementProps> = ({
  onSelectStudent,
}) => {
  const { batches, students, users, addBatch, updateBatch, toggleBatchStatus, getStudentSummary } =
    useApp();

  const [filterStatus, setFilterStatus] = useState<"RUNNING" | "COMPLETED" | "ALL">("RUNNING");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBatches = batches.filter((b) => {
    const matchesStatus = filterStatus === "ALL" ? true : b.status === filterStatus;
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    batches.find((b) => b.status === "RUNNING")?.id || batches[0]?.id || ""
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditingEndDate, setIsEditingEndDate] = useState(false);
  const [editEstimatedEndDate, setEditEstimatedEndDate] = useState("");

  const [name, setName] = useState("");
  const [scheduleDays, setScheduleDays] = useState("Sat Mon Wed");
  const [timeSlot, setTimeSlot] = useState("10:00 AM - 12:00 PM");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [estimatedEndDate, setEstimatedEndDate] = useState("");
  const [targetTotalClasses, setTargetTotalClasses] = useState(72);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);
  const batchStudents = students.filter(
    (s) => s.batchId === selectedBatchId && (filterStatus === "ALL" ? true : s.status === (filterStatus === "COMPLETED" ? "COMPLETED" : "ACTIVE"))
  );

  const assignedTeachers = users.filter((u) =>
    u.assignedBatchIds.includes(selectedBatchId)
  );

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    addBatch({
      name: name.trim(),
      scheduleDays,
      timeSlot,
      startDate,
      estimatedEndDate: estimatedEndDate || undefined,
      targetTotalClasses: Number(targetTotalClasses) || 72,
      completedClasses: 0,
      status: "RUNNING",
    });

    setShowAddModal(false);
    setName("");
    setEstimatedEndDate("");
  };

  const handleSaveBatchEndDate = () => {
    if (!selectedBatch) return;
    updateBatch({
      ...selectedBatch,
      estimatedEndDate: editEstimatedEndDate,
    });
    setIsEditingEndDate(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            ব্যাচ ব্যবস্থাপনা ও কোর্স সমাপ্তি ট্র্যাকিং (Batch & Duration Tracker)
          </h2>
          <p className="text-xs text-slate-500">
            চলমান ও সম্পন্ন ব্যাচসমূহ ফিল্টার করুন, প্রতিটি ব্যাচের কোর্স সমাপ্তির সম্ভাব্য তারিখ ট্র্যাক করে নতুন ব্যাচের প্রস্তুতি নিন।
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-[#F26622] hover:bg-[#D95314] text-white shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          নতুন ব্যাচ তৈরি করুন
        </button>
      </div>

      {/* Top Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setFilterStatus("RUNNING")}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all ${
              filterStatus === "RUNNING"
                ? "bg-[#662C90] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            চলমান ব্যাচসমূহ ({batches.filter((b) => b.status === "RUNNING").length})
          </button>
          <button
            onClick={() => setFilterStatus("COMPLETED")}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all ${
              filterStatus === "COMPLETED"
                ? "bg-slate-800 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            সম্পন্ন ব্যাচসমূহ ({batches.filter((b) => b.status === "COMPLETED").length})
          </button>
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all ${
              filterStatus === "ALL"
                ? "bg-[#F26622] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            সকল ব্যাচ ({batches.length})
          </button>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ব্যাচের নাম খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-2xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#662C90] outline-none font-semibold"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Batch List */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 max-h-[750px] overflow-y-auto">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            তালিকা ({filteredBatches.length}টি ব্যাচ)
          </p>

          <div className="space-y-2.5">
            {filteredBatches.map((b) => {
              const count = students.filter(
                (s) => s.batchId === b.id && (b.status === "COMPLETED" ? true : s.status === "ACTIVE")
              ).length;
              const isSelected = selectedBatchId === b.id;
              const isRunning = b.status === "RUNNING";
              const progressPct = Math.min(
                100,
                Math.round(((b.completedClasses || 0) / (b.targetTotalClasses || 72)) * 100)
              );

              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBatchId(b.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? "bg-[#F7F2FA] border-[#662C90] shadow-sm"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-sm">
                        {b.name}
                      </h3>
                      {isRunning ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                          সম্পন্ন
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FFF4EE] text-[#F26622] border border-[#FED7AA]">
                      {b.scheduleDays}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-semibold">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {count} জন
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      {b.timeSlot || "Regular Slot"}
                    </span>
                  </div>

                  {/* Course Duration & Countdown Preview */}
                  {isRunning && b.estimatedEndDate && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">কোর্স সমাপ্তি:</span>
                        <span className="font-bold text-slate-700">{b.estimatedEndDate}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">প্রগতি ({b.completedClasses || 0}/{b.targetTotalClasses || 72}):</span>
                        <span className={`font-extrabold ${b.daysRemaining !== undefined && b.daysRemaining <= 45 ? "text-[#F26622]" : "text-emerald-700"}`}>
                          {b.daysRemaining !== undefined ? `আর ${b.daysRemaining} দিন বাকি` : `${progressPct}% সম্পন্ন`}
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${b.daysRemaining !== undefined && b.daysRemaining <= 45 ? "bg-[#F26622]" : "bg-[#662C90]"}`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Batch Details & Student Roster */}
        <div className="lg:col-span-2 space-y-6">
          {selectedBatch ? (
            <>
              {/* Batch Overview Header */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-[#F7F2FA] text-[#662C90] border border-[#E9D8FD]">
                        {selectedBatch.scheduleDays}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        selectedBatch.status === "RUNNING"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {selectedBatch.status === "RUNNING" ? "● কোর্স চলমান (Active)" : "কোর্স সম্পন্ন (Completed)"}
                      </span>

                      {/* 1-Click Status Toggle for Super Admin */}
                      {selectedBatch.status === "RUNNING" ? (
                        <button
                          type="button"
                          onClick={() => toggleBatchStatus(selectedBatch.id, "COMPLETED")}
                          className="px-3 py-1 rounded-xl text-[11px] font-bold bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ব্যাচ সম্পন্ন ঘোষণা করুন (Complete Batch)
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleBatchStatus(selectedBatch.id, "RUNNING")}
                          className="px-3 py-1 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                          চলমান ব্যাচ হিসেবে চালু করুন (Re-open)
                        </button>
                      )}
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 mt-1.5">
                      {selectedBatch.name}
                    </h2>
                    <p className="text-xs text-slate-500 flex items-center gap-3 mt-1 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {selectedBatch.timeSlot}
                      </span>
                      {selectedBatch.startDate && <span>• শুরু: {selectedBatch.startDate}</span>}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-500 uppercase">
                      দায়িত্বরত শিক্ষক
                    </p>
                    <div className="flex flex-wrap gap-1.5 justify-end mt-1">
                      {assignedTeachers.length > 0 ? (
                        assignedTeachers.map((t) => (
                          <span
                            key={t.id}
                            className="px-2.5 py-0.5 rounded-lg bg-[#FFF4EE] text-[#F26622] text-xs font-bold border border-[#FED7AA]"
                          >
                            {t.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          কোনো শিক্ষক নির্ধারিত নেই
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Course Completion & Preparation Notice Card */}
                {selectedBatch.status === "RUNNING" && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-700" />
                        <span className="font-extrabold text-amber-900">
                          কোর্স সমাপ্তির আনুমানিক তারিখ:
                        </span>
                        <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                          {selectedBatch.estimatedEndDate || "নির্ধারণ করা হয়নি"}
                        </span>
                      </div>
                      
                      {!isEditingEndDate ? (
                        <button
                          onClick={() => {
                            setEditEstimatedEndDate(selectedBatch.estimatedEndDate || "");
                            setIsEditingEndDate(true);
                          }}
                          className="font-bold text-[#662C90] hover:underline"
                        >
                          তারিখ পরিবর্তন
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            value={editEstimatedEndDate}
                            onChange={(e) => setEditEstimatedEndDate(e.target.value)}
                            className="px-2 py-1 rounded-lg border border-amber-300 bg-white text-xs font-semibold outline-none"
                          />
                          <button
                            onClick={handleSaveBatchEndDate}
                            className="px-2.5 py-1 rounded-lg bg-[#662C90] text-white font-bold"
                          >
                            সেভ
                          </button>
                          <button
                            onClick={() => setIsEditingEndDate(false)}
                            className="px-2 py-1 text-slate-500 font-bold"
                          >
                            বাতিল
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-amber-200/60 text-amber-800">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#F26622]" />
                        <span className="font-semibold">
                          ক্লাস সম্পন্ন: <strong className="font-bold text-amber-950">{selectedBatch.completedClasses || 0}টি</strong> / {selectedBatch.targetTotalClasses || 72}টি
                        </span>
                      </div>
                      <span className="font-extrabold text-[#F26622] bg-[#FFF4EE] px-2.5 py-0.5 rounded-lg border border-[#FED7AA]">
                        {selectedBatch.daysRemaining !== undefined
                          ? `⏳ আর মাত্র ${selectedBatch.daysRemaining} দিন বাকি (নতুন ব্যাচ প্ল্যানিং নোটিশ)`
                          : "কোর্স সমাপ্তির প্ল্যানিং সক্রিয়"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Student Roster Table */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    এই ব্যাচের শিক্ষার্থী তালিকা ({batchStudents.length} জন)
                  </h3>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {batchStudents.length > 0 ? (
                    batchStudents.map((student, idx) => {
                      const summary = getStudentSummary(student.id);

                      return (
                        <div
                          key={student.id}
                          className="py-3.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-2xl transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 text-center font-bold text-slate-400">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                                  #{student.studentIdCode}
                                </span>
                                <p className="font-bold text-slate-900">
                                  {student.name}
                                </p>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                                অভিভাবক: {student.guardianNumber || "N/A"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {summary && (
                              <span
                                className={`px-2.5 py-0.5 rounded-lg font-bold text-xs border ${
                                  summary.attendancePercentage >= 80
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : summary.attendancePercentage >= 60
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : "bg-rose-50 text-rose-800 border-rose-200"
                                }`}
                              >
                                {summary.attendancePercentage}% ({summary.presentCount}/
                                {summary.totalClasses})
                              </span>
                            )}
                            <button
                              onClick={() => onSelectStudent(student.id)}
                              className="text-xs font-bold text-[#662C90] hover:text-[#532376]"
                            >
                              প্রোফাইল
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">
                      এই ব্যাচে বর্তমানে কোনো শিক্ষার্থী নেই।
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400">
              ব্যাচ নির্বাচন করুন।
            </div>
          )}
        </div>
      </div>

      {/* Create Batch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                নতুন ব্যাচ তৈরি করুন
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ব্যাচের নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: MJLI 23 / N4-27A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#662C90] outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ক্লাসের দিন নির্ধারণ করুন *
                </label>
                <select
                  value={scheduleDays}
                  onChange={(e) => setScheduleDays(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#662C90] outline-none bg-white font-semibold"
                >
                  <option value="Sat Mon Wed">
                    Saturday - Monday - Wednesday (শনি - সোম - বুধ)
                  </option>
                  <option value="Sun Tue Thu">
                    Sunday - Tuesday - Thursday (রবি - মঙ্গল - বৃহস্পতি)
                  </option>
                  <option value="Fri Sat">Friday - Saturday (শুক্র - শনি)</option>
                  <option value="Daily">Daily (প্রতিদিন)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ক্লাসের সময়
                </label>
                <input
                  type="text"
                  placeholder="যেমন: 10:00 AM - 12:00 PM"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#662C90] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    শুরুর তারিখ
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#662C90] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    আনুমানিক শেষ তারিখ
                  </label>
                  <input
                    type="date"
                    value={estimatedEndDate}
                    onChange={(e) => setEstimatedEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#662C90] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  মোট টার্গেট ক্লাসের সংখ্যা
                </label>
                <input
                  type="number"
                  value={targetTotalClasses}
                  onChange={(e) => setTargetTotalClasses(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#662C90] outline-none font-bold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold bg-[#662C90] hover:bg-[#532376] text-white shadow-sm"
                >
                  ব্যাচ সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
