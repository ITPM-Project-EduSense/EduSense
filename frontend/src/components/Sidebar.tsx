"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  CalendarRange,
  Users,
  Bell,
  BarChart3,
  AlertTriangle,
  MoreHorizontal,
} from "lucide-react";

const navItems: Array<{
  label: string;
  items: Array<{
    name: string;
    href: string;
    icon: any;
    badge?: string;
    badgeDanger?: boolean;
  }>;
}> = [
  {
    label: "Main",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "My Tasks", href: "/tasks", icon: CheckSquare, badge: "12" },
      { name: "Study Planner", href: "/planner", icon: CalendarRange },
    ],
  },
  {
    label: "Collaborate",
    items: [
      { name: "PeerConnect", href: "/peers", icon: Users },
      { name: "Events", href: "/events", icon: Bell },
    ],
  },
  {
    label: "Insights",
    items: [
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
      {
        name: "Risk Alerts",
        href: "/alerts",
        icon: AlertTriangle,
        badge: "3",
        badgeDanger: true,
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-[260px] bg-[#0F172A] flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 pt-7 pb-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-400 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-[0_4px_12px_rgba(99,102,241,0.35)]">
            E
          </div>
          <span className="text-[22px] font-bold text-white tracking-tight">
            Edu<span className="text-indigo-400">Sense</span>
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {navItems.map((group) => (
          <div key={group.label} className="mb-2">
            <div className="px-3 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-[1.2px] text-slate-500">
              {group.label}
            </div>
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative flex items-center gap-3 px-3.5 py-[11px] rounded-lg mb-0.5 text-sm transition-all duration-200 group
                    ${
                      isActive
                        ? "bg-indigo-500/[0.15] text-white font-medium"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-500 rounded-r" />
                  )}
                  <Icon
                    size={20}
                    className={`flex-shrink-0 transition-opacity ${
                      isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                    }`}
                  />
                  {item.name}
                  {item.badge && (
                    <span
                      className={`ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full min-w-[20px] text-center text-white
                        ${item.badgeDanger ? "bg-red-500" : "bg-indigo-500"}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Card */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 cursor-pointer transition-all duration-200">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
            SB
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-white truncate">
              Sadumina Bagya
            </div>
            <div className="text-[11px] text-slate-500">3rd Year • CS</div>
          </div>
          <MoreHorizontal size={16} className="text-slate-500" />
        </div>
      </div>
    </aside>
  );
}