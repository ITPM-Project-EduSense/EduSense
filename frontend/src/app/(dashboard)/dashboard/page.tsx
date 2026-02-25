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
  AlertTriangle,
  ShieldAlert,
  Activity,
  Timer,
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

interface OverloadWarning {
  type: string;
  severity: string;
  message: string;
  tasks?: string[];
}

interface OverloadRisk {
  risk_score: number;
  risk_level: string;
  active_tasks: number;
  warnings: OverloadWarning[];
  suggestion: string;
  breakdown: Record<string, { score: number; weight: number; weighted_score: number; reason: string }>;
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [priorityData, setPriorityData] = useState<PriorityBreakdown | null>(null);
  const [showPriorityPanel, setShowPriorityPanel] = useState(false);
  const [loadingPriority, setLoadingPriority] = useState(false);
  const [overloadRisk, setOverloadRisk] = useState<OverloadRisk | null>(null);
  const [showOverloadPanel, setShowOverloadPanel] = useState(false);
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
      // Also fetch overload risk
      fetchOverloadRisk();
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch overload risk
  const fetchOverloadRisk = async () => {
    try {
      const res = await fetch(`${API}/api/tasks/overload-risk`);
      const data = await res.json();
      setOverloadRisk(data);
    } catch (err) {
      console.error("Failed to fetch overload risk:", err);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-10 py-10">
        {/* Hero Section - Modern Colorful SaaS */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-12 text-white shadow-xl mb-12 animate-[fadeInUp_0.5s_ease_forwards]">
          {/* Floating blurred blobs */}
          <div className="absolute w-96 h-96 bg-white/20 blur-3xl rounded-full top-[-100px] right-[-100px] animate-pulse" />
          <div className="absolute w-72 h-72 bg-purple-400/20 blur-3xl rounded-full bottom-[-50px] left-[-50px]" />
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <h1 className="text-5xl font-bold tracking-tight mb-3">
                Good Morning, Sadumina ✨
              </h1>
              <p className="text-white/90 text-lg">
                You have <span className="font-semibold text-white">{pendingTasks} tasks</span> pending. Keep pushing to stay focused and productive.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-full text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer flex-shrink-0 ml-6 hover:bg-slate-50"
            >
              <Plus size={20} />
              New Task
            </button>
          </div>
        </div>

        {/* Stat Cards - Modern Floating SaaS Style */}
        <div className="grid grid-cols-4 gap-8 mb-12">
          {[
            {
              icon: <ClipboardList size={20} />,
              label: "Total Tasks",
              value: totalTasks,
              color: "from-indigo-500 to-purple-500",
            },
            {
              icon: <CheckCircle2 size={20} />,
              label: "Completed",
              value: completedTasks,
              color: "from-emerald-500 to-teal-500",
            },
            {
              icon: <Clock size={20} />,
              label: "In Progress",
              value: inProgressTasks,
              color: "from-amber-500 to-orange-500",
            },
            {
              icon: <Flame size={20} />,
              label: "Overdue",
              value: overdueTasks,
              color: "from-rose-500 to-pink-500",
            },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              {/* Gradient top strip */}
              <div className={`h-1.5 bg-gradient-to-r ${stat.color}`} />
              
              <div className="p-8">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {stat.icon}
                </div>
                <div className="text-4xl font-extrabold text-neutral-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-neutral-500 font-medium">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Overload Risk Alert - Modern Gradient */}
        {overloadRisk && overloadRisk.risk_score >= 4.0 && (
          <div
            onClick={() => setShowOverloadPanel(true)}
            className="mb-12 p-6 rounded-2xl bg-white shadow-md hover:shadow-lg hover:-translate-y-1 cursor-pointer group transition-all duration-300 border-l-4 border-rose-500"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <ShieldAlert size={24} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-neutral-900">
                    Overload Risk Detected
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                    Score: {overloadRisk.risk_score}/10
                  </span>
                </div>
                <p className="text-sm text-neutral-600">
                  {overloadRisk.warnings.length > 0
                    ? overloadRisk.warnings[0].message
                    : overloadRisk.suggestion}
                </p>
              </div>
              <span className="text-2xl text-neutral-300 flex-shrink-0 group-hover:text-neutral-900 transition-colors duration-300">→</span>
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-[1fr_380px] gap-12">
          {/* Task List - Modern Clean Card */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between px-8 py-6 border-b border-neutral-100">
              <span className="text-lg font-bold text-neutral-900">Tasks</span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                {filteredTasks.length}
              </span>
            </div>

            {/* Filters - Modern Pill Segmented Control */}
            <div className="px-8 py-5 bg-neutral-50/50">
              <div className="inline-flex items-center gap-2 bg-neutral-100 rounded-full p-1.5">
                {[
                  { key: "all", label: "All" },
                  { key: "pending", label: "Pending" },
                  { key: "in_progress", label: "In Progress" },
                  { key: "completed", label: "Completed" },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 cursor-pointer ${
                      filter === f.key
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md text-white scale-105"
                        : "text-neutral-600 hover:bg-white hover:text-neutral-900"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-neutral-100" />

            {/* Task Items */}
            <div className="py-3">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-neutral-400">Loading tasks...</p>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                    <BookOpen size={32} className="text-neutral-300" />
                  </div>
                  <div className="text-neutral-500 text-sm font-medium mb-3">No tasks found</div>
                  <button
                    onClick={() => setShowModal(true)}
                    className="text-indigo-600 text-sm font-semibold hover:text-indigo-700 cursor-pointer"
                  >
                    + Create your first task
                  </button>
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => fetchPriority(task.id)}
                    className="flex items-center gap-4 px-8 py-4 hover:bg-indigo-50/30 transition-all duration-200 group cursor-pointer border-b border-neutral-100 last:border-b-0"
                  >
                    {/* Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskStatus(task);
                      }}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 cursor-pointer ${
                        task.status === "completed"
                          ? "bg-gradient-to-br from-emerald-500 to-teal-500 border-emerald-500 shadow-md"
                          : "border-neutral-300 hover:border-indigo-500 hover:shadow-md"
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
                        className={`text-sm font-semibold truncate ${
                          task.status === "completed"
                            ? "line-through text-neutral-400"
                            : "text-neutral-900"
                        }`}
                      >
                        {task.title}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1.5">
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
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Priority Indicator */}
                      {task.priority_score !== null && (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${getPriorityStyle(task.priority_score).bg} ${getPriorityStyle(task.priority_score).text}`} title={`Priority: ${task.priority_score}/10`}>
                          <span className={`w-2 h-2 rounded-full ${getPriorityStyle(task.priority_score).dot}`} />
                          {task.priority_score}
                        </div>
                      )}
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${getDifficultyStyle(task.difficulty)}`}
                      >
                        {task.difficulty}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTask(task.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-rose-500 hover:scale-110 transition-all duration-200 cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-12">
            {/* Upcoming Deadlines - Modern SaaS Card */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between px-8 py-6 border-b border-neutral-100 bg-neutral-50/50">
                <span className="text-lg font-bold text-neutral-900">
                  Upcoming Deadlines
                </span>
                <Calendar size={20} className="text-indigo-600" />
              </div>
              <div className="px-8 py-6">
                {upcomingDeadlines.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                      <Calendar size={24} className="text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-400">No upcoming deadlines</p>
                  </div>
                ) : (
                  upcomingDeadlines.map((task) => {
                    const { month, day } = formatDeadlineDate(task.deadline);
                    const daysUntil = getDaysUntil(task.deadline);
                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-4 py-4 hover:bg-indigo-50/30 px-3 rounded-xl transition-all duration-200 group cursor-pointer border-b border-neutral-100 last:border-b-0 last:mb-0 last:pb-0"
                      >
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex flex-col items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                          <span className="text-xs font-bold uppercase tracking-wide leading-none">
                            {month}
                          </span>
                          <span className="text-2xl font-extrabold leading-tight">
                            {day}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-neutral-900 truncate">
                            {task.title}
                          </div>
                          <div className="text-xs text-neutral-500 mt-1">{task.subject}</div>
                        </div>
                        <span
                          className={`text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 transition-all duration-200 ${getCountdownStyle(daysUntil)}`}
                        >
                          {daysUntil < 0
                            ? `${Math.abs(daysUntil)}d ago`
                            : daysUntil === 0
                            ? "Today!"
                            : `${daysUntil}d`}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Progress - Modern SaaS Card */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
              <div className="px-8 py-6 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
                <span className="text-lg font-bold text-neutral-900">
                  Progress
                </span>
                <TrendingUp size={20} className="text-emerald-500" />
              </div>
              <div className="px-8 py-10 text-center">
                <div className="relative w-[140px] h-[140px] mx-auto mb-6">
                  <svg viewBox="0 0 36 36" className="-rotate-90">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#E5E5E5"
                      strokeWidth="2.8"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="2.8"
                      strokeDasharray={`${completionRate}, 100`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {completionRate}
                      <span className="text-lg">%</span>
                    </div>
                  </div>
                </div>
                <div className="text-lg font-bold text-neutral-900 mb-2">
                  {completionRate >= 75
                    ? "🎉 Excellent Progress"
                    : completionRate >= 50
                    ? "💪 Keep Going"
                    : "🚀 Just Getting Started"}
                </div>
                <div className="text-sm text-neutral-600 leading-relaxed">
                  <span className="font-semibold text-indigo-600">{completedTasks}</span> of{" "}
                  <span className="font-semibold text-indigo-600">{totalTasks}</span> tasks completed
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* ─── Create Task Modal - Modern Design ─── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-md z-[200] flex items-center justify-center animate-[fadeIn_0.2s_ease]"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white rounded-3xl w-[540px] max-h-[90vh] overflow-y-auto shadow-2xl animate-[scaleIn_0.25s_ease]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-10 pt-10 pb-3 border-b border-neutral-100">
              <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
                ✨ Create New Task
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition-all duration-200 cursor-pointer hover:scale-110"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateTask} className="px-10 py-8 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-3">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Complete Math Assignment"
                  className="w-full px-5 py-3 rounded-xl border border-neutral-200 text-sm text-neutral-900 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 placeholder:text-neutral-400 hover:border-neutral-300"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-3">
                  Description <span className="text-neutral-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add any details or notes..."
                  rows={3}
                  className="w-full px-5 py-3 rounded-xl border border-neutral-200 text-sm text-neutral-900 outline-none resize-y min-h-[100px] transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 placeholder:text-neutral-400 hover:border-neutral-300"
                />
              </div>

              {/* Subject + Deadline */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-neutral-900 mb-3">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Mathematics"
                    className="w-full px-5 py-3 rounded-xl border border-neutral-200 text-sm text-neutral-900 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 placeholder:text-neutral-400 hover:border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-neutral-900 mb-3">
                    Deadline
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-5 py-3 rounded-xl border border-neutral-200 text-sm text-neutral-900 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 hover:border-neutral-300"
                  />
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-3">
                  Difficulty Level
                </label>
                <div className="flex gap-3">
                  {(["easy", "medium", "hard"] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData({ ...formData, difficulty: level })}
                      className={`flex-1 py-3 rounded-xl font-semibold text-center transition-all duration-300 cursor-pointer text-sm ${
                        formData.difficulty === level
                          ? `bg-gradient-to-r ${
                              level === "easy"
                                ? "from-emerald-500 to-teal-500"
                                : level === "medium"
                                ? "from-amber-500 to-orange-500"
                                : "from-rose-500 to-pink-500"
                            } text-white shadow-md scale-105`
                          : "border-2 border-neutral-200 text-neutral-600 hover:border-neutral-300 bg-neutral-50"
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-8 py-3 rounded-full text-sm font-semibold text-neutral-700 hover:bg-neutral-100 transition-all duration-300 cursor-pointer hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                  <Plus size={18} />
                  {submitting ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Priority Breakdown Panel - Modern Design ─── */}
      {showPriorityPanel && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-md z-[200] flex items-center justify-center animate-[fadeIn_0.2s_ease]"
          onClick={(e) => e.target === e.currentTarget && setShowPriorityPanel(false)}
        >
          <div className="bg-white rounded-3xl w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl animate-[scaleIn_0.25s_ease]">
            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-2 border-b border-neutral-100">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
                  🎯 Priority Analysis
                </h2>
                <p className="text-xs text-neutral-500 mt-1">AI-powered insights</p>
              </div>
              <button
                onClick={() => setShowPriorityPanel(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition-all duration-200 cursor-pointer hover:scale-110"
              >
                <X size={20} />
              </button>
            </div>

            {loadingPriority ? (
              <div className="px-8 py-16 text-center">
                <div className="relative w-12 h-12 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full opacity-20 animate-pulse" />
                  <div className="absolute inset-1 rounded-full border-3 border-transparent border-t-indigo-500 border-r-purple-500 animate-spin" />
                </div>
                <p className="text-sm text-neutral-500 font-medium">Analyzing priority...</p>
              </div>
            ) : priorityData ? (
              <div className="px-8 py-6 space-y-6">
                {/* Task Title */}
                <div>
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wide mb-2">Task</p>
                  <p className="text-lg font-bold text-neutral-900">{priorityData.task_title}</p>
                </div>

                {/* Score Circle */}
                <div className="flex items-center gap-6 p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                  <div className="relative w-[100px] h-[100px] flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="-rotate-90">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#E5E5E5"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="url(#priorityGradient)"
                        strokeWidth="3"
                        strokeDasharray={`${priorityData.final_score * 10}, 100`}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="priorityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                      <div className="text-3xl font-extrabold text-neutral-900">{priorityData.final_score}</div>
                      <div className="text-xs text-neutral-500 font-bold">/ 10</div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="inline-block px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white mb-3 shadow-md">
                      {priorityData.priority_label}
                    </div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {priorityData.days_remaining < 0
                        ? `⚠️ Overdue by ${Math.abs(Math.round(priorityData.days_remaining))} days`
                        : priorityData.days_remaining < 1
                        ? "🔔 Due today"
                        : `📅 ${Math.round(priorityData.days_remaining)} days remaining`}
                    </p>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div>
                  <p className="text-xs font-bold text-neutral-700 uppercase tracking-wide mb-4">Breakdown</p>
                  <div className="space-y-3">
                    {[
                      { key: "deadline_proximity", icon: <Clock size={16} />, label: "Deadline" },
                      { key: "difficulty", icon: <Target size={16} />, label: "Difficulty" },
                      { key: "status", icon: <Zap size={16} />, label: "Status" },
                      { key: "overdue_penalty", icon: <AlertCircle size={16} />, label: "Overdue" },
                    ].map((item) => {
                      const data = priorityData.breakdown[item.key as keyof typeof priorityData.breakdown];
                      return (
                        <div key={item.key} className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 hover:border-indigo-200 transition-all duration-300 group">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 text-white group-hover:scale-110 transition-transform duration-300">
                              {item.icon}
                            </div>
                            <div className="flex items-center justify-between flex-1">
                              <span className="text-sm font-bold text-neutral-900">{item.label}</span>
                              <span className="text-sm font-bold text-indigo-600">{data.score}<span className="text-xs text-neutral-400 font-normal"> / 10</span></span>
                            </div>
                          </div>
                          <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden mb-2">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${(data.score / 10) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-neutral-600">{data.reason}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Suggestion */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Info size={16} className="text-amber-600" />
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">AI Suggestion</span>
                  </div>
                  <p className="text-sm text-amber-900 leading-relaxed">{priorityData.suggestion}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ─── Overload Risk Detail Panel - Modern Design ─── */}
      {showOverloadPanel && overloadRisk && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-md z-[200] flex items-center justify-center animate-[fadeIn_0.2s_ease]"
          onClick={(e) => e.target === e.currentTarget && setShowOverloadPanel(false)}
        >
          <div className="bg-white rounded-3xl w-[540px] max-h-[90vh] overflow-y-auto shadow-2xl animate-[scaleIn_0.25s_ease]">
            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-2 border-b border-neutral-100">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
                  ⚠️ Overload Analysis
                </h2>
                <p className="text-xs text-neutral-500 mt-1">Workload assessment</p>
              </div>
              <button
                onClick={() => setShowOverloadPanel(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition-all duration-200 cursor-pointer hover:scale-110"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-8 py-6 space-y-6">
              {/* Risk Score */}
              <div className="flex items-center gap-6 p-6 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100">
                <div className="relative w-[100px] h-[100px] flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="-rotate-90">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E5E5E5" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                      stroke="url(#riskGradient)"
                      strokeWidth="3"
                      strokeDasharray={`${overloadRisk.risk_score * 10}, 100`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="text-3xl font-extrabold text-neutral-900">{overloadRisk.risk_score}</div>
                    <div className="text-xs text-neutral-500 font-bold">/ 10</div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="inline-block px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-rose-500 to-pink-500 text-white mb-3 shadow-md">
                    {overloadRisk.risk_level} Risk
                  </div>
                  <p className="text-sm font-semibold text-neutral-900 mb-1">
                    💼 {overloadRisk.active_tasks} active tasks
                  </p>
                  <p className="text-xs text-neutral-600">Adjust your schedule if needed</p>
                </div>
              </div>

              {/* Warnings */}
              {overloadRisk.warnings.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-neutral-700 uppercase tracking-wide mb-4">⚡ Warnings</p>
                  <div className="space-y-3">
                    {overloadRisk.warnings.map((warning, i) => (
                      <div key={i} className="p-4 rounded-xl bg-rose-50 border border-rose-200 hover:border-rose-300 transition-all duration-300">
                        <p className="text-sm font-semibold text-rose-900 leading-relaxed mb-2">
                          {warning.message}
                        </p>
                        {warning.tasks && warning.tasks.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {warning.tasks.map((t, j) => (
                              <span key={j} className="px-3 py-1 rounded-full text-xs font-semibold bg-white text-rose-700 border border-rose-200">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Score Breakdown */}
              <div>
                <p className="text-xs font-bold text-neutral-700 uppercase tracking-wide mb-4">📊 Risk Factors</p>
                <div className="space-y-3">
                  {[
                    { key: "task_density", icon: <Activity size={16} />, label: "Task Density" },
                    { key: "difficulty_cluster", icon: <AlertTriangle size={16} />, label: "Hard Tasks" },
                    { key: "weekly_load", icon: <ClipboardList size={16} />, label: "Weekly Load" },
                    { key: "deadline_spacing", icon: <Timer size={16} />, label: "Spacing" },
                  ].map((item) => {
                    const data = overloadRisk.breakdown[item.key];
                    if (!data) return null;
                    return (
                      <div key={item.key} className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 hover:border-rose-200 transition-all duration-300 group">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center flex-shrink-0 text-white group-hover:scale-110 transition-transform duration-300">
                            {item.icon}
                          </div>
                          <div className="flex items-center justify-between flex-1">
                            <span className="text-sm font-bold text-neutral-900">{item.label}</span>
                            <span className="text-sm font-bold text-rose-600">{data.score}<span className="text-xs text-neutral-400 font-normal"> / 10</span></span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-500"
                            style={{ width: `${(data.score / 10) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-neutral-600">{data.reason}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Recommendation */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                <div className="flex items-center gap-2 mb-3">
                  <Info size={16} className="text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">Recommendation</span>
                </div>
                <p className="text-sm text-emerald-900 leading-relaxed">
                  {overloadRisk.suggestion}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}