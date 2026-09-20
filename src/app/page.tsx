"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Navbar } from "@/components/layout/Navbar";
import { LoginPage } from "@/components/auth/LoginPage";
import { AttendanceSheet } from "@/components/teacher/AttendanceSheet";
import { TeacherClassLogs } from "@/components/teacher/TeacherClassLogs";
import { DashboardOverview } from "@/components/admin/DashboardOverview";
import { StudentManagement } from "@/components/admin/StudentManagement";
import { TeacherManagement } from "@/components/admin/TeacherManagement";
import { BatchManagement } from "@/components/admin/BatchManagement";
import { ReportsView } from "@/components/admin/ReportsView";
import { StudentProfileDrawer } from "@/components/admin/StudentProfileDrawer";

export default function HomePage() {
  const { currentUser, isLoading } = useApp();
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // If user is not logged in, show Login Page
  if (!currentUser) {
    return <LoginPage />;
  }

  // If user is teacher and on a restricted tab, strictly route to attendance
  const isTeacher = currentUser.role === "TEACHER";
  const effectiveTab = isTeacher && currentTab !== "attendance" && currentTab !== "history"
    ? "attendance"
    : currentTab;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <Navbar currentTab={effectiveTab} setCurrentTab={setCurrentTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Super Admin Tabs */}
        {!isTeacher && effectiveTab === "dashboard" && (
          <DashboardOverview
            onSelectStudent={(id) => setSelectedStudentId(id)}
            onNavigateToTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {!isTeacher && effectiveTab === "students" && (
          <StudentManagement
            onSelectStudent={(id) => setSelectedStudentId(id)}
          />
        )}

        {!isTeacher && effectiveTab === "teachers" && <TeacherManagement />}

        {!isTeacher && effectiveTab === "batches" && (
          <BatchManagement
            onSelectStudent={(id) => setSelectedStudentId(id)}
          />
        )}

        {!isTeacher && effectiveTab === "reports" && <ReportsView />}

        {/* Teacher & Super Admin Shared / Dedicated Tabs */}
        {effectiveTab === "attendance" && (
          <AttendanceSheet
            onSelectStudent={(id) => setSelectedStudentId(id)}
          />
        )}

        {effectiveTab === "history" && <TeacherClassLogs />}
      </main>

      {/* Student Profile Drawer / Modal */}
      <StudentProfileDrawer
        studentId={selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
      />
    </div>
  );
}
