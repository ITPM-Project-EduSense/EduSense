"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Bot,
  FileText,
  Loader2,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
  PlusCircle,
  Send,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { API_BASE, apiFetch } from "@/lib/api";
import {
  calculateAcademicRisk,
  type BurnoutLevel,
  type RiskTask,
} from "@/lib/academicRiskEngine";
import {
  calculateDeadlineRisk,
  type DeadlineTask,
} from "@/lib/deadlineRiskEngine";
import { calculateBurnout, type BurnoutTask } from "@/lib/burnoutEngine";
import {
  calculateSubjectGpa,
  calculateWeightedGpa,
  type GpaPredictionResult,
  type SubjectMarks,
} from "@/lib/gpaEngine";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

type StudentLevel = "beginner" | "intermediate" | "advanced";

interface StudentProfilePayload {
  student_level: StudentLevel;
  academic_risk_analysis: {
    score: number;
    level: string;
  };
  predictive_deadline_risk: {
    probability: number;
    level: string;
  };
  gpa_prediction: {
    predicted_gpa: number;
    subject_count: number;
    has_valid_data: boolean;
  };
  burnout_index: {
    score: number;
    level: string;
  };
}

const starterPrompts = [
  "Summarize this lecture in simple bullet points.",
  "Create a quick revision plan for my next exam.",
  "Ask me 5 quiz questions from my uploaded notes.",
  "Explain this topic as if I am a beginner.",
];

const markdownComponents: Components = {
  code: ({ className, children, ...props }) => {
    const isInline =
      typeof className === "string" ? !className.includes("language-") : true;

    return isInline ? (
      <code
        className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm"
        {...props}
      >
        {children}
      </code>
    ) : (
      <code
        className="block overflow-x-auto rounded-2xl bg-slate-950 p-4 font-mono text-sm text-slate-100"
        {...props}
      >
        {children}
      </code>
    );
  },
};

const normalizeToPercent = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (max <= min) return 0;
  const pct = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
};

const mapRiskToStudentLevel = (compositeRisk: number): StudentLevel => {
  if (compositeRisk >= 67) return "beginner";
  if (compositeRisk >= 34) return "intermediate";
  return "advanced";
};

function formatSessionTime(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AiChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasInitializedScrollRef = useRef(false);
  const previousMessageCountRef = useRef(0);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Study Session",
      messages: [],
      updatedAt: Date.now(),
    };

    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  useEffect(() => {
    const stored = localStorage.getItem("edu_coach_sessions");
    if (!stored) {
      createNewSession();
      return;
    }

    try {
      const parsed: ChatSession[] = JSON.parse(stored);
      if (parsed.length === 0) {
        createNewSession();
        return;
      }
      setSessions(parsed);
      setCurrentSessionId(parsed[0].id);
    } catch {
      createNewSession();
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("edu_coach_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  const currentSession = sessions.find((s) => s.id === currentSessionId) ?? null;

  useEffect(() => {
    if (!currentSessionId && sessions.length > 0) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [currentSessionId, sessions]);

  useEffect(() => {
    const messageCount = currentSession?.messages.length ?? 0;

    if (!hasInitializedScrollRef.current) {
      hasInitializedScrollRef.current = true;
      previousMessageCountRef.current = messageCount;
      return;
    }

    const shouldScroll =
      messageCount > previousMessageCountRef.current || loading || uploading;

    previousMessageCountRef.current = messageCount;

    if (shouldScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentSession?.messages.length, uploading, loading]);

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    setSessions((prev) => {
      const remaining = prev.filter((session) => session.id !== id);
      if (currentSessionId === id) {
        setCurrentSessionId(remaining[0]?.id ?? null);
      }
      return remaining;
    });
  };

  const buildStudentProfile = async (): Promise<StudentProfilePayload> => {
    let riskScore = 0;
    let riskLevel = "Safe";
    let deadlineProbability = 0;
    let deadlineLevel = "Low";
    let burnoutScore = 0;
    let burnoutLevel = "Low";

    try {
      const rawTasks = await apiFetch("/tasks");
      const tasks = Array.isArray(rawTasks) ? rawTasks : [];
      const burnout = calculateBurnout(tasks as BurnoutTask[]);
      const deadlineRisk = calculateDeadlineRisk(
        tasks as DeadlineTask[],
        burnout.score,
      );
      const risk = calculateAcademicRisk(
        tasks as RiskTask[],
        burnout.level as BurnoutLevel,
      );

      riskScore = risk.score;
      riskLevel = risk.level;
      deadlineProbability = deadlineRisk.probability;
      deadlineLevel = deadlineRisk.level;
      burnoutScore = burnout.score;
      burnoutLevel = burnout.level;
    } catch {
      // Keep safe defaults if analytics data is unavailable.
    }

    let predictedGpa = 0;
    let gpaSubjectCount = 0;
    let gpaHasValidData = false;

    try {
      const storedMarks = localStorage.getItem("edusense_gpa_marks");
      const marksMap: Record<string, SubjectMarks> = storedMarks
        ? JSON.parse(storedMarks)
        : {};
      const subjectNames = Object.keys(marksMap);
      const predictions: GpaPredictionResult[] = subjectNames.map((subject) =>
        calculateSubjectGpa(subject, marksMap[subject]),
      );
      const weightedGpa = calculateWeightedGpa(predictions, marksMap);
      predictedGpa = weightedGpa.predictedGpa;
      gpaSubjectCount = weightedGpa.subjectCount;
      gpaHasValidData = weightedGpa.hasValidData;
    } catch {
      // Keep GPA defaults if local storage is missing or malformed.
    }

    const gpaRisk = gpaHasValidData
      ? 100 - normalizeToPercent(predictedGpa, 0, 4)
      : 50;
    const compositeRisk = Math.round(
      (riskScore + deadlineProbability + burnoutScore + gpaRisk) / 4,
    );

    const studentLevel = mapRiskToStudentLevel(compositeRisk);
    localStorage.setItem("edu_student_level", studentLevel);

    return {
      student_level: studentLevel,
      academic_risk_analysis: {
        score: riskScore,
        level: riskLevel,
      },
      predictive_deadline_risk: {
        probability: deadlineProbability,
        level: deadlineLevel,
      },
      gpa_prediction: {
        predicted_gpa: predictedGpa,
        subject_count: gpaSubjectCount,
        has_valid_data: gpaHasValidData,
      },
      burnout_index: {
        score: burnoutScore,
        level: burnoutLevel,
      },
    };
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentSessionId) return;

    const userMessageText = inputValue.trim();
    setInputValue("");
    setLoading(true);

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: userMessageText,
      timestamp: Date.now(),
    };

    setSessions((prev) =>
      prev.map((session) =>
        session.id === currentSessionId
          ? {
              ...session,
              messages: [...session.messages, newMessage],
              title:
                session.messages.length === 0
                  ? `${userMessageText.substring(0, 42)}${userMessageText.length > 42 ? "..." : ""}`
                  : session.title,
              updatedAt: Date.now(),
            }
          : session,
      ),
    );

    try {
      const studentProfile = await buildStudentProfile();

      const res = await fetch(`${API_BASE}/chat/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: userMessageText,
          subject: null,
          student_level: studentProfile.student_level,
          student_profile: studentProfile,
        }),
      });

      if (!res.ok) throw new Error("Failed to get response from AI Coach");

      const data = await res.json();
      const replyText = data.reply || "Sorry, I couldn't generate a response.";

      setSessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId
            ? {
                ...session,
                messages: [
                  ...session.messages,
                  {
                    id: Date.now().toString(),
                    sender: "ai",
                    text: replyText,
                    timestamp: Date.now(),
                  },
                ],
                updatedAt: Date.now(),
              }
            : session,
        ),
      );
    } catch {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId
            ? {
                ...session,
                messages: [
                  ...session.messages,
                  {
                    id: Date.now().toString(),
                    sender: "ai",
                    text: "Warning: Unable to connect to AI Coach. Please try again.",
                    timestamp: Date.now(),
                  },
                ],
                updatedAt: Date.now(),
              }
            : session,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentSessionId) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "subject",
        `Study Material: ${file.name.replace(/\.[^/.]+$/, "")}`,
      );

      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) throw new Error("PDF processing failed.");

      const data = await res.json();

      setSessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId
            ? {
                ...session,
                messages: [
                  ...session.messages,
                  {
                    id: Date.now().toString(),
                    sender: "ai",
                    text: `File processed successfully.\n\nI analyzed **${file.name}** and extracted **${data.concepts_extracted || 0}** key learning concepts. You can now ask focused questions based on this material.`,
                    timestamp: Date.now(),
                  },
                ],
                updatedAt: Date.now(),
              }
            : session,
        ),
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Upload failed unexpectedly.";
      alert(`Upload failed: ${message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="relative flex h-[calc(100vh-250px)] min-h-[680px] overflow-hidden rounded-[20px] bg-transparent font-[family-name:var(--font-poppins)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,_rgba(99,102,241,0.08),_transparent_24%),radial-gradient(circle_at_50%_100%,_rgba(34,211,238,0.08),_transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.52),rgba(248,250,252,0.76))]" />

      <div className="relative flex min-w-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-slate-200/50 bg-white/30 px-4 py-2.5 backdrop-blur-xl md:px-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#312e81,#4f46e5)] text-white shadow-[0_14px_28px_-18px_rgba(79,70,229,0.45)]">
                  <Bot size={17} />
                </div>
                <div>
                  <h1 className="text-[15px] font-bold tracking-tight text-slate-900">
                    AI Assistant
                  </h1>
                  <p className="text-xs text-slate-500">
                    Calm, focused study help
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden rounded-full border border-slate-200 bg-white/88 px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm sm:block">
                  {sessions.length} saved sessions
                </div>
                <button
                  onClick={() => setIsSidebarOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/88 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-white"
                  title="Toggle chat history"
                >
                  {isSidebarOpen ? (
                    <PanelRightClose size={16} />
                  ) : (
                    <PanelRightOpen size={16} />
                  )}
                  History
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-4 md:px-5">
            {!currentSession || currentSession.messages.length === 0 ? (
              <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-2 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#312e81,#06b6d4)] text-white shadow-[0_18px_36px_-22px_rgba(79,70,229,0.85)]">
                  <FileText size={26} />
                </div>
                <h2 className="mt-6 text-[2rem] font-extrabold tracking-tight text-slate-900">
                  Hi, can I help you with anything?
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
                  Ask study questions, summarize lecture notes, create quiz
                  practice, or upload material to get more grounded answers.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <Paperclip size={15} />
                    Upload Material
                  </button>
                  <button
                    onClick={createNewSession}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <PlusCircle size={15} />
                    New Session
                  </button>
                </div>

                <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
                  {starterPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setInputValue(prompt)}
                      className="rounded-[18px] border border-slate-200/90 bg-white/85 px-4 py-3 text-left text-sm font-medium text-slate-600 transition-all hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-white"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl">
                <div className="rounded-[22px] border border-white/70 bg-white/35 px-3 py-4 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.18)] backdrop-blur-sm md:px-4">
                  <div className="flex flex-col gap-3">
                {currentSession.messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex w-full ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`${
                        msg.sender === "user" ? "max-w-[54%] min-w-[180px]" : "max-w-[82%]"
                      } ${
                        msg.sender === "user"
                          ? "rounded-[20px] rounded-tr-[8px] border border-indigo-500/10 bg-[linear-gradient(135deg,#4f7df5,#4f46e5)] px-4 py-3 text-white shadow-[0_16px_32px_-24px_rgba(79,70,229,0.45)]"
                          : "rounded-[20px] rounded-tl-[8px] border border-slate-200/80 bg-white/96 px-4 py-3.5 text-slate-700 shadow-[0_16px_30px_-26px_rgba(15,23,42,0.12)] backdrop-blur-xl"
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${
                            msg.sender === "user"
                              ? "text-blue-100/95"
                              : "text-indigo-600"
                          }`}
                        >
                          {msg.sender === "user" ? "You" : "EduSense AI"}
                        </span>
                        <span
                          className={`text-[11px] ${
                            msg.sender === "user"
                              ? "text-blue-200/75"
                              : "text-slate-400"
                          }`}
                        >
                          {formatSessionTime(msg.timestamp)}
                        </span>
                      </div>

                      {msg.sender === "user" ? (
                        <p className="whitespace-pre-wrap text-[15px] font-medium leading-7">
                          {msg.text}
                        </p>
                      ) : (
                        <div className="prose prose-slate max-w-none prose-p:my-2 prose-p:leading-7 prose-headings:mb-3 prose-headings:text-slate-900 prose-strong:text-indigo-700 prose-li:my-1 prose-blockquote:border-indigo-300 prose-blockquote:text-slate-500">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {uploading && (
                  <div className="flex w-full justify-start">
                    <div className="max-w-[82%] rounded-[20px] rounded-tl-[8px] border border-slate-200/80 bg-white/96 px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Loader2 className="animate-spin text-indigo-500" size={20} />
                        <span className="text-sm font-medium text-slate-600">
                          Processing PDF and extracting concepts...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {loading && (
                  <div className="flex w-full justify-start">
                    <div className="max-w-[82%] rounded-[20px] rounded-tl-[8px] border border-slate-200/80 bg-white/96 px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-600">
                          AI Coach is thinking
                        </span>
                        <div className="flex gap-1">
                          <span
                            className="h-2 w-2 animate-bounce rounded-full bg-indigo-400"
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className="h-2 w-2 animate-bounce rounded-full bg-indigo-400"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="h-2 w-2 animate-bounce rounded-full bg-indigo-400"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} className="h-2" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200/50 bg-white/38 px-4 py-3 backdrop-blur-xl md:px-5">
            <div className="mx-auto max-w-3xl">
              <div className="rounded-[22px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.98))] p-3 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.14)]">
                <input
                  type="file"
                  accept=".pdf,.docx,.pptx"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />

                <div className="flex items-end gap-2.5">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || uploading}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-slate-200 bg-white text-slate-500 transition hover:-translate-y-0.5 hover:border-cyan-200 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Upload study material"
                  >
                    <Paperclip size={18} />
                  </button>

                  <div className="min-w-0 flex-1 rounded-[18px] border border-slate-200 bg-white px-4 py-2.5 focus-within:border-cyan-200 focus-within:ring-2 focus-within:ring-cyan-100">
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Ask anything about your material, revision plan, or difficult topic..."
                      className="min-h-[52px] w-full resize-none bg-transparent py-1 text-[15px] leading-7 text-slate-700 outline-none placeholder:text-slate-400"
                      rows={1}
                    />
                  </div>

                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || loading || uploading}
                    className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-[18px] px-4 text-sm font-semibold transition-all ${
                      inputValue.trim()
                        ? "bg-slate-950 text-white hover:-translate-y-0.5 hover:bg-slate-900"
                        : "cursor-not-allowed bg-slate-200 text-slate-400"
                    }`}
                  >
                    <Send size={18} />
                    Send
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
                  <p className="text-xs text-slate-400">
                    Press Enter to send. Shift + Enter adds a new line.
                  </p>
                  <p className="text-xs text-slate-400">
                    AI Coach uses semantic search from uploaded materials.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isSidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="hidden shrink-0 border-l border-slate-200/70 bg-white/60 backdrop-blur-xl lg:flex"
            >
              <div className="flex w-80 flex-col">
                <div className="border-b border-slate-200/70 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        Sessions
                      </p>
                      <h3 className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-800">
                        <MessageSquare size={16} className="text-indigo-500" />
                        Previous Conversations
                      </h3>
                    </div>
                    <button
                      onClick={createNewSession}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:border-indigo-200 hover:bg-indigo-50"
                      title="New Chat"
                    >
                      <PlusCircle size={16} />
                      New
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                  <div className="space-y-2">
                    {sessions.map((session) => {
                      const isActive = currentSessionId === session.id;
                      return (
                        <div
                          key={session.id}
                          onClick={() => setCurrentSessionId(session.id)}
                          className={`group cursor-pointer rounded-[22px] border p-4 transition-all ${
                            isActive
                              ? "border-cyan-200 bg-[linear-gradient(135deg,rgba(239,246,255,0.96),rgba(236,254,255,0.96))] shadow-[0_16px_34px_-24px_rgba(6,182,212,0.6)]"
                              : "border-transparent bg-white/78 hover:border-slate-200 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-800">
                                {session.title || "Untitled Session"}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {session.messages.length} messages
                              </p>
                              <p className="mt-2 text-xs text-slate-500">
                                {formatSessionTime(session.updatedAt)}
                              </p>
                            </div>
                            <button
                              onClick={(e) => deleteSession(e, session.id)}
                              className="rounded-lg p-1.5 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-white hover:text-rose-500"
                              aria-label="Delete session"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {sessions.length === 0 && (
                    <div className="mt-12 rounded-[22px] border border-dashed border-slate-200 bg-white/70 p-5 text-center text-sm text-slate-400">
                      No previous chats yet.
                    </div>
                  )}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
