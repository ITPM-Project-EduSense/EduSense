"use client";

import { useState, useEffect } from "react";
import {
    ShieldCheck,
    ShieldAlert,
    ShieldX,
    Clock,
    GraduationCap,
    Flame,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Info,
    Minus,
} from "lucide-react";
import { motion } from "framer-motion";
import { kpiData } from "./analyticsData";
import { apiFetch } from "@/lib/api";
import {
    calculateAcademicRisk,
    type AcademicRiskResult,
    type RiskTask,
    type BurnoutLevel,
} from "@/lib/academicRiskEngine";
import {
    calculateBurnout,
    type BurnoutResult,
    type BurnoutTask,
} from "@/lib/burnoutEngine";
import {
    calculateDeadlineRisk,
    type DeadlineRiskResult,
    type DeadlineRiskLevel,
    type DeadlineTask,
} from "@/lib/deadlineRiskEngine";

// ── Shared colour maps ────────────────────────────────────────────────────────

const riskConfig = {
    Safe: {
        topStripe:  "bg-gradient-to-r from-emerald-400 to-teal-500",
        iconBg:     "bg-emerald-500/15",
        iconRing:   "ring-emerald-500/25",
        text:       "text-emerald-400",
        bar:        "bg-gradient-to-r from-emerald-400 to-teal-400",
        glow:       "shadow-emerald-500/30",
        badge:      "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25",
        subRisk:    "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        icon:       ShieldCheck,
    },
    Warning: {
        topStripe:  "bg-gradient-to-r from-amber-400 to-orange-400",
        iconBg:     "bg-amber-500/15",
        iconRing:   "ring-amber-500/25",
        text:       "text-amber-400",
        bar:        "bg-gradient-to-r from-amber-400 to-orange-400",
        glow:       "shadow-amber-500/30",
        badge:      "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25",
        subRisk:    "border-amber-500/30 bg-amber-500/10 text-amber-400",
        icon:       ShieldAlert,
    },
    Critical: {
        topStripe:  "bg-gradient-to-r from-rose-400 to-red-500",
        iconBg:     "bg-rose-500/15",
        iconRing:   "ring-rose-500/25",
        text:       "text-rose-400",
        bar:        "bg-gradient-to-r from-rose-400 to-red-400",
        glow:       "shadow-rose-500/30",
        badge:      "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/25",
        subRisk:    "border-rose-500/30 bg-rose-500/10 text-rose-400",
        icon:       ShieldX,
    },
};

const dlColors: Record<DeadlineRiskLevel, {
    topStripe: string; iconBg: string; iconRing: string;
    text: string; bar: string; glow: string; badge: string;
}> = {
    Low: {
        topStripe: "bg-gradient-to-r from-emerald-400 to-teal-500",
        iconBg:    "bg-emerald-500/15", iconRing: "ring-emerald-500/25",
        text:      "text-emerald-400",  bar: "bg-gradient-to-r from-emerald-400 to-teal-400",
        glow:      "shadow-emerald-500/30", badge: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25",
    },
    Moderate: {
        topStripe: "bg-gradient-to-r from-amber-400 to-orange-400",
        iconBg:    "bg-amber-500/15",   iconRing: "ring-amber-500/25",
        text:      "text-amber-400",    bar: "bg-gradient-to-r from-amber-400 to-orange-400",
        glow:      "shadow-amber-500/30", badge: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25",
    },
    High: {
        topStripe: "bg-gradient-to-r from-rose-400 to-red-500",
        iconBg:    "bg-rose-500/15",    iconRing: "ring-rose-500/25",
        text:      "text-rose-400",     bar: "bg-gradient-to-r from-rose-400 to-red-400",
        glow:      "shadow-rose-500/30", badge: "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/25",
    },
};

const burnoutCfg = {
    High:   { topStripe: "bg-gradient-to-r from-rose-400 to-red-500",    iconBg: "bg-rose-500/15",    iconRing: "ring-rose-500/25",    text: "text-rose-400",    bar: "bg-gradient-to-r from-rose-400 to-red-400",    glow: "shadow-rose-500/30",    badge: "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/25"    },
    Medium: { topStripe: "bg-gradient-to-r from-amber-400 to-orange-400", iconBg: "bg-amber-500/15",  iconRing: "ring-amber-500/25",  text: "text-amber-400",  bar: "bg-gradient-to-r from-amber-400 to-orange-400", glow: "shadow-amber-500/30", badge: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25" },
    Low:    { topStripe: "bg-gradient-to-r from-emerald-400 to-teal-500", iconBg: "bg-emerald-500/15", iconRing: "ring-emerald-500/25", text: "text-emerald-400", bar: "bg-gradient-to-r from-emerald-400 to-teal-400", glow: "shadow-emerald-500/30", badge: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25" },
};

// ── Animation variants ────────────────────────────────────────────────────────

const cardVariants = {
    hidden:  { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
    }),
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
    return (
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 border border-blue-400/30 shadow-xl shadow-blue-900/30">
            <div className="h-1 w-full animate-pulse bg-blue-600/60" />
            <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <div className="h-3 w-28 animate-pulse rounded bg-blue-700/60" />
                        <div className="h-8 w-20 animate-pulse rounded bg-blue-700/60" />
                    </div>
                    <div className="h-10 w-10 animate-pulse rounded-xl bg-blue-700/60" />
                </div>
                <div className="h-2 w-full animate-pulse rounded-full bg-blue-700/60" />
                <div className="space-y-1.5">
                    <div className="h-3 w-full animate-pulse rounded bg-blue-700/40" />
                    <div className="h-3 w-3/4 animate-pulse rounded bg-blue-700/40" />
                </div>
            </div>
        </div>
    );
}

// ── Dark card shell ───────────────────────────────────────────────────────────

function CardShell({ topStripe, glow, children }: {
    topStripe: string;
    glow: string;
    children: React.ReactNode;
}) {
    return (
        <div className={`flex h-full flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 border border-blue-400/35 shadow-xl ${glow} shadow-lg`}>
            <div className={`h-1 w-full shrink-0 ${topStripe}`} />
            <div className="flex flex-1 flex-col p-5">{children}</div>
        </div>
    );
}

// ── Academic Risk Card ────────────────────────────────────────────────────────

function AcademicRiskCard({ data, loading }: { data: AcademicRiskResult | null; loading: boolean }) {
    const risk     = riskConfig[data?.level ?? "Safe"];
    const RiskIcon = risk.icon;

    if (loading) return <SkeletonCard />;

    return (
        <motion.div
            custom={0} initial="hidden" animate="visible" variants={cardVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="h-full"
        >
            <CardShell topStripe={risk.topStripe} glow={risk.glow}>
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-300/70">
                            Academic Risk Level
                        </p>
                        <div className="mt-2 flex items-baseline gap-2">
                            <p className={`text-2xl font-bold ${risk.text}`}>{data!.level}</p>
                            <span className="text-sm font-semibold text-blue-300/70">{data!.score}/100</span>
                        </div>
                    </div>
                    <div className={`rounded-xl p-2.5 ring-1 ${risk.iconBg} ${risk.iconRing}`}>
                        <RiskIcon size={20} className={risk.text} />
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-blue-900/80">
                    <motion.div
                        initial={{ width: 0 }} animate={{ width: `${data!.score}%` }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                        className={`h-full rounded-full ${risk.bar}`}
                    />
                </div>

                <p className="mt-3 flex-1 text-xs leading-relaxed text-blue-100/70">{data!.explanation}</p>

                <div className="mt-3 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${risk.badge}`}>
                        {data!.dominantFactor}
                    </span>
                    <div className="group relative ml-auto">
                        <Info size={13} className="cursor-help text-blue-400/50 transition-colors hover:text-blue-300" />
                        <div className="invisible absolute bottom-full right-0 z-20 mb-2 w-56 rounded-xl bg-blue-950 border border-blue-400/30 px-3 py-2.5 text-xs leading-relaxed text-blue-100 shadow-xl group-hover:visible">
                            {data?.tooltip ?? "Calculated using: Missed Deadlines (25%), Upcoming Workload (20%), Performance Trend (20%), Delay Consistency (20%), Burnout Level (15%)."}
                            <span className="absolute right-3 top-full border-4 border-transparent border-t-blue-950" />
                        </div>
                    </div>
                </div>

                {data!.subjectBreakdowns.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5 border-t border-blue-400/20 pt-3">
                        {data!.subjectBreakdowns.map((s) => (
                            <span key={s.subject}
                                title={`${s.subject}: score ${s.riskScore}/100`}
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                                    s.riskScore >= 61 ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                                    : s.riskScore >= 31 ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                }`}
                            >
                                {s.subject} · {s.riskScore}
                            </span>
                        ))}
                    </div>
                )}
            </CardShell>
        </motion.div>
    );
}

// ── Deadline Risk Card ────────────────────────────────────────────────────────

function DeadlineRiskCard({ data, loading }: { data: DeadlineRiskResult | null; loading: boolean }) {
    const level  = data?.level ?? "Low";
    const colors = dlColors[level];

    if (loading) return <SkeletonCard />;

    return (
        <motion.div
            custom={1} initial="hidden" animate="visible" variants={cardVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="h-full"
        >
            <CardShell topStripe={colors.topStripe} glow={colors.glow}>
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-300/70">
                            Predictive Deadline Risk
                        </p>
                        <div className="mt-2 flex items-baseline gap-2">
                            <p className={`text-2xl font-bold ${colors.text}`}>{data!.probability}%</p>
                            <span className="text-xs font-medium text-blue-300/70">of delay</span>
                        </div>
                    </div>
                    <div className={`rounded-xl p-2.5 ring-1 ${colors.iconBg} ${colors.iconRing}`}>
                        <Clock size={20} className={colors.text} />
                    </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-blue-900/80">
                    <motion.div
                        initial={{ width: 0 }} animate={{ width: `${data!.probability}%` }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                        className={`h-full rounded-full ${colors.bar}`}
                    />
                </div>

                <p className="mt-3 flex-1 text-xs leading-relaxed text-blue-100/70">{data!.explanation}</p>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {data!.dominantFactor !== "None" && (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${colors.badge}`}>
                            {data!.dominantFactor}
                        </span>
                    )}
                    {data?.level === "High" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-medium text-rose-400 ring-1 ring-rose-500/25">
                            <AlertTriangle size={11} /> Above threshold
                        </span>
                    )}
                    <div className="group relative ml-auto shrink-0">
                        <Info size={13} className="cursor-help text-blue-400/50 transition-colors hover:text-blue-300" />
                        <div className="invisible absolute bottom-full right-0 z-20 mb-2 w-56 rounded-xl bg-blue-950 border border-blue-400/30 px-3 py-2.5 text-xs leading-relaxed text-blue-100 shadow-xl group-hover:visible">
                            {data?.tooltip ?? TOOLTIP_FALLBACK}
                            <span className="absolute right-3 top-full border-4 border-transparent border-t-blue-950" />
                        </div>
                    </div>
                </div>

                {data!.topRiskyTasks.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5 border-t border-blue-400/20 pt-3">
                        {data!.topRiskyTasks.map((t) => (
                            <span key={t.taskId}
                                title={`${t.title} (${t.subject}) — ${t.daysRemaining <= 0 ? "overdue" : `${t.daysRemaining.toFixed(1)} days left`} · score ${t.riskScore}/100`}
                                className={`inline-flex cursor-default items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                                    t.level === "High"     ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                                    : t.level === "Moderate" ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                }`}
                            >
                                {t.subject} · {t.riskScore}
                            </span>
                        ))}
                        <span className="self-center text-[10px] text-blue-300/60">
                            top-3 of {data!.upcomingCount}
                        </span>
                    </div>
                )}
            </CardShell>
        </motion.div>
    );
}

const TOOLTIP_FALLBACK =
    "Calculated using: Deadline Proximity (30 %), Past Delay Behaviour (25 %), " +
    "Workload Pressure (20 %), Task Difficulty (15 %), Burnout Influence (10 %).";

// ── GPA Prediction Card ───────────────────────────────────────────────────────

function GpaPredictionCard() {
    const { gpaPrediction } = kpiData;
    return (
        <motion.div
            custom={2} initial="hidden" animate="visible" variants={cardVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="h-full"
        >
            <CardShell topStripe="bg-gradient-to-r from-blue-400 to-indigo-500" glow="shadow-blue-500/20">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-300/70">
                            GPA Prediction
                        </p>
                        <div className="mt-2 flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-white">{gpaPrediction.value}</p>
                            <span className="text-sm font-medium text-blue-300/70">/ {gpaPrediction.max.toFixed(1)}</span>
                        </div>
                    </div>
                    <div className="rounded-xl bg-blue-500/15 p-2.5 ring-1 ring-blue-500/25">
                        <GraduationCap size={20} className="text-blue-400" />
                    </div>
                </div>

                {/* GPA bar */}
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-blue-900/80">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(gpaPrediction.value / gpaPrediction.max) * 100}%` }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500"
                    />
                </div>

                <p className="mt-3 flex-1 text-xs text-blue-100/70">Overall predicted GPA this semester</p>

                <div className="mt-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        gpaPrediction.direction === "up"
                            ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25"
                            : "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/25"
                    }`}>
                        {gpaPrediction.direction === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {gpaPrediction.trend} from last semester
                    </span>
                </div>
            </CardShell>
        </motion.div>
    );
}

// ── Burnout Index Card ────────────────────────────────────────────────────────

function BurnoutIndexCard({ data, loading }: { data: BurnoutResult | null; loading: boolean }) {
    const level  = data?.level ?? "Low";
    const colors = burnoutCfg[level];

    const TrendIcon  = data?.trend === "up" ? TrendingUp : data?.trend === "down" ? TrendingDown : Minus;
    const trendColor = data?.trend === "up" ? "text-rose-400" : data?.trend === "down" ? "text-emerald-400" : "text-slate-500";
    const trendLabel = data?.trend === "up" ? "Rising" : data?.trend === "down" ? "Falling" : "Stable";

    if (loading) return <SkeletonCard />;

    return (
        <motion.div
            custom={3} initial="hidden" animate="visible" variants={cardVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="h-full"
        >
            <CardShell topStripe={colors.topStripe} glow={colors.glow}>
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-300/70">
                            Burnout Index
                        </p>
                        <div className="mt-2 flex items-baseline gap-2">
                            <p className={`text-2xl font-bold ${colors.text}`}>{level}</p>
                            <span className="text-sm font-semibold text-blue-300/70">{data!.score}/100</span>
                        </div>
                    </div>
                    <div className={`rounded-xl p-2.5 ring-1 ${colors.iconBg} ${colors.iconRing}`}>
                        <Flame size={20} className={colors.text} />
                    </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-blue-900/80">
                    <motion.div
                        initial={{ width: 0 }} animate={{ width: `${data!.score}%` }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                        className={`h-full rounded-full ${colors.bar}`}
                    />
                </div>

                <div className="mt-3 flex flex-1 items-start gap-1.5">
                    <TrendIcon size={13} className={trendColor} />
                    <span className="text-xs text-blue-100/70">{trendLabel} this week</span>
                </div>

                {data!.dominantFactor !== "None" && (
                    <span className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${colors.badge}`}>
                        {data!.dominantFactor}
                    </span>
                )}

                {data!.isCriticalWeek && (
                    <div className="mt-3 flex animate-pulse items-center gap-1.5 rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-400 ring-1 ring-rose-500/25 w-fit">
                        <AlertTriangle size={12} /> Critical Week Alert
                    </div>
                )}
            </CardShell>
        </motion.div>
    );
}

// ── Main KpiCards ─────────────────────────────────────────────────────────────

export default function KpiCards() {
    const [riskData,         setRiskData]         = useState<AcademicRiskResult | null>(null);
    const [burnoutData,      setBurnoutData]      = useState<BurnoutResult | null>(null);
    const [deadlineRiskData, setDeadlineRiskData] = useState<DeadlineRiskResult | null>(null);
    const [loading,          setLoading]          = useState(true);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                const raw   = await apiFetch("/tasks");
                const tasks = Array.isArray(raw) ? raw : [];

                const burnout      = calculateBurnout(tasks as BurnoutTask[]);
                const deadlineRisk = calculateDeadlineRisk(tasks as DeadlineTask[], burnout.score);
                const risk         = calculateAcademicRisk(tasks as RiskTask[], burnout.level as BurnoutLevel);

                if (!cancelled) {
                    setBurnoutData(burnout);
                    setDeadlineRiskData(deadlineRisk);
                    setRiskData(risk);
                }
            } catch {
                if (!cancelled) {
                    const emptyBurnout = calculateBurnout([]);
                    setBurnoutData(emptyBurnout);
                    setDeadlineRiskData(calculateDeadlineRisk([], 0));
                    setRiskData({
                        score: 0, level: "Safe",
                        explanation: "Unable to fetch task data for risk calculation.",
                        tooltip: "", dominantFactor: "N/A",
                        factorBreakdown: { A: 0, B: 0, C: 0, D: 0, E: 0 },
                        subjectBreakdowns: [],
                    });
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, []);

    return (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AcademicRiskCard    data={riskData}         loading={loading} />
            <DeadlineRiskCard    data={deadlineRiskData} loading={loading} />
            <GpaPredictionCard />
            <BurnoutIndexCard    data={burnoutData}      loading={loading} />
        </section>
    );
}
