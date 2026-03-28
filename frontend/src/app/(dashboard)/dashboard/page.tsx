"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { ProgressRing, SimpleBarChart } from "@/components/VisualIndicators";
import { SkeletonMetricCard, SkeletonActivityCard } from "@/components/Skeletons";
import { useToast } from "@/components/Toast";
import { useSearch } from "@/context/SearchContext";

type Task = {
  id: string;
  title: string;
  subject: string;
  deadline: string;
  status: "pending" | "in_progress" | "completed";
};

function daysUntil(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDue(deadline: string) {
  const days = daysUntil(deadline);
  if (days < 0) return `Overdue ${Math.abs(days)} day${Math.abs(days) > 1 ? "s" : ""}`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const { addToast } = useToast();
  const { searchQuery } = useSearch();

  useEffect(() => {
    const loadUserAndTasks = async () => {
      try {
        // Fetch user info
        const userData = await apiFetch("/users/me");
        setUserName(userData.full_name || "");
      } catch (error) {
        console.error("Failed to load user:", error);
        addToast("Failed to load profile", "error");
      }

      try {
        // Fetch tasks
        const taskData = await apiFetch("/tasks");
        setTasks(Array.isArray(taskData) ? (taskData as Task[]) : []);
      } catch (error) {
        console.error("Failed to load dashboard tasks:", error);
        setTasks([]);
        addToast("Failed to load tasks", "error");
      } finally {
        setLoading(false);
      }
    };

    loadUserAndTasks();
  }, [addToast]);

  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === "completed").length;
    const pendingOrProgress = tasks.filter((task) => task.status !== "completed");
    const nearDeadlines = pendingOrProgress.filter(
      (task) => daysUntil(task.deadline) >= 0 && daysUntil(task.deadline) <= 2
    ).length;

    const studyHours = Math.max(6, Math.round((total * 1.25 + completed * 0.5) * 10) / 10);
    const focusScore = Math.min(100, Math.max(65, 72 + completed * 2 - nearDeadlines * 3));
    const productivityIndex = Math.min(
      100,
      total === 0 ? 70 : Math.round((completed / total) * 100 + Math.max(0, 20 - nearDeadlines * 2))
    );

    return {
      total,
      active: pendingOrProgress.length,
      studyHours,
      completed,
      focusScore,
      productivityIndex,
    };
  }, [tasks]);

  const timeline = useMemo(() => {
    let prioritized = tasks
      .filter((task) => task.status !== "completed")
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      prioritized = prioritized.filter((task) =>
        task.title.toLowerCase().includes(query) ||
        task.subject.toLowerCase().includes(query) ||
        (task.description?.toLowerCase().includes(query) ?? false)
      );
    }

    prioritized = prioritized.slice(0, 5);

    if (prioritized.length === 0) {
      return [
        {
          title: "Database Lab Report",
          subject: "Database Systems",
          due: "Due tomorrow",
        },
        {
          title: "ITPM Sprint Checkpoint",
          subject: "ITPM",
          due: "Due in 3 days",
        },
        {
          title: "Parallel Computing Quiz",
          subject: "Parallel Computing",
          due: "Due in 5 days",
        },
      ];
    }

    return prioritized.map((item) => {
      return {
        title: item.title,
        subject: item.subject,
        due: formatDue(item.deadline),
      };
    });
  }, [tasks, searchQuery]);

  const subjectMix = useMemo(() => {
    const entries = new Map<string, number>();
    tasks.forEach((task) => {
      entries.set(task.subject, (entries.get(task.subject) || 0) + 1);
    });

    const sorted = [...entries.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (sorted.length === 0) {
      return [
        { subject: "Data Structures", value: 5 },
        { subject: "Database", value: 4 },
        { subject: "Cloud Computing", value: 3 },
      ];
    }

    return sorted.map(([subject, value]) => ({ subject, value }));
  }, [tasks]);

  const completionRate = useMemo(() => {
    if (metrics.total === 0) return 0;
    return Math.round((metrics.completed / metrics.total) * 100);
  }, [metrics]);

  const suggestionText = useMemo(() => {
    const next = tasks
      .filter((task) => task.status !== "completed")
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0];

    if (!next) {
      return "Start Database Systems now (1.5h)";
    }

    return `Start ${next.subject} now (1.5h)`;
  }, [tasks]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">
            Welcome back, {userName || "Learner"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">Your AI-powered learning command center</p>
        </div>

        {/* Quick Action Card */}
        <div className="mb-8 rounded-xl border border-slate-200/60 bg-white/90 backdrop-blur-md p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Next Priority</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{suggestionText}</p>
            </div>
            <button className="whitespace-nowrap rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-sm hover:shadow-md">
              Start Focus
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          {loading ? (
            <>
              <SkeletonMetricCard />
              <SkeletonMetricCard />
              <SkeletonMetricCard />
            </>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200/60 bg-white/90 backdrop-blur-md p-6 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Study Hours</p>
                  <p className="mt-1 text-sm text-slate-500">This period</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-slate-900">{metrics.studyHours}h</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/60 bg-white/90 backdrop-blur-md p-6 shadow-sm hover:shadow-md transition-shadow flex items-center justify-center">
                <div className="text-center">
                  <ProgressRing value={metrics.focusScore} color="indigo" size={100} />
                  <p className="mt-2 text-xs font-medium text-slate-600">Peak performance</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/60 bg-white/90 backdrop-blur-md p-6 shadow-sm hover:shadow-md transition-shadow flex items-center justify-center">
                <div className="text-center">
                  <ProgressRing value={completionRate} color="emerald" size={100} />
                  <p className="mt-2 text-xs font-medium text-slate-600">{metrics.completed} of {metrics.total} tasks</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Active Tasks */}
          <div className="rounded-xl border border-slate-200/60 bg-white/90 backdrop-blur-md shadow-sm overflow-hidden lg:col-span-1">
            <div className="border-b border-slate-200/60 px-6 py-4 bg-gradient-to-r from-indigo-50/50 to-transparent">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Active Tasks</h2>
            </div>
            <div className="divide-y divide-slate-200/50 p-6">
              {loading ? (
                <div className="space-y-3">
                  <SkeletonActivityCard />
                </div>
              ) : timeline.length > 0 ? (
                <ul className="space-y-3">
                  {timeline.map((item) => (
                    <li key={item.title} className="flex items-start gap-3 py-1">
                      <input
                        type="checkbox"
                        checked={item.due === "Done"}
                        readOnly
                        className="mt-1 h-4 w-4 rounded border border-indigo-300 bg-indigo-50 accent-indigo-600"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{item.subject}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-sm text-slate-500">No active tasks</p>
              )}
            </div>
          </div>

          {/* Timeline & Insights */}
          <div className="space-y-8 lg:col-span-2">
            {/* Timeline */}
            <div className="rounded-xl border border-slate-200/60 bg-white/90 backdrop-blur-md shadow-sm overflow-hidden">
              <div className="border-b border-slate-200/60 px-6 py-4 bg-gradient-to-r from-indigo-50/50 to-transparent">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Upcoming Deadlines</h2>
              </div>
              <div className="p-6">
                {loading ? (
                  <SkeletonActivityCard />
                ) : (
                  <ul className="space-y-6">
                    {timeline.map((item, index) => (
                      <li key={`${item.title}-${index}`} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-sm">
                            {index + 1}
                          </div>
                          {index < timeline.length - 1 && <div className="mt-3 w-px flex-grow bg-slate-200/50" style={{ height: "36px" }} />}
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{item.subject}</p>
                          <p className="mt-2 text-xs font-medium text-indigo-600">{item.due}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Subject Load Distribution */}
            <div className="rounded-xl border border-slate-200/60 bg-white/90 backdrop-blur-md shadow-sm overflow-hidden">
              <div className="border-b border-slate-200/60 px-6 py-4 bg-gradient-to-r from-indigo-50/50 to-transparent">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Subject Load</h2>
              </div>
              <div className="p-6">
                {loading ? (
                  <SkeletonActivityCard />
                ) : subjectMix.length > 0 ? (
                  <SimpleBarChart
                    data={subjectMix.map((subject, idx) => ({
                      label: subject.subject.substring(0, 12),
                      value: subject.value,
                      color: ["indigo", "blue", "emerald", "amber", "rose"][idx % 5] as any,
                    }))}
                    height={220}
                  />
                ) : (
                  <p className="text-center text-sm text-slate-500">No subject data</p>
                )}
              </div>
            </div>

            {/* AI Insights */}
            <div className="rounded-xl border border-slate-200/60 bg-white/90 backdrop-blur-md shadow-sm overflow-hidden">
              <div className="border-b border-slate-200/60 px-6 py-4 bg-gradient-to-r from-indigo-50/50 to-transparent">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">AI Insights</h2>
              </div>
              <div className="p-6">
                <p className="text-sm leading-relaxed text-slate-700">
                  Focus on tasks with the nearest deadlines first to maximize your completion rate. Schedule high-complexity subjects during peak mental hours (8-11 AM) for optimal retention.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
