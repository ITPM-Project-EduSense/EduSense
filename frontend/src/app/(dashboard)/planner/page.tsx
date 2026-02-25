"use client";

import { useEffect, useState } from "react";
import {
  Upload,
  Brain,
  Calendar,
  List,
  Clock,
  BookOpen,
  Sparkles,
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Target,
  X,
  Loader2,
  Plus,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface StudySession {
  day: number;
  date: string;
  day_name: string;
  topics: string[];
  duration_hours: number;
  focus_level: string;
  tips: string;
}

interface StudySchedule {
  id: string;
  task_id: string | null;
  title: string;
  subject: string;
  deadline: string;
  total_topics: number;
  total_days: number;
  total_hours: number;
  extracted_topics: string[];
  sessions: StudySession[];
  ai_summary: string;
  ai_tips: string;
  original_filename: string;
  status: string;
  created_at: string;
}

export default function PlannerPage() {
  const [schedules, setSchedules] = useState<StudySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<StudySchedule | null>(null);
  const [viewMode, setViewMode] = useState<"timeline" | "calendar">("timeline");
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  // Upload form state
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const fetchSchedules = async () => {
    try {
      const res = await fetch(`${API}/api/study-schedules/`);
      const data = await res.json();
      // Ensure data is an array
      const schedulesArray = Array.isArray(data) ? data : [];
      setSchedules(schedulesArray);
      if (schedulesArray.length > 0 && !selectedSchedule) {
        setSelectedSchedule(schedulesArray[0]);
      }
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setGenerating(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("subject", subject);
    formData.append("title", title);
    formData.append("deadline", new Date(deadline).toISOString());

    try {
      const res = await fetch(`${API}/api/study-schedules/generate`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const newSchedule = await res.json();
        setShowUploadModal(false);
        setFile(null);
        setSubject("");
        setTitle("");
        setDeadline("");
        await fetchSchedules();
        setSelectedSchedule(newSchedule);
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to generate schedule");
      }
    } catch (err) {
      console.error("Failed to generate schedule:", err);
      alert("Failed to connect to the server");
    } finally {
      setGenerating(false);
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      await fetch(`${API}/api/study-schedules/${id}`, { method: "DELETE" });
      if (selectedSchedule?.id === id) setSelectedSchedule(null);
      fetchSchedules();
    } catch (err) {
      console.error("Failed to delete schedule:", err);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const getFocusColor = (level: string) => {
    switch (level) {
      case "high": return { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", dot: "bg-red-500" };
      case "medium": return { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", dot: "bg-amber-500" };
      case "low": return { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", dot: "bg-emerald-500" };
      default: return { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-500" };
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Calendar helper
  const getCalendarWeeks = (sessions: StudySession[]) => {
    const weeks: StudySession[][] = [];
    let currentWeek: StudySession[] = [];

    if (sessions.length === 0) return weeks;

    // Get first day's weekday (0 = Sun, 6 = Sat)
    const firstDate = new Date(sessions[0].date);
    const startDay = firstDate.getDay();

    // Fill empty days before first session
    for (let i = 0; i < startDay; i++) {
      currentWeek.push(null as unknown as StudySession);
    }

    sessions.forEach((session) => {
      currentWeek.push(session);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    // Fill remaining days
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null as unknown as StudySession);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  };

  return (
    <>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-[28px] font-bold text-slate-800 tracking-tight mb-1 font-[family-name:var(--font-playfair)]">
            Study Planner <Sparkles size={24} className="inline text-indigo-500 mb-1" />
          </h1>
          <p className="text-sm text-slate-500">
            Upload course materials and let AI create your perfect study schedule
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-[0_2px_8px_rgba(99,102,241,0.3)] hover:bg-indigo-600 hover:shadow-[0_4px_16px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
        >
          <Plus size={18} />
          Generate Schedule
        </button>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-[300px_1fr] gap-5">
        {/* Left - Schedule List */}
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden h-fit">
          <div className="px-4 py-3.5 border-b border-slate-100">
            <span className="text-[14px] font-semibold text-slate-800">My Schedules</span>
          </div>

          {loading ? (
            <div className="p-6 text-center text-slate-400 text-sm">Loading...</div>
          ) : schedules.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                <Brain size={24} className="text-indigo-400" />
              </div>
              <p className="text-sm text-slate-400 mb-2">No schedules yet</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="text-indigo-500 text-sm font-medium hover:text-indigo-600 cursor-pointer"
              >
                + Generate your first
              </button>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              {schedules.map((s) => (
                <div
                  key={s.id}
                  onClick={() => { setSelectedSchedule(s); setExpandedDay(null); }}
                  className={`px-4 py-3 border-b border-slate-50 cursor-pointer transition-all duration-200 group ${
                    selectedSchedule?.id === s.id ? "bg-indigo-50 border-l-2 border-l-indigo-500" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-slate-800 truncate">{s.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{s.subject} • {s.total_days} days</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSchedule(s.id); }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right - Schedule Detail */}
        {selectedSchedule ? (
          <div className="space-y-5">
            {/* Schedule Header Card */}
            <div className="bg-white border border-slate-100 rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 font-[family-name:var(--font-playfair)]">
                    {selectedSchedule.title}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">{selectedSchedule.subject}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <FileText size={14} />
                  {selectedSchedule.original_filename}
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { icon: <BookOpen size={16} />, label: "Topics", value: selectedSchedule.total_topics, color: "indigo" },
                  { icon: <Calendar size={16} />, label: "Days", value: selectedSchedule.total_days, color: "emerald" },
                  { icon: <Clock size={16} />, label: "Hours", value: selectedSchedule.total_hours, color: "amber" },
                  { icon: <Target size={16} />, label: "Deadline", value: formatDate(selectedSchedule.deadline), color: "red" },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      stat.color === "indigo" ? "bg-indigo-100 text-indigo-500" :
                      stat.color === "emerald" ? "bg-emerald-100 text-emerald-500" :
                      stat.color === "amber" ? "bg-amber-100 text-amber-500" :
                      "bg-red-100 text-red-500"
                    }`}>
                      {stat.icon}
                    </div>
                    <div>
                      <div className="text-[17px] font-bold text-slate-800 leading-none">{stat.value}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wide">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Summary */}
              <div className="p-3.5 rounded-lg bg-indigo-50 border border-indigo-100">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles size={14} className="text-indigo-500" />
                  <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide">AI Summary</span>
                </div>
                <p className="text-[13px] text-indigo-700 leading-relaxed">{selectedSchedule.ai_summary}</p>
              </div>
            </div>

            {/* Topics Extracted */}
            <div className="bg-white border border-slate-100 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Extracted Topics</h3>
              <div className="flex flex-wrap gap-2">
                {selectedSchedule.extracted_topics.map((topic, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("timeline")}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  viewMode === "timeline"
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300"
                }`}
              >
                <List size={16} /> Timeline
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  viewMode === "calendar"
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300"
                }`}
              >
                <Calendar size={16} /> Calendar
              </button>
            </div>

            {/* Timeline View */}
            {viewMode === "timeline" && (
              <div className="space-y-3">
                {selectedSchedule.sessions.map((session) => {
                  const colors = getFocusColor(session.focus_level);
                  const isExpanded = expandedDay === session.day;
                  return (
                    <div
                      key={session.day}
                      className={`bg-white border rounded-xl overflow-hidden transition-all duration-200 ${
                        isExpanded ? `${colors.border} shadow-sm` : "border-slate-100"
                      }`}
                    >
                      <div
                        onClick={() => setExpandedDay(isExpanded ? null : session.day)}
                        className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-slate-50/50 transition-all"
                      >
                        {/* Day Number */}
                        <div className={`w-11 h-11 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${colors.bg}`}>
                          <span className={`text-[10px] font-bold uppercase ${colors.text}`}>Day</span>
                          <span className={`text-base font-bold leading-none ${colors.text}`}>{session.day}</span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-medium text-slate-800">
                            {session.topics.join(", ")}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                            <span>{session.day_name}, {session.date}</span>
                            <span className="flex items-center gap-1">
                              <Clock size={11} /> {session.duration_hours}h
                            </span>
                          </div>
                        </div>

                        {/* Focus Badge */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase ${colors.bg} ${colors.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                            {session.focus_level}
                          </span>
                          {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="px-5 pb-4 pt-1 border-t border-slate-100">
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100">
                            <Lightbulb size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                            <p className="text-[13px] text-amber-700 leading-relaxed">{session.tips}</p>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {session.topics.map((topic, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-100 text-[11px] font-medium text-slate-600">
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Calendar View */}
            {viewMode === "calendar" && (
              <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
                {/* Calendar Header */}
                <div className="grid grid-cols-7 border-b border-slate-100">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="px-3 py-2.5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                {getCalendarWeeks(selectedSchedule.sessions).map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 border-b border-slate-50 last:border-b-0">
                    {week.map((session, di) => {
                      if (!session) {
                        return <div key={`empty-${wi}-${di}`} className="min-h-[100px] p-2 bg-slate-50/50" />;
                      }
                      const colors = getFocusColor(session.focus_level);
                      return (
                        <div
                          key={session.day}
                          onClick={() => setExpandedDay(expandedDay === session.day ? null : session.day)}
                          className={`min-h-[100px] p-2 border-r border-slate-50 last:border-r-0 cursor-pointer hover:bg-slate-50/50 transition-all ${
                            expandedDay === session.day ? "bg-indigo-50/50 ring-1 ring-indigo-200" : ""
                          }`}
                        >
                          <div className="text-[12px] font-semibold text-slate-800 mb-1">
                            {new Date(session.date).getDate()}
                          </div>
                          <div className={`px-1.5 py-1 rounded text-[10px] font-medium ${colors.bg} ${colors.text} mb-1`}>
                            {session.duration_hours}h • {session.focus_level}
                          </div>
                          {session.topics.slice(0, 2).map((t, i) => (
                            <div key={i} className="text-[10px] text-slate-500 truncate leading-relaxed">
                              {t}
                            </div>
                          ))}
                          {session.topics.length > 2 && (
                            <div className="text-[10px] text-indigo-500 font-medium">+{session.topics.length - 2} more</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* AI Tips */}
            {selectedSchedule.ai_tips && (
              <div className="bg-white border border-slate-100 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb size={16} className="text-amber-500" />
                  <span className="text-sm font-semibold text-slate-800">AI Study Tips</span>
                </div>
                <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-line">{selectedSchedule.ai_tips}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-xl flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                <Brain size={32} className="text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">No Schedule Selected</h3>
              <p className="text-sm text-slate-400 mb-4">Upload course materials to generate an AI study plan</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-indigo-600 transition-all cursor-pointer"
              >
                <Upload size={16} /> Upload & Generate
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Upload & Generate Modal ─── */}
      {showUploadModal && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center animate-[fadeIn_0.2s_ease]"
          onClick={(e) => e.target === e.currentTarget && !generating && setShowUploadModal(false)}
        >
          <div className="bg-white rounded-2xl w-[520px] max-h-[85vh] overflow-y-auto shadow-[0_12px_40px_rgba(0,0,0,0.1)] animate-[scaleIn_0.25s_ease]">
            <div className="flex items-center justify-between px-6 pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Brain size={20} className="text-indigo-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 font-[family-name:var(--font-playfair)]">
                    Generate Study Schedule
                  </h2>
                  <p className="text-xs text-slate-400">Upload materials & let AI plan your study</p>
                </div>
              </div>
              <button
                onClick={() => !generating && setShowUploadModal(false)}
                className="w-[34px] h-[34px] rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:border-red-400 hover:text-red-500 transition-all duration-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="px-6 py-5">
              {/* File Upload */}
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-slate-800 mb-1.5">
                  Course Material <span className="text-red-500">*</span>
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                    dragActive
                      ? "border-indigo-500 bg-indigo-50"
                      : file
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                  }`}
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText size={20} className="text-emerald-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{file.name}</p>
                        <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="text-slate-400 hover:text-red-500 cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                      <p className="text-sm text-slate-600 mb-1">
                        Drag & drop your file here, or{" "}
                        <label className="text-indigo-500 font-medium cursor-pointer hover:text-indigo-600">
                          browse
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.pptx,.docx,.png,.jpg,.jpeg"
                            onChange={(e) => e.target.files && setFile(e.target.files[0])}
                          />
                        </label>
                      </p>
                      <p className="text-[11px] text-slate-400">PDF, PPTX, DOCX, PNG, JPG (max 10MB)</p>
                    </>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-slate-800 mb-1.5">
                  Schedule Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., DSA Final Exam Prep"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] placeholder:text-slate-400"
                />
              </div>

              {/* Subject + Deadline */}
              <div className="grid grid-cols-2 gap-3.5 mb-5">
                <div>
                  <label className="block text-[13px] font-medium text-slate-800 mb-1.5">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Data Structures"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-slate-800 mb-1.5">
                    Exam/Deadline <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => !generating && setShowUploadModal(false)}
                  disabled={generating}
                  className="px-5 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating || !file}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-[0_2px_8px_rgba(99,102,241,0.3)] hover:bg-indigo-600 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      AI is generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Generate Schedule
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}