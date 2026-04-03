"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Lightbulb, Sparkles, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RawTask {
    id: string;
    title: string;
    subject?: string;
    deadline?: string | null;
    status: "pending" | "in_progress" | "completed";
    completedAt?: string | null;
    difficulty?: "Low" | "Medium" | "High" | string;
}

interface Recommendation {
    title: string;
    explanation: string;
    priority: "High" | "Medium" | "Suggestion";
}

// ── Priority style maps ───────────────────────────────────────────────────────

const priorityStyles: Record<Recommendation["priority"], string> = {
    High: "bg-rose-600/15 text-rose-600 ring-1 ring-rose-600/25",
    Medium: "bg-amber-600/15 text-amber-600 ring-1 ring-amber-600/25",
    Suggestion: "bg-blue-600/15 text-blue-600 ring-1 ring-blue-600/25",
};

const priorityDot: Record<Recommendation["priority"], string> = {
    High: "bg-rose-600",
    Medium: "bg-amber-600",
    Suggestion: "bg-blue-600",
};

// ── Recommendation engine ─────────────────────────────────────────────────────

function generateRecommendations(tasks: RawTask[]): Recommendation[] {
    const now = new Date();
    const recs: Recommendation[] = [];

    const pending = tasks.filter((t) => t.status !== "completed");
    const completed = tasks.filter((t) => t.status === "completed");

    // ── 1. Overdue backlog (High) ─────────────────────────────────────────────
    const overdue = pending.filter((t) => {
        if (!t.deadline) return false;
        return new Date(t.deadline) < now;
    });

    if (overdue.length > 0) {
        const subjects = [...new Set(overdue.map((t) => t.subject).filter(Boolean))];
        const subjectPhrase =
            subjects.length > 0
                ? ` in ${subjects.slice(0, 2).join(" & ")}`
                : "";
        recs.push({
            title: `Clear your overdue backlog (${overdue.length} task${overdue.length > 1 ? "s" : ""})`,
            explanation: `You have ${overdue.length} unfinished task${overdue.length > 1 ? "s" : ""}${subjectPhrase} past their deadline. Focus on these first to prevent cascading delays.`,
            priority: "High",
        });
    }

    // ── 2. Workload spike in next 1–3 days (Medium) ─────────────────────────
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const upcomingSpike = pending.filter((t) => {
        if (!t.deadline) return false;
        const dl = new Date(t.deadline);
        return dl >= now && dl <= in3Days;
    });

    if (upcomingSpike.length >= 2) {
        const highDiff = upcomingSpike.filter((t) => t.difficulty === "High").length;
        const extraPhrase =
            highDiff > 0 ? ` (${highDiff} high-difficulty)` : "";
        recs.push({
            title: `Workload spike: ${upcomingSpike.length} tasks due in 3 days`,
            explanation: `You have ${upcomingSpike.length} pending task${upcomingSpike.length > 1 ? "s" : ""}${extraPhrase} due within the next 72 hours. Consider starting the hardest ones today to avoid a crunch.`,
            priority: "Medium",
        });
    } else if (upcomingSpike.length === 1) {
        const t = upcomingSpike[0];
        const hoursLeft = Math.max(
            0,
            Math.round((new Date(t.deadline!).getTime() - now.getTime()) / 36e5)
        );
        recs.push({
            title: `Upcoming deadline: "${t.title}"`,
            explanation: `"${t.title}"${t.subject ? ` (${t.subject})` : ""} is due in ~${hoursLeft} hour${hoursLeft !== 1 ? "s" : ""}. Start early to leave room for review.`,
            priority: "Medium",
        });
    }

    // ── 3. High-difficulty task clustering (High) ────────────────────────────
    const hardToday = pending.filter((t) => {
        if (t.difficulty !== "High" || !t.deadline) return false;
        const dl = new Date(t.deadline);
        const diffDays = (dl.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
        return diffDays >= 0 && diffDays <= 1.5;
    });

    if (hardToday.length >= 2 && !recs.find((r) => r.priority === "High")) {
        recs.push({
            title: `Limit high-difficulty tasks to avoid burnout`,
            explanation: `${hardToday.length} high-difficulty tasks are due in the next 36 hours. Spreading effort over several days improves retention and reduces errors.`,
            priority: "High",
        });
    }

    // ── 4. Momentum / Recovery (Suggestion) ──────────────────────────────────
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentlyCompleted = completed.filter((t) => {
        if (!t.completedAt) return false;
        return new Date(t.completedAt) >= last24h;
    });

    const noUrgentUpcoming = upcomingSpike.length === 0 && overdue.length === 0;

    if (recentlyCompleted.length >= 2 && noUrgentUpcoming) {
        recs.push({
            title: `Great momentum — consider a recovery break`,
            explanation: `You completed ${recentlyCompleted.length} task${recentlyCompleted.length > 1 ? "s" : ""} in the last 24 hours with no urgent deadlines ahead. A short break now will sustain your productivity streak.`,
            priority: "Suggestion",
        });
    } else if (recentlyCompleted.length >= 1 && noUrgentUpcoming) {
        recs.push({
            title: `On track — no urgent deadlines right now`,
            explanation: `You recently completed "${recentlyCompleted[0].title}" and have no imminent deadlines. This is a good time to get ahead on future subject work.`,
            priority: "Suggestion",
        });
    }

    // ── 5. No-deadline tasks reminder (Suggestion) ───────────────────────────
    const noDeadlinePending = pending.filter((t) => !t.deadline);
    if (noDeadlinePending.length >= 3) {
        recs.push({
            title: `Add deadlines to ${noDeadlinePending.length} unscheduled tasks`,
            explanation: `${noDeadlinePending.length} pending tasks have no deadline set. Assigning dates helps the AI surface accurate workload and risk warnings.`,
            priority: "Suggestion",
        });
    }

    // Fallback if nothing fired
    if (recs.length === 0) {
        recs.push({
            title: "All caught up — great work!",
            explanation:
                "No critical issues detected. Keep your current study pace and check back after adding more tasks.",
            priority: "Suggestion",
        });
    }

    return recs.slice(0, 5);
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function RecSkeleton() {
    return (
        <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-blue-300 bg-blue-100/60 p-3.5"
                >
                    <div className="mt-1.5 h-2 w-2 shrink-0 animate-pulse rounded-full bg-blue-300" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-3/4 animate-pulse rounded bg-blue-300/70" />
                        <div className="h-2.5 w-full animate-pulse rounded bg-blue-200/70" />
                        <div className="h-2.5 w-2/3 animate-pulse rounded bg-blue-200/70" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AiRecommendations() {
    const [tasks, setTasks] = useState<RawTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchedAt, setFetchedAt] = useState<Date | null>(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                setLoading(true);
                const raw = await apiFetch("/tasks");
                if (!cancelled) {
                    setTasks(Array.isArray(raw) ? raw : []);
                    setFetchedAt(new Date());
                }
            } catch {
                if (!cancelled) setTasks([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, []);

    const recommendations = useMemo(() => generateRecommendations(tasks), [tasks]);

    // Human-readable "X minutes ago" label
    const updatedLabel = fetchedAt
        ? (() => {
            const diffMs = Date.now() - fetchedAt.getTime();
            const mins = Math.floor(diffMs / 60000);
            return mins < 1 ? "Just now" : `${mins} minute${mins > 1 ? "s" : ""} ago`;
        })()
        : "—";

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-blue-100 to-white border border-blue-300 shadow-xl shadow-blue-300/50 p-5"
        >
            {/* Ambient blob */}
            <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-indigo-300/30 blur-3xl" />

            <div className="relative">
                {/* Header */}
                <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 shadow-lg shadow-blue-700/30">
                        <Sparkles size={16} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-slate-800">AI Recommendations</h3>
                        <p className="text-[11px] text-slate-500">Personalized insights from your task data</p>
                    </div>
                </div>

                {loading ? (
                    <RecSkeleton />
                ) : (
                    <div className="space-y-2.5">
                        {recommendations.map((rec, i) => (
                            <motion.div
                                key={rec.title}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.25 + i * 0.08, duration: 0.35 }}
                                whileHover={{ x: 4, transition: { duration: 0.15 } }}
                                className="group flex items-start gap-3 rounded-xl border border-blue-300 bg-blue-100/60 p-3.5 transition-all duration-200 hover:border-blue-400 hover:bg-blue-200/60"
                            >
                                {/* Priority dot */}
                                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${priorityDot[rec.priority]}`} />

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-semibold text-slate-800">{rec.title}</p>
                                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${priorityStyles[rec.priority]}`}>
                                            {rec.priority}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{rec.explanation}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="mt-4 flex items-center gap-2 border-t border-blue-300 pt-4">
                    <div className="rounded-lg bg-blue-600/10 p-1.5 ring-1 ring-blue-600/20">
                        {loading ? (
                            <Loader2 size={12} className="animate-spin text-blue-600" />
                        ) : (
                            <Lightbulb size={12} className="text-blue-600" />
                        )}
                    </div>
                    <span className="text-xs text-slate-500">
                        AI generated insight · Updated {updatedLabel}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
