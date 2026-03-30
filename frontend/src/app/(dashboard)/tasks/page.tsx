"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock3,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  ListTodo,
  Sparkles,
  Activity,
  AlertTriangle,
  BookOpen,
  Flame,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type TaskStatus = "pending" | "in_progress" | "completed";
type TaskDifficulty = "easy" | "medium" | "hard";
type TaskType = "reading" | "assignment" | "exam" | "coding";

type Task = {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  deadline: string;
  task_type: TaskType;
  estimated_hours: number;
  difficulty: TaskDifficulty;
  status: TaskStatus;
  priority_score: number | null;
  created_at: string;
  updated_at: string;
};

type TaskForm = {
  title: string;
  description: string;
  subject: string;
  deadline: string;
  task_type: TaskType;
  estimated_hours: number;
  difficulty: TaskDifficulty;
  status: TaskStatus;
};

const defaultForm: TaskForm = {
  title: "",
  description: "",
  subject: "",
  deadline: "",
  task_type: "reading",
  estimated_hours: 2,
  difficulty: "medium",
  status: "pending",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysLeft(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function difficultyClass(value: TaskDifficulty) {
  if (value === "easy") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (value === "medium") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}

function statusClass(value: TaskStatus) {
  if (value === "completed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (value === "in_progress") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function priorityColor(score: number | null) {
  if (!score) return "bg-slate-100";
  if (score >= 7) return "bg-rose-300";
  if (score >= 4) return "bg-amber-300";
  return "bg-emerald-300";
}

function getDaysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getFirstDayOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | TaskDifficulty>("all");

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskForm>(defaultForm);
  
  const [deleteConfirm, setDeleteConfirm] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch("/tasks");
      setTasks(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load tasks";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const text = `${task.title} ${task.subject} ${task.description || ""}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesDifficulty = difficultyFilter === "all" || task.difficulty === difficultyFilter;
      return matchesSearch && matchesStatus && matchesDifficulty;
    });
  }, [tasks, search, statusFilter, difficultyFilter]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    return { total, pending, inProgress, completed };
  }, [tasks]);

  const openCreate = () => {
    setEditingTask(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || "",
      subject: task.subject,
      deadline: task.deadline.slice(0, 16),
      task_type: task.task_type,
      estimated_hours: task.estimated_hours,
      difficulty: task.difficulty,
      status: task.status,
    });
    setShowModal(true);
  };

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.subject.trim() || !form.deadline) return;

    try {
      setSaving(true);
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        subject: form.subject.trim(),
        deadline: new Date(form.deadline).toISOString(),
        task_type: form.task_type,
        estimated_hours: form.estimated_hours,
        difficulty: form.difficulty,
        status: form.status,
      };

      if (editingTask) {
        await apiFetch(`/tasks/${editingTask.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/tasks", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setShowModal(false);
      setForm(defaultForm);
      setEditingTask(null);
      await loadTasks();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to save task";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === "completed" ? "pending" : "completed";
    try {
      await apiFetch(`/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
      });
      await loadTasks();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to update status";
      setError(message);
    }
  };

  const removeTask = async (task: Task) => {
    setDeleteConfirm(task);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setIsDeleting(true);
      await apiFetch(`/tasks/${deleteConfirm.id}`, { method: "DELETE" });
      await loadTasks();
      setDeleteConfirm(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to delete task";
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const getTasksForDate = useMemo(() => {
    return (date: Date) => {
      const dateStr = date.toISOString().split("T")[0];
      return tasks.filter(task => task.deadline.startsWith(dateStr) && task.status !== "completed");
    };
  }, [tasks]);

  const navigateToAnalytics = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    router.push(`/analytics?date=${dateStr}`);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 lg:p-6">
      {/* ── Page Header with Gradient ── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-600 p-6 shadow-2xl shadow-blue-900/40">
        {/* Ambient glow blobs */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-teal-400/15 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white/15 p-3 ring-1 ring-white/25 backdrop-blur-sm">
              <ListTodo size={26} className="text-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-100">
                EduSense · Task Center
              </p>
              <h1 className="text-2xl font-bold text-white lg:text-3xl">
                Manage Your Tasks
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-blue-100 ring-1 ring-white/20 backdrop-blur-sm">
              <Sparkles size={13} />
              Smart Prioritization
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-blue-100 ring-1 ring-white/20 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live
            </span>
            <button
              onClick={() => setShowCalendarView(!showCalendarView)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                showCalendarView
                  ? "bg-white/20 text-white ring-1 ring-white/40"
                  : "bg-white text-blue-600 hover:bg-blue-50"
              }`}
            >
              <Calendar size={18} />
              {showCalendarView ? "List View" : "Calendar"}
            </button>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-full bg-white text-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-50 transition-all"
            >
              <Plus size={18} />
              New Task
            </button>
          </div>
        </div>
      </section>

      {/* ── Section: Quick Stats ── */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-400 to-teal-600" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Performance & Insights
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Overdue Tasks Alert */}
          <article className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-red-50 p-4 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-rose-700">Overdue Tasks</p>
                <p className="mt-2 text-3xl font-bold text-rose-900">
                  {loading ? "--" : tasks.filter(t => t.status !== "completed" && daysLeft(t.deadline) < 0).length}
                </p>
                <p className="mt-1 text-xs text-rose-600">Need immediate attention</p>
              </div>
              <div className="rounded-xl bg-rose-200/50 p-2.5">
                <AlertTriangle size={18} className="text-rose-700" />
              </div>
            </div>
          </article>

          {/* Completion Rate */}
          <article className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-700">Completion Rate</p>
                <p className="mt-2 text-3xl font-bold text-emerald-900">
                  {loading ? "--" : `${Math.round((stats.completed / (stats.total || 1)) * 100)}%`}
                </p>
                <div className="mt-2 h-1.5 w-16 rounded-full bg-emerald-200">
                  <div 
                    className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600" 
                    style={{ width: `${Math.round((stats.completed / (stats.total || 1)) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="rounded-xl bg-emerald-200/50 p-2.5">
                <CheckCircle2 size={18} className="text-emerald-700" />
              </div>
            </div>
          </article>

          {/* Avg Task Complexity */}
          <article className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-700">Avg. Difficulty</p>
                <p className="mt-2 text-3xl font-bold text-amber-900">
                  {loading ? "--" : (
                    tasks.length > 0
                      ? tasks.reduce((sum, t) => sum + (t.difficulty === "hard" ? 3 : t.difficulty === "medium" ? 2 : 1), 0) / tasks.length
                      : 0
                  ).toFixed(1)}
                </p>
                <p className="mt-1 text-xs text-amber-600">
                  {tasks.length > 0 
                    ? tasks.filter(t => t.difficulty === "hard").length > tasks.length / 2
                      ? "Challenging workload"
                      : "Balanced workload"
                    : "No tasks yet"
                  }
                </p>
              </div>
              <div className="rounded-xl bg-amber-200/50 p-2.5">
                <Flame size={18} className="text-amber-700" />
              </div>
            </div>
          </article>

          {/* Most Active Subject */}
          <article className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-4 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700">Top Subject</p>
                <p className="mt-2 truncate text-2xl font-bold text-blue-900">
                  {loading ? "--" : (
                    tasks.length > 0
                      ? Object.entries(
                          tasks.reduce((acc, t) => ({
                            ...acc,
                            [t.subject]: (acc[t.subject as keyof typeof acc] || 0) + 1
                          }), {} as Record<string, number>)
                        ).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"
                      : "N/A"
                  )}
                </p>
                <p className="mt-1 text-xs text-blue-600">Most tasks assigned</p>
              </div>
              <div className="rounded-xl bg-blue-200/50 p-2.5">
                <BookOpen size={18} className="text-blue-700" />
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* ── Section: Calendar View ── */}
      {showCalendarView && (
        <section className="animate-in fade-in duration-300">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-400 to-teal-600" />
            <Calendar size={14} className="text-blue-500" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Task Calendar
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Month Navigation */}
            <div className="mb-8 flex items-center justify-between">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="rounded-lg p-2 hover:bg-slate-100 transition-all"
              >
                <ChevronLeft size={20} className="text-slate-600" />
              </button>
              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900">
                  {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </h3>
              </div>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="rounded-lg p-2 hover:bg-slate-100 transition-all"
              >
                <ChevronRight size={20} className="text-slate-600" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-2">
              {/* Days of Week Header */}
              <div className="grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center">
                    <p className="text-xs font-bold uppercase text-slate-500">{day}</p>
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {(() => {
                  const daysInMonth = getDaysInMonth(currentMonth);
                  const firstDay = getFirstDayOfMonth(currentMonth);
                  const days = [];

                  // Empty cells for days before month starts
                  for (let i = 0; i < firstDay; i++) {
                      days.push(
                        <div key={`empty-${i}`} className="h-32 rounded-lg bg-slate-50" />
                      );
                  }

                  // Calendar days
                  for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    const tasksForDay = getTasksForDate(date);
                    const isToday =
                      date.toDateString() === new Date().toDateString();

                    days.push(
                      <button
                          key={day}
                          onClick={() => navigateToAnalytics(date)}
                          className={`h-32 rounded-lg border-2 transition-all duration-200 p-2 flex flex-col overflow-hidden hover:shadow-md cursor-pointer ${
                          isToday
                            ? "border-blue-400 bg-blue-50"
                            : "border-slate-200 bg-white hover:border-blue-300"
                        }`}
                      >
                          {/* Day number */}
                          <span className={`text-xs font-bold mb-1 ${isToday ? "text-blue-600" : "text-slate-600"}`}>
                          {day}
                        </span>

                          {/* Tasks list */}
                          <div className="flex-1 overflow-y-auto space-y-1 text-left min-w-0">
                            {tasksForDay.length > 0 ? (
                              tasksForDay.slice(0, 3).map((task) => (
                                <div
                                  key={task.id}
                                  className={`text-xs rounded px-1.5 py-0.5 truncate font-medium ${
                                      (task.priority_score ?? 0) >= 7
                                      ? "bg-rose-100 text-rose-700 border-l-2 border-rose-400"
                                        : (task.priority_score ?? 0) >= 4
                                      ? "bg-amber-100 text-amber-700 border-l-2 border-amber-400"
                                      : "bg-emerald-100 text-emerald-700 border-l-2 border-emerald-400"
                                  }`}
                                  title={`${task.title} (${task.subject})`}
                                >
                                  <div className="truncate">{task.title}</div>
                                  <div className="text-xs opacity-75 truncate">{task.subject}</div>
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">No tasks</span>
                            )}
                            {tasksForDay.length > 3 && (
                              <div className="text-xs font-semibold text-slate-500 px-1.5">
                                +{tasksForDay.length - 3} more
                              </div>
                            )}
                          </div>
                      </button>
                    );
                  }

                  return days;
                })()}
              </div>

              {/* Legend */}
              <div className="mt-6 grid grid-cols-3 gap-4 border-t border-slate-200 pt-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-300" />
                  <span className="text-xs text-slate-600">High Priority</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-300" />
                  <span className="text-xs text-slate-600">Medium Priority</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-300" />
                  <span className="text-xs text-slate-600">Low Priority</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Section: Filters ── */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-400 to-teal-600" />
          <Sparkles size={14} className="text-blue-500" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Search & Filter
          </h2>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, subject or description"
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50"
              />
            </div>

            <div className="relative">
              <Filter size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | TaskStatus)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="relative">
              <Filter size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value as "all" | TaskDifficulty)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50"
              >
                <option value="all">All Difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <section className="rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          ⚠️ {error}
        </section>
      )}

      {/* ── Section: Task List ── */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-400 to-teal-600" />
          <Activity size={14} className="text-blue-500" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Active Tasks
          </h2>
        </div>

        <div className="space-y-3">
          {/* Loading Skeleton */}
          {loading && (
            <>
              {[...Array(3)].map((_, idx) => (
                <div
                  key={idx}
                  className="animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                >
                  {/* Header skeleton */}
                  <div className="border-b border-slate-100 px-6 py-4">
                    <div className="flex items-start gap-3 justify-between">
                      <div className="flex-1">
                        <div className="h-6 w-3/4 rounded-lg bg-slate-200" />
                        <div className="mt-3 h-4 w-20 rounded-lg bg-slate-100" />
                        <div className="mt-2 h-3 w-1/2 rounded-lg bg-slate-100" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-6 w-20 rounded-full bg-slate-200" />
                        <div className="h-6 w-16 rounded-full bg-slate-200" />
                      </div>
                    </div>
                  </div>

                  {/* Middle skeleton */}
                  <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-slate-50">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="h-5 w-5 rounded-lg bg-slate-200" />
                        <div className="flex-1">
                          <div className="h-3 w-16 rounded bg-slate-200" />
                          <div className="mt-2 h-4 w-20 rounded bg-slate-200" />
                          <div className="mt-2 h-3 w-12 rounded bg-slate-100" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer skeleton */}
                  <div className="flex gap-2 px-6 py-4 bg-slate-50">
                    <div className="flex-1" />
                    <div className="flex gap-2">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-8 w-20 rounded-lg bg-slate-200" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {!loading && filteredTasks.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              <p className="font-medium">No tasks match your filters</p>
              <p className="mt-1 text-xs">Try adjusting your search or creating a new task</p>
            </div>
          )}

          {filteredTasks.map((task) => {
            const remaining = daysLeft(task.deadline);
            return (
              <article
                key={task.id}
                className="group rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-300 overflow-hidden"
              >
                {/* Top section with title and badges */}
                <div className="border-b border-slate-100 px-6 py-4">
                  <div className="flex flex-wrap items-start gap-3 justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                        {task.title}
                      </h3>
                      <p className="mt-1.5 text-sm font-medium text-slate-600">{task.subject}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {task.task_type} · {task.estimated_hours}h estimated
                      </p>
                      {task.description && (
                        <p className="mt-2 line-clamp-1 text-sm text-slate-500">{task.description}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold transition-all duration-200 ${statusClass(task.status)}`}>
                        {task.status === "completed" ? "✓" : task.status === "in_progress" ? "⚙️" : "⏳"} {task.status.replace("_", " ")}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold transition-all duration-200 ${difficultyClass(task.difficulty)}`}>
                        {task.difficulty === "hard" ? "🔴" : task.difficulty === "medium" ? "🟡" : "🟢"} {task.difficulty}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle section with deadline and priority */}
                <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-gradient-to-r from-slate-50/50 to-slate-0">
                  {/* Deadline */}
                  <div className="flex items-center gap-3">
                    <CalendarClock size={20} className="text-slate-400" />
                    <div>
                      <p className="text-xs font-medium text-slate-500">Deadline</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-900">{formatDate(task.deadline)}</p>
                      <p className={`mt-1 text-xs font-semibold ${
                        remaining <= 1 ? "text-rose-600" : remaining <= 3 ? "text-amber-600" : "text-emerald-600"
                      }`}>
                        {remaining < 0 ? `Overdue ${Math.abs(remaining)}d` : `${remaining}d left`}
                      </p>
                    </div>
                  </div>

                  {/* Priority Score */}
                  <div className="flex items-center gap-3">
                    <TrendingUp size={20} className="text-slate-400" />
                    <div>
                      <p className="text-xs font-medium text-slate-500">Priority</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-900">{(task.priority_score || 0).toFixed(1)}/10</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {(task.priority_score || 0) >= 7 ? "High" : (task.priority_score || 0) >= 4 ? "Medium" : "Low"}
                      </p>
                    </div>
                  </div>

                  {/* Creation/Updated */}
                  <div className="flex items-center gap-3">
                    <Clock3 size={20} className="text-slate-400" />
                    <div>
                      <p className="text-xs font-medium text-slate-500">Updated</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-900">{formatDate(task.updated_at)}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {new Date(task.updated_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom section with actions */}
                <div className="flex items-center justify-between gap-2 px-6 py-4 bg-slate-50/50">
                  <div className="flex-1" />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => toggleTaskStatus(task)}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold border border-slate-300 text-slate-700 transition-all duration-200 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      {task.status === "completed" ? "Reopen" : "Complete"}
                    </button>
                    <button
                      onClick={() => openEdit(task)}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold border border-slate-300 text-slate-700 transition-all duration-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => router.push(`/planner?task_id=${task.id}`)}
                      className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-md"
                    >
                      Plan Task
                    </button>
                    <button
                      onClick={() => removeTask(task)}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold border border-rose-300 text-rose-700 transition-all duration-200 hover:bg-rose-50 hover:border-rose-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl animate-in zoom-in-95 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900">{editingTask ? "✏️ Edit Task" : "➕ Create New Task"}</h2>
            <p className="mt-1 text-sm text-slate-600">Fill in the task details below and save your changes.</p>

            <form onSubmit={submitForm} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Task Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Add task description (optional)"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 resize-none"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                  <input
                    value={form.subject}
                    onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g., Mathematics"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Deadline</label>
                  <input
                    type="datetime-local"
                    value={form.deadline}
                    onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Task Type</label>
                  <select
                    value={form.task_type}
                    onChange={(e) => setForm((prev) => ({ ...prev, task_type: e.target.value as TaskType }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50"
                  >
                    <option value="reading">Reading</option>
                    <option value="assignment">Assignment</option>
                    <option value="exam">Exam</option>
                    <option value="coding">Coding</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Estimated Hours</label>
                  <input
                    type="number"
                    min={0.5}
                    max={200}
                    step={0.5}
                    value={form.estimated_hours}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, estimated_hours: Number(e.target.value) || 1 }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm((prev) => ({ ...prev, difficulty: e.target.value as TaskDifficulty }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50"
                  >
                    <option value="easy">🟢 Easy</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="hard">🔴 Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as TaskStatus }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50"
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="in_progress">⚙️ In Progress</option>
                    <option value="completed">✅ Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:from-blue-700 hover:to-cyan-700 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : editingTask ? "Save Changes" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm animate-in zoom-in-95 rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-rose-100 p-3">
                <Trash2 size={24} className="text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Task?</h3>
                <p className="mt-0.5 text-sm text-slate-600">This action cannot be undone</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-4">
              <p className="text-sm font-semibold text-slate-900">"{deleteConfirm.title}"</p>
              <p className="mt-1 text-xs text-slate-600">Subject: {deleteConfirm.subject}</p>
              {deleteConfirm.description && (
                <p className="mt-2 line-clamp-2 text-xs text-slate-500">{deleteConfirm.description}</p>
              )}
            </div>

            <div className="mt-4 flex gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Keep Task
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:from-rose-700 hover:to-red-700 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
