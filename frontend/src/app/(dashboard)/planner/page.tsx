"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  BookOpen,
  Upload,
  Loader2,
  Sparkles,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  Target,
  Brain,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  LayoutList,
  CalendarDays,
  Flame,
  Zap,
  Minus,
  ArrowLeft,
  RotateCcw,
  Settings,
  ArrowRight,
} from "lucide-react";
import {
  attachTaskResource,
  generateTaskPlan,
  getTaskPlan,
  regenerateTaskPlan,
  type GeneratedPlanResponse,
} from "@/lib/scheduleApi";
import { validateFiles } from "@/lib/validation";

/* ─── Types ────────────────────────────────────────────────────────────────── */
interface Task {
  id: string;
  title: string;
  subject: string;
  task_type?: "reading" | "assignment" | "exam" | "coding";
  estimated_hours?: number;
  deadline: string;
  difficulty: string;
  status: string;
  created_at: string;
}

interface Session {
  day: number;
  date: string;
  day_name: string;
  topics: string[];
  duration_hours: number;
  focus_level: "low" | "medium" | "high";
  tips: string;
}

interface DocumentSummary {
  filename: string;
  summary: string;
  key_points: string[];
  topics: string[];
}

interface AssignmentAnalysis {
  module_name?: string;
  assignment_title?: string;
  assignment_type?: string;
  inferred_year_of_study?: number | null;
  program_name?: string;
  due_date_in_document?: string | null;
  key_requirements?: string[];
  summary?: string;
  confidence_score?: number;
  needs_review?: boolean;
}

interface SmartSchedule {
  schedule_id: string;
  task_id: string;
  subject: string;
  title: string;
  deadline: string;
  start_date: string;
  end_date: string;
  extracted_topics: string[];
  ai_summary: string;
  ai_tips: string[];
  document_summaries: DocumentSummary[];
  sessions: Session[];
  original_filenames: string[];
  assignment_analysis?: AssignmentAnalysis;
  analysis_status?: "not_analyzed" | "analyzed" | "needs_review";
}

function mapSessionTypeToTip(sessionType: string) {
  const tips: Record<string, string> = {
    reading: "Use active recall after each section to retain key concepts.",
    revision: "Summarize from memory first, then verify against notes.",
    research: "Identify 2-3 authoritative sources before deep work.",
    implementation: "Break work into small deliverables and test each step.",
    review: "Use a checklist and evaluate quality against task criteria.",
    practice: "Solve timed practice problems to improve speed and confidence.",
  };
  return tips[sessionType] || "Stay focused and review outcomes after this session.";
}

function mapSessionTypeToFocus(sessionType: string): "low" | "medium" | "high" {
  if (sessionType === "implementation" || sessionType === "practice") return "high";
  if (sessionType === "research" || sessionType === "review") return "medium";
  return "low";
}

function toSmartSchedule(task: Task, plan: GeneratedPlanResponse): SmartSchedule {
  const sortedSessions = [...plan.sessions].sort((a, b) =>
    a.scheduled_day.localeCompare(b.scheduled_day)
  );
  const extractedTopics = Array.from(new Set(sortedSessions.map((s) => s.session_type)));

  const sessions: Session[] = sortedSessions.map((s, idx) => {
    const dateObj = new Date(`${s.scheduled_day}T00:00:00`);
    return {
      day: idx + 1,
      date: s.scheduled_day,
      day_name: dateObj.toLocaleDateString("en-US", { weekday: "long" }),
      topics: [
        s.session_type.charAt(0).toUpperCase() + s.session_type.slice(1),
        `${task.subject} task`,
      ],
      duration_hours: Number((s.duration_minutes / 60).toFixed(1)),
      focus_level: mapSessionTypeToFocus(s.session_type),
      tips: mapSessionTypeToTip(s.session_type),
    };
  });

  const startDate = sortedSessions[0]?.scheduled_day || new Date().toISOString().split("T")[0];
  const endDate = sortedSessions[sortedSessions.length - 1]?.scheduled_day || startDate;

  return {
    schedule_id: plan.plan_id,
    task_id: plan.task_id,
    subject: task.subject,
    title: task.title,
    deadline: task.deadline,
    start_date: startDate,
    end_date: endDate,
    extracted_topics: extractedTopics,
    ai_summary: `This plan was generated from task context and attached materials using task-type strategy (${task.task_type || "reading"}).`,
    ai_tips: [
      "Follow the scheduled order to keep progress steady.",
      "Use short recap notes after each session.",
      "Regenerate with a lower daily cap if workload feels too heavy.",
    ],
    document_summaries: [],
    sessions,
    original_filenames: [],
  };
}

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";
const PLANNER_FILE_ALLOWED_EXTENSIONS = [".pdf", ".pptx", ".docx"];
const PLANNER_MAX_FILE_SIZE = 10 * 1024 * 1024;
const PLANNER_MAX_FILES = 5;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDeadline(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const base = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (diff < 0) return `${base} (overdue)`;
  if (diff === 0) return `${base} (today!)`;
  if (diff === 1) return `${base} (tomorrow)`;
  return `${base} (${diff}d left)`;
}

function focusStyle(level: string) {
  if (level === "high")
    return {
      badge: "bg-rose-100 text-rose-700",
      bar: "bg-rose-500",
      icon: <Flame size={13} className="text-rose-500" />,
    };
  if (level === "medium")
    return {
      badge: "bg-amber-100 text-amber-700",
      bar: "bg-amber-400",
      icon: <Zap size={13} className="text-amber-500" />,
    };
  return {
    badge: "bg-slate-100 text-slate-600",
    bar: "bg-slate-400",
    icon: <Minus size={13} className="text-slate-400" />,
  };
}

function toPercent(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

/* ─── Build weekly calendar from sessions ───────────────────────────────── */
function buildCalendar(sessions: Session[]) {
  if (!sessions.length) return [];
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  const firstDate = new Date(sorted[0].date + "T12:00:00");
  const lastDate = new Date(sorted[sorted.length - 1].date + "T12:00:00");

  // Start from the Monday of the first week
  const startDay = new Date(firstDate);
  startDay.setDate(firstDate.getDate() - ((firstDate.getDay() + 6) % 7));

  const weeks: { date: Date; sessions: Session[] }[][] = [];
  const current = new Date(startDay);

  while (current <= lastDate) {
    const week: { date: Date; sessions: Session[] }[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = current.toISOString().split("T")[0];
      week.push({
        date: new Date(current),
        sessions: sorted.filter((s) => s.date === dateStr),
      });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
function PlannerPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read task_id (new) or taskId (legacy) from URL
  const taskId = searchParams.get("task_id") || searchParams.get("taskId");

  /* ─── State ─────────────────────────────────────────────────────────── */
  const [task, setTask] = useState<Task | null>(null);
  const [schedule, setSchedule] = useState<SmartSchedule | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeView, setActiveView] = useState<"timeline" | "calendar">("timeline");
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [showDocSummaries, setShowDocSummaries] = useState(false);
  const [expandedDocs, setExpandedDocs] = useState<Set<number>>(new Set());
  const [maxMinutesPerDay, setMaxMinutesPerDay] = useState(240);

  /* ─── Load task + check for existing schedule ───────────────────────── */
  const loadInitialData = useCallback(async () => {
    if (!taskId) {
      setInitialLoading(false);
      return;
    }
    try {
      const [taskRes, schedRes] = await Promise.allSettled([
        fetch(`${API}/tasks/${taskId}`, { credentials: "include" }).then((r) =>
          r.ok ? r.json() : null
        ),
        getTaskPlan(taskId).catch(() => null),
      ]);

      if (taskRes.status === "fulfilled" && taskRes.value) {
        setTask(taskRes.value);
      }
      if (schedRes.status === "fulfilled" && schedRes.value && taskRes.status === "fulfilled" && taskRes.value) {
        setSchedule(toSmartSchedule(taskRes.value, schedRes.value));
      }
    } catch (e) {
      console.error("loadInitialData error:", e);
    } finally {
      setInitialLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  /* ─── File handling ─────────────────────────────────────────────────── */
  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;

    const incoming = Array.from(newFiles);
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      const combined = [...prev, ...incoming.filter((f) => !existing.has(f.name))];

      const allErrors = validateFiles(combined, {
        allowedExtensions: PLANNER_FILE_ALLOWED_EXTENSIONS,
        maxSizeBytes: PLANNER_MAX_FILE_SIZE,
        maxFiles: PLANNER_MAX_FILES,
      });

      if (allErrors.length > 0) {
        setError(allErrors[0]);
      } else {
        setError(null);
      }

      return combined.filter((file) => {
        const fileErrors = validateFiles([file], {
          allowedExtensions: PLANNER_FILE_ALLOWED_EXTENSIONS,
          maxSizeBytes: PLANNER_MAX_FILE_SIZE,
        });
        return fileErrors.length === 0;
      }).slice(0, PLANNER_MAX_FILES);
    });
  };

  const removeFile = (name: string) =>
    setFiles((prev) => prev.filter((f) => f.name !== name));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  /* ─── Generate schedule ─────────────────────────────────────────────── */
  const handleGenerate = async () => {
    if (!taskId) return;

    if (files.length === 0) {
      setError("Attach at least one study material before generating a plan.");
      return;
    }

    const fileErrors = validateFiles(files, {
      allowedExtensions: PLANNER_FILE_ALLOWED_EXTENSIONS,
      maxSizeBytes: PLANNER_MAX_FILE_SIZE,
      maxFiles: PLANNER_MAX_FILES,
    });

    if (fileErrors.length > 0) {
      setError(fileErrors[0]);
      return;
    }

    if (task && new Date(task.deadline).getTime() <= Date.now()) {
      setError("This task deadline has passed. Update the task deadline before generating a schedule.");
      return;
    }

    setGenerating(true);
    setError(null);
    setGeneratingStep("Extracting text from documents...");

    try {
      setGeneratingStep("Attaching study materials to this task...");
      const attachTargets = files.map((file) => {
        const ext = file.name.includes(".") ? file.name.split(".").pop() || "file" : "file";
        const estimatedPages = Math.max(1, Math.round(file.size / (1024 * 200)));
        return attachTaskResource(taskId, {
          file_name: file.name,
          file_type: ext.toLowerCase(),
          content_length: estimatedPages,
        });
      });
      await Promise.all(attachTargets);

      setGeneratingStep("Analyzing task + materials and generating sessions...");
      const plan = await generateTaskPlan(taskId);

      if (!task) throw new Error("Task not loaded");
      setSchedule(toSmartSchedule(task, plan));
      setExpandedDays(new Set([1]));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setGenerating(false);
      setGeneratingStep("");
    }
  };

  const handleRegenerate = async () => {
    if (!taskId || !task) return;
    try {
      setGenerating(true);
      setGeneratingStep("Regenerating plan with constraints...");
      const plan = await regenerateTaskPlan(taskId, maxMinutesPerDay);
      setSchedule(toSmartSchedule(task, plan));
      setExpandedDays(new Set([1]));
      setError(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to regenerate plan";
      setError(message);
    } finally {
      setGenerating(false);
      setGeneratingStep("");
    }
  };

  const totalHours = schedule
    ? schedule.sessions.reduce((sum, s) => sum + s.duration_hours, 0)
    : 0;

  /* ─── Empty / no-task state ─────────────────────────────────────────── */
  if (!taskId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Brain className="w-14 h-14 text-indigo-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Task Selected</h2>
          <p className="text-gray-500 mb-6 text-sm">
            Go to the Dashboard, pick a task, and click the{" "}
            <Sparkles className="inline w-4 h-4 text-indigo-500" /> icon to open it here.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ─── Initial loading ───────────────────────────────────────────────── */
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500 text-base">Loading planner...</p>
        </div>
      </div>
    );
  }

  /* ─── Generating overlay ────────────────────────────────────────────── */
  if (generating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-sm w-full text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <Loader2 className="w-20 h-20 animate-spin text-indigo-200" />
            <Brain className="w-8 h-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Groq AI is thinking...</h3>
          <p className="text-sm text-gray-500">{generatingStep}</p>
          <div className="mt-6 flex gap-1.5 justify-center">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const calendarWeeks = schedule ? buildCalendar(schedule.sessions) : [];

  /* ─── MAIN RENDER ────────────────────────────────────────────────────── */
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 lg:p-6 min-h-screen">
      
      {/* ── Page Header with Gradient (EDS) ── */}
        <section className="eds-hero-card eds-fade-up" style={{ animationDelay: "100ms" }}>
          {/* Ambient glow blobs */}
          <div className="pointer-events-none absolute eds-hero-glow-right blur-3xl opacity-60" />
          <div className="pointer-events-none absolute eds-hero-glow-left blur-3xl opacity-60" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="relative flex flex-col gap-4 md:flex-row md:items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/tasks")}
                className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm shadow-inner shadow-white/10 text-white hover:bg-white/25 hover:-translate-x-1 transition-all"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-100/90 mb-1">
                  EduSense · AI Schedule Engine
                </p>
                <h1 className="text-2xl font-bold text-white lg:text-3xl drop-shadow-sm flex items-center gap-3">
                  Smart Study Planner
                </h1>
              </div>
            </div>
            
            {schedule ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-blue-50 ring-1 ring-white/20 backdrop-blur-md shadow-sm">
                  <Sparkles size={13} className="text-blue-200" />
                  Groq Powered
                </span>
                <button
                  onClick={handleRegenerate}
                  disabled={generating}
                  className="eds-hero-action !bg-white !text-indigo-700 hover:!bg-indigo-50"
                >
                  {generating ? (
                    <Loader2 size={16} className="animate-spin text-indigo-400" />
                  ) : (
                    <RotateCcw size={16} />
                  )}
                  {generating ? "Regenerating..." : "Regenerate"}
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-blue-50 ring-1 ring-white/20 backdrop-blur-md shadow-sm">
                  <Sparkles size={13} className="text-blue-200" />
                  Groq Powered
                </span>
              </div>
            )}
          </div>
        </section>

      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Task info card ── */}
        {task && (
          <div className="rounded-2xl border border-white/60 bg-white/60 p-5 shadow-[0_8px_30px_-4px_rgba(15,23,42,0.04)] backdrop-blur-xl eds-fade-up" style={{ animationDelay: "200ms" }}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Target size={16} className="text-blue-500" />
                  <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wide">
                    {task.subject}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                      task.difficulty === "hard"
                        ? "bg-rose-100 text-rose-700 shadow-sm"
                        : task.difficulty === "medium"
                        ? "bg-amber-100 text-amber-700 shadow-sm"
                        : "bg-emerald-100 text-emerald-700 shadow-sm"
                    }`}
                  >
                    {task.difficulty}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-800">{task.title}</h2>
              </div>
              <div className="text-right text-sm">
                <div className="flex items-center gap-1.5 text-slate-500 bg-white/80 px-3 py-1.5 rounded-lg border border-slate-200/50 shadow-sm">
                  <Calendar size={14} className="text-indigo-400" />
                  <span className="font-semibold">Deadline: {formatDeadline(task.deadline)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            UPLOAD + GENERATE PANEL  (shown if no schedule yet)
        ══════════════════════════════════════════════════════════════ */}
        {!schedule && (
          <div className="rounded-2xl border border-white/60 bg-white/60 p-6 shadow-[0_8px_30px_-4px_rgba(15,23,42,0.04)] backdrop-blur-xl space-y-6 eds-fade-up" style={{ animationDelay: "300ms" }}>
            <div className="border-b border-slate-200/60 pb-5">
              <h3 className="font-extrabold text-slate-800 text-lg mb-1 flex items-center gap-2">
                <Sparkles size={18} className="text-blue-500" />
                Generate AI Schedule
              </h3>
              <p className="text-sm font-medium text-slate-500">
                Follow this flow: choose your task, upload material, then generate your study plan.
                Materials are required before generating a plan.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-blue-200/60 bg-blue-50/50 p-4 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:scale-110 transition-transform">
                  <Target size={40} className="text-blue-500" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Step 1</p>
                <p className="mt-1 text-sm font-extrabold text-slate-800">Task selected</p>
                <p className="mt-1 text-xs font-medium text-slate-500">You are planning for this task.</p>
              </div>
              <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                  <Upload size={40} className="text-slate-500" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Step 2</p>
                <p className="mt-1 text-sm font-extrabold text-slate-800">Upload PDF or docs</p>
                <p className="mt-1 text-xs font-medium text-slate-500">PDF, PPTX, DOCX supported.</p>
              </div>
              <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                  <Sparkles size={40} className="text-slate-500" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Step 3</p>
                <p className="mt-1 text-sm font-extrabold text-slate-800">Create schedule</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Scheduler uses task type + workload.</p>
              </div>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragging
                  ? "border-blue-400 bg-blue-50/50"
                  : "border-slate-300 hover:border-blue-300 hover:bg-white/60"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.pptx,.docx"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
              <Upload size={28} className="text-blue-500 mx-auto mb-3" />
              <p className="text-sm font-extrabold text-slate-700">
                Drop files here or <span className="text-blue-600">browse</span>
              </p>
              <p className="text-xs font-medium text-slate-400 mt-1">PDF · PPTX · DOCX · Max 5 files · 10MB each</p>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-2 mt-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                  {files.length} file{files.length > 1 ? "s" : ""} selected
                </p>
                {files.map((f) => (
                  <div
                    key={f.name}
                    className="flex items-center gap-3 px-4 py-3 bg-white/60 backdrop-blur-md rounded-xl border border-blue-100 shadow-sm transition-all hover:shadow-md hover:border-blue-200"
                  >
                    <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                      <FileText size={16} className="text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700 truncate">{f.name}</p>
                      <p className="text-xs font-medium text-slate-400">
                        {(f.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(f.name); }}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 px-4 py-3 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl text-sm font-medium text-red-700 shadow-sm">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={!taskId || files.length === 0}
              className="w-full py-4 text-white rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none mt-6"
            >
              <Brain size={20} className={files.length > 0 ? "animate-pulse" : ""} />
              {files.length > 0
                ? `Attach ${files.length} file${files.length > 1 ? "s" : ""} and Generate Plan`
                : "Attach Materials to Generate Plan"}
            </button>

            <p className="text-xs font-semibold text-slate-400 text-center mt-4">
              Required: upload at least one material to generate a task-aware study plan.
            </p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SCHEDULE RESULTS
        ══════════════════════════════════════════════════════════════ */}
        {schedule && (
          <>
            {/* ── Schedule header stats ── */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl shadow-[0_20px_40px_-15px_rgba(79,70,229,0.3)] p-8 text-white relative overflow-hidden eds-hero-card">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 scale-150 pointer-events-none">
                 <Calendar size={120} />
              </div>
              <div className="absolute -bottom-8 -left-8 p-12 opacity-10 -rotate-12 scale-125 pointer-events-none">
                 <Target size={100} />
              </div>

              <div className="flex flex-col md:flex-row items-start justify-between gap-6 relative z-10">
                <div className="flex-1">
                  <div className="inline-flex items-center justify-center rounded-lg bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-50 backdrop-blur-md mb-4 border border-white/10">
                    <span className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-300"></span>
                    {schedule.subject}
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-2 drop-shadow-sm">{schedule.title}</h2>
                  <div className="flex flex-wrap items-center gap-4 text-blue-100 text-sm font-medium mt-4 bg-black/10 w-fit px-4 py-2 rounded-xl backdrop-blur-sm border border-white/5">
                    <p className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-blue-300" />
                      {formatDate(schedule.start_date)} <ArrowRight size={12} className="text-blue-400 mx-1" /> {formatDate(schedule.end_date)}
                    </p>
                    <div className="w-1 h-1 rounded-full bg-blue-400/50 hidden sm:block"></div>
                    <p className="flex items-center gap-1.5">
                      <Clock size={14} className="text-purple-300" />
                      Due {formatDeadline(schedule.deadline)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRegenerate}
                  className="group flex flex-col md:flex-row items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white border border-white/20 hover:border-white rounded-xl text-sm font-bold text-white hover:text-blue-700 transition-all duration-300 shadow-sm hover:shadow-xl backdrop-blur-md shrink-0 w-full md:w-auto justify-center"
                >
                  <RotateCcw size={18} className="group-hover:-rotate-90 transition-transform duration-500" />
                  Regenerate Plan
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-white/20 flex flex-col sm:flex-row items-start sm:items-center gap-4 relative z-10">
                <label className="text-xs text-blue-200 font-bold uppercase tracking-widest flex items-center gap-2 shrink-0">
                  <Settings size={14} />
                  Max Minutes / Day
                </label>
                <div className="relative max-w-[200px] w-full group">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Clock size={14} className="text-white/40 group-focus-within:text-blue-300 transition-colors" />
                   </div>
                   <input
                    type="number"
                    min={60}
                    max={600}
                    value={maxMinutesPerDay}
                    onChange={(e) => setMaxMinutesPerDay(Number(e.target.value) || 240)}
                    className="w-full bg-black/20 hover:bg-black/30 focus:bg-white focus:text-slate-800 text-white rounded-lg pl-9 pr-12 py-2 text-sm font-bold placeholder-white/40 border border-white/20 focus:border-white outline-none transition-all"
                   />
                   <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                     <span className="text-xs font-bold text-white/50 group-focus-within:text-slate-400">MIN</span>
                   </div>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/20 hidden sm:block"></div>
                <p className="text-xs text-blue-200/80 font-medium hidden sm:block">Controls workload distribution</p>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-8 relative z-10 w-full pt-4 border-t border-white/10">
                {[
                  { label: "Sessions", value: schedule.sessions.length, icon: <LayoutList size={18} /> },
                  { label: "Total Time", value: `${totalHours.toFixed(1)}h`, icon: <Clock size={18} /> },
                  { label: "Topics", value: schedule.extracted_topics.length, icon: <BookOpen size={18} /> },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10 transition-all hover:scale-105 hover:-translate-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-blue-200/80 mb-2 font-bold uppercase tracking-wider">
                      {stat.icon}
                      <span className="text-[10px]">{stat.label}</span>
                    </div>
                    <p className="text-2xl font-black tracking-tight">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── AI Summary ── */}
            {schedule.ai_summary && (
              <div className="rounded-2xl border border-purple-200/60 bg-gradient-to-r from-purple-50/50 to-purple-100/30 p-6 shadow-[0_8px_30px_-4px_rgba(15,23,42,0.04)] backdrop-blur-xl relative overflow-hidden eds-fade-up">
                 <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Sparkles size={60} className="text-purple-600" />
                 </div>
                <h3 className="font-extrabold text-slate-800 text-sm mb-3 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 border border-purple-200/60">
                     <Brain size={18} className="text-purple-600 drop-shadow-sm" />
                  </span>
                  AI Study Insights
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed font-medium pl-10 relative z-10">{schedule.ai_summary}</p>
              </div>
            )}

            {/* Assignment Analysis */}
            {(schedule.assignment_analysis || schedule.analysis_status) && (
              <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Brain size={15} className="text-indigo-500" />
                    Assignment Analysis
                  </h3>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      schedule.analysis_status === "needs_review"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {schedule.analysis_status === "needs_review" ? "Needs Review" : "Analyzed"}
                  </span>
                </div>

                {schedule.analysis_status === "needs_review" && (
                  <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                    <AlertCircle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800">
                      Please confirm extracted module and year details before final study execution.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs text-slate-500 mb-1">Module</p>
                    <p className="font-semibold text-slate-700">
                      {schedule.assignment_analysis?.module_name || schedule.subject}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs text-slate-500 mb-1">Assignment Type</p>
                    <p className="font-semibold text-slate-700 capitalize">
                      {schedule.assignment_analysis?.assignment_type || "other"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs text-slate-500 mb-1">Year of Study</p>
                    <p className="font-semibold text-slate-700">
                      {schedule.assignment_analysis?.inferred_year_of_study ?? "Not set"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs text-slate-500 mb-1">Confidence</p>
                    <p className="font-semibold text-slate-700">
                      {toPercent(schedule.assignment_analysis?.confidence_score)}
                    </p>
                  </div>
                </div>

                {schedule.assignment_analysis?.summary && (
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                    {schedule.assignment_analysis.summary}
                  </p>
                )}

                {(schedule.assignment_analysis?.key_requirements || []).length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-500 mb-1.5">Key Requirements</p>
                    <ul className="space-y-1">
                      {(schedule.assignment_analysis?.key_requirements || []).map((item, idx) => (
                        <li key={`${item}-${idx}`} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 size={13} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* ── Extracted Topics ── */}
            {schedule.extracted_topics.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5">
                <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                  <Target size={15} className="text-purple-500" />
                  Topics to Cover
                </h3>
                <div className="flex flex-wrap gap-2">
                  {schedule.extracted_topics.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 text-indigo-700 rounded-full text-xs font-semibold"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Document Summaries ── */}
            {schedule.document_summaries.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
                <button
                  onClick={() => setShowDocSummaries((v) => !v)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <FileText size={15} className="text-indigo-500" />
                    Document Summaries ({schedule.document_summaries.length} file
                    {schedule.document_summaries.length > 1 ? "s" : ""})
                  </span>
                  {showDocSummaries ? (
                    <ChevronUp size={16} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={16} className="text-slate-400" />
                  )}
                </button>

                {showDocSummaries && (
                  <div className="border-t border-slate-100 divide-y divide-slate-100">
                    {schedule.document_summaries.map((doc, di) => (
                      <div key={di} className="px-5 py-4">
                        <button
                          onClick={() =>
                            setExpandedDocs((prev) => {
                              const next = new Set(prev);
                              if (next.has(di)) {
                                next.delete(di);
                              } else {
                                next.add(di);
                              }
                              return next;
                            })
                          }
                          className="w-full flex items-center justify-between text-left group"
                        >
                          <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                            <FileText size={13} className="text-indigo-400" />
                            {doc.filename}
                          </span>
                          {expandedDocs.has(di) ? (
                            <ChevronUp size={14} className="text-slate-400" />
                          ) : (
                            <ChevronDown size={14} className="text-slate-400" />
                          )}
                        </button>

                        {expandedDocs.has(di) && (
                          <div className="mt-3 space-y-3">
                            <p className="text-sm text-slate-600 leading-relaxed">{doc.summary}</p>
                            {doc.key_points.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-slate-500 mb-1.5">
                                  Key Points
                                </p>
                                <ul className="space-y-1">
                                  {doc.key_points.map((kp, ki) => (
                                    <li
                                      key={ki}
                                      className="flex items-start gap-2 text-sm text-slate-600"
                                    >
                                      <CheckCircle2
                                        size={13}
                                        className="text-indigo-400 mt-0.5 flex-shrink-0"
                                      />
                                      {kp}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {doc.topics.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {doc.topics.map((t) => (
                                  <span
                                    key={t}
                                    className="px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-full text-xs"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── View toggle ── */}
            <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1.5 w-fit shadow-sm">
              {(["timeline", "calendar"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setActiveView(v)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeView === v
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {v === "timeline" ? (
                    <><LayoutList size={14} /> Timeline</>
                  ) : (
                    <><CalendarDays size={14} /> Calendar</>
                  )}
                </button>
              ))}
            </div>

            {/* ══════════════════════════════════════════
                TIMELINE VIEW
            ══════════════════════════════════════════ */}
            {activeView === "timeline" && (
              <div className="space-y-3">
                {schedule.sessions.map((session) => {
                  const fs = focusStyle(session.focus_level);
                  const isExpanded = expandedDays.has(session.day);
                  return (
                    <div
                      key={session.day}
                      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedDays((prev) => {
                            const next = new Set(prev);
                            if (next.has(session.day)) {
                              next.delete(session.day);
                            } else {
                              next.add(session.day);
                            }
                            return next;
                          })
                        }
                        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                      >
                        {/* Day number */}
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {session.day}
                        </div>

                        {/* Date info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800 text-sm">
                              {session.day_name}
                            </span>
                            <span className="text-xs text-slate-500">{session.date}</span>
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${fs.badge}`}>
                              {fs.icon}
                              {session.focus_level} focus
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {session.topics.join(" · ")}
                          </p>
                        </div>

                        {/* Duration */}
                        <div className="flex items-center gap-1.5 text-slate-500 text-sm flex-shrink-0">
                          <Clock size={13} />
                          {session.duration_hours}h
                        </div>

                        {/* Expand icon */}
                        {isExpanded ? (
                          <ChevronUp size={15} className="text-slate-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown size={15} className="text-slate-400 flex-shrink-0" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="border-t border-slate-100 px-5 py-4 space-y-4 bg-gradient-to-r from-indigo-50/40 to-purple-50/20">
                          {/* Topics */}
                          <div>
                            <p className="text-xs font-semibold text-slate-500 mb-2">
                              Topics for this session
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {session.topics.map((t) => (
                                <span
                                  key={t}
                                  className="px-3 py-1 bg-white border border-indigo-200 text-indigo-700 rounded-full text-xs font-semibold shadow-sm"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Focus bar */}
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-slate-500 font-semibold">Focus Level</span>
                              <span className={`font-bold capitalize ${
                                session.focus_level === "high"
                                  ? "text-rose-600"
                                  : session.focus_level === "medium"
                                  ? "text-amber-600"
                                  : "text-slate-500"
                              }`}>
                                {session.focus_level}
                              </span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${fs.bar}`}
                                style={{
                                  width:
                                    session.focus_level === "high"
                                      ? "100%"
                                      : session.focus_level === "medium"
                                      ? "60%"
                                      : "30%",
                                }}
                              />
                            </div>
                          </div>

                          {/* AI Tip */}
                          {session.tips && (
                            <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                              <Lightbulb size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-amber-800 leading-relaxed">{session.tips}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ══════════════════════════════════════════
                CALENDAR VIEW
            ══════════════════════════════════════════ */}
            {activeView === "calendar" && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-slate-100">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <div
                      key={d}
                      className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wide"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {calendarWeeks.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 border-b border-slate-50 last:border-b-0">
                    {week.map((cell, di) => {
                      const isDeadline = cell.date.toISOString().split("T")[0] === schedule.end_date;
                      const hasSession = cell.sessions.length > 0;
                      return (
                        <div
                          key={di}
                          className={`min-h-[80px] p-2 border-r border-slate-50 last:border-r-0 ${
                            hasSession ? "bg-indigo-50/60" : ""
                          }`}
                        >
                          <p
                            className={`text-xs font-semibold mb-1 ${
                              isDeadline
                                ? "text-rose-600 font-bold"
                                : "text-slate-400"
                            }`}
                          >
                            {cell.date.getDate()}
                            {isDeadline && " ⚑"}
                          </p>
                          {cell.sessions.map((s) => {
                            const fs = focusStyle(s.focus_level);
                            return (
                              <div
                                key={s.day}
                                className={`mb-1 px-1.5 py-1 rounded-lg text-xs font-semibold truncate ${fs.badge} border border-current/20`}
                                title={s.topics.join(", ")}
                              >
                                {s.duration_hours}h · {s.focus_level}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* ── AI Tips ── */}
            {schedule.ai_tips.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-5">
                <h3 className="font-bold text-amber-900 text-sm mb-3 flex items-center gap-2">
                  <Lightbulb size={15} className="text-amber-500" />
                  AI Study Tips
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {schedule.ai_tips.map((tip, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 bg-white/70 rounded-xl px-3 py-2.5 border border-amber-100"
                    >
                      <span className="text-amber-500 font-bold text-xs mt-0.5">{i + 1}.</span>
                      <p className="text-xs text-amber-900 leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function PlannerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-500 text-base">Loading planner...</p>
          </div>
        </div>
      }
    >
      <PlannerPageContent />
    </Suspense>
  );
}
