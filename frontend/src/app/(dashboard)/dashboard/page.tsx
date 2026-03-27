"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

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

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const taskData = await apiFetch("/tasks");
        setTasks(Array.isArray(taskData) ? (taskData as Task[]) : []);
      } catch (error) {
        console.error("Failed to load dashboard tasks:", error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

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
    const prioritized = tasks
      .filter((task) => task.status !== "completed")
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 5);

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
  }, [tasks]);

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
    <div className="min-h-screen bg-[#F9FAFB] px-4 py-6 md:px-6">
      <div className="mx-auto max-w-6xl bg-white p-6 md:p-8">
        <div className="space-y-6 divide-y divide-slate-200">
          <section className="pb-6">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Study Workspace</h2>
          </section>

          <section className="pt-6">
            <p className="text-sm text-slate-700">{suggestionText}</p>
            <button className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:bg-slate-800">
              Start Focus
            </button>
          </section>

          <section className="pt-6">
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
              <span>
                Study hours: <strong className="font-semibold text-slate-900">{loading ? "--" : `${metrics.studyHours}h`}</strong>
              </span>
              <span>
                Focus score: <strong className="font-semibold text-slate-900">{loading ? "--" : `${metrics.focusScore}%`}</strong>
              </span>
              <span>
                Completion rate: <strong className="font-semibold text-slate-900">{loading ? "--" : `${completionRate}%`}</strong>
              </span>
            </div>
          </section>

          <section className="grid gap-6 pt-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Task list</h3>
              <ul className="mt-3 space-y-2">
                {timeline.map((item) => (
                  <li key={item.title} className="flex items-start gap-3 py-1">
                    <input type="checkbox" checked={item.due === "Done"} readOnly className="mt-1 h-4 w-4 rounded border-slate-300" />
                    <div>
                      <p className="text-sm text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.subject}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6 lg:col-span-5">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Timeline</h3>
                <ul className="mt-3 space-y-3">
                  {timeline.map((item, index) => (
                    <li key={`${item.title}-${index}`} className="grid grid-cols-[16px_1fr] gap-3">
                      <div className="relative mt-1">
                        <span className="block h-2 w-2 rounded-full bg-slate-400" />
                        {index < timeline.length - 1 && <span className="absolute left-[3px] top-3 h-8 w-px bg-slate-200" />}
                      </div>
                      <div>
                        <p className="text-sm text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.due}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">AI Insights</h3>
                <p className="mt-3 text-sm text-slate-600">Work on the nearest deadline first, then move to medium-effort subjects while your focus is high.</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Subject heatmap</h3>
                <div className="mt-3 space-y-3">
                  {subjectMix.map((subject) => {
                    const width = Math.min(100, Math.max(12, subject.value * 20));
                    return (
                      <div key={subject.subject}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-slate-700">{subject.subject}</span>
                          <span className="text-slate-500">{subject.value}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100">
                          <div className="h-1.5 rounded-full bg-slate-500" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
