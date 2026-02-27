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
} from "lucide-react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  subject: string;
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
    <div className="mx-auto w-full max-w-7xl p-4 lg:p-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Overview</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">Study Command Center</h1>
            <p className="mt-1 text-sm text-slate-600">Track tasks, manage workload risk, and stay ahead of deadlines.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                priorityQueue[0]
                  ? openPlannerForTask(priorityQueue[0].id)
                  : router.push("/planner")
              }
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Plan Top Task
            </button>
            <button
              onClick={() => router.push("/planner")}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus size={16} />
              Generate Plan
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5">
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
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Priority Queue</h2>
              <p className="text-sm text-slate-500">Highest urgency tasks ranked by AI priority score.</p>
            </div>
            <p className="inline-flex items-center gap-1 text-sm font-medium text-blue-600">
              Click a task to plan
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
                  className="flex w-full flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/40"
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

        <article className="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-4">
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock size={18} className="text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Upcoming Deadlines</h2>
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
                  className="w-full rounded-xl border border-slate-200 p-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/40"
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
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">Overload Risk</h2>
          </div>

          {risk ? (
            <>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">Risk Score</p>
                  <p className="text-lg font-semibold text-slate-900">{risk.risk_score}/10</p>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-blue-600" style={{ width: `${Math.min(risk.risk_score * 10, 100)}%` }} />
                </div>
                <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">{risk.risk_level} risk</p>
              </div>

              <div className="mt-4 space-y-2">
                {(risk.warnings || []).slice(0, 3).map((warning, idx) => (
                  <div key={`${warning.type}-${idx}`} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    {warning.message}
                  </div>
                ))}
                <p className="text-sm text-slate-600">{risk.suggestion}</p>
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

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">Completion Rate</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-3xl font-semibold text-slate-900">{stats.completionRate}%</p>
              <BookOpen size={20} className="text-slate-500" />
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${stats.completionRate}%` }} />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium text-slate-700">Top Subjects</p>
            {subjectDistribution.length === 0 && (
              <p className="text-sm text-slate-500">No subject distribution available yet.</p>
            )}
            {subjectDistribution.map(([subject, count]) => (
              <div key={subject} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <span className="text-slate-700">{subject}</span>
                <span className="font-medium text-slate-900">{count} task(s)</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
