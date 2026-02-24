"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  ClipboardList,
  CheckCircle2,
  Clock,
  Flame,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Calendar,
  X,
  Brain,
  Target,
  AlertCircle,
  Zap,
  Info,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Task {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  deadline: string;
  difficulty: string;
  status: string;
  priority_score: number | null;
  created_at: string;
  updated_at: string;
}

interface PriorityBreakdown {
  task_id: string;
  task_title: string;
  final_score: number;
  priority_label: string;
  days_remaining: number;
  breakdown: {
    deadline_proximity: { score: number; weight: number; weighted_score: number; reason: string };
    difficulty: { score: number; weight: number; weighted_score: number; reason: string };
    status: { score: number; weight: number; weighted_score: number; reason: string };
    overdue_penalty: { score: number; weight: number; weighted_score: number; reason: string };
  };
  suggestion: string;
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [priorityData, setPriorityData] = useState<PriorityBreakdown | null>(null);
  const [showPriorityPanel, setShowPriorityPanel] = useState(false);
  const [loadingPriority, setLoadingPriority] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    deadline: "",
    difficulty: "medium",
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API}/api/tasks/`);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Create task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/tasks/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          deadline: new Date(formData.deadline).toISOString(),
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ title: "", description: "", subject: "", deadline: "", difficulty: "medium" });
        fetchTasks();
      }
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle task status
  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    try {
      await fetch(`${API}/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTasks();
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    try {
      await fetch(`${API}/api/tasks/${taskId}`, { method: "DELETE" });
      fetchTasks();
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  // Fetch priority breakdown for a task
  const fetchPriority = async (taskId: string) => {
    setLoadingPriority(true);
    setShowPriorityPanel(true);
    try {
      const res = await fetch(`${API}/api/tasks/${taskId}/priority`);
      const data = await res.json();
      setPriorityData(data);
    } catch (err) {
      console.error("Failed to fetch priority:", err);
    } finally {
      setLoadingPriority(false);
    }
  };

  // Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const overdueTasks = tasks.filter(
    (t) => new Date(t.deadline) < new Date() && t.status !== "completed"
  ).length;

  // Filter tasks
  const filteredTasks =
    filter === "all"
      ? tasks
      : tasks.filter((t) => t.status === filter);

  // Upcoming deadlines (non-completed, sorted by deadline)
  const upcomingDeadlines = tasks
    .filter((t) => t.status !== "completed")
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 4);

  const getDaysUntil = (deadline: string) => {
    const diff = Math.ceil(
      (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff;
  };

  const getCountdownStyle = (days: number) => {
    if (days < 0) return "bg-red-50 text-red-500";
    if (days <= 3) return "bg-red-50 text-red-500";
    if (days <= 7) return "bg-amber-50 text-amber-500";
    return "bg-emerald-50 text-emerald-500";
  };

  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-emerald-50 text-emerald-600";
      case "medium":
        return "bg-amber-50 text-amber-600";
      case "hard":
        return "bg-red-50 text-red-600";
      default:
        return "bg-slate-100 text-slate-500";
    }
  };

  const getPriorityStyle = (score: number | null) => {
    if (!score) return { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400", label: "—" };
    if (score >= 8.0) return { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]", label: "Critical" };
    if (score >= 6.0) return { bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.4)]", label: "High" };
    if (score >= 4.0) return { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]", label: "Medium" };
    return { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]", label: "Low" };
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDeadlineDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      day: d.getDate(),
    };
  };

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-7 animate-[fadeInUp_0.45s_ease_forwards]">
        <div>
          <h1 className="text-[28px] font-bold text-slate-800 tracking-tight mb-1 font-[family-name:var(--font-playfair)]">
            Good Morning, Sadumina{" "}
            <span className="inline-block animate-[wave_2s_ease-in-out_infinite] origin-[70%_70%]">
              👋
            </span>
          </h1>
          <p className="text-sm text-slate-500">
            You have <strong className="text-slate-700">{pendingTasks} tasks</strong> pending.
            Stay focused!
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-[0_2px_8px_rgba(99,102,241,0.3)] hover:bg-indigo-600 hover:shadow-[0_4px_16px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
        >
          <Plus size={18} />
          New Task
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        {[
          {
            icon: <ClipboardList size={20} />,
            label: "Total Tasks",
            value: totalTasks,
            change: `${pendingTasks} pending`,
            positive: true,
            color: "indigo",
          },
          {
            icon: <CheckCircle2 size={20} />,
            label: "Completed",
            value: completedTasks,
            change: `${completionRate}% rate`,
            positive: true,
            color: "emerald",
          },
          {
            icon: <Clock size={20} />,
            label: "In Progress",
            value: inProgressTasks,
            change: `${pendingTasks} pending`,
            positive: false,
            color: "amber",
          },
          {
            icon: <Flame size={20} />,
            label: "Overdue",
            value: overdueTasks,
            change: overdueTasks > 0 ? "Needs attention" : "All on track",
            positive: overdueTasks === 0,
            color: "red",
          },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="bg-white border border-slate-100 rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div
              className={`absolute top-0 left-0 right-0 h-[3px] ${
                stat.color === "indigo"
                  ? "bg-indigo-500"
                  : stat.color === "emerald"
                  ? "bg-emerald-500"
                  : stat.color === "amber"
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
            />
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  stat.color === "indigo"
                    ? "bg-indigo-50 text-indigo-500"
                    : stat.color === "emerald"
                    ? "bg-emerald-50 text-emerald-500"
                    : stat.color === "amber"
                    ? "bg-amber-50 text-amber-500"
                    : "bg-red-50 text-red-500"
                }`}
              >
                {stat.icon}
              </div>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                {stat.label}
              </span>
            </div>
            <div className="text-[30px] font-bold text-slate-800 tracking-tight leading-none">
              {stat.value}
            </div>
            <div
              className={`text-xs font-medium mt-1 flex items-center gap-1 ${
                stat.positive ? "text-emerald-500" : "text-red-500"
              }`}
            >
              {stat.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-[1fr_380px] gap-5">
        {/* Task List */}
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <span className="text-[15px] font-semibold text-slate-800">Recent Tasks</span>
            <span className="text-[13px] text-indigo-500 font-medium cursor-pointer hover:text-indigo-600 transition-colors">
              View All →
            </span>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1.5 px-5 py-3 border-b border-slate-100">
            {[
              { key: "all", label: "All" },
              { key: "pending", label: "Pending" },
              { key: "in_progress", label: "In Progress" },
              { key: "completed", label: "Completed" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-medium transition-all duration-200 cursor-pointer border-0 ${
                  filter === f.key
                    ? "bg-indigo-500 text-white shadow-[0_2px_6px_rgba(99,102,241,0.25)]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Task Items */}
          {loading ? (
            <div className="p-10 text-center text-slate-400 text-sm">Loading tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-slate-400 text-sm mb-2">No tasks found</div>
              <button
                onClick={() => setShowModal(true)}
                className="text-indigo-500 text-sm font-medium hover:text-indigo-600 cursor-pointer"
              >
                + Create your first task
              </button>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => fetchPriority(task.id)}
                className="flex items-center gap-3.5 px-5 py-3.5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-all duration-200 group cursor-pointer"
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleTaskStatus(task)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 cursor-pointer ${
                    task.status === "completed"
                      ? "bg-emerald-500 border-emerald-500"
                      : "border-slate-300 hover:border-indigo-500"
                  }`}
                >
                  {task.status === "completed" && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-medium truncate ${
                      task.status === "completed"
                        ? "line-through text-slate-400"
                        : "text-slate-800"
                    }`}
                  >
                    {task.title}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <BookOpen size={12} />
                      {task.subject}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(task.deadline)}
                    </span>
                  </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  {/* Priority Indicator */}
                  {task.priority_score !== null && (
                    <div className="flex items-center gap-1.5" title={`Priority: ${task.priority_score}/10`}>
                      <span className={`w-2 h-2 rounded-full ${getPriorityStyle(task.priority_score).dot}`} />
                      <span className={`text-[11px] font-semibold ${getPriorityStyle(task.priority_score).text}`}>
                        {task.priority_score}
                      </span>
                    </div>
                  )}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${getDifficultyStyle(
                      task.difficulty
                    )}`}
                  >
                    {task.difficulty}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all duration-200 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Upcoming Deadlines */}
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <span className="text-[15px] font-semibold text-slate-800">
                Upcoming Deadlines
              </span>
              <span className="text-[13px] text-indigo-500 font-medium cursor-pointer hover:text-indigo-600 transition-colors">
                Calendar →
              </span>
            </div>
            <div className="px-5 py-3">
              {upcomingDeadlines.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-sm">
                  No upcoming deadlines
                </div>
              ) : (
                upcomingDeadlines.map((task) => {
                  const { month, day } = formatDeadlineDate(task.deadline);
                  const daysUntil = getDaysUntil(task.deadline);
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3.5 py-3 border-b border-slate-100 last:border-b-0"
                    >
                      <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wide leading-none">
                          {month}
                        </span>
                        <span className="text-lg font-bold text-slate-800 leading-tight">
                          {day}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-medium text-slate-800 truncate">
                          {task.title}
                        </div>
                        <div className="text-xs text-slate-400">{task.subject}</div>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${getCountdownStyle(
                          daysUntil
                        )}`}
                      >
                        {daysUntil < 0
                          ? `${Math.abs(daysUntil)}d overdue`
                          : daysUntil === 0
                          ? "Today"
                          : `${daysUntil} days`}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Productivity Score */}
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <span className="text-[15px] font-semibold text-slate-800">
                Productivity Score
              </span>
            </div>
            <div className="px-5 py-7 text-center">
              <div className="relative w-[120px] h-[120px] mx-auto mb-4">
                <svg viewBox="0 0 36 36" className="-rotate-90">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="2.8"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#6366F1"
                    strokeWidth="2.8"
                    strokeDasharray={`${completionRate}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[28px] font-bold text-indigo-500">
                  {completionRate}
                  <span className="text-sm font-medium">%</span>
                </div>
              </div>
              <div className="text-sm font-medium text-slate-800 mb-1">
                {completionRate >= 75
                  ? "Great Progress!"
                  : completionRate >= 50
                  ? "Keep Going!"
                  : "Let's Get Started!"}
              </div>
              <div className="text-[12.5px] text-slate-500 leading-relaxed">
                {completedTasks} of {totalTasks} tasks completed. You&apos;re doing well!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Create Task Modal ─── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center animate-[fadeIn_0.2s_ease]"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white rounded-2xl w-[520px] max-h-[85vh] overflow-y-auto shadow-[0_12px_40px_rgba(0,0,0,0.1)] animate-[scaleIn_0.25s_ease]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-6">
              <h2 className="text-[22px] font-bold text-slate-800 font-[family-name:var(--font-playfair)]">
                Create New Task
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-[34px] h-[34px] rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:border-red-400 hover:text-red-500 transition-all duration-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateTask} className="px-6 py-5">
              {/* Title */}
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-slate-800 mb-1.5">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Complete ITPM Assignment 3"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] placeholder:text-slate-400"
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-slate-800 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add details about this task..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 outline-none resize-y min-h-[80px] transition-all duration-200 focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] placeholder:text-slate-400"
                />
              </div>

              {/* Subject + Deadline */}
              <div className="grid grid-cols-2 gap-3.5 mb-4">
                <div>
                  <label className="block text-[13px] font-medium text-slate-800 mb-1.5">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Data Structures"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-slate-800 mb-1.5">
                    Deadline <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
                  />
                </div>
              </div>

              {/* Difficulty */}
              <div className="mb-6">
                <label className="block text-[13px] font-medium text-slate-800 mb-1.5">
                  Difficulty <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2.5">
                  {(["easy", "medium", "hard"] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData({ ...formData, difficulty: level })}
                      className={`flex-1 py-2.5 rounded-lg border-[1.5px] text-[13px] font-medium text-center transition-all duration-200 cursor-pointer ${
                        formData.difficulty === level
                          ? level === "easy"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                            : level === "medium"
                            ? "border-amber-500 bg-amber-50 text-amber-600"
                            : "border-red-500 bg-red-50 text-red-600"
                          : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {level === "easy" ? "🟢" : level === "medium" ? "🟡" : "🔴"}{" "}
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-[0_2px_8px_rgba(99,102,241,0.3)] hover:bg-indigo-600 hover:shadow-[0_4px_16px_rgba(99,102,241,0.4)] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={16} />
                  {submitting ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Priority Breakdown Panel ─── */}
      {showPriorityPanel && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center animate-[fadeIn_0.2s_ease]"
          onClick={(e) => e.target === e.currentTarget && setShowPriorityPanel(false)}
        >
          <div className="bg-white rounded-2xl w-[480px] max-h-[85vh] overflow-y-auto shadow-[0_12px_40px_rgba(0,0,0,0.1)] animate-[scaleIn_0.25s_ease]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Brain size={20} className="text-indigo-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 font-[family-name:var(--font-playfair)]">
                    AI Priority Analysis
                  </h2>
                  <p className="text-xs text-slate-400">Powered by EduSense AI Engine</p>
                </div>
              </div>
              <button
                onClick={() => setShowPriorityPanel(false)}
                className="w-[34px] h-[34px] rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:border-red-400 hover:text-red-500 transition-all duration-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {loadingPriority ? (
              <div className="px-6 py-12 text-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-400">Analyzing task priority...</p>
              </div>
            ) : priorityData ? (
              <div className="px-6 py-5">
                {/* Task Title */}
                <div className="mb-5">
                  <p className="text-xs text-slate-400 mb-1">Task</p>
                  <p className="text-[15px] font-semibold text-slate-800">{priorityData.task_title}</p>
                </div>

                {/* Score Circle */}
                <div className="flex items-center gap-6 mb-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="relative w-[90px] h-[90px] flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="-rotate-90">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={
                          priorityData.final_score >= 8 ? "#EF4444" :
                          priorityData.final_score >= 6 ? "#F97316" :
                          priorityData.final_score >= 4 ? "#F59E0B" : "#10B981"
                        }
                        strokeWidth="3"
                        strokeDasharray={`${priorityData.final_score * 10}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                      <div className="text-2xl font-bold text-slate-800">{priorityData.final_score}</div>
                      <div className="text-[9px] text-slate-400 uppercase tracking-wider">/ 10</div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-2 ${
                      priorityData.priority_label === "critical" ? "bg-red-100 text-red-600" :
                      priorityData.priority_label === "high" ? "bg-orange-100 text-orange-600" :
                      priorityData.priority_label === "medium" ? "bg-amber-100 text-amber-600" :
                      "bg-emerald-100 text-emerald-600"
                    }`}>
                      {priorityData.priority_label} Priority
                    </div>
                    <p className="text-sm text-slate-600">
                      {priorityData.days_remaining < 0
                        ? `Overdue by ${Math.abs(Math.round(priorityData.days_remaining))} days`
                        : priorityData.days_remaining < 1
                        ? "Due today"
                        : `${Math.round(priorityData.days_remaining)} days remaining`}
                    </p>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Score Breakdown</p>
                  <div className="space-y-3">
                    {[
                      { key: "deadline_proximity", icon: <Clock size={16} />, label: "Deadline Proximity", color: "indigo" },
                      { key: "difficulty", icon: <Target size={16} />, label: "Task Difficulty", color: "amber" },
                      { key: "status", icon: <Zap size={16} />, label: "Current Status", color: "emerald" },
                      { key: "overdue_penalty", icon: <AlertCircle size={16} />, label: "Overdue Penalty", color: "red" },
                    ].map((item) => {
                      const data = priorityData.breakdown[item.key as keyof typeof priorityData.breakdown];
                      return (
                        <div key={item.key} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            item.color === "indigo" ? "bg-indigo-50 text-indigo-500" :
                            item.color === "amber" ? "bg-amber-50 text-amber-500" :
                            item.color === "emerald" ? "bg-emerald-50 text-emerald-500" :
                            "bg-red-50 text-red-500"
                          }`}>
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[13px] font-medium text-slate-700">{item.label}</span>
                              <span className="text-[13px] font-bold text-slate-800">{data.score}<span className="text-[10px] text-slate-400 font-normal"> × {(data.weight * 100).toFixed(0)}%</span></span>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  item.color === "indigo" ? "bg-indigo-500" :
                                  item.color === "amber" ? "bg-amber-500" :
                                  item.color === "emerald" ? "bg-emerald-500" :
                                  "bg-red-500"
                                }`}
                                style={{ width: `${(data.score / 10) * 100}%` }}
                              />
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">{data.reason}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Suggestion */}
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Info size={14} className="text-indigo-500" />
                    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">AI Suggestion</span>
                  </div>
                  <p className="text-[13px] text-indigo-700 leading-relaxed">{priorityData.suggestion}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

    </>
  );
}