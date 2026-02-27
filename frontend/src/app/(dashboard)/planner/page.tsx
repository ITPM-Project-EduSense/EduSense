"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
} from "lucide-react";

/* ─── Types ────────────────────────────────────────────────────────────────── */
interface Task {
  id: string;
  title: string;
  subject: string;
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
}

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";

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
  let current = new Date(startDay);

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
export default function PlannerPage() {
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
        fetch(`${API}/schedule/by-task/${taskId}`, { credentials: "include" }).then(
          (r) => (r.ok ? r.json() : null)
        ),
      ]);

      if (taskRes.status === "fulfilled" && taskRes.value) {
        setTask(taskRes.value);
      }
      if (schedRes.status === "fulfilled" && schedRes.value?.success) {
        setSchedule(schedRes.value);
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
    const allowed = [".pdf", ".pptx", ".docx"];
    const valid = Array.from(newFiles).filter((f) =>
      allowed.some((ext) => f.name.toLowerCase().endsWith(ext))
    );
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...valid.filter((f) => !existing.has(f.name))];
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
    setGenerating(true);
    setError(null);
    setGeneratingStep("Extracting text from documents...");

    try {
      const formData = new FormData();
      formData.append("task_id", taskId);
      files.forEach((f) => formData.append("files", f));

      setGeneratingStep("Asking Groq AI to analyse your materials...");

      const res = await fetch(`${API}/schedule/generate-smart`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      setGeneratingStep("Building your personalised schedule...");

      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Generation failed");
      if (!data.success) throw new Error("AI returned an empty schedule");

      setSchedule(data);
      setExpandedDays(new Set([1]));
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* ── Page header ── */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Smart Study Planner</h1>
            <p className="text-sm text-slate-500">AI-powered by Groq · Llama 3.3</p>
          </div>
        </div>

        {/* ── Task info card ── */}
        {task && (
          <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Target size={16} className="text-indigo-500" />
                  <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                    {task.subject}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      task.difficulty === "hard"
                        ? "bg-rose-100 text-rose-700"
                        : task.difficulty === "medium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {task.difficulty}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-800">{task.title}</h2>
              </div>
              <div className="text-right text-sm">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Calendar size={13} />
                  <span>Deadline: {formatDeadline(task.deadline)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            UPLOAD + GENERATE PANEL  (shown if no schedule yet)
        ══════════════════════════════════════════════════════════════ */}
        {!schedule && (
          <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 space-y-5">
            <div>
              <h3 className="font-bold text-slate-800 text-base mb-0.5 flex items-center gap-2">
                <Sparkles size={16} className="text-purple-500" />
                Generate AI Schedule
              </h3>
              <p className="text-sm text-slate-500">
                Optionally upload lecture notes, slides or textbooks (PDF, PPTX, DOCX) for a
                personalised schedule. You can also skip uploads and generate a general plan.
              </p>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragging
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50"
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
              <Upload size={28} className="text-indigo-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">
                Drop files here or <span className="text-indigo-600">browse</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">PDF · PPTX · DOCX · Multiple files OK</p>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {files.length} file{files.length > 1 ? "s" : ""} selected
                </p>
                {files.map((f) => (
                  <div
                    key={f.name}
                    className="flex items-center gap-3 px-4 py-2.5 bg-indigo-50 rounded-xl border border-indigo-100"
                  >
                    <FileText size={15} className="text-indigo-500 flex-shrink-0" />
                    <span className="flex-1 text-sm text-slate-700 truncate">{f.name}</span>
                    <span className="text-xs text-slate-400">
                      {(f.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(f.name); }}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={!taskId}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Brain size={18} />
              {files.length > 0
                ? `Generate Schedule from ${files.length} file${files.length > 1 ? "s" : ""}`
                : "Generate General Study Plan"}
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SCHEDULE RESULTS
        ══════════════════════════════════════════════════════════════ */}
        {schedule && (
          <>
            {/* ── Schedule header stats ── */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div>
                  <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wide mb-1">
                    {schedule.subject}
                  </p>
                  <h2 className="text-xl font-bold">{schedule.title}</h2>
                  <p className="text-indigo-200 text-sm mt-1 flex items-center gap-1.5">
                    <Calendar size={13} />
                    {formatDate(schedule.start_date)} → {formatDate(schedule.end_date)}
                    &nbsp;·&nbsp;Due {formatDeadline(schedule.deadline)}
                  </p>
                </div>
                <button
                  onClick={() => { setSchedule(null); setFiles([]); setError(null); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-semibold transition-all"
                >
                  <Upload size={14} />
                  Regenerate
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Sessions", value: schedule.sessions.length, icon: <LayoutList size={15} /> },
                  { label: "Total Hours", value: `${totalHours.toFixed(1)}h`, icon: <Clock size={15} /> },
                  { label: "Topics", value: schedule.extracted_topics.length, icon: <BookOpen size={15} /> },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/15 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-indigo-200 mb-1">
                      {stat.icon}
                      <span className="text-xs">{stat.label}</span>
                    </div>
                    <p className="text-xl font-bold">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── AI Summary ── */}
            {schedule.ai_summary && (
              <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5">
                <h3 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                  <Brain size={15} className="text-indigo-500" />
                  AI Study Overview
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">{schedule.ai_summary}</p>
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
                              next.has(di) ? next.delete(di) : next.add(di);
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
                            next.has(session.day) ? next.delete(session.day) : next.add(session.day);
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
