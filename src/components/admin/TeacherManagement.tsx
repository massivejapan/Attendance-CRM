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
  KeyRound,
  ShieldCheck,
  Mail,
  AlertCircle,
} from "lucide-react";

export const TeacherManagement: React.FC = () => {
  const { users, batches, classLogs, addTeacher, updateTeacher, deleteTeacher } = useApp();

  const teachers = users.filter((u) => u.role === "TEACHER");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    teachers[0]?.id || ""
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [logBatchFilter, setLogBatchFilter] = useState("ALL");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Teacher Form State
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("teacher123");
  const [newAssignedBatches, setNewAssignedBatches] = useState<string[]>([]);
  const [newAssignedDays, setNewAssignedDays] = useState<string[]>([
    "Sat",
    "Mon",
    "Wed",
  ]);

  // Edit Teacher Form State
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editAssignedBatches, setEditAssignedBatches] = useState<string[]>([]);
  const [editAssignedDays, setEditAssignedDays] = useState<string[]>([]);

  const selectedTeacher = users.find((u) => u.id === selectedTeacherId) || teachers[0];

  const teacherLogs = classLogs
    .filter(
      (cl) =>
        (cl.teacherId === selectedTeacher?.id || cl.teacherName === selectedTeacher?.name) &&
        (logBatchFilter === "ALL" ? true : cl.batchId === logBatchFilter)
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalClassesConducted = classLogs.filter(
    (cl) => cl.teacherId === selectedTeacher?.id || cl.teacherName === selectedTeacher?.name
  ).length;

  const totalStudentsTaught = classLogs
    .filter((cl) => cl.teacherId === selectedTeacher?.id || cl.teacherName === selectedTeacher?.name)
    .reduce((acc, curr) => acc + curr.presentCount, 0);

  const handleOpenEditModal = (t: User) => {
    setSelectedTeacherId(t.id);
    setEditName(t.name);
    setEditPhone(t.phone || "");
    setEditEmail(t.email || "");
    setEditPassword("");
    setEditAssignedBatches([...(t.assignedBatchIds || [])]);
    setEditAssignedDays([...(t.assignedDays || ["Sat", "Mon", "Wed"])]);
    setShowEditModal(true);
  };

  const handleSaveTeacherEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const success = await updateTeacher({
      ...selectedTeacher,
      name: editName,
      phone: editPhone,
      email: editEmail,
      password: editPassword.trim() ? editPassword.trim() : undefined,
      assignedBatchIds: editAssignedBatches,
      assignedDays: editAssignedDays,
    });

    setIsSubmitting(false);

    if (success) {
      setShowEditModal(false);
      setFeedback(`✓ ${editName}-এর তথ্য ও ব্যাচ অ্যাসাইনমেন্ট সফলভাবে আপডেট হয়েছে!`);
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setErrorMessage("শিক্ষকের তথ্য আপডেট করতে সমস্যা হয়েছে");
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUsername.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await addTeacher({
      name: newName.trim(),
      username: newUsername.toLowerCase().trim(),
      email: newEmail.trim() || `${newUsername.toLowerCase().trim()}@massivejapan.com`,
      phone: newPhone.trim(),
      password: newPassword.trim() || "teacher123",
      assignedBatchIds: newAssignedBatches,
      assignedDays: newAssignedDays,
    });

    setIsSubmitting(false);

    if (res.success) {
      setShowAddModal(false);
      setFeedback(`✓ নতুন শিক্ষক ${newName} (User: ${newUsername}) সফলভাবে তৈরি হয়েছে!`);
      setTimeout(() => setFeedback(null), 4000);
      setNewName("");
      setNewUsername("");
      setNewEmail("");
      setNewPhone("");
      setNewPassword("teacher123");
      setNewAssignedBatches([]);
    } else {
      setErrorMessage(res.error || "শিক্ষক তৈরি করতে ব্যর্থ হয়েছে");
    }
  };

  const handleDeleteTeacher = async () => {
    if (!selectedTeacher) return;
    setIsSubmitting(true);
    const success = await deleteTeacher(selectedTeacher.id);
    setIsSubmitting(false);
    setShowDeleteConfirm(false);

    if (success) {
      setFeedback(`✓ শিক্ষক "${selectedTeacher.name}" সফলভাবে মুছে ফেলা হয়েছে!`);
      setTimeout(() => setFeedback(null), 4000);
      const remaining = teachers.filter((t) => t.id !== selectedTeacher.id);
      if (remaining.length > 0) {
        setSelectedTeacherId(remaining[0].id);
      }
    } else {
      setErrorMessage("শিক্ষক মুছতে সমস্যা হয়েছে");
    }
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
            শিক্ষক প্রোফাইল, লগইন পাসওয়ার্ড ও সিলেবাস ট্র্যাকিং
          </h2>
          <p className="text-xs text-slate-500">
            শিক্ষকদের ইউজার/পাসওয়ার্ড ও নির্ধারিত ব্যাচ সেট করুন, এবং কোন দিন কি পড়িয়েছেন তা দেখুন।
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

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Teacher List */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="শিক্ষকের নাম বা ইউজারনেম খুঁজুন..."
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
              const isSelected = selectedTeacher?.id === t.id;

              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTeacherId(t.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-[#662C90] text-white border-[#662C90] shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-[#FFF4EE] text-[#F26622] border border-[#FED7AA]"
                      }`}
                    >
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm">{t.name}</h4>
                      <p
                        className={`text-[11px] font-mono ${
                          isSelected ? "text-purple-200" : "text-slate-400"
                        }`}
                      >
                        User: @{t.username}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-purple-50 text-[#662C90] border border-purple-200"
                      }`}
                    >
                      {t.assignedBatchIds?.length || 0}টি ব্যাচ
                    </span>
                    <p
                      className={`text-[10px] mt-1 ${
                        isSelected ? "text-purple-200" : "text-slate-400"
                      }`}
                    >
                      {logsCount} ক্লাস নোট
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Teacher Detail, Batch Assignment & Syllabus Tracking */}
        {selectedTeacher && (
          <div className="lg:col-span-2 space-y-5">
            {/* Profile & Action Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#662C90] text-white flex items-center justify-center font-extrabold text-lg">
                    {selectedTeacher.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">
                        {selectedTeacher.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-50 text-[#662C90] border border-purple-200">
                        শিক্ষক (Teacher)
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">
                        User: @{selectedTeacher.username}
                      </span>
                      {selectedTeacher.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {selectedTeacher.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => handleOpenEditModal(selectedTeacher)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5 text-[#662C90]" />
                    পাসওয়ার্ড ও ব্যাচ এডিট
                  </button>

                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all"
                    title="শিক্ষক ডিলিট করুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stats & Overview */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-purple-50 border border-purple-100">
                  <p className="text-[11px] font-bold text-[#662C90]">নির্ধারিত ব্যাচ</p>
                  <p className="text-xl font-black text-[#662C90] mt-0.5">
                    {selectedTeacher.assignedBatchIds?.length || 0}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-orange-50 border border-orange-100">
                  <p className="text-[11px] font-bold text-[#F26622]">পরিচালিত ক্লাস</p>
                  <p className="text-xl font-black text-[#F26622] mt-0.5">
                    {totalClassesConducted}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <p className="text-[11px] font-bold text-emerald-800">মোট শিক্ষার্থী হাজিরা</p>
                  <p className="text-xl font-black text-emerald-700 mt-0.5">
                    {totalStudentsTaught}
                  </p>
                </div>
              </div>

              {/* Assigned Batches List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                  <span>বর্তমানে অ্যাসাইন করা ব্যাচসমূহ</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    (টিচার শুধুমাত্র এই ব্যাচগুলোতেই হাজিরা নিতে পারবেন)
                  </span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTeacher.assignedBatchIds &&
                  selectedTeacher.assignedBatchIds.length > 0 ? (
                    selectedTeacher.assignedBatchIds.map((bId) => {
                      const batch = batches.find((b) => b.id === bId);
                      const isRunning = batch?.status === "RUNNING";
                      return (
                        <div
                          key={bId}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border flex items-center gap-1.5 ${
                            isRunning
                              ? "bg-[#FFF4EE] border-[#FED7AA] text-[#F26622]"
                              : "bg-slate-100 border-slate-200 text-slate-600"
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{batch?.name || bId}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                              isRunning
                                ? "bg-[#F26622] text-white"
                                : "bg-slate-300 text-slate-700"
                            }`}
                          >
                            {isRunning ? "Running" : "Completed"}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold w-full">
                      ⚠️ এই শিক্ষকের জন্য এখনো কোনো ব্যাচ নির্ধারণ করা হয়নি। &apos;পাসওয়ার্ড ও ব্যাচ এডিট&apos; বাটনে ক্লিক করে ব্যাচ যুক্ত করুন।
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Syllabus Logs Explorer ("তারা কি পড়াইছে কোনদিন") */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#F26622]" />
                    ক্লাস লেকচার ও সিলেবাস ইতিহাস (কোন দিন কি পড়িয়েছেন)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    হাজিরা নেওয়ার সময় শিক্ষক যে সিলেবাস ও হোমওয়ার্ক এন্ট্রি দিয়েছেন।
                  </p>
                </div>

                {/* Filter by batch */}
                <select
                  value={logBatchFilter}
                  onChange={(e) => setLogBatchFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#662C90]"
                >
                  <option value="ALL">সকল ব্যাচ ({teacherLogs.length})</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {teacherLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                  এই শিক্ষকের জন্য এখনো কোনো ক্লাস লেকচার বা সিলেবাস রেকর্ড করা হয়নি।
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {teacherLogs.map((log) => {
                    const batch = batches.find((b) => b.id === log.batchId);
                    return (
                      <div
                        key={log.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 space-y-2 transition-all"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-[#662C90] text-white font-extrabold text-[11px]">
                              {batch?.name || "Batch"}
                            </span>
                            <span className="font-bold text-slate-700 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {log.date} ({log.dayName || "Class"})
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] font-bold">
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              উপস্থিত: {log.presentCount}
                            </span>
                            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              অনুপস্থিত: {log.absentCount}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-800 bg-white p-3 rounded-xl border border-slate-200/80">
                          <p className="font-extrabold text-slate-900 mb-0.5 text-[11px] text-[#F26622]">
                            পড়ানো বিষয় / সিলেবাস (Topic Covered):
                          </p>
                          <p className="font-medium text-slate-700">{log.topicCovered}</p>

                          {log.homework && (
                            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px]">
                              <span className="font-bold text-purple-900">হোমওয়ার্ক: </span>
                              <span className="text-slate-600">{log.homework}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Teacher Modal (Password, Profile & Batch Assign) */}
      {showEditModal && selectedTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  শিক্ষকের তথ্য, পাসওয়ার্ড ও ব্যাচ সম্পাদনা
                </h3>
                <p className="text-[11px] text-slate-500">
                  {selectedTeacher.name} (User: @{selectedTeacher.username})
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

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  নতুন পাসওয়ার্ড সেট করুন (Change/Reset Password)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="অপরিবর্তিত রাখতে খালি রাখুন (যেমন: newpass2026)"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#662C90] outline-none font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  পাসওয়ার্ড পরিবর্তন না করতে চাইলে খালি রাখুন।
                </p>
              </div>

              {/* Interactive Batch Checkbox Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800">
                    নির্ধারিত ব্যাচসমূহ নির্বাচন করুন ({editAssignedBatches.length}টি সিলেক্টেড)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    (যে ব্যাচে টিক দিবেন, শুধুমাত্র সেখানেই হাজিরা নিতে পারবেন)
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
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-2xl font-bold bg-[#662C90] hover:bg-[#532376] text-white shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? "সংরক্ষণ হচ্ছে..." : "পরিবর্তন সংরক্ষণ করুন"}
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
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  নতুন শিক্ষক অ্যাকাউন্ট তৈরি করুন
                </h3>
                <p className="text-[11px] text-slate-500">
                  শিক্ষকের লগইন ইউজারনেম ও পাসওয়ার্ড সেট করে দিন
                </p>
              </div>
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
                    placeholder="যেমন: Tanvir Sir"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#662C90] outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    লগইন ইউজারনেম (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="tanvir"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono font-bold text-[#662C90]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    লগইন পাসওয়ার্ড (Password) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="teacher123"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-800"
                  />
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
              </div>

              {/* Batch Assignment Selector */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-800">
                  শুরুতেই ব্যাচ নির্ধারণ করুন ({newAssignedBatches.length}টি সিলেক্টেড)
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
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-2xl font-bold bg-[#F26622] hover:bg-[#D95314] text-white shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? "তৈরি হচ্ছে..." : "শিক্ষক অ্যাকাউন্ট তৈরি করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Teacher Confirmation Modal */}
      {showDeleteConfirm && selectedTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-extrabold text-slate-900 text-base">
                শিক্ষক অ্যাকাউন্ট ডিলিট করবেন?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                আপনি কি নিশ্চিতভাবে &apos;{selectedTeacher.name}&apos; (@{selectedTeacher.username})-কে ডিলিট করতে চান?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleDeleteTeacher}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-xs text-white shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? "ডিলিট হচ্ছে..." : "হ্যাঁ, ডিলিট করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
