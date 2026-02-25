"use client";

import { useState } from "react";
import { Search, Bell, Settings, User, LogOut, UserCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/tasks": "My Tasks",
  "/planner": "Study Planner",
  "/peers": "PeerConnect",
  "/events": "Events",
  "/analytics": "Analytics",
  "/alerts": "Risk Alerts",
};

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = pageTitles[pathname] || "Dashboard";
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

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

        {/* User Avatar */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-10 h-10 rounded-lg border border-neutral-200 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white hover:shadow-md hover:shadow-indigo-200/50 transition-all duration-300 group"
          >
            <User size={18} className="group-hover:scale-110 transition-transform duration-300" />
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              
              {/* Dropdown */}
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-neutral-200 shadow-xl z-50 overflow-hidden animate-[fadeIn_0.15s_ease]">
                {/* Profile Section */}
                <div className="p-4 border-b border-neutral-100 bg-gradient-to-br from-indigo-50 to-purple-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">Student</p>
                      <p className="text-xs text-neutral-500">student@edusense.com</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push("/dashboard");
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center gap-3"
                  >
                    <UserCircle size={16} />
                    My Profile
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}