"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Flame,
  ListTodo,
  MessageCircle,
  Sparkles,
  TrendingUp,
  Workflow,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ActiveMeetingsCard } from "../materials/components";
import { apiGroupToGroup } from "../materials/utils";
import type { Group } from "../materials/types";

const flowPalette = [
  {
    border: "border-cyan-300/45",
    panel: "from-cyan-400/18 via-sky-400/10 to-white/0",
    glow: "shadow-[0_18px_40px_-24px_rgba(34,211,238,0.7)]",
    accent: "from-cyan-400 to-sky-500",
    line: "from-cyan-300 via-sky-300 to-indigo-300",
  },
  {
    border: "border-fuchsia-300/40",
    panel: "from-fuchsia-400/18 via-violet-400/10 to-white/0",
    glow: "shadow-[0_18px_40px_-24px_rgba(217,70,239,0.65)]",
    accent: "from-fuchsia-400 to-violet-500",
    line: "from-fuchsia-300 via-violet-300 to-indigo-300",
  },
  {
    border: "border-emerald-300/40",
    panel: "from-emerald-400/18 via-teal-400/10 to-white/0",
    glow: "shadow-[0_18px_40px_-24px_rgba(16,185,129,0.65)]",
    accent: "from-emerald-400 to-teal-500",
    line: "from-emerald-300 via-teal-300 to-cyan-300",
  },
  {
    border: "border-amber-300/40",
    panel: "from-amber-300/18 via-orange-300/10 to-white/0",
    glow: "shadow-[0_18px_40px_-24px_rgba(251,191,36,0.65)]",
    accent: "from-amber-400 to-orange-500",
    line: "from-amber-300 via-orange-300 to-rose-300",
  },
  {
    border: "border-indigo-300/40",
    panel: "from-indigo-400/18 via-blue-400/10 to-white/0",
    glow: "shadow-[0_18px_40px_-24px_rgba(99,102,241,0.68)]",
    accent: "from-indigo-400 to-blue-500",
    line: "from-indigo-300 via-blue-300 to-cyan-300",
  },
];
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

function getFeatureDescription(title: string) {
  switch (title) {
    case "Create Task":
      return "Easily add new study tasks to your workflow. Track deadlines, priorities, and subjects for smarter planning.";
    case "Attach Materials":
      return "Link lecture notes, PDFs, and resources to each task. Keep all your study materials organized and accessible.";
    case "AI Schedule":
      return "Let AI generate a personalized study plan based on your priorities, deadlines, and workload.";
    case "PeerConnect":
      return "Collaborate with peers in your module circle. Share progress, ask questions, and study together.";
    case "AI Coach":
      return "Get AI-powered coaching and tips to boost your study momentum and stay on track.";
    default:
      return "Learn more about this feature.";
  }
}

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
  const [loading, setLoading] = useState(true);
  const [openCard, setOpenCard] = useState<number | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const taskData = await apiFetch("/tasks");

        setTasks(Array.isArray(taskData) ? taskData : []);
      } catch (error) {
        console.error("Dashboard load failed:", error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    const loadDashboardGroups = async () => {
      try {
        setLoadingGroups(true);
        const data = await apiFetch("/groups/");
        setGroups(Array.isArray(data) ? data.map(apiGroupToGroup) : []);
      } catch {
        setGroups([]);
      } finally {
        setLoadingGroups(false);
      }
    };

    load();
    loadDashboardGroups();
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

  const productivityPulse = useMemo(() => {
    const active = Math.max(1, stats.pending + stats.inProgress);
    const momentum = Math.min(100, Math.round((stats.inProgress / active) * 100 + stats.completionRate * 0.35));
    return momentum;
  }, [stats]);

  const flowSteps = useMemo(
    () => [
      {
        title: "Create Task",
        caption: `${stats.total} tracked tasks`,
        icon: ListTodo,
        tone: "from-blue-500 to-indigo-500",
        eyebrow: "Capture the plan",
        detail: "Start with the task, deadline, and subject so the rest of the workflow has clear context.",
        action: "Set the study goal",
      },
      {
        title: "Attach Materials",
        caption: `${subjectDistribution.length} active modules`,
        icon: BookOpen,
        tone: "from-cyan-500 to-sky-500",
        eyebrow: "Organize resources",
        detail: "Keep notes, PDFs, and lecture files tied to the task so nothing gets lost between sessions.",
        action: "Link relevant material",
      },
      {
        title: "AI Schedule",
        caption: `${priorityQueue.length} ready to plan`,
        icon: Sparkles,
        tone: "from-fuchsia-500 to-violet-500",
        eyebrow: "Generate momentum",
        detail: "Turn priorities and deadlines into a focused plan with blocks that feel realistic to follow.",
        action: "Build the study plan",
      },
      {
        title: "PeerConnect",
        caption: "Study with the right module circle",
        icon: Workflow,
        tone: "from-amber-500 to-orange-500",
        eyebrow: "Collaborate clearly",
        detail: "Bring in the right study partners when a topic needs discussion, review, or shared accountability.",
        action: "Open your study circle",
      },
      {
        title: "AI Coach",
        caption: `${productivityPulse}% momentum`,
        icon: MessageCircle,
        tone: "from-emerald-500 to-teal-500",
        eyebrow: "Improve continuously",
        detail: "Use coaching prompts and nudges to maintain rhythm and recover quickly when progress slows down.",
        action: "Get focused guidance",
      },
    ],
    [priorityQueue.length, productivityPulse, stats.total, subjectDistribution.length]
  );

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

      {!loadingGroups && <ActiveMeetingsCard groups={groups} />}

      {/* Task Overview */}
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
              accent: "from-blue-500 to-indigo-500",
              meta: `${stats.pending} active in queue`,
            },
            {
              label: "Completed",
              value: stats.completed,
              icon: CheckCircle2,
              tone: "text-emerald-600 bg-emerald-50 border-emerald-100",
              accent: "from-emerald-500 to-teal-500",
              meta: `${stats.completionRate}% completion rate`,
            },
            {
              label: "In Progress",
              value: stats.inProgress,
              icon: Clock3,
              tone: "text-amber-600 bg-amber-50 border-amber-100",
              accent: "from-amber-500 to-orange-500",
              meta: `${productivityPulse}% momentum`,
            },
            {
              label: "Overdue",
              value: stats.overdue,
              icon: Flame,
              tone: "text-rose-600 bg-rose-50 border-rose-100",
              accent: "from-rose-500 to-pink-500",
              meta: stats.overdue > 0 ? "Needs attention today" : "All caught up",
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.label} className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/75 p-5 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_-18px_rgba(59,130,246,0.35)]">
                <div className={`pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${card.accent}`} />
                <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-slate-100/70 blur-2xl transition-transform duration-300 group-hover:scale-110" />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-500">{card.label}</p>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{loading ? "--" : card.value}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-400">{card.meta}</p>
                  </div>
                  <div className={`rounded-2xl border p-2.5 shadow-inner shadow-white/50 ${card.tone}`}>
                    <Icon size={18} />
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${card.accent}`}
                    style={{
                      width: loading
                        ? "22%"
                        : `${Math.max(
                            18,
                            card.label === "Total Tasks"
                              ? Math.min(100, stats.total * 8)
                              : card.label === "Completed"
                              ? stats.completionRate
                              : card.label === "In Progress"
                              ? Math.min(100, productivityPulse)
                              : Math.min(100, stats.overdue * 22)
                          )}%`,
                    }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="h-5 w-1 rounded-full bg-gradient-to-b from-cyan-400 to-blue-600" />
          <Workflow size={14} className="text-cyan-600" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Smart Flow
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <article className="eds-flow-stage rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_22px_60px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Journey Diagram</p>
                <h2 className="mt-1 text-xl font-extrabold text-slate-900">3D Study Workflow</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-500">
                  The platform now flows from task setup into materials, AI planning, collaboration, and focused coaching.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-bold text-slate-500 shadow-sm">
                {flowSteps.length} connected stages
              </div>
            </div>

            <div className="eds-flow-board relative overflow-hidden rounded-[26px] border border-[#21356f] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_32%),linear-gradient(135deg,#081226_0%,#0d1a3d_52%,#16255f_100%)] p-4 md:p-6">
              <div className="flow-board-grid pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:34px_34px]" />
              <div className="flow-board-aurora pointer-events-none absolute inset-[-18%]" />
              <div className="flow-board-shimmer pointer-events-none absolute inset-y-0 left-[-18%] w-[42%]" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/8 to-transparent" />
              <div className="flow-board-orb flow-board-orb-cyan pointer-events-none absolute -right-12 top-10 h-52 w-52 rounded-full bg-cyan-300/18 blur-3xl" />
              <div className="flow-board-orb flow-board-orb-indigo pointer-events-none absolute -left-10 bottom-0 h-44 w-44 rounded-full bg-indigo-300/20 blur-3xl" />
              <div className="flow-board-vignette pointer-events-none absolute inset-0" />

              <div className="relative mx-auto max-w-6xl">
                <div className="relative">
                  <div className="pointer-events-none absolute bottom-8 left-1/2 top-8 hidden w-px -translate-x-1/2 bg-white/10 md:block" />
                  <div className="flow-line-core pointer-events-none absolute bottom-10 left-1/2 top-10 hidden w-[6px] -translate-x-1/2 rounded-full bg-gradient-to-b from-cyan-300 via-indigo-300 to-fuchsia-300 opacity-90 md:block" />
                  <div className="flow-line-halo pointer-events-none absolute left-1/2 top-10 hidden h-24 w-24 -translate-x-1/2 rounded-full bg-cyan-300/15 blur-3xl md:block" />

                  <div className="space-y-4 md:space-y-5">
                    {flowSteps.map((step, index) => {
                      const Icon = step.icon;
                      const isLeft = index % 2 === 0;
                      const stageNo = String(index + 1).padStart(2, "0");
                      const palette = flowPalette[index % flowPalette.length];
                      const status =
                        index === 0 ? "active" : index === flowSteps.length - 1 ? "done" : "next";
                      const statusLabel =
                        status === "active" ? "Active now" : status === "done" ? "Outcome ready" : "Coming next";
                      const statusClasses =
                        status === "active"
                          ? "border-emerald-300/35 bg-emerald-400/15 text-emerald-100"
                          : status === "done"
                          ? "border-indigo-300/30 bg-indigo-400/14 text-indigo-100"
                          : "border-white/12 bg-white/8 text-slate-200";

                      return (
                        <div
                          key={step.title}
                          className={`relative md:flex ${isLeft ? "md:justify-start" : "md:justify-end"}`}
                        >
                          <div className={`relative w-full md:w-[44%] ${isLeft ? "md:pr-16" : "md:pl-16"}`}>
                            <div
                              className={`pointer-events-none absolute top-1/2 hidden h-px w-16 -translate-y-1/2 md:block ${
                                isLeft ? "right-5 bg-gradient-to-r" : "left-5 bg-gradient-to-l"
                              } ${palette.line}`}
                            />

                            <article
                              tabIndex={0}
                              role="button"
                              aria-label={`Show details for ${step.title}`}
                              onClick={() => setOpenCard(index)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") setOpenCard(index);
                              }}
                              className={`eds-flow-node group relative cursor-pointer overflow-hidden rounded-[24px] border bg-white/[0.08] p-4 text-left text-white backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-300/80 ${palette.border} ${palette.glow} ${status === "active" ? "md:scale-[1.01]" : ""}`}
                              style={{
                                transitionProperty: "box-shadow, border-color, transform, background",
                                willChange: "transform, box-shadow",
                              }}
                            >
                              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${palette.panel}`} />
                              <div className="pointer-events-none absolute inset-x-5 bottom-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

                              <div className="relative flex items-start justify-between gap-3">
                                <div className="space-y-2.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-extrabold tracking-[0.18em] text-slate-100">
                                      STAGE {stageNo}
                                    </span>
                                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses}`}>
                                      {statusLabel}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-300/80">
                                      {step.eyebrow}
                                    </p>
                                    <h3 className="mt-1.5 text-lg font-bold tracking-tight text-white">{step.title}</h3>
                                  </div>
                                </div>

                                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br ${palette.accent} shadow-[0_14px_30px_-18px_rgba(15,23,42,0.75)] ring-1 ring-white/20`}>
                                  <Icon size={19} className="text-white" />
                                </span>
                              </div>

                              <div className="relative mt-3 grid gap-3">
                                <p className="max-w-md text-[13px] leading-5 text-slate-200/88">{step.detail}</p>

                                <div className="grid gap-2.5 rounded-[18px] border border-white/10 bg-slate-950/20 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                                  <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                      Key signal
                                    </p>
                                    <p className="mt-1 text-[13px] font-semibold text-white">{step.caption}</p>
                                  </div>
                                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-cyan-100">
                                    {step.action}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                                    <div
                                      className={`h-full rounded-full bg-gradient-to-r ${step.tone} ${
                                        status === "active" ? "animate-pulse" : ""
                                      }`}
                                      style={{ width: status === "active" ? "78%" : status === "done" ? "100%" : "52%" }}
                                    />
                                  </div>
                                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300/80">
                                    {status}
                                  </span>
                                </div>
                              </div>
                            </article>
                          </div>

                          <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
                            <div className={`relative flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-slate-950/70 ${status === "active" ? "shadow-[0_0_0_10px_rgba(16,185,129,0.18)]" : "shadow-[0_0_0_8px_rgba(99,102,241,0.14)]"}`}>
                              <div className={`absolute inset-1 rounded-full bg-gradient-to-br ${status === "active" ? "from-emerald-300 to-cyan-300" : "from-indigo-300 to-cyan-300"}`} />
                              <div className="relative h-2.5 w-2.5 rounded-full bg-white" />
                            </div>
                          </div>

                          {openCard === index && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onClick={() => setOpenCard(null)}>
                              <div className="relative w-full max-w-xl overflow-hidden rounded-[28px] border border-cyan-300/40 bg-[linear-gradient(180deg,#0b1633_0%,#0f1d44_100%)] p-8 text-white shadow-[0_30px_80px_-28px_rgba(8,18,38,0.95)]" onClick={(e) => e.stopPropagation()}>
                                <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${step.tone}`} />
                                <button className="absolute right-4 top-4 text-2xl text-white/70 hover:text-white" onClick={() => setOpenCard(null)} aria-label="Close">&times;</button>

                                <div className="flex items-start gap-4">
                                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${palette.accent} ring-1 ring-white/20`}>
                                    <Icon size={24} className="text-white" />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-200/80">
                                      Stage {stageNo}
                                    </p>
                                    <h3 className="mt-2 text-2xl font-bold tracking-tight">{step.title}</h3>
                                    <p className="mt-2 text-sm text-slate-300">{step.detail}</p>
                                  </div>
                                </div>

                                <div className="mt-6 grid gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 md:grid-cols-2">
                                  <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Current signal</p>
                                    <p className="mt-2 text-base font-semibold text-white">{step.caption}</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Workflow value</p>
                                    <p className="mt-2 text-sm leading-6 text-slate-200">{getFeatureDescription(step.title)}</p>
                                  </div>
                                </div>

                                <div className="mt-5 flex flex-wrap items-center gap-2">
                                  <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${statusClasses}`}>{statusLabel}</span>
                                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-cyan-100">{step.action}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </article>
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

      <style jsx>{`
        .flow-board-grid {
          animation: flowGridShift 18s linear infinite;
        }

        .flow-board-aurora {
          background:
            radial-gradient(circle at 18% 24%, rgba(34, 211, 238, 0.18), transparent 24%),
            radial-gradient(circle at 78% 18%, rgba(168, 85, 247, 0.16), transparent 28%),
            radial-gradient(circle at 58% 78%, rgba(59, 130, 246, 0.14), transparent 26%);
          filter: blur(10px);
          animation: flowAurora 14s ease-in-out infinite alternate;
        }

        .flow-board-shimmer {
          background: linear-gradient(90deg, transparent, rgba(125, 211, 252, 0.14), transparent);
          transform: skewX(-18deg);
          filter: blur(10px);
          animation: flowSweep 11s ease-in-out infinite;
        }

        .flow-board-orb {
          animation: flowOrbFloat 12s ease-in-out infinite;
        }

        .flow-board-orb-cyan {
          animation-delay: -2s;
        }

        .flow-board-orb-indigo {
          animation-duration: 15s;
          animation-delay: -6s;
        }

        .flow-board-vignette {
          background:
            radial-gradient(circle at 50% 50%, transparent 48%, rgba(8, 18, 38, 0.16) 100%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 22%, transparent 78%, rgba(15, 23, 42, 0.18));
        }

        .flow-line-core {
          box-shadow: 0 0 22px rgba(103, 232, 249, 0.22);
          animation: flowLinePulse 4.5s ease-in-out infinite;
        }

        .flow-line-halo {
          animation: flowHaloDrift 6s ease-in-out infinite;
        }

        @keyframes flowGridShift {
          0% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(-10px, 8px, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes flowAurora {
          0% {
            transform: translate3d(-2%, -1%, 0) scale(1);
            opacity: 0.7;
          }
          50% {
            transform: translate3d(3%, 2%, 0) scale(1.06);
            opacity: 1;
          }
          100% {
            transform: translate3d(-1%, 4%, 0) scale(1.02);
            opacity: 0.84;
          }
        }

        @keyframes flowSweep {
          0% {
            transform: translateX(0) skewX(-18deg);
            opacity: 0;
          }
          12% {
            opacity: 0.55;
          }
          50% {
            transform: translateX(240%) skewX(-18deg);
            opacity: 0.2;
          }
          100% {
            transform: translateX(420%) skewX(-18deg);
            opacity: 0;
          }
        }

        @keyframes flowOrbFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(-18px, 14px, 0) scale(1.08);
          }
        }

        @keyframes flowLinePulse {
          0%,
          100% {
            opacity: 0.82;
            filter: saturate(1);
          }
          50% {
            opacity: 1;
            filter: saturate(1.28);
          }
        }

        @keyframes flowHaloDrift {
          0%,
          100% {
            transform: translateX(-50%) translateY(0) scale(0.92);
            opacity: 0.26;
          }
          50% {
            transform: translateX(-50%) translateY(26px) scale(1.08);
            opacity: 0.42;
          }
        }
      `}</style>
    </div>
  );
}
