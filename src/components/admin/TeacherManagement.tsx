"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { User, UserRole } from "@/types";
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
  Eye,
  Crown,
  UserCheck,
  ShieldAlert,
} from "lucide-react";

export const TeacherManagement: React.FC = () => {
  const { users, batches, classLogs, addTeacher, updateTeacher, deleteTeacher, loginAs, currentUser } = useApp();

  const [roleFilter, setRoleFilter] = useState<"ALL" | "SUPER_ADMIN" | "TEACHER">("ALL");
  const [selectedUserId, setSelectedUserId] = useState<string>(
    users[0]?.id || ""
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [logBatchFilter, setLogBatchFilter] = useState("ALL");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New User Form State
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("TEACHER");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("massive123");
  const [newAssignedBatches, setNewAssignedBatches] = useState<string[]>([]);
  const [newAssignedDays, setNewAssignedDays] = useState<string[]>([
    "Sat",
    "Mon",
    "Wed",
  ]);

  // Edit User Form State
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("TEACHER");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editAssignedBatches, setEditAssignedBatches] = useState<string[]>([]);
  const [editAssignedDays, setEditAssignedDays] = useState<string[]>([]);

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q))
      );
    }
    return true;
  });

  const selectedUser = users.find((u) => u.id === selectedUserId) || filteredUsers[0] || users[0];

  const teacherLogs = classLogs
    .filter(
      (cl) =>
        (cl.teacherId === selectedUser?.id || cl.teacherName === selectedUser?.name) &&
        (logBatchFilter === "ALL" ? true : cl.batchId === logBatchFilter)
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalClassesConducted = classLogs.filter(
    (cl) => cl.teacherId === selectedUser?.id || cl.teacherName === selectedUser?.name
  ).length;

  const totalStudentsTaught = classLogs
    .filter((cl) => cl.teacherId === selectedUser?.id || cl.teacherName === selectedUser?.name)
    .reduce((acc, curr) => acc + curr.presentCount, 0);

  const adminCount = users.filter((u) => u.role === "SUPER_ADMIN").length;
  const teacherCount = users.filter((u) => u.role === "TEACHER").length;

  const handleOpenEditModal = (u: User) => {
    setSelectedUserId(u.id);
    setEditName(u.name);
    setEditRole(u.role);
    setEditPhone(u.phone || "");
    setEditEmail(u.email || "");
    setEditPassword("");
    setEditIsActive(u.isActive);
    setEditAssignedBatches([...(u.assignedBatchIds || [])]);
    setEditAssignedDays([...(u.assignedDays || ["Sat", "Mon", "Wed"])]);
    setShowEditModal(true);
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const success = await updateTeacher({
      ...selectedUser,
      name: editName,
      role: editRole,
      phone: editPhone,
      email: editEmail,
      isActive: editIsActive,
      password: editPassword.trim() ? editPassword.trim() : undefined,
      assignedBatchIds: editRole === "TEACHER" ? editAssignedBatches : [],
      assignedDays: editRole === "TEACHER" ? editAssignedDays : [],
    });

    setIsSubmitting(false);

    if (success) {
      setShowEditModal(false);
      setFeedback(`✓ ${editName}-এর তথ্য ও পারমিশন সফলভাবে আপডেট হয়েছে!`);
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setErrorMessage("ইউজারের তথ্য আপডেট করতে সমস্যা হয়েছে");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUsername.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await addTeacher({
      name: newName.trim(),
      username: newUsername.toLowerCase().trim(),
      role: newRole,
      email: newEmail.trim() || `${newUsername.toLowerCase().trim()}@massivejapan.com`,
      phone: newPhone.trim(),
      password: newPassword.trim() || "massive123",
      assignedBatchIds: newRole === "TEACHER" ? newAssignedBatches : [],
      assignedDays: newRole === "TEACHER" ? newAssignedDays : [],
    });

    setIsSubmitting(false);

    if (res.success) {
      setShowAddModal(false);
      setFeedback(
        `✓ নতুন ${newRole === "SUPER_ADMIN" ? "সুপার অ্যাডমিন" : "শিক্ষক"} "${newName}" (ইউজার: ${newUsername}) সফলভাবে তৈরি হয়েছে!`
      );
      setTimeout(() => setFeedback(null), 4000);
      setNewName("");
      setNewUsername("");
      setNewRole("TEACHER");
      setNewEmail("");
      setNewPhone("");
      setNewPassword("massive123");
      setNewAssignedBatches([]);
    } else {
      setErrorMessage(res.error || "ইউজার তৈরি করতে ব্যর্থ হয়েছে");
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsSubmitting(true);
    const success = await deleteTeacher(userToDelete.id);
    setIsSubmitting(false);
    setUserToDelete(null);

    if (success) {
      setFeedback(`✓ ইউজার "${userToDelete.name}" সফলভাবে মুছে ফেলা হয়েছে!`);
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setErrorMessage("ইউজার ডিলিট করা যায়নি");
    }
  };

  const toggleBatchAssignment = (batchId: string, isEditing: boolean) => {
    if (isEditing) {
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

  const toggleDayAssignment = (day: string, isEditing: boolean) => {
    if (isEditing) {
      setEditAssignedDays((prev) =>
        prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
      );
    } else {
      setNewAssignedDays((prev) =>
        prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white flex items-center justify-between text-xs font-bold shadow-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span className="text-sm">{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-white/80 hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#662C90]" />
            ব্যবহারকারী ও স্টাফ ব্যবস্থাপনা (User & Staff Management)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            সুপার অ্যাডমিন, ভিসা কর্মকর্তা, কাউন্সেলর ও শিক্ষক অ্যাকাউন্ট তৈরি, পাসওয়ার্ড ও ব্যাচ নিয়ন্ত্রণ করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Role Filter Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setRoleFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                roleFilter === "ALL"
                  ? "bg-white text-[#662C90] shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              সকল ({users.length})
            </button>
            <button
              onClick={() => setRoleFilter("SUPER_ADMIN")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                roleFilter === "SUPER_ADMIN"
                  ? "bg-[#662C90] text-white shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              অ্যাডমিন ({adminCount})
            </button>
            <button
              onClick={() => setRoleFilter("TEACHER")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                roleFilter === "TEACHER"
                  ? "bg-[#F26622] text-white shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              শিক্ষক ({teacherCount})
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#662C90] hover:bg-[#522375] text-white font-extrabold text-xs shadow-xs flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ইউজার / শিক্ষক তৈরি</span>
          </button>
        </div>
      </div>

      {/* Main Grid: User List & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Cards */}
        <div className="lg:col-span-1 space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="নাম বা ইউজারনেম দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#662C90] font-medium"
            />
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {filteredUsers.map((u) => {
              const isSelected = selectedUser?.id === u.id;
              const isSuperAdmin = u.role === "SUPER_ADMIN";

              return (
                <div
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 text-xs ${
                    isSelected
                      ? isSuperAdmin
                        ? "bg-purple-50/70 border-[#662C90] shadow-xs"
                        : "bg-[#FFF4EE]/70 border-[#F26622] shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl text-white font-black text-xs flex items-center justify-center shadow-2xs ${
                          isSuperAdmin ? "bg-[#662C90]" : "bg-[#F26622]"
                        }`}
                      >
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 leading-tight">
                          {u.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-mono">
                          @{u.username}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                        isSuperAdmin
                          ? "bg-purple-100 text-[#662C90] border-purple-200"
                          : "bg-[#FFF4EE] text-[#F26622] border-[#FED7AA]"
                      }`}
                    >
                      {isSuperAdmin ? "Super Admin" : "Teacher"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>
                      {isSuperAdmin ? (
                        <strong className="text-purple-700">সম্পূর্ণ অ্যাডমিন অ্যাক্সেস</strong>
                      ) : (
                        `অ্যাসাইন ব্যাচ: ${u.assignedBatchIds?.length || 0}টি`
                      )}
                    </span>
                    <span
                      className={`font-bold ${
                        u.isActive ? "text-emerald-700" : "text-slate-400"
                      }`}
                    >
                      {u.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected User Overview, Permissions & Class Logs */}
        <div className="lg:col-span-2 space-y-4">
          {selectedUser ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl text-white font-black text-lg flex items-center justify-center shadow-xs ${
                      selectedUser.role === "SUPER_ADMIN" ? "bg-[#662C90]" : "bg-[#F26622]"
                    }`}
                  >
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-slate-900">{selectedUser.name}</h2>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          selectedUser.role === "SUPER_ADMIN"
                            ? "bg-purple-100 text-[#662C90] border border-purple-200"
                            : "bg-[#FFF4EE] text-[#F26622] border border-[#FED7AA]"
                        }`}
                      >
                        {selectedUser.role === "SUPER_ADMIN" ? "Super Admin" : "Teacher"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      ইউজারনেম: @{selectedUser.username} {selectedUser.phone ? `• 📞 ${selectedUser.phone}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(selectedUser)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 border border-slate-200 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    এডিট ও পাসওয়ার্ড পরিবর্তন
                  </button>

                  <button
                    type="button"
                    onClick={() => loginAs(selectedUser.id)}
                    className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#662C90] font-bold text-xs flex items-center gap-1.5 border border-purple-200 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    এই ভিউতে প্রবেশ
                  </button>

                  {selectedUser.username !== "sadif609" && (
                    <button
                      type="button"
                      onClick={() => setUserToDelete(selectedUser)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200"
                      title="ইউজার ডিলিট করুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Information Cards based on Role */}
              {selectedUser.role === "SUPER_ADMIN" ? (
                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-[#662C90] font-extrabold text-sm">
                    <Crown className="w-4 h-4" />
                    সুপার অ্যাডমিন অ্যাকাউন্ট প্রিভিলেজ
                  </div>
                  <p className="text-slate-600">
                    এই অ্যাকাউন্টটি সম্পূর্ণ CRM পরিচালনা করতে পারে — শিক্ষার্থী ভর্তি, ব্যাচ তৈরি, হাজিরা রিসেট, ভিসা ডকুমেন্টস ট্র্যাকিং, এক্সেল রিপোর্ট জেনারেশন এবং অন্যান্য অ্যাডমিন ও শিক্ষক নিয়ন্ত্রণ।
                  </p>
                </div>
              ) : (
                <>
                  {/* Teacher KPI Box */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-center">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">অ্যাসাইন ব্যাচ</span>
                      <p className="text-lg font-black text-[#662C90] mt-0.5">
                        {selectedUser.assignedBatchIds?.length || 0}টি
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">পরিচালিত ক্লাস</span>
                      <p className="text-lg font-black text-[#F26622] mt-0.5">
                        {totalClassesConducted}টি
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl col-span-2 sm:col-span-1">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">মোট শিক্ষার্থী অংশগ্রহণ</span>
                      <p className="text-lg font-black text-emerald-700 mt-0.5">
                        {totalStudentsTaught} জন
                      </p>
                    </div>
                  </div>

                  {/* Assigned Batches List */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black text-slate-800 uppercase">
                      শিক্ষকের নির্ধারিত ব্যাচসমূহ (Assigned Batches)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.assignedBatchIds && selectedUser.assignedBatchIds.length > 0 ? (
                        selectedUser.assignedBatchIds.map((bId) => {
                          const batch = batches.find((b) => b.id === bId);
                          return (
                            <span
                              key={bId}
                              className="px-3 py-1.5 rounded-xl bg-purple-50 text-[#662C90] border border-purple-200 text-xs font-bold flex items-center gap-1.5"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              {batch?.name || bId} ({batch?.scheduleDays})
                            </span>
                          );
                        })
                      ) : (
                        <p className="text-xs text-amber-700 font-medium bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                          বর্তমানে কোনো ব্যাচ অ্যাসাইন করা নেই। "এডিট" বাটন দিয়ে ব্যাচ অ্যাসাইন করুন।
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Recent Class Logs Taken by this Teacher */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-black text-slate-800 uppercase">
                      বিগত ক্লাস লগ ও সিলেবাস হিস্ট্রি ({teacherLogs.length}টি)
                    </h3>

                    <div className="divide-y divide-slate-100 text-xs max-h-72 overflow-y-auto">
                      {teacherLogs.length > 0 ? (
                        teacherLogs.map((log) => (
                          <div key={log.id} className="py-3 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{log.date} ({log.dayName})</span>
                              <span className="text-emerald-700 font-bold font-mono">
                                {log.presentCount}/{log.totalStudents} উপস্থিত
                              </span>
                            </div>
                            <p className="text-slate-600 italic">"{log.topicCovered}"</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 py-4 text-center">এখনো কোনো ক্লাসের লগ পাওয়া যায়নি।</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
              কোনো ইউজার সিলেক্ট করা নেই।
            </div>
          )}
        </div>
      </div>

      {/* CREATE NEW USER / ADMIN / TEACHER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#662C90]" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  নতুন ব্যবহারকারী / স্টাফ তৈরি করুন
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              {/* Role Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  অ্যাকাউন্টের ধরন / ভূমিকা (Account Role) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole("SUPER_ADMIN")}
                    className={`p-3 rounded-xl border text-left font-bold transition-all flex items-center gap-2 ${
                      newRole === "SUPER_ADMIN"
                        ? "bg-purple-50 border-[#662C90] text-[#662C90] shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Crown className="w-4 h-4 text-[#662C90]" />
                    <div>
                      <span>সুপার অ্যাডমিন</span>
                      <p className="text-[10px] font-normal text-slate-400">সম্পূর্ণ নিয়ন্ত্রণ</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole("TEACHER")}
                    className={`p-3 rounded-xl border text-left font-bold transition-all flex items-center gap-2 ${
                      newRole === "TEACHER"
                        ? "bg-[#FFF4EE] border-[#F26622] text-[#F26622] shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-[#F26622]" />
                    <div>
                      <span>শিক্ষক (Teacher)</span>
                      <p className="text-[10px] font-normal text-slate-400">হাজিরা ও ক্লাস লগ</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">পূর্ণ নাম (Full Name) *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: Rahim Ahmed"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">লগইন ইউজারনেম (Username) *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: rahim609"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">পাসওয়ার্ড (Password) *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: massive123"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs font-bold text-purple-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">মোবাইল নম্বর (Phone)</label>
                  <input
                    type="text"
                    placeholder="017XXXXXXXX"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs"
                  />
                </div>
              </div>

              {/* If Teacher, show batch assignment */}
              {newRole === "TEACHER" && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block font-bold text-slate-700">
                    নির্ধারিত ব্যাচ নির্বাচন করুন ({newAssignedBatches.length}টি নির্বাচিত):
                  </label>
                  <div className="max-h-36 overflow-y-auto grid grid-cols-2 gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {batches.map((b) => {
                      const isChecked = newAssignedBatches.includes(b.id);
                      return (
                        <label
                          key={b.id}
                          className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center gap-2 select-none ${
                            isChecked
                              ? "bg-purple-100 border-[#662C90] text-[#662C90] font-bold"
                              : "bg-white border-slate-200 text-slate-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleBatchAssignment(b.id, false)}
                            className="rounded text-[#662C90]"
                          />
                          <span className="truncate">{b.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#662C90] hover:bg-[#522375] text-white font-extrabold shadow-sm"
                >
                  {isSubmitting ? "তৈরি হচ্ছে..." : "ইউজার তৈরি নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#662C90]" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  ইউজার তথ্য ও পাসওয়ার্ড এডিট
                </h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">রোল (Role):</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-[#662C90]"
                >
                  <option value="SUPER_ADMIN">👑 Super Admin (সম্পূর্ণ অ্যাক্সেস)</option>
                  <option value="TEACHER">👨‍🏫 Teacher (হাজিরা শিট ও ক্লাস লগ)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">পূর্ণ নাম *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ফোন নম্বর</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  নতুন পাসওয়ার্ড (পরিবর্তন না করতে চাইলে খালি রাখুন):
                </label>
                <input
                  type="text"
                  placeholder="নতুন পাসওয়ার্ড লিখুন..."
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs font-bold text-purple-800"
                />
              </div>

              {/* Batch Selector for Teachers */}
              {editRole === "TEACHER" && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block font-bold text-slate-700">
                    নির্ধারিত ব্যাচ নির্বাচন করুন ({editAssignedBatches.length}টি):
                  </label>
                  <div className="max-h-36 overflow-y-auto grid grid-cols-2 gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {batches.map((b) => {
                      const isChecked = editAssignedBatches.includes(b.id);
                      return (
                        <label
                          key={b.id}
                          className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center gap-2 select-none ${
                            isChecked
                              ? "bg-purple-100 border-[#662C90] text-[#662C90] font-bold"
                              : "bg-white border-slate-200 text-slate-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleBatchAssignment(b.id, true)}
                            className="rounded text-[#662C90]"
                          />
                          <span className="truncate">{b.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#662C90] hover:bg-[#522375] text-white font-extrabold shadow-sm"
                >
                  {isSubmitting ? "সংরক্ষণ হচ্ছে..." : "আপডেট নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3 text-rose-600">
              <ShieldAlert className="w-8 h-8 shrink-0" />
              <h3 className="font-extrabold text-slate-900 text-base">
                ইউজার ডিলিট নিশ্চিত করুন
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              আপনি কি নিশ্চিতভাবে <strong>"{userToDelete.name}"</strong> (@{userToDelete.username}) অ্যাকাউন্টটি মুছে ফেলতে চান?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-sm"
              >
                {isSubmitting ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, ডিলিট করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
