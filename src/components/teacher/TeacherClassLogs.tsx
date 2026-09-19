"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { BookOpen, Search } from "lucide-react";

export const TeacherClassLogs: React.FC = () => {
  const { currentUser, classLogs, batches } = useApp();
  const [searchQuery, setSearchQuery] = useState("");

  const myLogs = classLogs
    .filter((cl) => cl.teacherId === currentUser?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredLogs = myLogs.filter(
    (log) =>
      log.topicCovered.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.date.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            আমার ক্লাসের বিবরণ ও সিলেবাস নোট (My Class Logs)
          </h2>
          <p className="text-xs text-slate-500">
            আপনার সাবমিট করা পূর্ববর্তী সকল ক্লাসের তারিখ, উপস্থিতি ও সিলেবাসের
            তালিকা।
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ক্লাস নোট খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#662C90]"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => {
            const batch = batches.find((b) => b.id === log.batchId);
            return (
              <div
                key={log.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {batch?.name || "ব্যাচ"}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-[#F7F2FA] text-[#662C90] border border-[#E9D8FD]">
                      {log.date} ({log.dayName})
                    </span>
                  </div>

                  <span className="font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full text-[11px] border border-emerald-200">
                    {log.presentCount}/{log.totalStudents} জন উপস্থিত (
                    {Math.round((log.presentCount / log.totalStudents) * 100)}%)
                  </span>
                </div>

                <div className="space-y-1.5">
                  <p className="text-slate-800 leading-relaxed font-semibold">
                    <strong className="text-slate-400 font-medium">
                      পড়ানো হয়েছে:
                    </strong>{" "}
                    {log.topicCovered}
                  </p>
                  {log.homework && (
                    <p className="text-slate-600 italic bg-slate-50 p-3 rounded-2xl border border-slate-100 font-medium">
                      <strong className="text-slate-400 font-medium">
                        হোমওয়ার্ক:
                      </strong>{" "}
                      {log.homework}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400">
            এখনও কোনো ক্লাসের রেকর্ড পাওয়া যায়নি।
          </div>
        )}
      </div>
    </div>
  );
};
