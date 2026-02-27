"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock3,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

type TaskStatus = "pending" | "in_progress" | "completed";
type TaskDifficulty = "easy" | "medium" | "hard";

type Task = {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  deadline: string;
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
  difficulty: TaskDifficulty;
  status: TaskStatus;
};

const defaultForm: TaskForm = {
  title: "",
  description: "",
  subject: "",
  deadline: "",
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
    const proceed = window.confirm(`Delete "${task.title}"?`);
    if (!proceed) return;
    try {
      await apiFetch(`/tasks/${task.id}`, { method: "DELETE" });
      await loadTasks();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to delete task";
      setError(message);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-4 lg:p-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Task Workspace</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">Task List</h1>
            <p className="mt-1 text-sm text-slate-600">Manage assignments with filters, priorities, and planner shortcuts.</p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            New Task
          </button>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "All Tasks", value: stats.total, icon: Circle },
          { label: "Pending", value: stats.pending, icon: Clock3 },
          { label: "In Progress", value: stats.inProgress, icon: CalendarClock },
          { label: "Completed", value: stats.completed, icon: CheckCircle2 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{loading ? "--" : item.value}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600">
                  <Icon size={16} />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 lg:p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, subject or description"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
            />
          </div>

          <div className="relative">
            <Filter size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | TaskStatus)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as "all" | TaskDifficulty)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
            >
              <option value="all">All Difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </section>

      {error && (
        <section className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </section>
      )}

      <section className="mt-6 space-y-3">
        {!loading && filteredTasks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No tasks match your current filters.
          </div>
        )}

        {filteredTasks.map((task) => {
          const remaining = daysLeft(task.deadline);
          return (
            <article key={task.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-base font-semibold text-slate-900">{task.title}</h3>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(task.status)}`}>
                      {task.status.replace("_", " ")}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${difficultyClass(task.difficulty)}`}>
                      {task.difficulty}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{task.subject}</p>
                  {task.description && <p className="mt-2 text-sm text-slate-600">{task.description}</p>}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
                  <p className="text-xs text-slate-500">Deadline</p>
                  <p className="text-sm font-medium text-slate-800">{formatDate(task.deadline)}</p>
                  <p className={`text-xs ${remaining <= 1 ? "text-rose-600" : "text-slate-500"}`}>
                    {remaining < 0 ? `${Math.abs(remaining)}d overdue` : `${remaining}d left`}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-500">
                  Priority score: <span className="font-semibold text-slate-700">{(task.priority_score || 0).toFixed(1)}</span>
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => toggleTaskStatus(task)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Mark {task.status === "completed" ? "Pending" : "Completed"}
                  </button>
                  <button
                    onClick={() => openEdit(task)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil size={12} />
                    Edit
                  </button>
                  <button
                    onClick={() => router.push(`/planner?task_id=${task.id}`)}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    Plan
                  </button>
                  <button
                    onClick={() => removeTask(task)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-900">{editingTask ? "Edit Task" : "Create Task"}</h2>
            <p className="mt-1 text-sm text-slate-500">Fill task details and save changes.</p>

            <form onSubmit={submitForm} className="mt-4 space-y-3">
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Task title"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                required
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Description (optional)"
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={form.subject}
                  onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="Subject"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                  required
                />
                <input
                  type="datetime-local"
                  value={form.deadline}
                  onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                  required
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm((prev) => ({ ...prev, difficulty: e.target.value as TaskDifficulty }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <select
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as TaskStatus }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingTask ? "Save Changes" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
