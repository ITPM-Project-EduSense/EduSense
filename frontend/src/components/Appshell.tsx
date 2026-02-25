"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

// Routes that should NOT show the sidebar/topbar
const publicRoutes = ["/landing"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#f2f2f5]">
      <Sidebar />
      <main className="flex-1 ml-[260px] min-h-screen">
        <Topbar />
        <div>
          {children}
        </div>
      </main>
    </div>
  );
}