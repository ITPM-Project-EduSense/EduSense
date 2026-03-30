"use client";

import { Bell, Menu, Search, X } from "lucide-react";
import { useSearch } from "@/context/SearchContext";

type CurrentUser = {
  full_name?: string;
  email?: string;
} | null;

type HeaderProps = {
  onMenuClick: () => void;
  user: CurrentUser;
};

export default function Header({ onMenuClick, user }: HeaderProps) {
  const { searchQuery, setSearchQuery, clearSearch } = useSearch();

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase())
        .join("")
    : "U";

  return (
    <header className="sticky top-0 z-30 bg-white px-4 py-4 shadow-sm md:px-6">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-xl bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Dashboard
          </p>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 md:text-xl">
            Study Workspace
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 md:flex md:w-72 group hover:bg-slate-200 transition">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks, subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="text-slate-400 hover:text-slate-600 transition"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          className="rounded-xl bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-2.5 py-1.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-700">
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
      </div>
    </header>
  );
}
