"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, Clock3, Circle } from "lucide-react";
import { apiFetch } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type TaskStatus = "pending" | "in_progress" | "completed";

type Task = {
    id: string;
    title: string;
    subject: string;
    status: TaskStatus;
};

type SubjectStats = {
    subject: string;
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    completionPct: number;
};

// ── Colour palette per subject ────────────────────────────────────────────────

const SUBJECT_PALETTE = [
    { bg: "bg-blue-500/15", ring: "ring-blue-500/30", text: "text-blue-400" },
    { bg: "bg-violet-500/15", ring: "ring-violet-500/30", text: "text-violet-400" },
    { bg: "bg-cyan-500/15", ring: "ring-cyan-500/30", text: "text-cyan-400" },
    { bg: "bg-indigo-500/15", ring: "ring-indigo-500/30", text: "text-indigo-400" },
    { bg: "bg-sky-500/15", ring: "ring-sky-500/30", text: "text-sky-400" },
    { bg: "bg-purple-500/15", ring: "ring-purple-500/30", text: "text-purple-400" },
] as const;

// ── Data grouping ─────────────────────────────────────────────────────────────

function groupTasksBySubject(tasks: Task[]): SubjectStats[] {
    const map = new Map<string, SubjectStats>();

    for (const task of tasks) {
        if (!map.has(task.subject)) {
            map.set(task.subject, {
                subject: task.subject, total: 0,
                completed: 0, inProgress: 0, pending: 0, completionPct: 0,
            });
        }
        const s = map.get(task.subject)!;
        s.total++;
        if (task.status === "completed") s.completed++;
        else if (task.status === "in_progress") s.inProgress++;
        else s.pending++;
    }

    for (const s of map.values()) {
        s.completionPct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

// ── Shared card shell ─────────────────────────────────────────────────────────

function CardShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-blue-50 to-white border border-blue-200 shadow-xl shadow-blue-200/50 p-5">
            {/* Ambient glow blobs */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-200/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-indigo-200/30 blur-3xl" />
            <div className="relative">{children}</div>
        </div>
    );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
    return (
        <CardShell>
            <div className="mb-5 flex items-center gap-3">
                <div className="h-9 w-9 animate-pulse rounded-xl bg-blue-200/60" />
                <div className="space-y-1.5">
                    <div className="h-4 w-36 animate-pulse rounded bg-blue-200/60" />
                    <div className="h-3 w-24 animate-pulse rounded bg-blue-100/60" />
                </div>
            </div>
            <div className="mb-5 grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl bg-blue-100/60" />
                ))}
            </div>
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse rounded-xl bg-blue-100/60 p-4 space-y-3">
                        <div className="flex justify-between">
                            <div className="h-4 w-32 rounded bg-blue-200/60" />
                            <div className="h-5 w-12 rounded bg-blue-200/60" />
                        </div>
                        <div className="h-2 rounded-full bg-blue-200/60" />
                        <div className="flex gap-2">
                            <div className="h-4 w-16 rounded-md bg-blue-100/60" />
                            <div className="h-4 w-16 rounded-md bg-blue-100/60" />
                            <div className="h-4 w-16 rounded-md bg-blue-100/60" />
                        </div>
                    </div>
                ))}
            </div>
        </CardShell>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SubjectPerformanceChart() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await apiFetch("/tasks");
                if (!cancelled) setTasks(Array.isArray(data) ? data : []);
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load tasks");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, []);

    const subjectStats = useMemo(() => groupTasksBySubject(tasks), [tasks]);

    const overallPct = useMemo(() => {
        if (!tasks.length) return 0;
        return Math.round(tasks.filter((t) => t.status === "completed").length / tasks.length * 100);
    }, [tasks]);

    if (loading) return <LoadingSkeleton />;

    if (error) {
        return (
            <CardShell>
                <p className="text-base font-semibold text-slate-800 mb-1">Subject Performance</p>
                <p className="text-sm text-rose-400">{error}</p>
            </CardShell>
        );
    }

    if (subjectStats.length === 0) {
        return (
            <CardShell>
                <div className="flex items-center gap-3 mb-3">
                    <div className="rounded-xl bg-blue-100 p-2.5 ring-1 ring-blue-200">
                        <BookOpen size={18} className="text-blue-600" />
                    </div>
                    <p className="text-base font-semibold text-slate-800">Subject Performance</p>
                </div>
                <p className="text-sm text-slate-500">No tasks found. Add tasks to see subject performance.</p>
            </CardShell>
        );
    }

    return (
        <CardShell>
            {/* ── Header ── */}
            <div className="mb-5 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-100 p-2.5 ring-1 ring-blue-200">
                        <BookOpen size={18} className="text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-slate-800 leading-tight">
                            Subject Performance
                        </h3>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                            Task breakdown by subject
                        </p>
                    </div>
                </div>

                {/* Live indicator */}
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 ring-1 ring-emerald-200">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-medium text-emerald-600">Live</span>
                </div>
            </div>

            {/* ── Summary stats ── */}
            <div className="mb-5 grid grid-cols-3 gap-2">
                {[
                    { label: "Total Tasks", value: tasks.length, color: "text-slate-800" },
                    { label: "Subjects", value: subjectStats.length, color: "text-blue-400" },
                    { label: "Completed", value: `${overallPct}%`, color: overallPct === 100 ? "text-emerald-400" : overallPct >= 50 ? "text-amber-400" : "text-rose-400" },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-3 text-center"
                    >
                        <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* ── Subject rows ── */}
            <div className="space-y-3">
                {subjectStats.map((stats, i) => {
                    const palette = SUBJECT_PALETTE[i % SUBJECT_PALETTE.length];
                    const completedPct = (stats.completed / stats.total) * 100;
                    const inProgressPct = (stats.inProgress / stats.total) * 100;
                    const pendingPct = (stats.pending / stats.total) * 100;

                    const pctColor =
                        stats.completionPct === 100 ? "text-emerald-400" :
                            stats.completionPct >= 50 ? "text-amber-400" :
                                "text-rose-400";

                    return (
                        <motion.div
                            key={stats.subject}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07, duration: 0.4 }}
                            className="rounded-xl bg-blue-50/60 border border-blue-200 p-4 hover:bg-blue-100/60 hover:border-blue-300 transition-all duration-200"
                        >
                            {/* Top row */}
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ring-1 ${palette.bg} ${palette.ring} ${palette.text}`}>
                                        {stats.subject.slice(0, 3).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-white">
                                            {stats.subject}
                                        </p>
                                        <p className="text-[10px] text-slate-500">
                                            {stats.total} task{stats.total !== 1 ? "s" : ""}
                                        </p>
                                    </div>
                                </div>

                                <div className="shrink-0 text-right">
                                    <p className={`text-lg font-bold leading-none ${pctColor}`}>
                                        {stats.completionPct}%
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-slate-500">done</p>
                                </div>
                            </div>

                            {/* Segmented progress bar */}
                            <div className="flex h-2 overflow-hidden rounded-full bg-blue-100">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${completedPct}%` }}
                                    transition={{ delay: i * 0.07 + 0.15, duration: 0.75, ease: "easeOut" }}
                                    className="h-full bg-emerald-400"
                                />
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${inProgressPct}%` }}
                                    transition={{ delay: i * 0.07 + 0.3, duration: 0.75, ease: "easeOut" }}
                                    className="h-full bg-amber-400"
                                />
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pendingPct}%` }}
                                    transition={{ delay: i * 0.07 + 0.45, duration: 0.75, ease: "easeOut" }}
                                    className="h-full bg-rose-400"
                                />
                            </div>

                            {/* Stat pills */}
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 ring-1 ring-emerald-500/20">
                                    <CheckCircle2 size={9} /> {stats.completed} done
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 ring-1 ring-amber-500/20">
                                    <Clock3 size={9} /> {stats.inProgress} active
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-300 ring-1 ring-blue-400/25">
                                    <Circle size={9} /> {stats.pending} pending
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* ── Legend ── */}
            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-blue-200 pt-4">
                {[
                    { color: "bg-emerald-400", label: "Completed" },
                    { color: "bg-amber-400", label: "In Progress" },
                    { color: "bg-rose-400", label: "Pending" },
                ].map(({ color, label }) => (
                    <span key={label} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <span className={`h-2 w-2 rounded-full ${color}`} />
                        {label}
                    </span>
                ))}
            </div>
        </CardShell>
    );
}
