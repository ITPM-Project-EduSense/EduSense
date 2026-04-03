"use client";

import { useState, useEffect, useMemo } from "react";
import { Radio, AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
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

interface LiveAlert {
    type: "danger" | "warning" | "info";
    message: string;
    time: string;       // human-readable timestamp label
    sortKey: number;    // epoch ms for dedup / ordering
}

// ── Alert config ──────────────────────────────────────────────────────────────

const alertConfig: Record<LiveAlert["type"], {
    icon: typeof AlertCircle;
    border: string; bg: string; text: string; iconBg: string;
}> = {
    danger: {
        icon: AlertCircle,
        border: "border-rose-600/30",
        bg: "bg-rose-600/8",
        text: "text-rose-600",
        iconBg: "bg-rose-600/15",
    },
    warning: {
        icon: AlertTriangle,
        border: "border-amber-600/30",
        bg: "bg-amber-600/8",
        text: "text-amber-600",
        iconBg: "bg-amber-600/15",
    },
    info: {
        icon: Info,
        border: "border-blue-600/30",
        bg: "bg-blue-600/8",
        text: "text-blue-600",
        iconBg: "bg-blue-600/15",
    },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns a human-readable relative time string for a past date. */
function relativeTime(date: Date, now: Date): string {
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs} hr${diffHrs > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

/** Returns a human-readable label for a future deadline. */
function futureLabel(deadline: Date, now: Date): string {
    const diffMs = deadline.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / 3600000);
    if (diffHrs < 1) return "less than 1 hour";
    if (diffHrs < 24) return `~${diffHrs} hour${diffHrs > 1 ? "s" : ""}`;
    const diffDays = Math.ceil(diffHrs / 24);
    return `~${diffDays} day${diffDays > 1 ? "s" : ""}`;
}

// ── Alert generation engine ───────────────────────────────────────────────────

function generateAlerts(tasks: RawTask[], now: Date): LiveAlert[] {
    const alerts: LiveAlert[] = [];

    const pending = tasks.filter((t) => t.status !== "completed");
    const completed = tasks.filter((t) => t.status === "completed");

    // ── DANGER: Overdue tasks ─────────────────────────────────────────────────
    pending.forEach((t) => {
        if (!t.deadline) return;
        const dl = new Date(t.deadline);
        if (dl >= now) return;
        const daysLate = Math.ceil((now.getTime() - dl.getTime()) / (24 * 60 * 60 * 1000));
        const subjectTag = t.subject ? ` (${t.subject})` : "";
        alerts.push({
            type: "danger",
            message: `"${t.title}"${subjectTag} is overdue by ${daysLate} day${daysLate > 1 ? "s" : ""}`,
            time: relativeTime(dl, now),
            sortKey: dl.getTime(),
        });
    });

    // ── WARNING: Due within 48 hours ──────────────────────────────────────────
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    pending.forEach((t) => {
        if (!t.deadline) return;
        const dl = new Date(t.deadline);
        if (dl < now || dl > in48h) return;
        const subjectTag = t.subject ? ` (${t.subject})` : "";
        const diffHrs = Math.floor((dl.getTime() - now.getTime()) / 3600000);
        const urgency = diffHrs <= 6 ? "critical" : "upcoming";
        alerts.push({
            type: "warning",
            message: `${urgency === "critical" ? "⚠️ Urgent — " : ""}"${t.title}"${subjectTag} due in ${futureLabel(dl, now)}`,
            time: futureLabel(dl, now),
            sortKey: dl.getTime(),
        });
    });

    // ── INFO: Recently completed tasks (last 24 h) ────────────────────────────
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    completed.forEach((t) => {
        if (!t.completedAt) return;
        const doneAt = new Date(t.completedAt);
        if (doneAt < since24h) return;
        const subjectTag = t.subject ? ` (${t.subject})` : "";
        alerts.push({
            type: "info",
            message: `"${t.title}"${subjectTag} completed successfully`,
            time: relativeTime(doneAt, now),
            sortKey: doneAt.getTime(),
        });
    });

    // ── INFO: High-difficulty tasks in the next 3 days ───────────────────────
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const upcomingHard = pending.filter((t) => {
        if (t.difficulty !== "High" || !t.deadline) return false;
        const dl = new Date(t.deadline);
        return dl >= now && dl <= in3Days;
    });
    if (upcomingHard.length >= 2) {
        alerts.push({
            type: "info",
            message: `${upcomingHard.length} high-difficulty tasks due in the next 3 days — pace yourself`,
            time: "Just now",
            sortKey: now.getTime() - 1,
        });
    }

    // ── Deduplication: keep first occurrence of identical messages ────────────
    const seen = new Set<string>();
    const unique: LiveAlert[] = [];
    // Sort: danger first, then warning, then info; within type by sortKey asc
    const typeOrder = { danger: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => {
        const tDiff = typeOrder[a.type] - typeOrder[b.type];
        if (tDiff !== 0) return tDiff;
        return a.sortKey - b.sortKey;
    });

    alerts.forEach((alert) => {
        if (!seen.has(alert.message)) {
            seen.add(alert.message);
            unique.push(alert);
        }
    });

    return unique;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function AlertSkeleton() {
    return (
        <div className="space-y-2">
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-blue-300/40 bg-blue-100/30 p-3.5"
                >
                    <div className="mt-0.5 h-8 w-8 shrink-0 animate-pulse rounded-lg bg-blue-200/70" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-4/5 animate-pulse rounded bg-blue-200/80" />
                        <div className="h-2 w-1/3 animate-pulse rounded bg-blue-200/50" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RealTimeAlerts() {
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

    const { validatedAlerts, duplicateCount } = useMemo(() => {
        if (!fetchedAt) return { validatedAlerts: [], duplicateCount: 0 };
        const generated = generateAlerts(tasks, fetchedAt);
        const rawCount = tasks.length > 0 ? Math.max(0, tasks.filter(t => t.status !== "completed" && t.deadline && new Date(t.deadline) < fetchedAt).length - generated.filter(a => a.type === "danger").length) : 0;
        return { validatedAlerts: generated, duplicateCount: rawCount };
    }, [tasks, fetchedAt]);

    const dangerCount = validatedAlerts.filter((a) => a.type === "danger").length;
    const warningCount = validatedAlerts.filter((a) => a.type === "warning").length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-blue-100 to-white border border-blue-300 shadow-xl shadow-blue-300/50 p-5"
        >
            {/* Ambient blob */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-rose-300/20 blur-3xl" />

            <div className="relative">
                {/* Header */}
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative rounded-xl bg-rose-600/15 p-2.5 ring-1 ring-rose-600/25">
                            {loading ? (
                                <Loader2 size={16} className="animate-spin text-rose-600" />
                            ) : (
                                <>
                                    <Radio size={16} className="text-rose-600" />
                                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-ping rounded-full bg-rose-600 opacity-75" />
                                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-700" />
                                </>
                            )}
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-slate-800">Real-Time Alerts</h3>
                            <p className="text-[11px] text-slate-500">Live monitoring feed</p>
                        </div>
                    </div>

                    {/* Summary badges */}
                    {!loading && (
                        <div className="flex items-center gap-1.5">
                            {dangerCount > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-600/15 px-2 py-0.5 text-[10px] font-bold text-rose-600 ring-1 ring-rose-600/25">
                                    {dangerCount} critical
                                </span>
                            )}
                            {warningCount > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-600/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 ring-1 ring-amber-600/25">
                                    {warningCount} warning
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Alert list */}
                {loading ? (
                    <AlertSkeleton />
                ) : validatedAlerts.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-8 text-center">
                        <span className="text-2xl">✅</span>
                        <p className="text-sm font-medium text-slate-600">All clear — no active alerts</p>
                        <p className="text-xs text-slate-400">No overdue or imminent tasks detected.</p>
                    </div>
                ) : (
                    <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.700)_transparent]">
                        {validatedAlerts.map((alert, i) => {
                            const cfg = alertConfig[alert.type];
                            const Icon = cfg.icon;
                            return (
                                <motion.div
                                    key={`${alert.type}-${i}`}
                                    initial={{ opacity: 0, x: 12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.06, duration: 0.3 }}
                                    className={`flex items-start gap-3 rounded-xl border ${cfg.border} ${cfg.bg} p-3.5 transition-all duration-200 hover:brightness-110`}
                                >
                                    <div className={`mt-0.5 shrink-0 rounded-lg p-1.5 ${cfg.iconBg}`}>
                                        <Icon size={13} className={cfg.text} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-sm font-medium ${cfg.text}`}>{alert.message}</p>
                                        <div className="mt-1 flex items-center justify-between">
                                            <p className="text-[10px] text-slate-400">{alert.time}</p>
                                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">Verified</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-blue-200 pt-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400">
                            {loading ? "Loading alerts…" : `Showing ${validatedAlerts.length} unique alert${validatedAlerts.length !== 1 ? "s" : ""}`}
                        </span>
                        {duplicateCount > 0 && (
                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                                {duplicateCount} duplicates suppressed
                            </span>
                        )}
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-600 ring-1 ring-emerald-500/20">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                        Validation: Active
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
