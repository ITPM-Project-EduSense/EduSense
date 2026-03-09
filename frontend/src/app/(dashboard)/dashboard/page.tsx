"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  ListTodo,
  Plus,
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
    const overdue = tasks.filter((t) => t.status !== "completed" && daysUntil(t.deadline) < 0).length;
    const dueSoon = tasks.filter(
      (t) => t.status !== "completed" && daysUntil(t.deadline) >= 0 && daysUntil(t.deadline) <= 3
    ).length;
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

    return { total, completed, inProgress, overdue, dueSoon, completionRate };
  }, [tasks]);

  const focusTasks = useMemo(
    () =>
      [...tasks]
        .filter((t) => t.status !== "completed")
        .sort((a, b) => {
          const scoreDiff = (b.priority_score || 0) - (a.priority_score || 0);
          if (scoreDiff !== 0) return scoreDiff;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        })
        .slice(0, 8),
    [tasks]
  );

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
                focusTasks[0]
                  ? openPlannerForTask(focusTasks[0].id)
                  : router.push("/planner")
              }
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Plan Next Task
            </button>
            <button
              onClick={() => router.push("/tasks")}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus size={16} />
              Add Task
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
            label: "Due Soon (3d)",
            value: stats.dueSoon,
            icon: CalendarDays,
            tone: "text-amber-600 bg-amber-50 border-amber-100",
          },
          {
            label: "In Progress",
            value: stats.inProgress,
            icon: Clock3,
            tone: "text-blue-600 bg-blue-50 border-blue-100",
          },
          {
            label: "Completed",
            value: `${stats.completionRate}%`,
            icon: CheckCircle2,
            tone: "text-emerald-600 bg-emerald-50 border-emerald-100",
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

      {risk && (
        <section className="mt-6">
          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="mt-0.5 text-amber-700" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Workload risk: {risk.risk_level} ({risk.risk_score}/10)
                  </p>
                  <p className="text-sm text-amber-800">{risk.suggestion}</p>
                </div>
              </div>
              <button
                onClick={() => router.push("/planner")}
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100"
              >
                Rebalance Plan
              </button>
            </div>
          </article>
        </section>
      )}

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-12">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Focus Today</h2>
              <p className="text-sm text-slate-500">Your highest priority and nearest-deadline tasks.</p>
            </div>
          </div>

          <div className="space-y-3">
            {focusTasks.length === 0 && !loading && (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                No tasks yet. Create your first task to start planning.
              </div>
            )}

            {focusTasks.map((task) => {
              const remaining = daysUntil(task.deadline);
              return (
                <button
                  key={task.id}
                  onClick={() => openPlannerForTask(task.id)}
                  className="flex w-full flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{task.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {task.subject} • Due {formatDate(task.deadline)}
                    </p>
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
      </section>
    </div>
  );
}
