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
  { name: "Profile", href: "/users", icon: UserCircle },
];

type CurrentUser = {
  id?: string;
  full_name?: string;
  email?: string;
};

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  user: CurrentUser | null;
};

export default function Sidebar({ open, onClose, user }: SidebarProps) {
  const pathname = usePathname();
  const displayName = user?.full_name || "Student";
  const email = user?.email || "No email";

  const itemClass = (isActive: boolean) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? "bg-blue-50 text-blue-700 border border-blue-100"
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
        className={`fixed inset-y-0 left-0 z-50 w-[260px] border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <Link href="/landing" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="EduSense logo"
              width={34}
              height={34}
              className="h-[34px] w-[34px] rounded-lg border border-slate-200 object-cover"
            />
            <div>
              <p className="text-lg font-semibold text-slate-900">EduSense</p>
              <p className="text-xs text-slate-500">Student Productivity OS</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex h-[calc(100vh-73px)] flex-col justify-between p-3">
          <div className="space-y-1">
            {navMain.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={itemClass(active)} onClick={onClose}>
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="space-y-1 border-t border-slate-200 pt-3">
            {navBottom.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={itemClass(active)} onClick={onClose}>
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-700 truncate">{displayName}</p>
              <p className="mt-0.5 text-xs text-slate-500 truncate">{email}</p>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
