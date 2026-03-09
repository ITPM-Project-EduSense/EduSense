"use client";

import { Bell, Menu, Search } from "lucide-react";

type CurrentUser = {
  full_name?: string;
  email?: string;
} | null;

type HeaderProps = {
  onMenuClick: () => void;
  user: CurrentUser;
};

export default function Header({ onMenuClick, user }: HeaderProps) {
  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase())
        .join("")
    : "U";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Dashboard
          </p>
          <h1 className="text-lg font-semibold text-slate-900">
            EduSense Command Center
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 md:flex md:w-72">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks or subjects"
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>

        <button
          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-2.5 py-1.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-xs font-semibold text-white">
            {initials}
          </span>
          <div className="hidden md:block">
            <p className="max-w-32 truncate text-xs font-medium text-slate-800">
              {user?.full_name || "Student"}
            </p>
            <p className="max-w-32 truncate text-[11px] text-slate-500">
              {user?.email || "student@edusense.app"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
