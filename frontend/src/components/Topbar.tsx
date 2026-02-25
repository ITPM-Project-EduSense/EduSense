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
    <header className="sticky top-0 z-40 h-16 bg-gradient-to-r from-slate-50 to-indigo-50/50 backdrop-blur-lg px-8 flex items-center justify-between border-b border-white/50">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px]">
        <span className="font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">EduSense</span>
        <span className="text-neutral-300">/</span>
        <span className="text-neutral-700 font-semibold">{pageTitle}</span>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-3 bg-white border border-neutral-200 rounded-xl px-4 py-2.5 w-[300px] transition-all duration-300 focus-within:border-indigo-500 focus-within:shadow-md focus-within:border-opacity-50 hover:border-neutral-300 group">
          <Search size={16} className="text-neutral-400 flex-shrink-0 group-focus-within:text-indigo-600 transition-colors duration-300" />
          <input
            type="text"
            placeholder="Search tasks, subjects..."
            className="border-none outline-none bg-transparent text-[13px] text-neutral-800 w-full placeholder:text-neutral-400"
          />
        </div>

        {/* Notification */}
        <button className="relative w-40 h-10 rounded-lg border border-neutral-200 bg-white flex items-center justify-center text-neutral-600 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md hover:shadow-indigo-200/50 transition-all duration-300 group">
          <Bell size={18} className="group-hover:scale-110 transition-transform duration-300" />
          <span className="absolute top-2 right-2 w-[7px] h-[7px] bg-gradient-to-r from-rose-500 to-pink-500 rounded-full border-[1.5px] border-white shadow-lg shadow-rose-500/30 animate-pulse" />
        </button>

        {/* Settings */}
        <button className="w-10 h-10 rounded-lg border border-neutral-200 bg-white flex items-center justify-center text-neutral-600 hover:border-purple-300 hover:text-purple-600 hover:shadow-md hover:shadow-purple-200/50 transition-all duration-300 group">
          <Settings size={18} className="group-hover:rotate-90 group-hover:scale-110 transition-all duration-300" />
        </button>
      </div>
    </header>
  );
}