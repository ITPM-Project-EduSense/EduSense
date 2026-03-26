"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, TrendingDown, Minus, Zap, Flame, Activity, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
    calculateBurnout,
    type BurnoutResult,
    type BurnoutTask,
    type BurnoutLevel,
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
        scoreText: "text-emerald-600",
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
        scoreText: "text-amber-600",
    },
    High: {
        stroke: "#F87171",
        gradStart: "#F87171",
        badge: "bg-rose-500/15 text-rose-600 ring-1 ring-rose-500/25",
        text: "text-rose-600",
        dot: "#F87171",
        iconBg: "bg-rose-500/15",
        iconRing: "ring-rose-500/25",
        scoreBg: "bg-rose-50",
        scoreText: "text-rose-600",
    },
};

function pointColor(score: number): string {
    if (score > 70) return "#F87171";
    if (score > 40) return "#F59E0B";
    return "#34D399";
}

// ── SVG Chart ─────────────────────────────────────────────────────────────────

function BurnoutChart({ burnout }: { burnout: BurnoutResult }) {
    const W = 440;
    const H = 200;
    const PAD = 32;
    const usableW = W - PAD * 2;
    const usableH = H - PAD * 2;

    const trend = burnout.weeklyTrend;
    const stepX = trend.length > 1 ? usableW / (trend.length - 1) : usableW;
    const level = burnout.level;
    const colors = LEVEL_COLOR[level];
    const gradId = `burnoutGrad_${level}`;

    const points = trend.map((w, i) => ({
        x: PAD + i * stepX,
        y: H - PAD - (Math.min(100, w.score) / 100) * usableH,
        ...w,
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
                    <stop offset="0%" stopColor={colors.gradStart} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={colors.gradStart} stopOpacity="0.02" />
                </linearGradient>
            </defs>

            {/* Zone bands */}
            <rect x={PAD} y={H - PAD - (100 / 100) * usableH}
                width={usableW} height={(30 / 100) * usableH}
                fill="rgba(248,113,113,0.08)" rx={4} />
            <rect x={PAD} y={H - PAD - (70 / 100) * usableH}
                width={usableW} height={(30 / 100) * usableH}
                fill="rgba(245,158,11,0.06)" rx={4} />
            <rect x={PAD} y={H - PAD - (40 / 100) * usableH}
                width={usableW} height={(40 / 100) * usableH}
                fill="rgba(52,211,153,0.05)" rx={4} />

            {/* Grid lines */}
            {[25, 40, 70, 75].map((v) => {
                const y = H - PAD - (v / 100) * usableH;
                const col = v === 40 ? "rgba(52,211,153,0.25)" : v === 70 ? "rgba(248,113,113,0.25)" : "rgba(255,255,255,0.1)";
                return (
                    <g key={v}>
                        <line x1={PAD} y1={y} x2={W - PAD} y2={y}
                            stroke={col} strokeWidth="1" strokeDasharray="4 4" />
                        <text x={PAD - 6} y={y + 4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.5)">
                            {v}
                        </text>
                    </g>
                );
            })}

            {/* Zone labels */}
            <text x={W - PAD + 4} y={H - PAD - (85 / 100) * usableH + 4} fontSize="8" fill="#F87171" fontWeight="700">HIGH</text>
            <text x={W - PAD + 4} y={H - PAD - (55 / 100) * usableH + 4} fontSize="8" fill="#FBBF24" fontWeight="700">MED</text>
            <text x={W - PAD + 4} y={H - PAD - (20 / 100) * usableH + 4} fontSize="8" fill="#34D399" fontWeight="700">LOW</text>

            {/* Critical-week highlight */}
            {burnout.criticalWeekIndex >= 0 && (
                <rect
                    x={points[burnout.criticalWeekIndex].x - stepX * 0.45}
                    y={PAD} width={stepX * 0.9} height={usableH}
                    rx={6} fill="rgba(248,113,113,0.15)"
                />
            )}

            {/* Spike markers */}
            {points.filter((p) => p.isSpike).map((p, i) => (
                <text key={`spike-${i}`} x={p.x} y={p.y - 18}
                    textAnchor="middle" fontSize="9" fill="#FB923C" fontWeight="700">
                    ↑ Spike
                </text>
            ))}

            {/* Area fill */}
            <path d={areaD} fill={`url(#${gradId})`} />

            {/* Curve */}
            <motion.path
                d={pathD} fill="none"
                stroke={colors.stroke} strokeWidth="2.5" strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
            />

            {/* Data points */}
            {points.map((pt, i) => (
                <g key={i}>
                    {pt.isCritical && (
                        <circle cx={pt.x} cy={pt.y} r={10} fill={pointColor(pt.score)} fillOpacity="0.2" />
                    )}
                    <circle
                        cx={pt.x} cy={pt.y}
                        r={i === burnout.criticalWeekIndex ? 5.5 : 3.5}
                        fill={pointColor(pt.score)} stroke="rgba(255,255,255,0.9)" strokeWidth="2"
                    />
                    <text
                        x={pt.x} y={pt.y - 10}
                        textAnchor="middle" fontSize="9"
                        fill="rgba(255,255,255,0.85)" fontWeight="600"
                        opacity={pt.isCritical || pt.isSpike ? 1 : 0.7}
                    >
                        {pt.score}
                    </text>
                </g>
            ))}

            {/* Critical label */}
            {burnout.criticalWeekIndex >= 0 && (
                <text
                    x={points[burnout.criticalWeekIndex].x} y={PAD - 6}
                    textAnchor="middle" fontSize="9" fontWeight="700" fill="#F87171"
                >
                    ⚠ Critical
                </text>
            )}

            {/* X-axis labels */}
            {points.map((pt, i) => (
                <text key={i} x={pt.x} y={H - 8}
                    textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.6)">
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

export default function BurnoutStressChart() {
    const [burnout, setBurnout] = useState<BurnoutResult | null>(null);
    const [loading, setLoading] = useState(true);

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
    const colors = LEVEL_COLOR[b.level];

    const TrendIcon =
        b.trend === "up" ? TrendingUp :
            b.trend === "down" ? TrendingDown :
                Minus;

    const trendLabel = b.trend === "stable" ? "Stable" : b.trend === "up" ? "Rising" : "Falling";
    const trendColor =
        b.trend === "up" ? "text-rose-500" :
            b.trend === "down" ? "text-emerald-500" :
                "text-blue-500";

    const peakScore = Math.max(...b.weeklyTrend.map(w => w.score));
    const peakWeek = b.weeklyTrend.find(w => w.score === peakScore);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl bg-white border border-gray-300 shadow-xl shadow-gray-300/50 p-5"
        >
            {/* Ambient glow blobs */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gray-300/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-gray-300/30 blur-3xl" />

            <div className="relative">
                {/* ── Header ── */}
                <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`rounded-xl p-2.5 ring-1 ${colors.iconBg} ${colors.iconRing}`}>
                            <Flame size={18} className={colors.text} />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-slate-800 leading-tight">
                                Burnout &amp; Stress Trend
                            </h3>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                                6-week rolling burnout index · {b.weeklyTrend.length} weeks
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${colors.badge}`}>
                            {b.level === "High" && "🔴"}
                            {b.level === "Medium" && "🟡"}
                            {b.level === "Low" && "🟢"}
                            {b.level} · {b.score}/100
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${trendColor}`}>
                            <TrendIcon size={11} />
                            {trendLabel}
                        </span>
                    </div>
                </div>

                {/* ── KPI Stats Row ── */}
                <div className="mb-4 grid grid-cols-3 gap-2">
                    <div className={`rounded-xl ${colors.scoreBg} border border-gray-200 px-3 py-3 text-center`}>
                        <p className={`text-xl font-bold ${colors.scoreText}`}>{b.score}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">Burnout Score</p>
                    </div>
                    <div className="rounded-xl bg-blue-50 border border-gray-200 px-3 py-3 text-center">
                        <p className={`text-xl font-bold ${trendColor}`}>
                            {trendLabel}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-500">Trend</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-3 text-center">
                        <p className="text-xl font-bold text-slate-700">{peakScore}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">Peak {peakWeek ? `(${peakWeek.label})` : ""}</p>
                    </div>
                </div>

                {/* ── Critical Week Alert ── */}
                {b.isCriticalWeek && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-3 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5"
                    >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 ring-1 ring-rose-500/25">
                            <AlertTriangle size={13} className="text-rose-500" />
                        </div>
                        <p className="text-xs font-semibold text-rose-600">
                            Critical Week — Burnout risk is high. Consider redistributing your workload.
                        </p>
                    </motion.div>
                )}

                {/* ── Chart (inside gradient container) ── */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-3 shadow-lg shadow-blue-900/30">
                    {/* Ambient blobs inside chart */}
                    <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-indigo-400/10 blur-3xl" />
                    <div className="relative">
                        <BurnoutChart burnout={b} />
                    </div>
                </div>

                {/* ── Legend ── */}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />Low (≤ 40)</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" />Medium (41–70)</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" />High (&gt; 70)</span>
                    <span className="flex items-center gap-1.5"><span className="h-3 w-5 rounded bg-rose-500/20 border border-rose-400/30" />Critical week</span>
                </div>

                {/* ── Subject Breakdown ── */}
                {b.subjectBreakdowns.filter((s) => s.weeklyTaskCount > 0).length > 0 && (
                    <div className="mt-4 border-t border-gray-200 pt-3">
                        <p className="mb-2 text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                            <Activity size={12} className="text-blue-500" />
                            Subject contribution this week
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {b.subjectBreakdowns
                                .filter((s) => s.weeklyTaskCount > 0)
                                .sort((a, b) => b.burnoutScore - a.burnoutScore)
                                .map((s) => {
                                    const lvl = s.burnoutScore > 70 ? "High" : s.burnoutScore > 40 ? "Medium" : "Low";
                                    return (
                                        <span
                                            key={s.subject}
                                            title={`${s.subject}: ${s.weeklyTaskCount} tasks · ${s.estimatedHours.toFixed(1)} h`}
                                            className={`inline-flex cursor-default items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-150 hover:scale-105 ${lvl === "High" ? "border-rose-300 bg-rose-50 text-rose-600"
                                                : lvl === "Medium" ? "border-amber-300 bg-amber-50 text-amber-600"
                                                    : "border-emerald-300 bg-emerald-50 text-emerald-600"
                                                }`}
                                        >
                                            {s.subject}
                                            <span className="font-bold">{s.burnoutScore}</span>
                                        </span>
                                    );
                                })}
                        </div>
                    </div>
                )}

                {/* ── Dominant Factor ── */}
                {b.dominantFactor !== "None" && (
                    <div className="mt-3 flex items-center gap-2">
                        <Zap size={12} className="text-amber-500" />
                        <span className="text-xs text-slate-500">Top stressor:</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors.badge}`}>
                            {b.dominantFactor}
                        </span>
                    </div>
                )}

                {/* ── AI Insight ── */}
                <div className="mt-4 relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-4 shadow-md shadow-blue-900/20">
                    <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
                    <div className="relative flex items-start gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25">
                            <Brain size={15} className="text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-blue-200 tracking-wide uppercase">AI Generated Insight</p>
                            <p className="mt-1 text-sm leading-relaxed text-white/90">
                                {b.aiInsight}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
