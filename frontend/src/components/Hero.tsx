"use client";

import Link from "next/link";
import { motion, type Transition } from "framer-motion";
import { CalendarClock, CheckCircle2, Sparkles, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

const floatTransition = (duration: number, delay = 0): Transition => ({
  duration,
  repeat: Number.POSITIVE_INFINITY,
  repeatType: "reverse" as const,
  ease: "easeInOut" as const,
  delay,
});

export default function Hero() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAuthStatus = async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/status`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (mounted) {
          if (response.ok) {
            const data = await response.json();
            setIsLoggedIn(Boolean(data.authenticated));
          } else {
            setIsLoggedIn(false);
          }
        }
      } catch {
        if (mounted) {
          setIsLoggedIn(false);
        }
      }
    };

    checkAuthStatus();

    return () => {
      mounted = false;
    };
  }, []);

  const startStudyingHref = isLoggedIn ? "/tasks" : "/login";
  const watchDemoHref = isLoggedIn ? "/dashboard" : "/login";

  return (
    <section id="hero" className="relative py-14 md:py-20">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 md:grid-cols-2 md:px-8">
        <div className="space-y-7">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
          >
            <Sparkles size={14} className="text-cyan-500" />
            Built for focused students
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl font-semibold leading-tight text-slate-900 md:text-6xl"
          >
            Study Smarter With{" "}
            <span className="bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">
              AI
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-xl text-base leading-7 text-slate-500 md:text-lg"
          >
            EduSense helps students automatically generate study plans, prioritize
            tasks, and stay ahead of deadlines using intelligent AI assistance.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3 }}
            className="flex flex-wrap items-center gap-3"
          >
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link
                href={startStudyingHref}
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-cyan-500/35"
              >
                Start Studying
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }}>
              <a
                href={watchDemoHref}
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100"
              >
                Watch Demo
              </a>
            </motion.div>
          </motion.div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_35px_80px_rgba(15,23,42,0.13)]"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">AI Dashboard</p>
                <h3 className="text-xl font-semibold text-slate-900">Today at a glance</h3>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-600">
                On Track
              </span>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Task Priorities
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                    <span className="text-sm text-slate-700">Physics Quiz Review</span>
                    <span className="text-xs font-semibold text-rose-500">High</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                    <span className="text-sm text-slate-700">History Notes Summary</span>
                    <span className="text-xs font-semibold text-amber-500">Medium</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">Study Progress</span>
                  <span className="font-semibold text-cyan-600">72%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200">
                  <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500" />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  AI Schedule Suggestion
                </p>
                <p className="text-sm text-slate-700">
                  Focus on Algorithms between 6:00 PM - 7:30 PM, then short review for Chemistry.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={floatTransition(6)}
            className="absolute -left-3 top-14 hidden rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl md:block"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Target size={16} className="text-indigo-500" />
              Priority optimized
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={floatTransition(7, 0.2)}
            className="absolute -right-2 top-32 hidden rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl md:block"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <CheckCircle2 size={16} className="text-emerald-500" />
              4 tasks completed
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={floatTransition(8, 0.4)}
            className="absolute bottom-10 right-8 hidden rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl md:block"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <CalendarClock size={16} className="text-cyan-500" />
              AI slot ready 6:00 PM
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
