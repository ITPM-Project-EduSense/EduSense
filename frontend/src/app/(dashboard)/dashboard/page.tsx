"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import {
  Plus,
  ClipboardList,
  CheckCircle2,
  Clock,
  Flame,
  TrendingUp,
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
  Sparkles,
} from "lucide-react";

/* ─── Animation Variants ─── */
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 },
  },
};

const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
} as const;

/* ─── Interfaces ─── */
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

/* ─── Helper: time-based greeting ─── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

/* ─── Helper: overload banner style by severity ─── */
function getOverloadBannerStyle(riskLevel: string) {
  switch (riskLevel?.toLowerCase()) {
    case "high":
    case "critical":
      return {
        border: "border-rose-200/60",
        iconBg: "from-rose-500 to-pink-500",
        badge: "bg-rose-100 text-rose-700",
        iconShadow: "shadow-rose-200",
      };
    case "medium":
      return {
        border: "border-orange-200/60",
        iconBg: "from-orange-500 to-amber-500",
        badge: "bg-orange-100 text-orange-700",
        iconShadow: "shadow-orange-200",
      };
    default:
      return {
        border: "border-amber-200/60",
        iconBg: "from-amber-400 to-yellow-500",
        badge: "bg-amber-100 text-amber-700",
        iconShadow: "shadow-amber-200",
      };
  }
}

export default function Dashboard() {
  const router = useRouter();
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

  /* ─── Data Fetching ─── */
  const fetchTasks = async () => {
    try {
      const data = await apiFetch("/tasks");
      setTasks(Array.isArray(data) ? data : []);
      fetchOverloadRisk();
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverloadRisk = async () => {
    try {
      const data = await apiFetch("/tasks/overload-risk");
      if (data && typeof data === "object") setOverloadRisk(data);
    } catch (err) {
      console.error("Failed to fetch overload risk:", err);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  /* ─── CRUD Handlers ─── */
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          deadline: new Date(formData.deadline).toISOString(),
        }),
      });
      if (data && data.id) {
        setShowModal(false);
        setFormData({ title: "", description: "", subject: "", deadline: "", difficulty: "medium" });
        router.push(`/planner?task_id=${data.id}`);
      } else {
        alert("❌ Task created but no ID received");
      }
    } catch (err) {
      console.error("Failed to create task:", err);
      alert(`❌ Failed to create task: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    try {
      await apiFetch(`/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTasks();
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await apiFetch(`/tasks/${taskId}`, { method: "DELETE" });
      fetchTasks();
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const fetchPriority = async (taskId: string) => {
    setLoadingPriority(true);
    setShowPriorityPanel(true);
    try {
      const data = await apiFetch(`/tasks/${taskId}/priority`);
      if (data && typeof data === "object") setPriorityData(data);
    } catch (err) {
      console.error("Failed to fetch priority:", err);
    } finally {
      setLoadingPriority(false);
    }
  };

  /* ─── Derived Stats ─── */
  const totalTasks     = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const inProgressTasks= tasks.filter((t) => t.status === "in_progress").length;
  const pendingTasks   = tasks.filter((t) => t.status === "pending").length;
  const overdueTasks   = tasks.filter(
    (t) => new Date(t.deadline) < new Date() && t.status !== "completed"
  ).length;

  const filteredTasks = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  const upcomingDeadlines = tasks
    .filter((t) => t.status !== "completed")
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 4);

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  /* ─── Style Helpers ─── */
  const getDaysUntil = (deadline: string) =>
    Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const getCountdownStyle = (days: number) => {
    if (days < 0 || days <= 3) return "bg-red-50 text-red-500";
    if (days <= 7) return "bg-amber-50 text-amber-500";
    return "bg-emerald-50 text-emerald-500";
  };

  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case "easy":   return "bg-emerald-50 text-emerald-600";
      case "medium": return "bg-amber-50 text-amber-600";
      case "hard":   return "bg-red-50 text-red-600";
      default:       return "bg-slate-100 text-slate-500";
    }
  };

  const getPriorityStyle = (score: number | null) => {
    if (!score) return { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" };
    if (score >= 8.0) return { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]" };
    if (score >= 6.0) return { bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.4)]" };
    if (score >= 4.0) return { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]" };
    return { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" };
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const formatDeadlineDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      day: d.getDate(),
    };
  };

  /* ═══════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════ */
  return (
    <>
      {/* Wave + fadeIn keyframes */}
      <style>{`
        @keyframes wave {
          0%,100% { transform: rotate(0deg); }
          15%      { transform: rotate(14deg); }
          30%      { transform: rotate(-8deg); }
          45%      { transform: rotate(14deg); }
          60%      { transform: rotate(-4deg); }
          75%      { transform: rotate(10deg); }
        }
        .wave-emoji {
          display: inline-block;
          animation: wave 2.5s ease-in-out infinite;
          transform-origin: 70% 70%;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { animation: fadeInUp 0.55s ease both; }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 relative overflow-hidden">

        {/* ── Ambient background glows ── */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-b from-indigo-200/20 via-purple-200/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-t from-blue-200/15 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-10 py-12 relative z-10">

          {/* ══════════════════════════════════════════
              HERO BANNER
          ══════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-14 text-white shadow-2xl shadow-indigo-500/20 mb-14"
          >
            {/* Decorative blobs */}
            <div className="absolute w-[500px] h-[500px] bg-white/15 blur-3xl rounded-full top-[-200px] right-[-150px] animate-pulse" />
            <div className="absolute w-[400px] h-[400px] bg-purple-400/20 blur-3xl rounded-full bottom-[-150px] left-[-100px]" />
            <div className="absolute w-64 h-64 bg-pink-400/10 blur-2xl rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            {/* Subtle dot grid */}
            <div
              className="absolute inset-0 opacity-[0.035]"
              style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }}
            />

            <div className="flex items-start justify-between relative z-10">
              <div className="flex-1">
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-xs font-semibold mb-5 border border-white/20"
                >
                  <Sparkles size={12} />
                  AI-Powered Study Dashboard
                </motion.div>

                {/* Greeting */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-5xl md:text-6xl font-bold tracking-tight mb-4 font-[family-name:var(--font-playfair)]"
                >
                  {getGreeting()}, Sadumina{" "}
                  <span className="wave-emoji">✨</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-white/85 text-lg md:text-xl leading-relaxed max-w-xl"
                >
                  You have{" "}
                  <span className="font-semibold text-white">{pendingTasks} tasks</span>{" "}
                  pending. Keep pushing to stay focused and productive.
                </motion.p>
              </div>

              {/* New Task CTA */}
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/95 backdrop-blur-sm text-indigo-600 rounded-full text-sm font-semibold shadow-lg cursor-pointer flex-shrink-0 ml-6 hover:bg-white transition-colors duration-300"
              >
                <Plus size={20} />
                New Task
              </motion.button>
            </div>
          </motion.div>

          {/* ══════════════════════════════════════════
              STATS CARDS
          ══════════════════════════════════════════ */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14"
          >
            {[
              { icon: <ClipboardList size={20} />, label: "Total Tasks",  value: totalTasks,      color: "from-indigo-500 to-purple-500" },
              { icon: <CheckCircle2 size={20} />, label: "Completed",     value: completedTasks,   color: "from-emerald-500 to-teal-500" },
              { icon: <Clock size={20} />,        label: "In Progress",   value: inProgressTasks,  color: "from-amber-500 to-orange-500" },
              { icon: <Flame size={20} />,        label: "Overdue",       value: overdueTasks,     color: "from-rose-500 to-pink-500" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={cardVariants}
                whileHover={{ y: -6, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.12)" }}
                className="bg-white/70 backdrop-blur-xl rounded-2xl overflow-hidden shadow-sm border border-white/80 cursor-pointer group"
              >
                {/* Colored top accent */}
                <div className={`h-1 bg-gradient-to-r ${stat.color}`} />
                <div className="p-7">
                  <div className={`flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                    {stat.icon}
                  </div>
                  <div className="text-4xl font-extrabold text-slate-800 mb-1 font-[family-name:var(--font-playfair)]">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ══════════════════════════════════════════
              OVERLOAD RISK BANNER
          ══════════════════════════════════════════ */}
          <AnimatePresence>
            {overloadRisk && overloadRisk.risk_score >= 4.0 && (() => {
              const s = getOverloadBannerStyle(overloadRisk.risk_level);
              return (
                <motion.div
                  key="overload-banner"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  whileHover={{ y: -2 }}
                  onClick={() => setShowOverloadPanel(true)}
                  className={`mb-14 p-6 rounded-2xl bg-white/70 backdrop-blur-xl shadow-sm border ${s.border} cursor-pointer group transition-all duration-300`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-md ${s.iconShadow}`}>
                      <ShieldAlert size={24} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-800">Overload Risk Detected</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.badge}`}>
                          Score: {overloadRisk.risk_score}/10
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">
                        {overloadRisk.warnings.length > 0
                          ? overloadRisk.warnings[0].message
                          : overloadRisk.suggestion}
                      </p>
                    </div>
                    <span className="text-2xl text-slate-300 flex-shrink-0 group-hover:text-indigo-500 transition-colors duration-300">→</span>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>

          {/* ══════════════════════════════════════════
              CONTENT GRID
          ══════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">

            {/* ── Task List Card ── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-white/70 backdrop-blur-xl rounded-3xl overflow-hidden shadow-sm border border-white/80"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6">
                <span className="text-xl font-bold text-slate-800 font-[family-name:var(--font-playfair)]">Tasks</span>
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-100/80 text-indigo-700">
                  {filteredTasks.length}
                </span>
              </div>

              {/* Filter chips */}
              <div className="px-8 pb-5">
                <div className="inline-flex items-center gap-1.5 bg-slate-100/60 rounded-full p-1">
                  {[
                    { key: "all",         label: "All" },
                    { key: "pending",     label: "Pending" },
                    { key: "in_progress", label: "In Progress" },
                    { key: "completed",   label: "Completed" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFilter(f.key)}
                      className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer ${
                        filter === f.key
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md shadow-indigo-200/50 text-white"
                          : "text-slate-500 hover:bg-white/80 hover:text-slate-700"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Task rows */}
              <div className="py-2">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="w-8 h-8 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-400">Loading tasks...</p>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="p-14 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                      <BookOpen size={28} className="text-slate-300" />
                    </div>
                    <div className="text-slate-500 text-sm font-medium mb-3">No tasks found</div>
                    <button
                      onClick={() => setShowModal(true)}
                      className="inline-flex items-center gap-1.5 text-indigo-600 text-sm font-semibold hover:text-indigo-700 cursor-pointer"
                    >
                      <Plus size={14} />
                      Create your first task
                    </button>
                  </div>
                ) : (
                  <motion.div variants={staggerContainer} initial="hidden" animate="visible">
                    {filteredTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        variants={listItemVariants}
                        transition={{ delay: index * 0.04 }}
                        onClick={() => router.push(`/planner?task_id=${task.id}`)}
                        className="flex items-center gap-4 px-8 py-4 hover:bg-indigo-50/40 transition-all duration-200 group cursor-pointer border-b border-slate-100/60 last:border-b-0"
                      >
                        {/* Checkbox */}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 cursor-pointer ${
                            task.status === "completed"
                              ? "bg-gradient-to-br from-emerald-500 to-teal-500 border-emerald-500 shadow-sm"
                              : "border-slate-300 hover:border-indigo-400 hover:shadow-sm"
                          }`}
                        >
                          {task.status === "completed" && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>

                        {/* Task info */}
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-semibold truncate ${task.status === "completed" ? "line-through text-slate-400" : "text-slate-800"}`}>
                            {task.title}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5">
                            <span className="flex items-center gap-1">
                              <BookOpen size={11} />
                              {task.subject}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />
                              {formatDate(task.deadline)}
                            </span>
                          </div>
                        </div>

                        {/* Right badges + action buttons */}
                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          {task.priority_score !== null && (
                            <div
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${getPriorityStyle(task.priority_score).bg} ${getPriorityStyle(task.priority_score).text}`}
                              title={`Priority: ${task.priority_score}/10`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${getPriorityStyle(task.priority_score).dot}`} />
                              {task.priority_score}
                            </div>
                          )}
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getDifficultyStyle(task.difficulty)}`}>
                            {task.difficulty}
                          </span>

                          {/* AI Priority Analysis */}
                          <button
                            onClick={(e) => { e.stopPropagation(); fetchPriority(task.id); }}
                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-purple-500 hover:scale-110 transition-all duration-200 cursor-pointer"
                            title="AI Priority Analysis"
                          >
                            <Brain size={15} />
                          </button>

                          {/* Open in Planner */}
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/planner?task_id=${task.id}`); }}
                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-indigo-500 hover:scale-110 transition-all duration-200 cursor-pointer"
                            title="Generate study schedule"
                          >
                            <Sparkles size={15} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 hover:scale-110 transition-all duration-200 cursor-pointer"
                            title="Delete task"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* ── Right Column ── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="space-y-10"
            >
              {/* Upcoming Deadlines */}
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-white/70 backdrop-blur-xl rounded-3xl overflow-hidden shadow-sm border border-white/80"
              >
                <div className="flex items-center justify-between px-8 py-6">
                  <span className="text-lg font-bold text-slate-800 font-[family-name:var(--font-playfair)]">
                    Upcoming Deadlines
                  </span>
                  <Calendar size={20} className="text-indigo-500" />
                </div>
                <div className="px-8 pb-6">
                  {upcomingDeadlines.length === 0 ? (
                    <div className="py-10 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                        <Calendar size={24} className="text-slate-300" />
                      </div>
                      <p className="text-sm text-slate-400">No upcoming deadlines</p>
                    </div>
                  ) : (
                    upcomingDeadlines.map((task) => {
                      const { month, day } = formatDeadlineDate(task.deadline);
                      const daysUntil = getDaysUntil(task.deadline);
                      return (
                        <div
                          key={task.id}
                          className="flex items-center gap-4 py-3.5 hover:bg-indigo-50/30 px-3 rounded-xl transition-all duration-200 group cursor-pointer"
                        >
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex flex-col items-center justify-center flex-shrink-0 shadow-md shadow-indigo-200/50 group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                            <span className="text-[10px] font-bold uppercase tracking-wide leading-none">{month}</span>
                            <span className="text-xl font-extrabold leading-tight">{day}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-800 truncate">{task.title}</div>
                            <div className="text-xs text-slate-400 mt-1">{task.subject}</div>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 ${getCountdownStyle(daysUntil)}`}>
                            {daysUntil < 0 ? `${Math.abs(daysUntil)}d ago` : daysUntil === 0 ? "Today!" : `${daysUntil}d`}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>

              {/* Productivity / Progress Ring */}
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-white/70 backdrop-blur-xl rounded-3xl overflow-hidden shadow-sm border border-white/80"
              >
                <div className="px-8 py-6 flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-800 font-[family-name:var(--font-playfair)]">Progress</span>
                  <TrendingUp size={20} className="text-emerald-500" />
                </div>
                <div className="px-8 py-8 text-center">
                  <div className="relative w-[130px] h-[130px] mx-auto mb-6">
                    <svg viewBox="0 0 36 36" className="-rotate-90">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="#F1F5F9" strokeWidth="2.5"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="url(#progressGradient)" strokeWidth="2.5"
                        strokeDasharray={`${completionRate}, 100`} strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                      <div className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-[family-name:var(--font-playfair)]">
                        {completionRate}<span className="text-sm">%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-base font-bold text-slate-800 mb-1.5">
                    {completionRate >= 75 ? "Excellent Progress" : completionRate >= 50 ? "Keep Going" : "Just Getting Started"}
                  </div>
                  <div className="text-sm text-slate-500 leading-relaxed">
                    <span className="font-semibold text-indigo-600">{completedTasks}</span> of{" "}
                    <span className="font-semibold text-indigo-600">{totalTasks}</span> tasks completed
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          MODAL: Create Task
      ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-md z-[200] flex items-center justify-center"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              className="bg-white/95 backdrop-blur-xl rounded-3xl w-[540px] max-h-[90vh] overflow-y-auto shadow-2xl border border-white/80"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-10 pt-10 pb-3">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight font-[family-name:var(--font-playfair)]">
                  Create New Task
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all duration-200 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreateTask} className="px-10 py-8 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2.5">Task Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Complete Math Assignment"
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 placeholder:text-slate-400 hover:border-slate-300 bg-white/80"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                    Description <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add any details or notes..."
                    rows={3}
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none resize-y min-h-[100px] transition-all duration-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 placeholder:text-slate-400 hover:border-slate-300 bg-white/80"
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2.5">Subject</label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g., Mathematics"
                      className="w-full px-5 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 placeholder:text-slate-400 hover:border-slate-300 bg-white/80"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2.5">Deadline</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      className="w-full px-5 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 hover:border-slate-300 bg-white/80"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2.5">Difficulty Level</label>
                  <div className="flex gap-3">
                    {(["easy", "medium", "hard"] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setFormData({ ...formData, difficulty: level })}
                        className={`flex-1 py-3 rounded-xl font-semibold text-center transition-all duration-300 cursor-pointer text-sm ${
                          formData.difficulty === level
                            ? `bg-gradient-to-r ${
                                level === "easy"   ? "from-emerald-500 to-teal-500" :
                                level === "medium" ? "from-amber-500 to-orange-500" :
                                                    "from-rose-500 to-pink-500"
                              } text-white shadow-md shadow-indigo-200/30`
                            : "border border-slate-200 text-slate-500 hover:border-slate-300 bg-white/60"
                        }`}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-5">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-8 py-3 rounded-full text-sm font-medium text-slate-500 hover:bg-slate-100 transition-all duration-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full text-sm font-semibold shadow-md shadow-indigo-200/50 hover:shadow-lg hover:shadow-indigo-300/40 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={18} />
                    {submitting ? "Creating..." : "Create Task"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════
          PANEL: Priority Breakdown (AI Analysis)
      ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showPriorityPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-md z-[200] flex items-center justify-center"
            onClick={(e) => e.target === e.currentTarget && setShowPriorityPanel(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              className="bg-white/95 backdrop-blur-xl rounded-3xl w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl border border-white/80"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 pt-8 pb-2">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight font-[family-name:var(--font-playfair)]">
                    Priority Analysis
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">AI-powered insights</p>
                </div>
                <button
                  onClick={() => setShowPriorityPanel(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all duration-200 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {loadingPriority ? (
                <div className="px-8 py-16 text-center">
                  <div className="relative w-12 h-12 mx-auto mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full opacity-20 animate-pulse" />
                    <div className="absolute inset-1 rounded-full border-[3px] border-transparent border-t-indigo-500 border-r-purple-500 animate-spin" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Analyzing priority...</p>
                </div>
              ) : priorityData ? (
                <div className="px-8 py-6 space-y-6">
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-2">Task</p>
                    <p className="text-lg font-bold text-slate-800">{priorityData.task_title}</p>
                  </div>

                  {/* Score ring */}
                  <div className="flex items-center gap-6 p-6 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-purple-50/80 border border-indigo-100/60">
                    <div className="relative w-[100px] h-[100px] flex-shrink-0">
                      <svg viewBox="0 0 36 36" className="-rotate-90">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F1F5F9" strokeWidth="3" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="url(#priorityGradient)" strokeWidth="3" strokeDasharray={`${priorityData.final_score * 10}, 100`} strokeLinecap="round" />
                        <defs>
                          <linearGradient id="priorityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                        <div className="text-3xl font-extrabold text-slate-800 font-[family-name:var(--font-playfair)]">{priorityData.final_score}</div>
                        <div className="text-xs text-slate-400 font-bold">/ 10</div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white mb-3 shadow-md shadow-indigo-200/50">
                        {priorityData.priority_label}
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        {priorityData.days_remaining < 0
                          ? `Overdue by ${Math.abs(Math.round(priorityData.days_remaining))} days`
                          : priorityData.days_remaining < 1
                          ? "Due today"
                          : `${Math.round(priorityData.days_remaining)} days remaining`}
                      </p>
                    </div>
                  </div>

                  {/* Breakdown bars */}
                  <div>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-4">Breakdown</p>
                    <div className="space-y-3">
                      {[
                        { key: "deadline_proximity", icon: <Clock size={16} />,        label: "Deadline" },
                        { key: "difficulty",          icon: <Target size={16} />,       label: "Difficulty" },
                        { key: "status",              icon: <Zap size={16} />,          label: "Status" },
                        { key: "overdue_penalty",     icon: <AlertCircle size={16} />,  label: "Overdue" },
                      ].map((item) => {
                        const data = priorityData.breakdown[item.key as keyof typeof priorityData.breakdown];
                        return (
                          <div key={item.key} className="p-4 rounded-xl bg-slate-50/80 border border-slate-100/60 hover:border-indigo-200/60 transition-all duration-300 group">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 text-white shadow-sm group-hover:scale-105 transition-transform duration-300">
                                {item.icon}
                              </div>
                              <div className="flex items-center justify-between flex-1">
                                <span className="text-sm font-bold text-slate-800">{item.label}</span>
                                <span className="text-sm font-bold text-indigo-600">
                                  {data.score}<span className="text-xs text-slate-400 font-normal"> / 10</span>
                                </span>
                              </div>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                                style={{ width: `${(data.score / 10) * 100}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-500">{data.reason}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* AI Suggestion */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/80 to-yellow-50/80 border border-amber-200/60">
                    <div className="flex items-center gap-2 mb-3">
                      <Info size={16} className="text-amber-600" />
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">AI Suggestion</span>
                    </div>
                    <p className="text-sm text-amber-800 leading-relaxed">{priorityData.suggestion}</p>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════
          PANEL: Overload Risk Detail
      ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showOverloadPanel && overloadRisk && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-md z-[200] flex items-center justify-center"
            onClick={(e) => e.target === e.currentTarget && setShowOverloadPanel(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white/95 backdrop-blur-xl rounded-3xl w-[540px] max-h-[90vh] overflow-y-auto shadow-2xl shadow-slate-200/50 border border-white/80"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 pt-8 pb-2 border-b border-slate-100/60">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight font-[family-name:var(--font-playfair)]">
                    Overload Analysis
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Workload assessment</p>
                </div>
                <button
                  onClick={() => setShowOverloadPanel(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all duration-200 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-8 py-6 space-y-6">
                {/* Risk score ring */}
                <div className="flex items-center gap-6 p-6 rounded-2xl bg-gradient-to-br from-rose-50/80 to-pink-50/80 border border-rose-100/60">
                  <div className="relative w-[100px] h-[100px] flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="-rotate-90">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F1F5F9" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="url(#riskGradient)" strokeWidth="3" strokeDasharray={`${overloadRisk.risk_score * 10}, 100`} strokeLinecap="round" />
                      <defs>
                        <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f43f5e" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                      <div className="text-3xl font-extrabold text-slate-800 font-[family-name:var(--font-playfair)]">{overloadRisk.risk_score}</div>
                      <div className="text-xs text-slate-400 font-bold">/ 10</div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-rose-500 to-pink-500 text-white mb-3 shadow-md shadow-rose-200/50">
                      {overloadRisk.risk_level} Risk
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mb-1">
                      {overloadRisk.active_tasks} active tasks
                    </p>
                    <p className="text-xs text-slate-500">Adjust your schedule if needed</p>
                  </div>
                </div>

                {/* Warnings */}
                {overloadRisk.warnings.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-4">Warnings</p>
                    <div className="space-y-3">
                      {overloadRisk.warnings.map((warning, i) => (
                        <div key={i} className="p-4 rounded-xl bg-rose-50/80 border border-rose-200/60 hover:border-rose-300/80 transition-all duration-300">
                          <p className="text-sm font-semibold text-rose-800 leading-relaxed mb-2">{warning.message}</p>
                          {warning.tasks && warning.tasks.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {warning.tasks.map((t, j) => (
                                <span key={j} className="px-3 py-1 rounded-full text-xs font-semibold bg-white/80 text-rose-700 border border-rose-200/60">
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

                {/* Risk factor breakdown */}
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-4">Risk Factors</p>
                  <div className="space-y-3">
                    {[
                      { key: "task_density",       icon: <Activity size={16} />,      label: "Task Density" },
                      { key: "difficulty_cluster", icon: <AlertTriangle size={16} />, label: "Hard Tasks" },
                      { key: "weekly_load",        icon: <ClipboardList size={16} />, label: "Weekly Load" },
                      { key: "deadline_spacing",   icon: <Timer size={16} />,         label: "Spacing" },
                    ].map((item) => {
                      const data = overloadRisk.breakdown[item.key];
                      if (!data) return null;
                      return (
                        <div key={item.key} className="p-4 rounded-xl bg-slate-50/80 border border-slate-100/60 hover:border-rose-200/60 transition-all duration-300 group">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center flex-shrink-0 text-white shadow-sm group-hover:scale-105 transition-transform duration-300">
                              {item.icon}
                            </div>
                            <div className="flex items-center justify-between flex-1">
                              <span className="text-sm font-bold text-slate-800">{item.label}</span>
                              <span className="text-sm font-bold text-rose-600">
                                {data.score}<span className="text-xs text-slate-400 font-normal"> / 10</span>
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-500"
                              style={{ width: `${(data.score / 10) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-500">{data.reason}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Recommendation */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/80 to-teal-50/80 border border-emerald-200/60">
                  <div className="flex items-center gap-2 mb-3">
                    <Info size={16} className="text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Recommendation</span>
                  </div>
                  <p className="text-sm text-emerald-800 leading-relaxed">{overloadRisk.suggestion}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
