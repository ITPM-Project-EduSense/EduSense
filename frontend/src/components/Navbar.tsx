"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  email: string;
  full_name?: string;
}

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAuthStatus = async () => {
      try {
        const apiBase =
          process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";
        const response = await fetch(`${apiBase}/auth/me`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!mounted) return;

        if (response.ok) {
          const data = await response.json();
          setUser(data.user ?? null);
          setIsLoggedIn(true);
        } else {
          setUser(null);
          setIsLoggedIn(false);
        }
      } catch {
        if (mounted) {
          setUser(null);
          setIsLoggedIn(false);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuthStatus();

    return () => {
      mounted = false;
    };
  }, []);

  const initials = useMemo(() => {
    if (!user?.full_name) return "U";
    return user.full_name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [user]);

  const tasksHref = isLoggedIn ? "/tasks" : "/login";
  const dashboardHref = isLoggedIn ? "/dashboard" : "/login";

  const handleLogout = async () => {
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";
      await fetch(`${apiBase}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } finally {
      setIsMenuOpen(false);
      setUser(null);
      setIsLoggedIn(false);
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 md:px-8">
        <Link href="/landing" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="EduSense logo"
            width={36}
            height={36}
            priority
            className="h-9 w-9 rounded-xl border border-slate-200 object-cover"
          />
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            EduSense
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#hero"
            className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            Home
          </a>
          <a
            href="#features"
            className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            Features
          </a>
          <Link
            href={tasksHref}
            className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            Tasks
          </Link>
          <Link
            href={dashboardHref}
            className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            Dashboard
          </Link>

          {isLoading ? (
            <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
          ) : isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25"
                aria-label="Profile menu"
              >
                {initials}
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-12 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl">
                  <div className="mb-2 rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {user?.full_name || "Student"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {user?.email || "No email"}
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    Go to Dashboard
                  </Link>
                  <Link
                    href="/tasks"
                    onClick={() => setIsMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    My Tasks
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:scale-105 hover:bg-slate-100"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-105"
              >
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
