"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Topbar from "@/components/Topbar";

const publicRoutes = ["/landing"];
const SETTINGS_KEY = "edusense_user_settings_v1";

type ThemeMode = "light" | "dark" | "system";

function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

function applyTheme(mode: ThemeMode) {
  const theme = resolveTheme(mode);
  document.documentElement.setAttribute("data-theme", theme);
}

type CurrentUser = {
  id: string;
  full_name?: string;
  email?: string;
  bio?: string;
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [activeTheme, setActiveTheme] = useState<"light" | "dark">("light");

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

  useEffect(() => {
    if (isPublicRoute) return;

    let mode: ThemeMode = "light";
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { theme?: ThemeMode };
        if (parsed.theme === "light" || parsed.theme === "dark" || parsed.theme === "system") {
          mode = parsed.theme;
        }
      }
    } catch {
      mode = "light";
    }

    const initialTheme = resolveTheme(mode);
    applyTheme(mode);
    setActiveTheme(initialTheme);

    if (mode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      applyTheme("system");
      setActiveTheme(resolveTheme("system"));
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [isPublicRoute]);

  useEffect(() => {
    if (isPublicRoute) return;

    const syncFromDom = () => {
      const attr = document.documentElement.getAttribute("data-theme");
      if (attr === "dark" || attr === "light") {
        setActiveTheme(attr);
      }
    };

    syncFromDom();

    const observer = new MutationObserver(syncFromDom);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, [isPublicRoute]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  const shellBg =
    activeTheme === "dark"
      ? "bg-[radial-gradient(circle_at_10%_12%,rgba(56,189,248,0.12),transparent_30%),radial-gradient(circle_at_86%_18%,rgba(129,140,248,0.12),transparent_32%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.09),transparent_32%),#020617]"
      : "bg-slate-50";

  return (
    <div className={`min-h-screen ${shellBg}`}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} theme={activeTheme} />

      <main className="min-h-screen lg:ml-65">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={user} theme={activeTheme} />
        {children}
      </main>
    </div>
  );
}
