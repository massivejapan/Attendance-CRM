"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Users,
  GraduationCap,
  ShieldCheck,
  Calendar,
  ChevronDown,
  LogOut,
  Sparkles,
} from "lucide-react";

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { currentUser, users, loginAs, logout } = useApp();
  const [formattedDate, setFormattedDate] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState(false);

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

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#662C90] flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-slate-900 tracking-tight">
                  <span className="text-[#F26622]">MJLI</span>{" "}
                  <span className="text-[#662C90]">Attendance</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                  {isSuperAdmin ? "ADMIN CRM" : "TEACHER"}
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
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
            {isSuperAdmin ? (
              <>
                <button
                  onClick={() => setCurrentTab("dashboard")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    currentTab === "dashboard"
                      ? "bg-white text-[#662C90] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  ড্যাশবোর্ড
                </button>
                <button
                  onClick={() => setCurrentTab("attendance")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    currentTab === "attendance"
                      ? "bg-[#F26622] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  হাজিরা গ্রহণ
                </button>
                <button
                  onClick={() => setCurrentTab("students")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    currentTab === "students"
                      ? "bg-white text-[#662C90] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  শিক্ষার্থী
                </button>
                <button
                  onClick={() => setCurrentTab("teachers")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    currentTab === "teachers"
                      ? "bg-white text-[#662C90] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  শিক্ষক ট্র্যাকিং
                </button>
                <button
                  onClick={() => setCurrentTab("batches")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    currentTab === "batches"
                      ? "bg-white text-[#662C90] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  ব্যাচসমূহ
                </button>
                <button
                  onClick={() => setCurrentTab("reports")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    currentTab === "reports"
                      ? "bg-white text-[#662C90] shadow-xs"
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
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    currentTab === "attendance"
                      ? "bg-[#F26622] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  হাজিরা শিট (Take Attendance)
                </button>
                <button
                  onClick={() => setCurrentTab("history")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    currentTab === "history"
                      ? "bg-white text-[#662C90] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  আমার ক্লাস লগ (My Class Logs)
                </button>
              </>
            )}
          </nav>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isSuperAdmin ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 hover:bg-slate-100 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#662C90] text-white font-bold text-xs flex items-center justify-center">
                    {currentUser?.name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1">
                      {currentUser?.name}
                      <ShieldCheck className="w-3.5 h-3.5 text-[#662C90] inline" />
                    </p>
                    <p className="text-[10px] text-purple-700 font-semibold">
                      Super Admin
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        অ্যাকাউন্ট পরিবর্তন
                      </p>
                      <Sparkles className="w-3 h-3 text-[#662C90]" />
                    </div>
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          loginAs(u.id);
                          setShowDropdown(false);
                          if (u.role === "TEACHER") setCurrentTab("attendance");
                        }}
                        className={`w-full text-left px-3.5 py-2 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors ${
                          currentUser?.id === u.id
                            ? "bg-purple-50/70 font-bold text-[#662C90]"
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
                          <span className="w-2 h-2 rounded-full bg-[#662C90]"></span>
                        )}
                      </button>
                    ))}

                    <div className="mt-2 pt-2 border-t border-slate-100 px-2">
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          logout();
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        লগআউট করুন (Logout)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                  <div className="w-7 h-7 rounded-lg bg-[#F26622] text-white font-bold text-xs flex items-center justify-center">
                    {currentUser?.name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      {currentUser?.name}
                    </p>
                    <p className="text-[10px] text-[#F26622] font-semibold">
                      শিক্ষক (Teacher)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => logout()}
                  title="লগআউট"
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-600 transition-all flex items-center gap-1 text-xs font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">লগআউট</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
