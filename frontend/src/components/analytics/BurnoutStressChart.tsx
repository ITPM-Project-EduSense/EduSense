"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, TrendingDown, Minus, Activity, AlertTriangle, Calendar, Layers } from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
    calculateBurnout,
    type BurnoutResult,
    type BurnoutTask,
    type BurnoutLevel,
    type WorkloadPoint,
} from "@/lib/burnoutEngine";

// ── Colour config ─────────────────────────────────────────────────────────────

const LEVEL_COLOR: Record<BurnoutLevel, {
    stroke: string; gradStart: string;
    badge: string; text: string; dot: string;
    iconBg: string; iconRing: string;
    scoreBg: string; scoreText: string;
}> = {
    Low: {
        stroke: "#34D399",
        gradStart: "#34D399",
        badge: "bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/25",
        text: "text-emerald-600",
        dot: "#34D399",
        iconBg: "bg-emerald-500/15",
        iconRing: "ring-emerald-500/25",
        scoreBg: "bg-emerald-50",
        scoreText: "text-emerald-700",
    },
    Medium: {
        stroke: "#F59E0B",
        gradStart: "#F59E0B",
        badge: "bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/25",
        text: "text-amber-600",
        dot: "#F59E0B",
        iconBg: "bg-amber-500/15",
        iconRing: "ring-amber-500/25",
        scoreBg: "bg-amber-50",
        scoreText: "text-amber-700",
    },
    High: {
        stroke: "#EF4444",
        gradStart: "#EF4444",
        badge: "bg-rose-500/15 text-rose-600 ring-1 ring-rose-500/25",
        text: "text-rose-600",
        dot: "#EF4444",
        iconBg: "bg-rose-500/15",
        iconRing: "ring-rose-500/25",
        scoreBg: "bg-rose-50",
        scoreText: "text-rose-700",
    },
};

function pointColor(score: number): string {
    if (score > 70) return "#EF4444";
    if (score > 40) return "#F59E0B";
    return "#34D399";
}

// ── SVG Chart ─────────────────────────────────────────────────────────────────

function WorkloadChart({ data, level }: { data: WorkloadPoint[], level: BurnoutLevel }) {
    const W = 440;
    const H = 200;
    const PAD = 32;
    const usableW = W - PAD * 2;
    const usableH = H - PAD * 2;

    const stepX = data.length > 1 ? usableW / (data.length - 1) : usableW;
    const colors = LEVEL_COLOR[level];
    const gradId = `workloadGrad_${level}`;

    const points = data.map((d, i) => ({
        ...d,
        x: PAD + i * stepX,
        y: H - PAD - (Math.min(100, d.score) / 100) * usableH,
    }));

    const pathD = points.reduce((acc, pt, i, arr) => {
        if (i === 0) return `M ${pt.x},${pt.y}`;
        const prev = arr[i - 1];
        const cpx1 = prev.x + stepX * 0.4;
        const cpx2 = pt.x - stepX * 0.4;
        return `${acc} C ${cpx1},${prev.y} ${cpx2},${pt.y} ${pt.x},${pt.y}`;
    }, "");

    const areaD = `${pathD} L ${points[points.length - 1].x},${H - PAD} L ${points[0].x},${H - PAD} Z`;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.gradStart} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={colors.gradStart} stopOpacity="0.01" />
                </linearGradient>
            </defs>

            {/* Grid lines */}
            {[25, 50, 75].map((v) => {
                const y = H - PAD - (v / 100) * usableH;
                const col = "rgba(148,163,184,0.15)";
                return (
                    <g key={v}>
                        <line x1={PAD} y1={y} x2={W - PAD} y2={y}
                            stroke={col} strokeWidth="1" strokeDasharray="4 4" />
                        <text x={PAD - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
                            {v}
                        </text>
                    </g>
                );
            })}

            {/* Current Day / Week Highlight */}
            {points.map((pt, i) =>
                pt.isCurrent && (
                    <rect
                        key={`highlight-${i}`}
                        x={pt.x - stepX * 0.45}
                        y={PAD} width={stepX * 0.9} height={usableH}
                        rx={6} fill="rgba(59,130,246,0.06)"
                    />
                )
            )}

            {/* Area fill */}
            <path d={areaD} fill={`url(#${gradId})`} />

            {/* Curve */}
            <motion.path
                d={pathD} fill="none"
                stroke={colors.stroke} strokeWidth="3" strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
            />

            {/* Data points */}
            {points.map((pt, i) => (
                <g key={i}>
                    {pt.isCritical && (
                        <circle cx={pt.x} cy={pt.y} r={12} fill={pointColor(pt.score)} fillOpacity="0.15" />
                    )}
                    <circle
                        cx={pt.x} cy={pt.y}
                        r={pt.isCurrent ? 6 : 4}
                        fill={pointColor(pt.score)} stroke="#ffffff" strokeWidth="2"
                        className="shadow-sm"
                    />
                    {pt.score > 0 && (
                        <text
                            x={pt.x} y={pt.y - 12}
                            textAnchor="middle" fontSize="9"
                            fill="#64748b" fontWeight="600"
                        >
                            {pt.score}
                        </text>
                    )}
                </g>
            ))}

            {/* X-axis labels */}
            {points.map((pt, i) => (
                <text key={i} x={pt.x} y={H - 8}
                    textAnchor="middle" fontSize="10"
                    fill={pt.isCurrent ? "#2563eb" : "#94a3b8"}
                    fontWeight={pt.isCurrent ? "700" : "500"}>
                    {pt.label}
                </text>
            ))}
        </svg>
    );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl bg-white border border-gray-300 shadow-xl shadow-gray-300/50 p-5"
        >
            <div className="mb-1 h-5 w-44 animate-pulse rounded bg-gray-200/60" />
            <div className="mb-4 h-3 w-36 animate-pulse rounded bg-gray-200/60" />
            <div className="grid grid-cols-3 gap-2 mb-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100/60" />
                ))}
            </div>
            <div className="h-48 animate-pulse rounded-xl bg-gray-100/60" />
            <div className="mt-4 h-16 animate-pulse rounded-xl bg-gray-100/60" />
        </motion.div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

type ViewMode = "day" | "week" | "month";

export default function BurnoutStressChart() {
    const [burnout, setBurnout] = useState<BurnoutResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>("week");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                const raw = await apiFetch("/tasks");
                const tasks: BurnoutTask[] = Array.isArray(raw) ? raw : [];
                const result = calculateBurnout(tasks);
                if (!cancelled) setBurnout(result);
            } catch {
                if (!cancelled) setBurnout(calculateBurnout([]));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, []);

    if (loading) return <Skeleton />;

    const b = burnout!;

    const chartData =
        viewMode === "day" ? b.dailyWorkload :
            viewMode === "week" ? b.weeklyWorkload :
                b.monthlyWorkload;

    const currentPoint = chartData.find(d => d.isCurrent) || chartData[chartData.length - 1];

    // Check if we have tomorrow/next week info
    const currentIndex = chartData.findIndex(d => d.isCurrent);
    const nextPoint = currentIndex >= 0 && currentIndex < chartData.length - 1 ? chartData[currentIndex + 1] : null;

    const currentLevel = currentPoint.level;
    const colors = LEVEL_COLOR[currentLevel];

    const TrendIcon =
        b.trend === "up" ? TrendingUp :
            b.trend === "down" ? TrendingDown :
                Minus;

    const trendColor =
        b.trend === "up" ? "text-rose-500" :
            b.trend === "down" ? "text-emerald-500" :
                "text-blue-500";

    const peakScore = Math.max(...chartData.map(w => w.score));
    const peakPoint = chartData.find(w => w.score === peakScore);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl bg-white border border-gray-300 shadow-xl shadow-gray-300/50 p-5"
        >
            {/* Ambient glow blobs */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-100/50 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-indigo-100/50 blur-3xl" />

            <div className="relative">
                {/* ── Header & Toggles ── */}
                <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`rounded-xl p-2.5 ring-1 ${colors.iconBg} ${colors.iconRing}`}>
                            <Activity size={18} className={colors.text} />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-slate-800 leading-tight">
                                Burnout Index Chart
                            </h3>
                            <p className="mt-0.5 text-[11px] text-slate-500 flex items-center gap-1">
                                <Calendar size={10} /> Track your workload intensity over time
                            </p>
                        </div>
                    </div>

                    <div className="flex bg-gray-100/80 p-1 rounded-lg ring-1 ring-gray-200">
                        {(["day", "week", "month"] as ViewMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${viewMode === mode
                                        ? "bg-white text-blue-600 shadow-sm ring-1 ring-gray-200"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-gray-200/50"
                                    }`}
                            >
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── KPI Stats Row ── */}
                <div className="mb-4 grid grid-cols-3 gap-2">
                    <div className={`rounded-xl ${colors.scoreBg} border border-gray-200 px-3 py-3 text-center`}>
                        <p className={`text-xl font-bold ${colors.scoreText}`}>{currentPoint.score}</p>
                        <p className="mt-0.5 text-[10px] text-slate-600 font-medium">
                            {viewMode === "day" ? "Today's Workload" : viewMode === "week" ? "This Week" : "This Month"}
                        </p>
                    </div>

                    <div className="rounded-xl bg-blue-50 border border-blue-100 px-3 py-3 text-center">
                        <p className={`text-xl font-bold text-blue-700`}>
                            {nextPoint ? nextPoint.score : "N/A"}
                        </p>
                        <p className="mt-0.5 text-[10px] text-blue-600 font-medium">
                            {viewMode === "day" ? "Tomorrow" : viewMode === "week" ? "Next Week" : "Next Month"}
                        </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-3 text-center">
                        <p className="text-xl font-bold text-slate-700">{peakScore}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500 font-medium">Peak {peakPoint ? `(${peakPoint.label})` : ""}</p>
                    </div>
                </div>

                {/* ── Insights ── */}
                <div className="mb-3 space-y-2">
                    {b.isCriticalWeek && viewMode === "week" && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 shadow-sm"
                        >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 ring-1 ring-rose-500/25">
                                <AlertTriangle size={13} className="text-rose-600" />
                            </div>
                            <p className="text-[11px] font-medium text-rose-700">
                                Critical workload this week! Consider redistributing your pending tasks.
                            </p>
                        </motion.div>
                    )}

                    {nextPoint && nextPoint.score > currentPoint.score + 15 && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 shadow-sm"
                        >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 ring-1 ring-amber-500/25">
                                <TrendingUp size={13} className="text-amber-600" />
                            </div>
                            <p className="text-[11px] font-medium text-amber-700">
                                Prepare for a workload spike <strong>{nextPoint.label.toLowerCase()}</strong> ({nextPoint.score}/100 score).
                            </p>
                        </motion.div>
                    )}
                </div>

                {/* ── Chart ── */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white via-blue-50/30 to-slate-50 border border-slate-200 p-3 shadow-inner">
                    <WorkloadChart data={chartData} level={currentPoint.level} />
                </div>

                {/* ── Legend ── */}
                <div className="mt-3 flex flex-wrap items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />Light (&le; 40)</span>
                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" />Moderate (41–70)</span>
                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" />Heavy (&gt; 70)</span>
                    </div>
                </div>

                {/* ── AI Insight ── */}
                <div className="mt-4 relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-4 shadow-md shadow-blue-900/20">
                    <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
                    <div className="relative flex items-start gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25">
                            <Brain size={15} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-blue-200 tracking-wider uppercase">AI Analysis</p>
                            <p className="mt-1 text-[13px] leading-relaxed text-white/95">
                                {b.aiInsight}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
