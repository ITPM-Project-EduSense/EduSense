"use client";

import { Search, Bell, Settings } from "lucide-react";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/": "Smart Study Planner",
  "/tasks": "My Tasks",
  "/planner": "Study Planner",
  "/peers": "PeerConnect",
  "/events": "Events",
  "/analytics": "Analytics",
  "/alerts": "Risk Alerts",
};

export default function Topbar() {
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] || "Dashboard";

  return (
    <header className="sticky top-0 z-40 h-16 bg-[#FAFBFD]/85 backdrop-blur-xl border-b border-slate-100 px-8 flex items-center justify-between">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px]">
        <span className="text-slate-500">EduSense</span>
        <span className="text-slate-400">/</span>
        <span className="text-slate-800 font-medium">{pageTitle}</span>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3.5 py-2 w-[280px] transition-all duration-200 focus-within:border-indigo-500 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]">
          <Search size={16} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search tasks, subjects..."
            className="border-none outline-none bg-transparent text-[13px] text-slate-800 w-full placeholder:text-slate-400"
          />
        </div>

        {/* Notification */}
        <button className="relative w-[38px] h-[38px] rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-indigo-500 hover:text-indigo-500 hover:shadow-sm transition-all duration-200">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-[7px] h-[7px] bg-red-500 rounded-full border-[1.5px] border-white" />
        </button>

        {/* Settings */}
        <button className="w-[38px] h-[38px] rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-indigo-500 hover:text-indigo-500 hover:shadow-sm transition-all duration-200">
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}