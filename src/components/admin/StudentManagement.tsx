"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Student, StudentDocumentItem, STANDARD_VISA_DOCUMENTS, MilestoneStage } from "@/types";
import {
  Users,
  Plus,
  Search,
  Phone,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  MessageSquare,
  FileText,
  ChevronDown,
  ChevronUp,
  Check,
  Clock,
} from "lucide-react";
import { openWhatsApp, getWhatsAppGeneralMsg } from "@/lib/utils";

interface StudentManagementProps {
  onSelectStudent: (studentId: string) => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
  onSelectStudent,
}) => {
  const {
    students,
    batches,
    getStudentSummary,
    addStudent,
    updateStudent,
    deleteStudent,
    currentUser,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatchFilter, setSelectedBatchFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // New Student Form
  const [newIdCode, setNewIdCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newGuardian, setNewGuardian] = useState("");
  const [newRefInfo, setNewRefInfo] = useState("");
  const [newMilestone, setNewMilestone] = useState<MilestoneStage>("LANGUAGE_COURSE");
  const [newBatchId, setNewBatchId] = useState(
    batches.find((b) => b.status === "RUNNING")?.id || batches[0]?.id || ""
  );
  const [isDocsSectionOpen, setIsDocsSectionOpen] = useState(false);
  const [newDocsMap, setNewDocsMap] = useState<Record<string, StudentDocumentItem>>(() => {
    const init: Record<string, StudentDocumentItem> = {};
    STANDARD_VISA_DOCUMENTS.forEach((d) => {
      init[d.id] = {
        id: d.id,
        title: d.title,
        isSubmitted: false,
        receivedDate: undefined,
        receivedBy: undefined,
        status: "PENDING",
        note: "",
      };
    });
    return init;
  });

  const handleToggleNewDoc = (docId: string, currentChecked: boolean) => {
    const today = new Date().toISOString().split("T")[0];
    const newChecked = !currentChecked;
    setNewDocsMap((prev) => {
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

  const handleNewDocFieldChange = (
    docId: string,
    field: "receivedDate" | "receivedBy" | "status" | "note",
    value: any
  ) => {
    setNewDocsMap((prev) => {
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

  // Edit Student Form
  const [editIdCode, setEditIdCode] = useState("");
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editGuardian, setEditGuardian] = useState("");
  const [editBatchId, setEditBatchId] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "COMPLETED" | "INACTIVE">("ACTIVE");

  const handleOpenEdit = (st: Student) => {
    setStudentToEdit(st);
    setEditIdCode(st.studentIdCode);
    setEditName(st.name);
    setEditMobile(st.mobileNumber || "");
    setEditGuardian(st.guardianNumber || "");
    setEditBatchId(st.batchId);
    setEditStatus(st.status as any || "ACTIVE");
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentToEdit) return;

    const targetBatch = batches.find((b) => b.id === editBatchId);

    await updateStudent({
      ...studentToEdit,
      studentIdCode: editIdCode.trim(),
      name: editName.trim(),
      mobileNumber: editMobile.trim() || undefined,
      guardianNumber: editGuardian.trim() || undefined,
      batchId: editBatchId,
      batchName: targetBatch?.name || studentToEdit.batchName,
      status: editStatus as any,
    });

    setShowEditModal(false);
    setFeedback(`✓ শিক্ষার্থী ${editName}-এর তথ্য সফলভাবে আপডেট হয়েছে!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    const name = studentToDelete.name;
    await deleteStudent(studentToDelete.id);
    setStudentToDelete(null);
    setFeedback(`✓ শিক্ষার্থী ${name}-কে সফলভাবে মুছে ফেলা হয়েছে!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdCode || !newName || !newBatchId) return;

    setIsSubmittingAdd(true);
    const result = await addStudent({
      studentIdCode: newIdCode.trim(),
      name: newName.trim(),
      mobileNumber: newMobile.trim() || undefined,
      guardianNumber: newGuardian.trim() || undefined,
      refInfo: newRefInfo.trim() || undefined,
      batchId: newBatchId,
      status: "ACTIVE",
      milestoneStage: newMilestone,
      documents: newDocsMap,
    });
    setIsSubmittingAdd(false);

    if (result.success) {
      setShowAddModal(false);
      setFeedback(`✓ নতুন শিক্ষার্থী ${newName} সফলভাবে যুক্ত হয়েছে!`);
      setTimeout(() => setFeedback(null), 4000);
      setNewIdCode("");
      setNewName("");
      setNewMobile("");
      setNewGuardian("");
      setNewRefInfo("");
      setNewMilestone("LANGUAGE_COURSE");
      setIsDocsSectionOpen(false);
      // Reset doc map
      const init: Record<string, StudentDocumentItem> = {};
      STANDARD_VISA_DOCUMENTS.forEach((d) => {
        init[d.id] = {
          id: d.id,
          title: d.title,
          isSubmitted: false,
          receivedDate: undefined,
          receivedBy: undefined,
          status: "PENDING",
          note: "",
        };
      });
      setNewDocsMap(init);
    } else {
      setFeedback(`⚠️ ${result.error || "শিক্ষার্থী যোগ করতে সমস্যা হয়েছে"}`);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentIdCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.guardianNumber && s.guardianNumber.includes(searchQuery)) ||
      (s.mobileNumber && s.mobileNumber.includes(searchQuery));

    const matchesBatch =
      selectedBatchFilter === "ALL" || s.batchId === selectedBatchFilter;

    const matchesStatus =
      statusFilter === "ALL" ? true : s.status === statusFilter;

    return matchesSearch && matchesBatch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            শিক্ষার্থী ডিরেক্টরি ও ম্যানেজমেন্ট (Student Directory)
          </h2>
          <p className="text-xs text-slate-500">
            শিক্ষার্থীদের তালিকা, নতুন স্টুডেন্ট যোগ, তথ্য এডিট ও ডিলিট পরিচালনা করুন।
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-[#F26622] hover:bg-[#D95314] text-white shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          নতুন শিক্ষার্থী যুক্ত করুন
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          {feedback}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="নাম, আইডি বা ফোন দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-2xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#662C90] outline-none font-semibold"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs font-bold px-3 py-2 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 outline-none"
          >
            <option value="ALL">সকল স্ট্যাটাস</option>
            <option value="ACTIVE">নিয়মিত (Active)</option>
            <option value="COMPLETED">কোর্স সম্পন্ন (Completed)</option>
          </select>

          {/* Batch Filter */}
          <select
            value={selectedBatchFilter}
            onChange={(e) => setSelectedBatchFilter(e.target.value)}
            className="text-xs font-bold px-3.5 py-2 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 outline-none max-w-xs"
          >
            <option value="ALL">সকল ব্যাচ ({students.length} জন)</option>
            <optgroup label="চলমান ব্যাচসমূহ (Running Batches)">
              {batches
                .filter((b) => b.status === "RUNNING")
                .map((b) => {
                  const count = students.filter(
                    (s) => s.batchId === b.id && s.status === "ACTIVE"
                  ).length;
                  return (
                    <option key={b.id} value={b.id}>
                      {b.name} ({count} জন)
                    </option>
                  );
                })}
            </optgroup>
            <optgroup label="সম্পন্ন ব্যাচসমূহ (Completed Batches)">
              {batches
                .filter((b) => b.status === "COMPLETED")
                .map((b) => {
                  const count = students.filter((s) => s.batchId === b.id).length;
                  return (
                    <option key={b.id} value={b.id}>
                      {b.name} ({count} জন)
                    </option>
                  );
                })}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">নং</th>
                <th className="py-3.5 px-4">আইডি ও নাম</th>
                <th className="py-3.5 px-4">ব্যাচ</th>
                <th className="py-3.5 px-4">অভিভাবক ফোন</th>
                <th className="py-3.5 px-4 text-center">উপস্থিতি</th>
                <th className="py-3.5 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, idx) => {
                  const summary = getStudentSummary(student.id);

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center text-slate-400 font-bold">
                        {idx + 1}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-extrabold text-[#662C90] bg-[#F7F2FA] px-1.5 py-0.5 rounded border border-[#E9D8FD]">
                            #{student.studentIdCode}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {student.name}
                            </span>
                            {student.mobileNumber && (
                              <span className="text-[10px] text-slate-400">
                                {student.mobileNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-slate-800 font-semibold px-2 py-0.5 rounded bg-slate-100">
                          {student.batchName || "অ্যাসাইন নেই"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {student.guardianNumber ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${student.guardianNumber}`}
                              className="text-slate-700 hover:text-[#F26622] font-mono text-[11px] font-bold flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-slate-400" />
                              {student.guardianNumber}
                            </a>
                            <button
                              type="button"
                              onClick={() =>
                                openWhatsApp(
                                  student.guardianNumber,
                                  getWhatsAppGeneralMsg(student.name, student.batchName)
                                )
                              }
                              className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 shadow-2xs"
                              title="অভিভাবককে WhatsApp বার্তা পাঠান"
                            >
                              <MessageSquare className="w-3 h-3 text-emerald-600" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {summary ? (
                          <span
                            className={`px-2 py-0.5 rounded-lg font-bold text-xs border ${
                              summary.attendancePercentage >= 80
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : summary.attendancePercentage >= 60
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-rose-50 text-rose-800 border-rose-200"
                            }`}
                          >
                            {summary.attendancePercentage}% ({summary.presentCount}/{summary.totalClasses})
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectStudent(student.id)}
                            className="px-3 py-1 rounded-xl text-xs font-bold bg-[#F7F2FA] text-[#662C90] hover:bg-[#E9D8FD] border border-[#E9D8FD]"
                          >
                            প্রোফাইল
                          </button>
                          <button
                            type="button"
                            title="তথ্য এডিট করুন"
                            onClick={() => handleOpenEdit(student)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-[#662C90] hover:bg-slate-100 border border-slate-200"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="শিক্ষার্থী রিমুভ করুন"
                            onClick={() => setStudentToDelete(student)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 font-medium">
                    কোনো শিক্ষার্থী পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Student Modal */}
      {showEditModal && studentToEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                শিক্ষার্থীর তথ্য এডিট করুন
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    স্টুডেন্ট আইডি *
                  </label>
                  <input
                    type="text"
                    required
                    value={editIdCode}
                    onChange={(e) => setEditIdCode(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono font-bold text-[#662C90]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    স্ট্যাটাস *
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-semibold"
                  >
                    <option value="ACTIVE">নিয়মিত (Active)</option>
                    <option value="COMPLETED">সম্পন্ন (Completed)</option>
                    <option value="INACTIVE">নিষ্ক্রিয় (Inactive)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  শিক্ষার্থীর পুরো নাম *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="text"
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    অভিভাবকের মোবাইল
                  </label>
                  <input
                    type="text"
                    value={editGuardian}
                    onChange={(e) => setEditGuardian(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ব্যাচ নির্বাচন *
                </label>
                <select
                  value={editBatchId}
                  onChange={(e) => setEditBatchId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-semibold"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.status === "RUNNING" ? "চলমান" : "সম্পন্ন"})
                    </option>
                  ))}
                </select>
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
                  পরিবর্তন সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 text-base">
                শিক্ষার্থী মুছে ফেলতে চান?
              </h3>
              <p className="text-xs text-slate-500">
                <strong>{studentToDelete.name}</strong> (#{studentToDelete.studentIdCode})-এর সমস্ত রেকর্ড ও হাজিরা মুছে যাবে।
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 rounded-2xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-2xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                হ্যাঁ, মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 max-h-[90vh] flex flex-col animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  নতুন শিক্ষার্থী যুক্ত করুন (Add New Student)
                </h3>
                <p className="text-[11px] text-slate-500">
                  মৌলিক তথ্যের পাশাপাশি ভর্তির সময় জমা নেওয়া ভিসা ডকুমেন্টস চেকলিস্ট যুক্ত করতে পারেন।
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-base p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    স্টুডেন্ট আইডি *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: 25240"
                    value={newIdCode}
                    onChange={(e) => setNewIdCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#662C90] outline-none font-bold text-[#662C90]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    শিক্ষার্থীর নাম *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: MD. RAHIM MIAH"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#662C90] outline-none font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="text"
                    placeholder="01711-xxxxxx"
                    value={newMobile}
                    onChange={(e) => setNewMobile(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#662C90] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    অভিভাবকের ফোন
                  </label>
                  <input
                    type="text"
                    placeholder="01811-xxxxxx"
                    value={newGuardian}
                    onChange={(e) => setNewGuardian(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#662C90] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ব্যাচ নির্বাচন *
                  </label>
                  <select
                    value={newBatchId}
                    onChange={(e) => setNewBatchId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#662C90] outline-none bg-white font-semibold"
                  >
                    <optgroup label="চলমান ব্যাচসমূহ (Running Batches)">
                      {batches
                        .filter((b) => b.status === "RUNNING")
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.scheduleDays})
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="অন্যান্য ব্যাচসমূহ">
                      {batches
                        .filter((b) => b.status === "COMPLETED")
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    বর্তমান পর্যায় (Milestone Stage)
                  </label>
                  <select
                    value={newMilestone}
                    onChange={(e) => setNewMilestone(e.target.value as MilestoneStage)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#662C90] outline-none bg-white font-semibold text-[#662C90]"
                  >
                    <option value="LANGUAGE_COURSE">১. ভাষা কোর্স চলমান (Language Course)</option>
                    <option value="INTERVIEW_SCHEDULED">২. ইন্টারভিউ শিডিউল্ড (Interview)</option>
                    <option value="COE_AWAITING">৩. COE প্রসেসিং (COE Awaiting)</option>
                    <option value="VISA_APPROVED">৪. ভিসা অনুমোদিত (Visa Approved)</option>
                    <option value="FLY_TO_JAPAN">৫. জাপান ফ্লাইট সম্পন্ন (Fly to Japan)</option>
                  </select>
                </div>
              </div>

              {/* Collapsible Visa Documents Checklist */}
              <div className="border border-purple-200 rounded-2xl bg-purple-50/40 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsDocsSectionOpen(!isDocsSectionOpen)}
                  className="w-full p-3.5 flex items-center justify-between font-bold text-slate-800 hover:bg-purple-100/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#662C90]" />
                    <span className="text-xs">জাপান ভিসা ডকুমেন্টস চেকলিস্ট (ভর্তির সময় জমা নেওয়া ফাইল)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#662C90] text-white">
                      {Object.values(newDocsMap).filter((d) => d.isSubmitted).length} / 27 জমা
                    </span>
                  </div>
                  {isDocsSectionOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>

                {isDocsSectionOpen && (
                  <div className="p-3.5 border-t border-purple-100 bg-white space-y-2.5 max-h-60 overflow-y-auto">
                    <p className="text-[11px] text-slate-500 italic pb-1">
                      যেসব ডকুমেন্ট শিক্ষার্থী জমা দিয়েছে সেগুলোতে টিক দিন। আজকের তারিখ ও লগইন করা অ্যাডমিনের নাম স্বয়ংক্রিয়ভাবে বসে যাবে।
                    </p>

                    <div className="divide-y divide-slate-100">
                      {STANDARD_VISA_DOCUMENTS.map((doc, idx) => {
                        const item = newDocsMap[doc.id] || {
                          id: doc.id,
                          title: doc.title,
                          isSubmitted: false,
                          status: "PENDING",
                          note: "",
                        };

                        return (
                          <div
                            key={doc.id}
                            className={`py-2 px-1.5 transition-colors rounded-xl ${
                              item.isSubmitted ? "bg-purple-50/50" : ""
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <label className="flex items-center gap-2 cursor-pointer flex-1">
                                <input
                                  type="checkbox"
                                  checked={item.isSubmitted}
                                  onChange={() => handleToggleNewDoc(doc.id, item.isSubmitted)}
                                  className="w-4 h-4 rounded text-[#662C90] focus:ring-[#662C90] cursor-pointer"
                                />
                                <span
                                  className={`text-xs ${
                                    item.isSubmitted ? "font-bold text-slate-900" : "text-slate-600"
                                  }`}
                                >
                                  {idx + 1}. {doc.title}
                                </span>
                              </label>

                              {item.isSubmitted && (
                                <div className="flex items-center gap-1.5">
                                  <select
                                    value={item.status || "OK"}
                                    onChange={(e) =>
                                      handleNewDocFieldChange(doc.id, "status", e.target.value)
                                    }
                                    className={`text-[10px] font-bold py-1 px-2 rounded-lg border outline-none ${
                                      item.status === "CORRECTION_NEEDED"
                                        ? "bg-rose-50 text-rose-800 border-rose-300 font-bold"
                                        : "bg-emerald-50 text-emerald-800 border-emerald-300"
                                    }`}
                                  >
                                    <option value="OK">সঠিক (OK)</option>
                                    <option value="CORRECTION_NEEDED">সংশোধন প্রয়োজন</option>
                                  </select>
                                </div>
                              )}
                            </div>

                            {item.isSubmitted && (
                              <div className="mt-2 pl-6 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                                <div>
                                  <input
                                    type="date"
                                    value={item.receivedDate || ""}
                                    onChange={(e) =>
                                      handleNewDocFieldChange(doc.id, "receivedDate", e.target.value)
                                    }
                                    className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-[11px]"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="text"
                                    placeholder="রিসিভারের নাম"
                                    value={item.receivedBy || ""}
                                    onChange={(e) =>
                                      handleNewDocFieldChange(doc.id, "receivedBy", e.target.value)
                                    }
                                    className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-[11px]"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="text"
                                    placeholder="মন্তব্য / কারেকশন নোট"
                                    value={item.note || ""}
                                    onChange={(e) =>
                                      handleNewDocFieldChange(doc.id, "note", e.target.value)
                                    }
                                    className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-[11px]"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-2xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-6 py-2.5 rounded-2xl font-bold bg-[#F26622] hover:bg-[#D95314] text-white shadow-sm disabled:opacity-50 transition-all flex items-center gap-1"
                >
                  {isSubmittingAdd ? "সংরক্ষণ হচ্ছে..." : "শিক্ষার্থী যুক্ত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
