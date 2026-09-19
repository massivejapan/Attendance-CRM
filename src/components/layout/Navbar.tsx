"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Users,
  GraduationCap,
  ShieldCheck,
  Calendar,
  ChevronDown,
} from "lucide-react";

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { currentUser, users, loginAs } = useApp();
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    setFormattedDate(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    );
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#662C90] flex items-center justify-center text-white">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-slate-900 tracking-tight">
                  <span className="text-[#F26622]">MJLI</span>{" "}
                  <span className="text-[#662C90]">Attendance</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  CRM
                </span>
              </div>
              {formattedDate && (
                <p className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {formattedDate}
                </p>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200">
            {currentUser?.role === "SUPER_ADMIN" ? (
              <>
                <button
                  onClick={() => setCurrentTab("dashboard")}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                    currentTab === "dashboard"
                      ? "bg-white text-[#662C90] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  ড্যাশবোর্ড
                </button>
                <button
                  onClick={() => setCurrentTab("attendance")}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                    currentTab === "attendance"
                      ? "bg-[#F26622] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  হাজিরা গ্রহণ
                </button>
                <button
                  onClick={() => setCurrentTab("students")}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                    currentTab === "students"
                      ? "bg-white text-[#662C90] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  শিক্ষার্থী
                </button>
                <button
                  onClick={() => setCurrentTab("teachers")}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                    currentTab === "teachers"
                      ? "bg-white text-[#662C90] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  শিক্ষক ট্র্যাকিং
                </button>
                <button
                  onClick={() => setCurrentTab("batches")}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                    currentTab === "batches"
                      ? "bg-white text-[#662C90] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  ব্যাচসমূহ
                </button>
                <button
                  onClick={() => setCurrentTab("reports")}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                    currentTab === "reports"
                      ? "bg-white text-[#662C90] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  রিপোর্ট
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setCurrentTab("attendance")}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${
                    currentTab === "attendance"
                      ? "bg-[#F26622] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  হাজিরা শিট
                </button>
                <button
                  onClick={() => setCurrentTab("history")}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${
                    currentTab === "history"
                      ? "bg-white text-[#662C90] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  আমার ক্লাস নোট
                </button>
              </>
            )}
          </nav>

          {/* User Role Switcher Dropdown */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="w-6 h-6 rounded bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                  {currentUser?.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1">
                    {currentUser?.name}
                    {currentUser?.role === "SUPER_ADMIN" ? (
                      <ShieldCheck className="w-3 h-3 text-[#662C90] inline" />
                    ) : (
                      <Users className="w-3 h-3 text-[#F26622] inline" />
                    )}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {currentUser?.role === "SUPER_ADMIN"
                      ? "Super Admin"
                      : "Teacher"}
                  </p>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
              </div>

              {/* Fast User Switcher */}
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1 hidden group-hover:block transition-all z-50">
                <div className="px-3 py-1 border-b border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    সুইচ অ্যাকাউন্ট
                  </p>
                </div>
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      loginAs(u.id);
                      if (u.role === "TEACHER") setCurrentTab("attendance");
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors ${
                      currentUser?.id === u.id
                        ? "bg-slate-50 font-bold text-[#F26622]"
                        : "text-slate-700"
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {u.role === "SUPER_ADMIN" ? "Admin" : `@${u.username}`}
                      </p>
                    </div>
                    {currentUser?.id === u.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F26622]"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
