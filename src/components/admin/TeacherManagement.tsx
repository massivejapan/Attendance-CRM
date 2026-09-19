"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { User } from "@/types";
import {
  Users,
  Plus,
  BookOpen,
  Phone,
  Search,
  Check,
  Edit,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Trash2,
  Filter,
} from "lucide-react";

export const TeacherManagement: React.FC = () => {
  const { users, batches, classLogs, addTeacher, updateTeacher } = useApp();

  const teachers = users.filter((u) => u.role === "TEACHER");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    teachers[0]?.id || ""
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [logBatchFilter, setLogBatchFilter] = useState("ALL");
  const [feedback, setFeedback] = useState<string | null>(null);

  // New Teacher Form
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAssignedBatches, setNewAssignedBatches] = useState<string[]>([]);
  const [newAssignedDays, setNewAssignedDays] = useState<string[]>([
    "Sat",
    "Mon",
    "Wed",
  ]);

  // Edit Teacher Form
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAssignedBatches, setEditAssignedBatches] = useState<string[]>([]);
  const [editAssignedDays, setEditAssignedDays] = useState<string[]>([]);

  const selectedTeacher = users.find((u) => u.id === selectedTeacherId);

  const teacherLogs = classLogs
    .filter(
      (cl) =>
        (cl.teacherId === selectedTeacherId || cl.teacherName === selectedTeacher?.name) &&
        (logBatchFilter === "ALL" ? true : cl.batchId === logBatchFilter)
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalClassesConducted = classLogs.filter(
    (cl) => cl.teacherId === selectedTeacherId || cl.teacherName === selectedTeacher?.name
  ).length;

  const totalStudentsTaught = classLogs
    .filter((cl) => cl.teacherId === selectedTeacherId || cl.teacherName === selectedTeacher?.name)
    .reduce((acc, curr) => acc + curr.presentCount, 0);

  const handleOpenEditModal = (t: User) => {
    setEditName(t.name);
    setEditPhone(t.phone || "");
    setEditEmail(t.email || "");
    setEditAssignedBatches([...(t.assignedBatchIds || [])]);
    setEditAssignedDays([...(t.assignedDays || ["Sat", "Mon", "Wed"])]);
    setShowEditModal(true);
  };

  const handleSaveTeacherEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    await updateTeacher({
      ...selectedTeacher,
      name: editName,
      phone: editPhone,
      email: editEmail,
      assignedBatchIds: editAssignedBatches,
      assignedDays: editAssignedDays,
    });

    setShowEditModal(false);
    setFeedback(`✓ ${editName}-এর ব্যাচ ও তথ্য সফলভাবে আপডেট হয়েছে!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newUsername) return;

    addTeacher({
      name: newName,
      username: newUsername.toLowerCase().trim(),
      email: newEmail || `${newUsername}@mjli-attendance.com`,
      phone: newPhone,
      role: "TEACHER",
      isActive: true,
      assignedBatchIds: newAssignedBatches,
      assignedDays: newAssignedDays,
    });

    setShowAddModal(false);
    setFeedback(`✓ নতুন শিক্ষক ${newName} সফলভাবে যুক্ত হয়েছেন!`);
    setTimeout(() => setFeedback(null), 4000);
    setNewName("");
    setNewUsername("");
    setNewEmail("");
    setNewPhone("");
    setNewAssignedBatches([]);
  };

  const toggleBatchAssignment = (batchId: string, isEdit: boolean) => {
    if (isEdit) {
      setEditAssignedBatches((prev) =>
        prev.includes(batchId)
          ? prev.filter((id) => id !== batchId)
          : [...prev, batchId]
      );
    } else {
      setNewAssignedBatches((prev) =>
        prev.includes(batchId)
          ? prev.filter((id) => id !== batchId)
          : [...prev, batchId]
      );
    }
  };

  const filteredTeachers = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            শিক্ষক প্রোফাইল, ব্যাচ অ্যাসাইন ও সিলেবাস ট্র্যাকিং
          </h2>
          <p className="text-xs text-slate-500">
            শিক্ষকদের ব্যাচ যোগ বা বাতিল করুন, কোন দিন কি সিলেবাস পড়িয়েছেন তা নিরীক্ষণ করুন।
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-[#F26622] hover:bg-[#D95314] text-white shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          নতুন শিক্ষক যুক্ত করুন
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Teacher List */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="শিক্ষকের নাম খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-2xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#662C90] outline-none font-semibold"
            />
          </div>

          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            শিক্ষকদের তালিকা ({filteredTeachers.length} জন)
          </p>

          <div className="space-y-2 text-xs">
            {filteredTeachers.map((t) => {
              const logsCount = classLogs.filter(
                (cl) => cl.teacherId === t.id || cl.teacherName === t.name
              ).length;
              const isSelected = selectedTeacherId === t.id;

              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTeacherId(t.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                    isSelected
                      ? "bg-[#F7F2FA] border-[#662C90] shadow-sm"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-extrabold text-slate-900 text-sm">{t.name}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {logsCount}টি ক্লাস
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    @{t.username} •{" "}
                    <strong className="text-[#662C90]">
                      {t.assignedBatchIds?.length || 0}টি ব্যাচ অ্যাসাইনড
                    </strong>
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Teacher Details, Batch Assignment & Syllabus Logs */}
        <div className="lg:col-span-2 space-y-5">
          {selectedTeacher ? (
            <>
              {/* Teacher Header Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-[#F7F2FA] text-[#662C90] border border-[#E9D8FD]">
                        ইনস্টিটিউট শিক্ষক
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                        ● অ্যাক্টিভ
                      </span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-xl mt-1">
                      {selectedTeacher.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      ইউজারনেম: <strong>@{selectedTeacher.username}</strong> • ফোন: {selectedTeacher.phone || "N/A"}
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenEditModal(selectedTeacher)}
                    className="px-4 py-2 rounded-2xl font-bold text-xs bg-[#662C90] hover:bg-[#532376] text-white shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    ব্যাচ পরিবর্তন ও এডিট করুন
                  </button>
                </div>

                {/* Assigned Batches List */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      অ্যাসাইন করা ব্যাচসমূহ ({selectedTeacher.assignedBatchIds?.length || 0}টি):
                    </span>
                    <span className="text-[11px] text-slate-400">
                      (শিক্ষক শুধুমাত্র এই ব্যাচগুলোর উপস্থিতি নিতে পারেন)
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {selectedTeacher.assignedBatchIds && selectedTeacher.assignedBatchIds.length > 0 ? (
                      selectedTeacher.assignedBatchIds.map((bId) => {
                        const b = batches.find((x) => x.id === bId);
                        const isRunning = b?.status === "RUNNING";
                        return (
                          <span
                            key={bId}
                            className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                              isRunning
                                ? "bg-[#FFF4EE] text-[#F26622] border-[#FED7AA]"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            <span>{b?.name || bId}</span>
                            <span className="text-[10px] font-normal opacity-80">
                              ({b?.scheduleDays || "Schedule"})
                            </span>
                            {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-[#F26622]" />}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-xs text-amber-700 italic">
                        কোনো ব্যাচ অ্যাসাইন করা নেই। 'ব্যাচ পরিবর্তন' বাটনে ক্লিক করে ব্যাচ যুক্ত করুন।
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Performance Counters */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-center text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">মোট ক্লাস নিয়েছেন</p>
                    <p className="text-xl font-extrabold text-slate-900 mt-0.5">{totalClassesConducted}টি</p>
                  </div>
                  <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] text-emerald-700 font-bold uppercase">শিক্ষার্থী উপস্থিতি নিয়েছেন</p>
                    <p className="text-xl font-extrabold text-emerald-800 mt-0.5">{totalStudentsTaught} জন</p>
                  </div>
                  <div className="bg-[#F7F2FA] p-3.5 rounded-2xl border border-[#E9D8FD] col-span-2 sm:col-span-1">
                    <p className="text-[10px] text-[#662C90] font-bold uppercase">চলমান অ্যাক্টিভ ব্যাচ</p>
                    <p className="text-xl font-extrabold text-[#662C90] mt-0.5">
                      {selectedTeacher.assignedBatchIds?.filter((id) => batches.find((b) => b.id === id)?.status === "RUNNING").length || 0}টি
                    </p>
                  </div>
                </div>
              </div>

              {/* Syllabus & Class History Explorer */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      সিলেবাস ও ক্লাস হিস্ট্রি (Topic & Homework Log)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      শিক্ষক কোন দিন কোন ব্যাচে কি পড়িয়েছেন তার সম্পূর্ণ বিবরণ
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={logBatchFilter}
                      onChange={(e) => setLogBatchFilter(e.target.value)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none"
                    >
                      <option value="ALL">সকল ব্যাচের লগ</option>
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {teacherLogs.length > 0 ? (
                    teacherLogs.map((log) => {
                      const batch = batches.find((b) => b.id === log.batchId);
                      return (
                        <div key={log.id} className="py-4 space-y-2 hover:bg-slate-50/60 px-2 rounded-2xl transition-colors">
                          <div className="flex items-center justify-between font-extrabold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-lg bg-[#F7F2FA] text-[#662C90] border border-[#E9D8FD] text-[11px]">
                                {batch?.name || "Batch"}
                              </span>
                              <span>{log.date} ({log.dayName || "Class"})</span>
                              {log.isSubstitute && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                                  প্রক্সি / সাবস্টিটিউট
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 text-[11px]">
                              {log.presentCount}/{log.totalStudents} জন উপস্থিত
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                            <p className="text-slate-800 font-semibold">
                              📖 <strong className="text-slate-900">পড়ানো হয়েছে (Topic):</strong> {log.topicCovered}
                            </p>
                            {log.homework && (
                              <p className="text-slate-600 text-[11px]">
                                📝 <strong>হোমওয়ার্ক:</strong> {log.homework}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-slate-400 py-8 text-center font-medium">
                      এই শিক্ষকের কোনো ক্লাসের রেকর্ড পাওয়া যায়নি।
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400">
              শিক্ষক নির্বাচন করুন।
            </div>
          )}
        </div>
      </div>

      {/* Edit Teacher Modal (Batch Assign / Remove) */}
      {showEditModal && selectedTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  শিক্ষকের তথ্য ও ব্যাচ অ্যাসাইন পরিবর্তন
                </h3>
                <p className="text-[11px] text-slate-500">
                  {selectedTeacher.name}-এর অ্যাসাইন করা ব্যাচ যোগ বা বাতিল করুন
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTeacherEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    শিক্ষকের নাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#662C90] outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ফোন নম্বর
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#662C90] outline-none"
                  />
                </div>
              </div>

              {/* Interactive Batch Checkbox Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800">
                    নির্ধারিত ব্যাচসমূহ নির্বাচন করুন ({editAssignedBatches.length}টি সিলেক্টেড)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    (যে যে ব্যাচে টিক দিবেন, শিক্ষক শুধুমাত্র সেগুলোতেই হাজিরা নিতে পারবেন)
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 max-h-56 overflow-y-auto space-y-3">
                  {/* Running Batches */}
                  <div>
                    <span className="text-[10px] font-bold text-[#F26622] uppercase tracking-wider block mb-1.5">
                      চলমান ব্যাচসমূহ (Running)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {batches
                        .filter((b) => b.status === "RUNNING")
                        .map((b) => {
                          const isAssigned = editAssignedBatches.includes(b.id);
                          return (
                            <label
                              key={b.id}
                              className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                isAssigned
                                  ? "bg-[#FFF4EE] border-[#F26622] text-[#F26622] font-bold"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isAssigned}
                                onChange={() => toggleBatchAssignment(b.id, true)}
                                className="rounded text-[#F26622] focus:ring-[#F26622]"
                              />
                              <span className="text-xs">{b.name}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>

                  {/* Completed Batches */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      সম্পন্ন / অন্যান্য ব্যাচসমূহ (Completed)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {batches
                        .filter((b) => b.status === "COMPLETED")
                        .map((b) => {
                          const isAssigned = editAssignedBatches.includes(b.id);
                          return (
                            <label
                              key={b.id}
                              className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all text-xs ${
                                isAssigned
                                  ? "bg-slate-200 border-slate-400 font-bold"
                                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isAssigned}
                                onChange={() => toggleBatchAssignment(b.id, true)}
                                className="rounded text-slate-600 focus:ring-slate-500"
                              />
                              <span>{b.name}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-2xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl font-bold bg-[#662C90] hover:bg-[#532376] text-white shadow-sm"
                >
                  পরিবর্তন সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                নতুন শিক্ষক অ্যাকাউন্ট যুক্ত করুন
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    শিক্ষকের নাম *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: Shakil Sir"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#662C90] outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ইউজারনেম (Login Username) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="shakil"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono font-bold text-[#662C90]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ফোন নম্বর
                </label>
                <input
                  type="text"
                  placeholder="01711-xxxxxx"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                />
              </div>

              {/* Batch Assignment Selector */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-800">
                  শুরুতেই ব্যাচ নির্ধারণ করুন ({newAssignedBatches.length}টি)
                </label>
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 max-h-48 overflow-y-auto space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {batches.map((b) => {
                      const isAssigned = newAssignedBatches.includes(b.id);
                      return (
                        <label
                          key={b.id}
                          className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer text-xs ${
                            isAssigned
                              ? "bg-[#FFF4EE] border-[#F26622] text-[#F26622] font-bold"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={() => toggleBatchAssignment(b.id, false)}
                            className="rounded text-[#F26622] focus:ring-[#F26622]"
                          />
                          <span>{b.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-2xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl font-bold bg-[#F26622] hover:bg-[#D95314] text-white shadow-sm"
                >
                  শিক্ষক অ্যাকাউন্ট তৈরি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
