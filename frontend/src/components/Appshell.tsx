"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

const publicRoutes = ["/landing"];

type CurrentUser = {
  id: string;
  full_name?: string;
  email?: string;
  bio?: string;
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";
        const response = await fetch(`${apiBase}/auth/me`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) return;
        const data = await response.json();
        if (data?.user) setUser(data.user);
      } catch (error) {
        console.error("Failed to load current user:", error);
      }
    };

    if (!isPublicRoute) {
      loadCurrentUser();
    }
  }, [isPublicRoute, pathname]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />

      <main className="min-h-screen lg:ml-[260px]">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={user} />
        {children}
      </main>
    </div>
  );
}
