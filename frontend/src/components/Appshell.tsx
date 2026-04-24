"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

const publicRoutes = ["/landing"];
const SETTINGS_KEY = "edusense_user_settings_v1";
const SIDEBAR_COLLAPSED_KEY = "edusense_sidebar_collapsed_v1";

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

function getInitialSidebarCollapsed() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";

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

  return mode === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
    : mode;
}

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialSidebarCollapsed);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [activeTheme, setActiveTheme] = useState<"light" | "dark">(getInitialTheme);

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

    let mode: ThemeMode = activeTheme;
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { theme?: ThemeMode };
        if (parsed.theme === "light" || parsed.theme === "dark" || parsed.theme === "system") {
          mode = parsed.theme;
        }
      }
    } catch {
      mode = activeTheme;
    }

    applyTheme(mode);

    if (mode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      applyTheme("system");
      setActiveTheme(resolveTheme("system"));
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [activeTheme, isPublicRoute]);

  useEffect(() => {
    if (isPublicRoute) return;
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
    } catch {
      // Ignore localStorage persistence issues for sidebar state.
    }
  }, [isPublicRoute, sidebarCollapsed]);

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
      : "bg-white";

  return (
    <div className={`min-h-screen ${shellBg}`}>
      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        user={user}
        theme={activeTheme}
      />

      <main className={`min-h-screen transition-[margin] duration-300 ${sidebarCollapsed ? "lg:ml-22" : "lg:ml-65"}`}>
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          onSidebarToggle={() => setSidebarCollapsed((prev) => !prev)}
          sidebarCollapsed={sidebarCollapsed}
          user={user}
          theme={activeTheme}
        />
        {children}
      </main>
    </div>
  );
}
