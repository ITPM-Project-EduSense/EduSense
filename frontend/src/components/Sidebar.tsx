"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  CalendarRange,
  House,
  Users,
  FolderOpen,
  Brain,
  BarChart3,
  Bell,
  Settings,
  UserCircle,
  PanelLeftClose,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

const navMain: NavItem[] = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Planner", href: "/planner", icon: CalendarRange },
  { name: "Materials", href: "/materials", icon: FolderOpen },
  { name: "AI Assistant", href: "/ai", icon: Brain },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

const navBottom: NavItem[] = [
  { name: "Home", href: "/landing", icon: House },
  { name: "User Management", href: "/users", icon: Users },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Profile", href: "/profile", icon: UserCircle },
];

type CurrentUser = {
  id?: string;
  full_name?: string;
  email?: string;
};

type SidebarProps = {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  user: CurrentUser | null;
  theme?: "light" | "dark";
};

export default function Sidebar({
  open,
  collapsed,
  onClose,
  onToggleCollapse,
  user,
  theme = "light",
}: SidebarProps) {
  const pathname = usePathname();
  const displayName = user?.full_name || "Student";
  const email = user?.email || "No email";
  const isDark = theme === "dark";

  const itemClass = (isActive: boolean) =>
    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
      isActive
        ? isDark
          ? "bg-sky-500/20 text-sky-200 border border-sky-400/30"
          : "bg-blue-50 text-blue-700 border border-blue-100"
        : isDark
          ? "text-slate-300 hover:bg-slate-800/70 hover:text-slate-100"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/30 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 border-r transition-[width,transform] duration-300 lg:translate-x-0 ${
          isDark ? "border-slate-800 bg-slate-950/95" : "border-slate-200 bg-white"
        } ${
          open ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "lg:w-22" : "w-65"}`}
      >
        <div
          className={`flex items-center border-b px-4 py-4 ${
            collapsed ? "justify-center lg:px-3" : "justify-between"
          } ${isDark ? "border-slate-800" : "border-slate-200"}`}
        >
          <Link href="/landing" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="EduSense logo"
              width={34}
              height={34}
              className={`h-8.5 w-8.5 rounded-lg border object-cover ${isDark ? "border-slate-700" : "border-slate-200"}`}
            />
            {!collapsed && (
              <div>
                <p className={`text-lg font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>EduSense</p>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Student Productivity OS</p>
              </div>
            )}
          </Link>
          <div className={`flex items-center gap-1 ${collapsed ? "hidden lg:flex" : ""}`}>
            <button
              onClick={onToggleCollapse}
              className={`hidden rounded-md p-1 lg:inline-flex ${
                isDark
                  ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <PanelLeftClose size={16} className={`${collapsed ? "rotate-180" : ""} transition-transform`} />
            </button>
            <button
              onClick={onClose}
              className={`rounded-md p-1 lg:hidden ${
                isDark
                  ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
              aria-label="Close sidebar"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <nav className="flex h-[calc(100vh-73px)] flex-col justify-between p-3">
          <div className="space-y-1">
            {navMain.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={`${item.href}-${item.name}`}
                  href={item.href}
                  className={`${itemClass(active)} ${collapsed ? "justify-center px-2.5" : ""}`}
                  onClick={onClose}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon size={18} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>

          <div className={`space-y-1 border-t pt-3 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
            {navBottom.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${itemClass(active)} ${collapsed ? "justify-center px-2.5" : ""}`}
                  onClick={onClose}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon size={18} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}

            <div
              className={`mt-3 rounded-xl border ${
                collapsed ? "flex items-center justify-center p-2.5" : "p-3"
              } ${isDark ? "border-slate-800 bg-slate-900/70" : "border-slate-200 bg-slate-50"}`}
              title={collapsed ? `${displayName} • ${email}` : undefined}
            >
              {collapsed ? (
                <div
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${
                    isDark ? "bg-sky-500/20 text-sky-200" : "bg-slate-900 text-white"
                  }`}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              ) : (
                <>
                  <p className={`truncate text-xs font-medium ${isDark ? "text-slate-200" : "text-slate-700"}`}>{displayName}</p>
                  <p className={`mt-0.5 truncate text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{email}</p>
                </>
              )}
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
