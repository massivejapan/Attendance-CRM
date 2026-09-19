"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Navbar } from "@/components/layout/Navbar";
import { AttendanceSheet } from "@/components/teacher/AttendanceSheet";
import { TeacherClassLogs } from "@/components/teacher/TeacherClassLogs";
import { DashboardOverview } from "@/components/admin/DashboardOverview";
import { StudentManagement } from "@/components/admin/StudentManagement";
import { TeacherManagement } from "@/components/admin/TeacherManagement";
import { BatchManagement } from "@/components/admin/BatchManagement";
import { ReportsView } from "@/components/admin/ReportsView";
import { StudentProfileDrawer } from "@/components/admin/StudentProfileDrawer";

export default function HomePage() {
  const { currentUser } = useApp();
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null
  );

  // If user is teacher and on a tab they cannot access, redirect to attendance
  const effectiveTab =
    currentUser?.role === "TEACHER" &&
    currentTab !== "attendance" &&
    currentTab !== "history"
      ? "attendance"
      : currentTab;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <Navbar currentTab={effectiveTab} setCurrentTab={setCurrentTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Render Tab View */}
        {effectiveTab === "dashboard" && (
          <DashboardOverview
            onSelectStudent={(id) => setSelectedStudentId(id)}
            onNavigateToTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {effectiveTab === "attendance" && (
          <AttendanceSheet
            onSelectStudent={(id) => setSelectedStudentId(id)}
          />
        )}

        {effectiveTab === "students" && (
          <StudentManagement
            onSelectStudent={(id) => setSelectedStudentId(id)}
          />
        )}

        {effectiveTab === "teachers" && <TeacherManagement />}

        {effectiveTab === "batches" && (
          <BatchManagement
            onSelectStudent={(id) => setSelectedStudentId(id)}
          />
        )}

        {effectiveTab === "reports" && <ReportsView />}

        {effectiveTab === "history" && <TeacherClassLogs />}
      </main>

      {/* Student Profile Drawer / Modal (Available globally) */}
      <StudentProfileDrawer
        studentId={selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
      />
    </div>
  );
}
