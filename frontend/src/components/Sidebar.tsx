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
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
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
    <aside className="fixed top-0 left-0 bottom-0 w-[260px] bg-slate-900 flex flex-col z-50 border-r border-white/10">
      {/* Logo */}
      <Link href="/landing" className="block">
        <div className="px-6 pt-7 pb-6 border-b border-white/[0.1] cursor-pointer hover:bg-white/[0.05] transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-purple-500/50 group-hover:scale-110 transition-all duration-300">
              E
            </div>
            <span className="text-[22px] font-bold text-white tracking-tight group-hover:text-indigo-200 transition-colors duration-300">
              Edu<span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Sense</span>
            </span>
          </div>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto">
        {navItems.map((group) => (
          <div key={group.label} className="mb-7">
            <div className="px-3 pt-3 pb-2.5 text-[10px] font-bold uppercase tracking-[1.3px] text-neutral-500 opacity-75">
              {group.label}
            </div>
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative flex items-center gap-3 px-3.5 py-3.5 rounded-xl mb-1.5 text-sm font-medium transition-all duration-300 group
                    ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 scale-105"
                        : "text-neutral-300 hover:bg-white/[0.08] hover:text-white hover:translate-x-1"
                    }`}
                >
                  <Icon
                    size={20}
                    className={`flex-shrink-0 transition-all duration-300 ${
                      isActive ? "opacity-100 drop-shadow-lg" : "opacity-70 group-hover:opacity-100"
                    }`}
                  />
                  {item.name}
                  {item.badge && (
                    <span
                      className={`ml-auto text-[11px] font-bold px-2.5 py-1 rounded-full min-w-[24px] text-center transition-all duration-300 ${
                        item.badgeDanger 
                          ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30" 
                          : isActive
                          ? "bg-white/20 text-white"
                          : "bg-indigo-500/30 text-indigo-200"
                      }`}
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
      <div className="p-4 border-t border-white/[0.1]">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gradient-to-r hover:from-indigo-500/20 hover:to-purple-500/20 cursor-pointer transition-all duration-300 group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform duration-300">
            SB
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-white truncate group-hover:text-indigo-200 transition-colors duration-300">
              Sadumina Bagya
            </div>
            <div className="text-[11px] text-neutral-400 group-hover:text-neutral-300 transition-colors duration-300">3rd Year • CS</div>
          </div>
          <MoreHorizontal size={16} className="text-neutral-400 group-hover:text-indigo-300 transition-colors duration-300" />
        </div>
      </div>
    </aside>
  );
}