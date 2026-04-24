"use client";

import { API_ROOT } from "@/lib/api";
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  LogOut,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

type TopbarProps = {
  onMenuClick: () => void;
  onSidebarToggle: () => void;
  sidebarCollapsed: boolean;
  user: {
    full_name?: string;
    email?: string;
  } | null;
  theme?: "light" | "dark";
};

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/tasks": "Tasks",
  "/planner": "Planner",
  "/materials": "Materials",
  "/ai": "AI Assistant",
  "/analytics": "Analytics",
  "/users": "User Management",
  "/notifications": "Notifications",
  "/settings": "Settings",
  "/profile": "Profile",
};

export default function Topbar({
  onMenuClick,
  onSidebarToggle,
  sidebarCollapsed,
  user,
  theme = "light",
}: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isDark = theme === "dark";
  const pageTitle = pageTitles[pathname] || "Overview";
  const userInitials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  const handleLogout = async () => {
    try {
      await fetch(`${API_ROOT}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header
      className={`sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 backdrop-blur lg:px-6 ${
        isDark ? "border-slate-800 bg-slate-950/85" : "border-slate-200 bg-white/95"
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className={`rounded-lg border p-2 lg:hidden ${
            isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"
          }`}
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>

        <button
          onClick={onSidebarToggle}
          className={`hidden rounded-lg border p-2 lg:inline-flex ${
            isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"
          }`}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        <div>
          <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>Workspace</p>
          <h1 className={`text-lg font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>{pageTitle}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-3">
        <button
          onClick={() => router.push("/settings")}
          className={`rounded-lg border p-2 ${
            isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"
          }`}
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>

        <button
          onClick={() => router.push("/users")}
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${
            isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"
          }`}
          aria-label="Profile"
        >
          <span
            className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
              isDark ? "bg-sky-500/20 text-sky-200" : "bg-blue-50 text-blue-700"
            }`}
          >
            {userInitials}
          </span>
          <span className={`max-w-28 truncate text-xs font-medium ${isDark ? "text-slate-200" : "text-slate-700"}`}>
            {user?.full_name || "Profile"}
          </span>
        </button>

        <button
          onClick={handleLogout}
          className={`rounded-lg border p-2 ${
            isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"
          }`}
          aria-label="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
