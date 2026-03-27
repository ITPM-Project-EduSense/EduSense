"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BrainCircuit,
  CalendarDays,
  CheckSquare,
  LayoutDashboard,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type CurrentUser = {
  full_name?: string;
  email?: string;
} | null;

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  user: CurrentUser;
};

const items: SidebarItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Smart Study Planner", href: "/planner", icon: Sparkles },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Calendar", href: "/planner", icon: CalendarDays },
  { label: "AI Insights", href: "/ai", icon: BrainCircuit },
  { label: "Study Groups", href: "/users", icon: Users },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/users", icon: Settings },
];

export default function Sidebar({ open, onClose, user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/35 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[248px] border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
            <Link href="/landing" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="EduSense logo"
                width={36}
                height={36}
                className="h-9 w-9 rounded-xl border border-slate-200 object-cover"
              />
              <div>
                <p className="text-base font-semibold text-slate-900">EduSense</p>
                <p className="text-xs text-slate-500">Workspace</p>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Close sidebar"
            >
              <X size={16} />
            </button>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 p-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-500">Account</p>
              <p className="truncate text-sm font-medium text-slate-800">
                {user?.full_name || "Student"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {user?.email || "student@edusense.app"}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
