"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Flame,
  ListTodo,
  Plus,
  TrendingUp,
  Sparkles,
  Brain,
  Activity,
} from "lucide-react";

type Task = {
  id: string;
  title: string;
  subject: string;
  description?: string;
  deadline: string;
  difficulty: "easy" | "medium" | "hard";
  status: "pending" | "in_progress" | "completed";
  priority_score: number | null;
  created_at: string;
  updated_at: string;
};

type OverloadWarning = {
  type: string;
  severity: string;
  message: string;
  tasks?: string[];
};

type OverloadBreakdownItem = {
  score: number;
  weight: number;
  weighted_score: number;
  reason: string;
};

type OverloadRisk = {
  risk_score: number;
  risk_level: string;
  active_tasks: number;
  warnings: OverloadWarning[];
  suggestion: string;
  breakdown: Record<string, OverloadBreakdownItem>;
};

function daysUntil(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function difficultyClass(level: Task["difficulty"]) {
  if (level === "easy") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (level === "medium") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-rose-50 text-rose-700 border-rose-100";
}

function urgencyClass(days: number) {
  if (days <= 1) return "bg-rose-50 text-rose-700 border-rose-100";
  if (days <= 4) return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-blue-50 text-blue-700 border-blue-100";
}

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [risk, setRisk] = useState<OverloadRisk | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [taskData, riskData] = await Promise.all([
          apiFetch("/tasks"),
          apiFetch("/tasks/overload-risk").catch(() => null),
        ]);

        setTasks(Array.isArray(taskData) ? taskData : []);
        setRisk(riskData && typeof riskData === "object" ? (riskData as OverloadRisk) : null);
      } catch (error) {
        console.error("Dashboard load failed:", error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    const overdue = tasks.filter((t) => t.status !== "completed" && daysUntil(t.deadline) < 0).length;
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

    return { total, completed, inProgress, pending, overdue, completionRate };
  }, [tasks]);

  const upcoming = useMemo(
    () =>
      [...tasks]
        .filter((t) => t.status !== "completed")
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
        .slice(0, 6),
    [tasks]
  );

  const priorityQueue = useMemo(
    () =>
      [...tasks]
        .filter((t) => t.status !== "completed")
        .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
        .slice(0, 6),
    [tasks]
  );

  const subjectDistribution = useMemo(() => {
    const map = new Map<string, number>();
    for (const task of tasks) {
      map.set(task.subject, (map.get(task.subject) || 0) + 1);
    }

    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [tasks]);

  const openPlannerForTask = (taskId: string) => {
    router.push(`/planner?task_id=${taskId}`);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 lg:p-6">
      {/* ── Page Header with Gradient ── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 p-6 shadow-2xl shadow-indigo-900/40">
        {/* Ambient glow blobs */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white/15 p-3 ring-1 ring-white/25 backdrop-blur-sm">
              <ListTodo size={26} className="text-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-200">
                EduSense · Dashboard
              </p>
              <h1 className="text-2xl font-bold text-white lg:text-3xl">
                Study Command Center
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-indigo-100 ring-1 ring-white/20 backdrop-blur-sm">
              <TrendingUp size={13} />
              AI Priority Ranking
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-indigo-100 ring-1 ring-white/20 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Updated now
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30 backdrop-blur-sm">
              <Activity size={12} />
              Live
            </span>
          </div>
        </div>
      </section>

      {/* ── Section: Quick Stats ── */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="h-5 w-1 rounded-full bg-gradient-to-b from-indigo-400 to-purple-600" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Task Overview
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Tasks",
              value: stats.total,
              icon: ListTodo,
              tone: "text-blue-600 bg-blue-50 border-blue-100",
            },
            {
              label: "Completed",
              value: stats.completed,
              icon: CheckCircle2,
              tone: "text-emerald-600 bg-emerald-50 border-emerald-100",
            },
            {
              label: "In Progress",
              value: stats.inProgress,
              icon: Clock3,
              tone: "text-amber-600 bg-amber-50 border-amber-100",
            },
            {
              label: "Overdue",
              value: stats.overdue,
              icon: Flame,
              tone: "text-rose-600 bg-rose-50 border-rose-100",
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{card.label}</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">{loading ? "--" : card.value}</p>
                  </div>
                  <div className={`rounded-xl border p-2 ${card.tone}`}>
                    <Icon size={18} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Section: Priority & Upcoming ── */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="h-5 w-1 rounded-full bg-gradient-to-b from-indigo-400 to-purple-600" />
          <Sparkles size={14} className="text-indigo-500" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Smart Planning
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Priority Queue</h2>
                <p className="text-sm text-slate-500">Highest urgency tasks ranked by AI priority score.</p>
              </div>
              <p className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600">
                Click to plan
                <ArrowRight size={14} />
              </p>
            </div>

            <div className="space-y-3">
              {priorityQueue.length === 0 && !loading && (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  No tasks yet. Create your first task to start planning.
                </div>
              )}

              {priorityQueue.map((task) => {
                const remaining = daysUntil(task.deadline);
                return (
                  <button
                    key={task.id}
                    onClick={() => openPlannerForTask(task.id)}
                    className="flex w-full flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition-all hover:border-indigo-200 hover:bg-indigo-50/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{task.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{task.subject}</p>
                    </div>

                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${difficultyClass(task.difficulty)}`}>
                      {task.difficulty}
                    </span>

                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${urgencyClass(remaining)}`}>
                      {remaining < 0 ? `${Math.abs(remaining)}d overdue` : `${remaining}d left`}
                    </span>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      Score {(task.priority_score || 0).toFixed(1)}
                    </span>
                  </button>
                );
              })}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <CalendarClock size={18} className="text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">Upcoming</h2>
            </div>

            <div className="space-y-3">
              {upcoming.length === 0 && !loading && (
                <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">No upcoming items.</p>
              )}

              {upcoming.map((task) => {
                const remaining = daysUntil(task.deadline);
                return (
                  <button
                    key={task.id}
                    onClick={() => openPlannerForTask(task.id)}
                    className="w-full rounded-xl border border-slate-200 p-3 text-left transition-all hover:border-indigo-200 hover:bg-indigo-50/40"
                  >
                    <p className="text-sm font-medium text-slate-900">{task.title}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>{formatDate(task.deadline)}</span>
                      <span className={remaining <= 1 ? "text-rose-600" : "text-slate-600"}>
                        {remaining < 0 ? "Overdue" : `${remaining} day(s)`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </article>
        </div>
      </section>

      {/* ── Section: Risk & Progress Analysis ── */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="h-5 w-1 rounded-full bg-gradient-to-b from-indigo-400 to-purple-600" />
          <Brain size={14} className="text-indigo-500" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Intelligence Zone
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-slate-700" />
              <h2 className="text-lg font-semibold text-slate-900">Workload Risk</h2>
            </div>

            {risk ? (
              <>
                <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">Risk Score</p>
                    <p className="text-lg font-semibold text-slate-900">{risk.risk_score}/10</p>
                  </div>
                  <div className="mt-3 h-2.5 rounded-full bg-slate-300">
                    <div className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600" style={{ width: `${Math.min(risk.risk_score * 10, 100)}%` }} />
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-wide font-semibold text-slate-600">{risk.risk_level} Risk Level</p>
                </div>

                <div className="mt-4 space-y-2">
                  {(risk.warnings || []).slice(0, 3).map((warning, idx) => (
                    <div key={`${warning.type}-${idx}`} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      {warning.message}
                    </div>
                  ))}
                  <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                    <p className="font-medium">💡 AI Suggestion</p>
                    <p className="mt-1 text-xs">{risk.suggestion}</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">Risk analysis will appear once task data is available.</p>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-slate-700" />
              <h2 className="text-lg font-semibold text-slate-900">Progress Snapshot</h2>
            </div>

            <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4">
              <p className="text-sm text-slate-600">Completion Rate</p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-3xl font-bold text-slate-900">{stats.completionRate}%</p>
                <BookOpen size={24} className="text-slate-400" />
              </div>
              <div className="mt-4 h-2.5 rounded-full bg-slate-300">
                <div className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600" style={{ width: `${stats.completionRate}%` }} />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium text-slate-700">Top Subjects</p>
              {subjectDistribution.length === 0 && (
                <p className="text-sm text-slate-500">No subject distribution available yet.</p>
              )}
              {subjectDistribution.map(([subject, count]) => (
                <div key={subject} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm hover:border-indigo-200 transition-colors">
                  <span className="font-medium text-slate-700">{subject}</span>
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">{count}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      {/* ── Action Footer ── */}
      <section className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <h3 className="font-semibold text-slate-900">Ready to plan?</h3>
          <p className="text-sm text-slate-600">Create a study plan for your top priority task</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              priorityQueue[0]
                ? openPlannerForTask(priorityQueue[0].id)
                : router.push("/planner")
            }
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Plan Top Task
          </button>
          <button
            onClick={() => router.push("/planner")}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:from-indigo-700 hover:to-purple-700 transition-all"
          >
            <Plus size={16} />
            Generate Plan
          </button>
        </div>
      </section>
    </div>
  );
}
