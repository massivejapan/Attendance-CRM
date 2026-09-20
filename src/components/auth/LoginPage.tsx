"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  GraduationCap,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export const LoginPage: React.FC = () => {
  const { login } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("দয়া করে ইউজারনেম এবং পাসওয়ার্ড প্রদান করুন");
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await login(username.trim(), password.trim());
    if (!res.success) {
      setError(res.error || "ইউজারনেম বা পাসওয়ার্ড ভুল হয়েছে!");
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Brand Card */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#662C90] text-white shadow-md mb-3">
            <GraduationCap className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            <span className="text-[#F26622]">MJLI</span>{" "}
            <span className="text-[#662C90]">Attendance</span> CRM
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            ম্যাসিভ জাপান ল্যাঙ্গুয়েজ ইনস্টিটিউট — স্মার্ট হাজিরা ও ট্র্যাকিং পোর্টাল
          </p>
        </div>

        {/* Main Login Box */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <LogIn className="w-5 h-5 text-[#F26622]" />
              সিস্টেমে লগইন করুন
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              আপনার ইউজারনেম/ইমেইল এবং পাসওয়ার্ড দিয়ে প্রবেশ করুন।
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ইউজারনেম অথবা ইমেইল (Username / Email)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="যেমন: admin বা teacher username"
                  required
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#662C90] focus:ring-2 focus:ring-[#662C90]/10 outline-none font-medium text-slate-800 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                পাসওয়ার্ড (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#662C90] focus:ring-2 focus:ring-[#662C90]/10 outline-none font-medium text-slate-800 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#F26622] hover:bg-[#d95315] active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  যাচাই করা হচ্ছে...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  লগইন করুন
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Selector for Admin Testing */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#662C90]" />
              টেস্টিং / ডেমো দ্রুত সিলেক্টর (Quick Login):
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin", "admin123")}
                className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/70 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#662C90]" />
                  <span className="text-xs font-black text-[#662C90]">
                    Super Admin
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  User: <code className="text-purple-900 font-mono">admin</code> | Pass: <code className="text-purple-900 font-mono">admin123</code>
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("mam", "teacher123")}
                className="p-2.5 rounded-xl border border-orange-200 bg-orange-50/60 hover:bg-orange-100/70 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#F26622]" />
                  <span className="text-xs font-black text-[#F26622]">
                    MAM Sir (Teacher)
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  User: <code className="text-orange-900 font-mono">mam</code> | Pass: <code className="text-orange-900 font-mono">teacher123</code>
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("shakil", "teacher123")}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left text-[11px] text-slate-700 font-bold transition-all"
              >
                Shakil Sir (<code className="font-mono text-[10px]">shakil</code>)
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("nazrul", "teacher123")}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left text-[11px] text-slate-700 font-bold transition-all"
              >
                Nazrul Sir (<code className="font-mono text-[10px]">nazrul</code>)
              </button>
            </div>
          </div>
        </div>

        {/* Security & Support Note */}
        <div className="text-center mt-4">
          <p className="text-[11px] text-slate-500">
            শিক্ষকদের ইউজার ও পাসওয়ার্ড সুপার অ্যাডমিন প্যানেল থেকে তৈরি ও পরিবর্তন করা যাবে।
          </p>
        </div>
      </div>
    </div>
  );
};
