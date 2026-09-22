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
  Menu,
  X,
  Home,
  ClipboardList,
  UserCheck,
  Layers,
  FileText,
  Clock,
  ArrowLeft,
  RefreshCw,
  Phone,
} from "lucide-react";

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { currentUser, users, loginAs, logout, returnToSuperAdmin } = useApp();
  const [formattedDate, setFormattedDate] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setFormattedDate(
      new Date().toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    );
  }, []);

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const hasSuperAdminAccount = users.some((u) => u.role === "SUPER_ADMIN");

  const handleTabClick = (tab: string) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top Warning Banner if Admin is Viewing as Teacher */}
      {!isSuperAdmin && hasSuperAdminAccount && (
        <div className="bg-gradient-to-r from-[#662C90] via-purple-700 to-[#F26622] text-white px-4 py-2 text-xs font-bold shadow-md flex items-center justify-between sticky top-0 z-50 animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">
              👁️ আপনি বর্তমানে <strong>{currentUser?.name}</strong> (শিক্ষক)-এর ভিউতে আছেন।
            </span>
          </div>
          <button
            onClick={() => {
              returnToSuperAdmin();
              setCurrentTab("dashboard");
            }}
            className="shrink-0 ml-2 px-3 py-1 rounded-lg bg-white text-[#662C90] hover:bg-purple-50 font-black text-xs shadow-sm flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>সুপার অ্যাডমিনে ফিরুন</span>
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => handleTabClick(isSuperAdmin ? "dashboard" : "attendance")}
                className="flex items-center gap-2.5 text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-[#662C90] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-base text-slate-900 tracking-tight">
                      <span className="text-[#F26622]">MJLI</span>{" "}
                      <span className="text-[#662C90]">Attendance</span>
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                        isSuperAdmin
                          ? "bg-purple-100 text-[#662C90] border border-purple-200"
                          : "bg-[#FFF4EE] text-[#F26622] border border-[#FED7AA]"
                      }`}
                    >
                      {isSuperAdmin ? "ADMIN CRM" : "TEACHER"}
                    </span>
                  </div>
                  {formattedDate && (
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formattedDate}
                    </p>
                  )}
                </div>
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
              {isSuperAdmin ? (
                <>
                  <button
                    onClick={() => handleTabClick("dashboard")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      currentTab === "dashboard"
                        ? "bg-white text-[#662C90] shadow-xs font-black"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                    ড্যাশবোর্ড
                  </button>
                  <button
                    onClick={() => handleTabClick("attendance")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      currentTab === "attendance"
                        ? "bg-[#F26622] text-white shadow-xs font-black"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    হাজিরা গ্রহণ
                  </button>
                  <button
                    onClick={() => handleTabClick("students")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      currentTab === "students"
                        ? "bg-white text-[#662C90] shadow-xs font-black"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    শিক্ষার্থী
                  </button>
                  <button
                    onClick={() => handleTabClick("teachers")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      currentTab === "teachers"
                        ? "bg-white text-[#662C90] shadow-xs font-black"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    শিক্ষক ট্র্যাকিং
                  </button>
                  <button
                    onClick={() => handleTabClick("batches")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      currentTab === "batches"
                        ? "bg-white text-[#662C90] shadow-xs font-black"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    ব্যাচসমূহ
                  </button>
                  <button
                    onClick={() => handleTabClick("reports")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      currentTab === "reports"
                        ? "bg-white text-[#662C90] shadow-xs font-black"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    রিপোর্ট
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleTabClick("attendance")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      currentTab === "attendance"
                        ? "bg-[#F26622] text-white shadow-xs font-black"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <ClipboardList className="w-4 h-4" />
                    হাজিরা শিট (Take Attendance)
                  </button>
                  <button
                    onClick={() => handleTabClick("history")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      currentTab === "history"
                        ? "bg-white text-[#662C90] shadow-xs font-black"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    আমার ক্লাস লগ (My Class Logs)
                  </button>
                </>
              )}
            </nav>

            {/* User Profile & Mobile Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quick Home / Back to Dashboard button on tablet/mobile */}
              {isSuperAdmin && currentTab !== "dashboard" && (
                <button
                  type="button"
                  onClick={() => handleTabClick("dashboard")}
                  title="মূল ড্যাশবোর্ডে ফিরুন"
                  className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 text-[#662C90] border border-purple-200 hover:bg-purple-100 text-xs font-bold transition-all"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>ড্যাশবোর্ড</span>
                </button>
              )}

              {/* User Dropdown for Desktop */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-1.5 hover:bg-slate-100 transition-colors"
                >
                  <div
                    className={`w-7 h-7 rounded-lg text-white font-black text-xs flex items-center justify-center ${
                      isSuperAdmin ? "bg-[#662C90]" : "bg-[#F26622]"
                    }`}
                  >
                    {currentUser?.name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1">
                      {currentUser?.name}
                      {isSuperAdmin && <ShieldCheck className="w-3.5 h-3.5 text-[#662C90] inline" />}
                    </p>
                    <p
                      className={`text-[10px] font-bold ${
                        isSuperAdmin ? "text-purple-700" : "text-[#F26622]"
                      }`}
                    >
                      {isSuperAdmin ? "Super Admin" : "Teacher"}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <p className="text-[11px] font-bold text-slate-800">{currentUser?.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">@{currentUser?.username}</p>
                    </div>

                    {/* Switch Account Section */}
                    <div className="px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        প্রোফাইল পরিবর্তন / প্রিভিউ
                      </p>
                      <Sparkles className="w-3 h-3 text-[#662C90]" />
                    </div>

                    <div className="max-h-56 overflow-y-auto">
                      {users.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            loginAs(u.id);
                            setShowDropdown(false);
                            if (u.role === "TEACHER") setCurrentTab("attendance");
                            if (u.role === "SUPER_ADMIN") setCurrentTab("dashboard");
                          }}
                          className={`w-full text-left px-3.5 py-2 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors ${
                            currentUser?.id === u.id
                              ? "bg-purple-50 font-bold text-[#662C90]"
                              : "text-slate-700"
                          }`}
                        >
                          <div>
                            <p className="font-semibold">{u.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {u.role === "SUPER_ADMIN" ? "Super Admin" : `@${u.username}`}
                            </p>
                          </div>
                          {currentUser?.id === u.id && (
                            <span className="w-2 h-2 rounded-full bg-[#662C90]" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 px-2 space-y-1">
                      {!isSuperAdmin && hasSuperAdminAccount && (
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            returnToSuperAdmin();
                            setCurrentTab("dashboard");
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#662C90] font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          সুপার অ্যাডমিনে ফিরুন
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          logout();
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        লগআউট (Logout)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-rose-600" />
                ) : (
                  <Menu className="w-5 h-5 text-slate-800" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-start">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative bg-white w-full max-w-sm ml-auto h-full shadow-2xl flex flex-col border-l border-slate-200 z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl text-white font-black text-sm flex items-center justify-center shadow-xs ${
                    isSuperAdmin ? "bg-[#662C90]" : "bg-[#F26622]"
                  }`}
                >
                  {currentUser?.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm leading-tight">
                    {currentUser?.name}
                  </h3>
                  <span
                    className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      isSuperAdmin
                        ? "bg-purple-100 text-[#662C90]"
                        : "bg-[#FFF4EE] text-[#F26622]"
                    }`}
                  >
                    {isSuperAdmin ? "Super Admin" : "Teacher Account"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Return to Admin Banner inside Drawer */}
            {!isSuperAdmin && hasSuperAdminAccount && (
              <div className="p-3 bg-purple-50 border-b border-purple-200">
                <button
                  onClick={() => {
                    returnToSuperAdmin();
                    handleTabClick("dashboard");
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#662C90] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <RefreshCw className="w-4 h-4 animate-spin-reverse" />
                  সুপার অ্যাডমিন অ্যাকাউন্টে ফিরে যান
                </button>
              </div>
            )}

            {/* Navigation Tabs List */}
            <div className="p-4 space-y-1.5 flex-1 overflow-y-auto">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 mb-2">
                মেন্যু নির্বাচন করুন
              </p>

              {isSuperAdmin ? (
                <>
                  <button
                    onClick={() => handleTabClick("dashboard")}
                    className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-extrabold flex items-center gap-3 transition-all ${
                      currentTab === "dashboard"
                        ? "bg-[#662C90] text-white shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    <span>📊 মূল ড্যাশবোর্ড (Dashboard)</span>
                  </button>

                  <button
                    onClick={() => handleTabClick("attendance")}
                    className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-extrabold flex items-center gap-3 transition-all ${
                      currentTab === "attendance"
                        ? "bg-[#F26622] text-white shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>📝 হাজিরা গ্রহণ (Take Attendance)</span>
                  </button>

                  <button
                    onClick={() => handleTabClick("students")}
                    className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-extrabold flex items-center gap-3 transition-all ${
                      currentTab === "students"
                        ? "bg-[#662C90] text-white shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>👥 শিক্ষার্থী তালিকা ও ট্র্যাকিং</span>
                  </button>

                  <button
                    onClick={() => handleTabClick("teachers")}
                    className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-extrabold flex items-center gap-3 transition-all ${
                      currentTab === "teachers"
                        ? "bg-[#662C90] text-white shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>👨‍🏫 শিক্ষক ব্যবস্থাপনা ও পাসওয়ার্ড</span>
                  </button>

                  <button
                    onClick={() => handleTabClick("batches")}
                    className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-extrabold flex items-center gap-3 transition-all ${
                      currentTab === "batches"
                        ? "bg-[#662C90] text-white shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>📚 ব্যাচসমূহ ও শিডিউল</span>
                  </button>

                  <button
                    onClick={() => handleTabClick("reports")}
                    className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-extrabold flex items-center gap-3 transition-all ${
                      currentTab === "reports"
                        ? "bg-[#662C90] text-white shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>📑 এক্সেল রিপোর্ট ও হাজিরা শিট</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleTabClick("attendance")}
                    className={`w-full text-left px-3.5 py-3.5 rounded-xl text-xs font-extrabold flex items-center gap-3 transition-all ${
                      currentTab === "attendance"
                        ? "bg-[#F26622] text-white shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>📝 হাজিরা শিট (Take Attendance)</span>
                  </button>

                  <button
                    onClick={() => handleTabClick("history")}
                    className={`w-full text-left px-3.5 py-3.5 rounded-xl text-xs font-extrabold flex items-center gap-3 transition-all ${
                      currentTab === "history"
                        ? "bg-[#662C90] text-white shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>📋 আমার পূর্ববর্তী ক্লাস লগ</span>
                  </button>
                </>
              )}

              {/* Switch User Quick Section on Mobile */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 mb-2">
                  অ্যাকাউন্ট পরিবর্তন করুন
                </p>
                <div className="space-y-1">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        loginAs(u.id);
                        setMobileMenuOpen(false);
                        if (u.role === "TEACHER") setCurrentTab("attendance");
                        if (u.role === "SUPER_ADMIN") setCurrentTab("dashboard");
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between ${
                        currentUser?.id === u.id
                          ? "bg-purple-100 font-extrabold text-[#662C90]"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span>{u.name} ({u.role === "SUPER_ADMIN" ? "Admin" : "Teacher"})</span>
                      {currentUser?.id === u.id && (
                        <span className="w-2 h-2 rounded-full bg-[#662C90]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer Logout */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs flex items-center justify-center gap-2 transition-all border border-rose-200"
              >
                <LogOut className="w-4 h-4" />
                <span>লগআউট করুন (Logout)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
