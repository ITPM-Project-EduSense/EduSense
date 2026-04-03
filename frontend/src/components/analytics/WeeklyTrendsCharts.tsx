"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, CheckCircle, AlertCircle, Target, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type TaskStatus = "pending" | "in_progress" | "completed";

type Task = {
    id: string;
    title: string;
    subject: string;
    deadline?: string;
    status: TaskStatus;
    updated_at: string;
    created_at: string;
};

type ViewMode = "day" | "week" | "cumulative";

type TimePoint = {
    label: string;
    date: Date; // represents start of period
    completedCount: number;
    missedCount: number;
    assignedCount: number;
    isHighProductivity: boolean;
    isLowProductivity: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000;

function startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfWeek(d: Date) {
    const res = startOfDay(d);
    const offset = (res.getDay() + 6) % 7; // Mon=0
    res.setDate(res.getDate() - offset);
    return res;
}

function formatDateLabel(d: Date, mode: ViewMode): string {
    if (mode === "week" || (mode === "cumulative" && d.getDay() === 1)) {
        return `Wk of ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    }
    return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
}

// ── Data Processing ───────────────────────────────────────────────────────────

function processTaskData(tasks: Task[], mode: ViewMode): TimePoint[] {
    const now = new Date();
    const today = startOfDay(now);

    // Determine the periods we want to show
    // For "day": last 7 days + today (8 points)
    // For "week": last 4 weeks + this week (5 points)
    // For "cumulative": use daily points but we will accumulate them later.

    const count = mode === "week" ? 5 : 8;
    const basePeriodArr: TimePoint[] = [];

    for (let i = count - 1; i >= 0; i--) {
        const d = new Date(today);
        if (mode === "week") {
            const wStart = startOfWeek(d);
            wStart.setDate(wStart.getDate() - i * 7);
            basePeriodArr.push({
                label: i === 0 ? "This Wk" : formatDateLabel(wStart, "week"),
                date: wStart,
                completedCount: 0,
                missedCount: 0,
                assignedCount: 0,
                isHighProductivity: false,
                isLowProductivity: false
            });
        } else {
            d.setDate(d.getDate() - i);
            basePeriodArr.push({
                label: i === 0 ? "Today" : formatDateLabel(d, "day"),
                date: d,
                completedCount: 0,
                missedCount: 0,
                assignedCount: 0,
                isHighProductivity: false,
                isLowProductivity: false
            });
        }
    }

    // Helper to find bin index
    const getBinIndex = (dText: string | undefined, useWeek: boolean) => {
        if (!dText) return -1;
        const d = startOfDay(new Date(dText));
        for (let i = 0; i < basePeriodArr.length; i++) {
            const startStr = basePeriodArr[i].date.getTime();
            const endStr = startStr + (useWeek ? 7 * MS_PER_DAY : MS_PER_DAY);
            if (d.getTime() >= startStr && d.getTime() < endStr) return i;
        }
        return -1;
    };

    tasks.forEach(t => {
        // Completed Tasks (based on updated_at)
        if (t.status === "completed") {
            const idx = getBinIndex(t.updated_at, mode === "week");
            if (idx >= 0) basePeriodArr[idx].completedCount++;
        }

        // Missed Deadlines (based on deadline)
        if (t.deadline && t.status !== "completed") {
            const deadlineDate = new Date(t.deadline);
            if (deadlineDate < now) {
                const idx = getBinIndex(t.deadline, mode === "week");
                if (idx >= 0) basePeriodArr[idx].missedCount++;
            }
        }

        // Assigned Tasks (based on deadline or creation date)
        const refDate = t.deadline || t.created_at;
        if (refDate) {
            const idx = getBinIndex(refDate, mode === "week");
            if (idx >= 0) basePeriodArr[idx].assignedCount++;
        }
    });

    // Mark productivity levels
    basePeriodArr.forEach(pt => {
        if (pt.assignedCount > 0) {
            const ratio = pt.completedCount / pt.assignedCount;
            if (ratio >= 1.0) pt.isHighProductivity = true;
            else if (ratio < 0.5 && pt.assignedCount >= 2) pt.isLowProductivity = true;
        } else if (pt.completedCount > 0) {
            // Overachieving (completing tasks without deadlines or early)
            pt.isHighProductivity = true;
        }
    });

    if (mode === "cumulative") {
        let runAssigned = 0;
        let runCompleted = 0;
        let runMissed = 0;
        return basePeriodArr.map(pt => {
            runAssigned += pt.assignedCount;
            runCompleted += pt.completedCount;
            runMissed += pt.missedCount;
            return {
                ...pt,
                assignedCount: runAssigned,
                completedCount: runCompleted,
                missedCount: runMissed,
            };
        });
    }

    return basePeriodArr;
}

/* ── SVG Helpers ── */
function toPolyline(data: number[], width: number, height: number, padding = 40) {
    const minPaddingX = padding;
    const minPaddingY = padding;
    const activeW = width - minPaddingX * 2;
    const activeH = height - minPaddingY * 2;

    const maxVal = Math.max(...data, 4); // min scale of 4 to prevent flatline at top

    const stepX = data.length > 1 ? activeW / (data.length - 1) : activeW;
    return data
        .map((v, i) => {
            const cx = minPaddingX + i * stepX;
            const cy = height - minPaddingY - (v / maxVal) * activeH;
            return `${cx},${cy}`;
        })
        .join(" ");
}

/* ── Productivity Chart (Line Chart: Assigned vs Completed) ── */
function ProductivityChart({ data }: { data: TimePoint[] }) {
    const W = 460;
    const H = 220;
    const P = 32;
    const activeW = W - P * 2;
    const activeH = H - P * 2;

    const assigned = data.map(d => d.assignedCount);
    const completed = data.map(d => d.completedCount);

    const maxVal = Math.max(...assigned, ...completed, 4);

    const stepX = data.length > 1 ? activeW / (data.length - 1) : activeW;

    const assignedPts = toPolyline(assigned, W, H, P);
    const completedPts = toPolyline(completed, W, H, P);

    // Build Area underneath completed
    const completedArea = `${completedPts} ${W - P},${H - P} ${P},${H - P}`;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            <defs>
                <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34D399" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#34D399" stopOpacity="0.0" />
                </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.5, 1].map((r) => {
                const y = P + r * activeH;
                const val = Math.round(maxVal - r * maxVal);
                return (
                    <g key={r}>
                        <line x1={P} y1={y} x2={W - P} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
                        <text x={P - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="500">{val}</text>
                    </g>
                );
            })}

            {/* High/Low Productivity Highlights */}
            {data.map((d, i) => {
                const cx = P + i * stepX;
                if (d.isHighProductivity || d.isLowProductivity) {
                    return (
                        <rect
                            key={`bg-${i}`}
                            x={cx - stepX * 0.4} y={P}
                            width={stepX * 0.8} height={activeH}
                            rx={4}
                            fill={d.isHighProductivity ? "rgba(52,211,153,0.06)" : "rgba(244,63,94,0.06)"}
                        />
                    );
                }
                return null;
            })}

            <polygon points={completedArea} fill="url(#compGrad)" />

            {/* Assigned Line */}
            <motion.polyline
                points={assignedPts} fill="none" stroke="#94a3b8" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
            />

            {/* Completed Line */}
            <motion.polyline
                points={completedPts} fill="none" stroke="#34D399" strokeWidth="3"
                strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.1, ease: "easeOut" }}
            />

            {/* Data Dots */}
            {data.map((d, i) => {
                const cx = P + i * stepX;
                const cyC = H - P - (d.completedCount / maxVal) * activeH;
                const cyA = H - P - (d.assignedCount / maxVal) * activeH;
                return (
                    <g key={i}>
                        {/* Assigned Dot */}
                        <circle cx={cx} cy={cyA} r={3} fill="#fff" stroke="#94a3b8" strokeWidth="2" />
                        {/* Completed Dot */}
                        <circle cx={cx} cy={cyC} r={4.5} fill="#fff" stroke="#34D399" strokeWidth="2.5" className="shadow-sm" />

                        {/* Interaction indicator if needed */}
                    </g>
                );
            })}

            {/* X Labels */}
            {data.map((d, i) => (
                <text key={i} x={P + i * stepX} y={H - 8} textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="600">
                    {d.label}
                </text>
            ))}
        </svg>
    )
}

/* ── Task Tracking Chart (Bar Chart: Completed vs Missed) ── */
function TaskTrackingChart({ data }: { data: TimePoint[] }) {
    const W = 460;
    const H = 160;
    const P = 32;
    const activeW = W - P * 2;
    const activeH = H - P * 2;

    const completed = data.map(d => d.completedCount);
    const missed = data.map(d => d.missedCount);
    const maxVal = Math.max(...completed, ...missed, 4);

    const groupW = activeW / data.length;
    const barW = Math.min(groupW * 0.35, 12);
    const gap = 2; // gap between bars in a group

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* Grid lines */}
            {[0, 0.5, 1].map((r) => {
                const y = P + r * activeH;
                const val = Math.round(maxVal - r * maxVal);
                return (
                    <g key={r}>
                        <line x1={P} y1={y} x2={W - P} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
                        <text x={P - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="500">{val}</text>
                    </g>
                );
            })}

            {data.map((d, i) => {
                const cx = P + i * groupW + groupW / 2;

                // Heights
                const compH = (d.completedCount / maxVal) * activeH;
                const missH = (d.missedCount / maxVal) * activeH;

                // Y positions
                const compY = H - P - compH;
                const missY = H - P - missH;

                return (
                    <g key={i}>
                        {/* Completed Bar */}
                        <motion.rect
                            initial={{ height: 0, y: H - P }}
                            animate={{ height: compH, y: compY }}
                            transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
                            x={cx - barW - gap / 2} width={barW} rx={3}
                            fill="#3B82F6"
                        />
                        {/* Missed Bar */}
                        <motion.rect
                            initial={{ height: 0, y: H - P }}
                            animate={{ height: missH, y: missY }}
                            transition={{ duration: 0.8, delay: i * 0.05 + 0.1, ease: "easeOut" }}
                            x={cx + gap / 2} width={barW} rx={3}
                            fill="#F43F5E"
                        />

                        {/* Labels for X axis */}
                        <text x={cx} y={H - 8} textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="600">
                            {d.label}
                        </text>
                    </g>
                )
            })}
        </svg>
    );

}


// ── Main Component ────────────────────────────────────────────────────────────

export default function WeeklyTrendsCharts() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>("day");

    useEffect(() => {
        let mounted = true;
        apiFetch("/tasks")
            .then(res => {
                if (mounted) setTasks(Array.isArray(res) ? res : []);
            })
            .catch(console.error)
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => { mounted = false; };
    }, []);

    const dataPoints = useMemo(() => processTaskData(tasks, viewMode), [tasks, viewMode]);

    // Calculate aggregated KPIs for displaying
    const totalCompleted = dataPoints.reduce((s, d) => s + (viewMode === "cumulative" ? 0 : d.completedCount), 0)
        + (viewMode === "cumulative" ? dataPoints[dataPoints.length - 1]?.completedCount || 0 : 0);
    const totalMissed = dataPoints.reduce((s, d) => s + (viewMode === "cumulative" ? 0 : d.missedCount), 0)
        + (viewMode === "cumulative" ? dataPoints[dataPoints.length - 1]?.missedCount || 0 : 0);
    const totalAssigned = dataPoints.reduce((s, d) => s + (viewMode === "cumulative" ? 0 : d.assignedCount), 0)
        + (viewMode === "cumulative" ? dataPoints[dataPoints.length - 1]?.assignedCount || 0 : 0);

    const globalCompleted = tasks.filter(t => t.status === "completed").length;
    const globalAssigned = tasks.length;

    const rawProdPercent = globalAssigned > 0 ? Math.round((globalCompleted / globalAssigned) * 100) : (globalCompleted > 0 ? 100 : 0);
    const prodPercent = Math.min(100, Math.max(0, rawProdPercent));

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 p-5"
        >
            {/* Ambient gradients */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-100/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-indigo-50/50 blur-3xl" />

            <div className="relative">
                {/* ── Header & Toggles ── */}
                <div className="mb-5 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-50 p-2.5 ring-1 ring-blue-100">
                            <TrendingUp size={18} className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-slate-800 leading-tight">
                                Performance Trends
                            </h3>
                            <p className="mt-0.5 text-[11px] text-slate-500">Track task completion &amp; missed deadlines</p>
                        </div>
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-lg ring-1 ring-slate-200">
                        {(["day", "week", "cumulative"] as ViewMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${viewMode === mode
                                        ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                    }`}
                            >
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── KPI Stats Row ── */}
                <div className="mb-5 grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-blue-50/80 border border-blue-100 px-3 py-3 text-center transition hover:shadow-md">
                        <div className="flex items-center justify-center gap-1.5 mb-1.5">
                            <CheckCircle size={14} className="text-blue-500" />
                            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Completed</p>
                        </div>
                        <p className="text-2xl font-black text-blue-600 leading-none">{loading ? "-" : totalCompleted}</p>
                    </div>

                    <div className={`rounded-xl border px-3 py-3 text-center transition hover:shadow-md ${totalMissed > 0 ? "bg-rose-50/80 border-rose-100" : "bg-emerald-50/80 border-emerald-100"}`}>
                        <div className="flex items-center justify-center gap-1.5 mb-1.5">
                            <AlertCircle size={14} className={totalMissed > 0 ? "text-rose-500" : "text-emerald-500"} />
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${totalMissed > 0 ? "text-rose-800" : "text-emerald-800"}`}>Missed</p>
                        </div>
                        <p className={`text-2xl font-black leading-none ${totalMissed > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                            {loading ? "-" : totalMissed}
                        </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-3 text-center transition hover:shadow-md">
                        <div className="flex items-center justify-center gap-1.5 mb-1.5">
                            <Target size={14} className="text-emerald-500" />
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Productivity</p>
                        </div>
                        <p className="text-2xl font-black text-emerald-600 leading-none">{loading ? "-" : `${prodPercent}%`}</p>
                    </div>
                </div>

                {/* ── Visualizations ── */}
                <div className="space-y-4">

                    {/* Productivity Area Chart */}
                    <div className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">Productivity</h4>
                                <p className="text-[10px] text-slate-500 mt-0.5">Assigned vs. Completed Tasks</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                                    <span className="inline-block h-2.5 w-4 rounded-sm border-[1.5px] border-dashed border-slate-400" />
                                    Assigned
                                </span>
                                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                                    <span className="inline-block h-2.5 w-4 rounded-sm bg-emerald-400" />
                                    Completed
                                </span>
                            </div>
                        </div>
                        <div className="h-44 w-full">
                            {!loading && <ProductivityChart data={dataPoints} />}
                        </div>
                    </div>

                    {/* Task Tracking Bar Chart */}
                    <div className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">Task Tracking</h4>
                                <p className="text-[10px] text-slate-500 mt-0.5">Specific completion dates &amp; missed deadlines</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" />
                                    Completed
                                </span>
                                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-rose-500" />
                                    Missed
                                </span>
                            </div>
                        </div>
                        <div className="h-36 w-full">
                            {!loading && <TaskTrackingChart data={dataPoints} />}
                        </div>
                    </div>

                </div>

            </div>
        </motion.div>
    );
}

