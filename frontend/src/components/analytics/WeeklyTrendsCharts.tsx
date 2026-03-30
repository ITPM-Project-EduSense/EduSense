"use client";

import { motion } from "framer-motion";
import { TrendingUp, BarChart3, Clock, Target, AlertTriangle } from "lucide-react";
import {
    weekLabels,
    taskCompletionTrend,
    missedDeadlinesTrend,
    studyHoursTrend,
    productivityTrend,
} from "./analyticsData";

/* ── Helper: Build SVG polyline points ── */
function toPolyline(data: number[], width: number, height: number, padding = 24) {
    const max = Math.max(...data, 1);
    const stepX = (width - padding * 2) / (data.length - 1);
    return data
        .map((v, i) => `${padding + i * stepX},${height - padding - (v / max) * (height - padding * 2)}`)
        .join(" ");
}

/* ── Mini line chart (dark bg — inside gradient container) ── */
function MiniLineChart({ data, color, gradId, label }: {
    data: number[];
    color: string;
    gradId: string;
    label: string;
}) {
    const W = 320;
    const H = 120;
    const PAD = 24;
    const points = toPolyline(data, W, H, PAD);
    const max = Math.max(...data, 1);
    const stepX = (W - PAD * 2) / (data.length - 1);
    const latest = data[data.length - 1];
    const prev = data[data.length - 2] ?? latest;
    const diff = latest - prev;

    return (
        <div>
            <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-blue-100">{label}</p>
                <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white">{latest}</span>
                    {diff !== 0 && (
                        <span className={`text-[10px] font-medium ${diff > 0 ? "text-emerald-300" : "text-rose-300"}`}>
                            {diff > 0 ? "↑" : "↓"}{Math.abs(diff)}
                        </span>
                    )}
                </div>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.35" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                    </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0.25, 0.5, 0.75].map((r) => (
                    <line
                        key={r}
                        x1={PAD} y1={H - PAD - r * (H - PAD * 2)}
                        x2={W - PAD} y2={H - PAD - r * (H - PAD * 2)}
                        stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 4"
                    />
                ))}

                {/* Area fill */}
                <polygon
                    points={`${points} ${W - PAD},${H - PAD} ${PAD},${H - PAD}`}
                    fill={`url(#${gradId})`}
                />

                {/* Line */}
                <motion.polyline
                    points={points} fill="none"
                    stroke={color} strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />

                {/* Dots */}
                {data.map((v, i) => {
                    const cx = PAD + i * stepX;
                    const cy = H - PAD - (v / max) * (H - PAD * 2);
                    return (
                        <g key={i}>
                            <circle cx={cx} cy={cy} r="3.5"
                                fill={color} stroke="rgba(255,255,255,0.9)" strokeWidth="2" />
                            <text x={cx} y={cy - 8}
                                textAnchor="middle" fontSize="8" fontWeight="600"
                                fill="rgba(255,255,255,0.7)">{v}</text>
                        </g>
                    );
                })}

                {/* X labels */}
                {weekLabels.map((l, i) => (
                    <text key={l} x={PAD + i * stepX} y={H - 6}
                        textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">
                        {l}
                    </text>
                ))}
            </svg>
        </div>
    );
}

/* ── Mini bar chart (dark bg — inside gradient container) ── */
function MiniBarChart({ data, color, label }: {
    data: number[];
    color: string;
    label: string;
}) {
    const W = 320;
    const H = 120;
    const PAD = 24;
    const max = Math.max(...data, 1);
    const barW = (W - PAD * 2) / data.length - 6;
    const total = data.reduce((a, b) => a + b, 0);

    return (
        <div>
            <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-blue-100">{label}</p>
                <span className={`text-sm font-bold ${total === 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {total} total
                </span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                {/* Grid lines */}
                {[0.33, 0.66].map((r) => (
                    <line
                        key={r}
                        x1={PAD} y1={H - PAD - r * (H - PAD * 2)}
                        x2={W - PAD} y2={H - PAD - r * (H - PAD * 2)}
                        stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 4"
                    />
                ))}

                {data.map((v, i) => {
                    const barH = (v / max) * (H - PAD * 2);
                    const x = PAD + i * ((W - PAD * 2) / data.length) + 3;
                    const y = H - PAD - barH;
                    return (
                        <g key={i}>
                            <rect x={x} y={y} width={barW} height={barH} rx={4}
                                fill={v === 0 ? "rgba(255,255,255,0.1)" : color} fillOpacity={v === 0 ? 1 : 0.85} />
                            {v > 0 && (
                                <text x={x + barW / 2} y={y - 5}
                                    textAnchor="middle" fontSize="8" fontWeight="600"
                                    fill="rgba(255,255,255,0.7)">{v}</text>
                            )}
                            <text x={x + barW / 2} y={H - 6}
                                textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">
                                {weekLabels[i]}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

/* ── Dual line chart (dark bg — inside gradient container) ── */
function DualLineChart({ data1, data2, color1, color2, label1, label2, title }: {
    data1: number[]; data2: number[];
    color1: string; color2: string;
    label1: string; label2: string;
    title: string;
}) {
    const W = 320;
    const H = 120;
    const PAD = 24;
    const allMax = Math.max(...data1, ...data2, 1);
    const norm1 = data1.map((v) => (v / allMax) * 100);
    const norm2 = data2.map((v) => (v / allMax) * 100);
    const points1 = toPolyline(norm1, W, H, PAD);
    const points2 = toPolyline(norm2, W, H, PAD);

    return (
        <div>
            <div className="mb-2 flex items-center gap-4">
                <p className="text-xs font-semibold text-blue-100">{title}</p>
                <div className="flex items-center gap-3 ml-auto">
                    <span className="flex items-center gap-1 text-[10px] text-blue-200">
                        <span className="inline-block h-2 w-4 rounded-sm" style={{ background: color1 }} />
                        {label1}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-blue-200">
                        <span className="inline-block h-2 w-4 rounded-sm border-t-2 border-dashed" style={{ borderColor: color2, background: "transparent" }} />
                        {label2}
                    </span>
                </div>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                {[0.25, 0.5, 0.75].map((r) => (
                    <line
                        key={r}
                        x1={PAD} y1={H - PAD - r * (H - PAD * 2)}
                        x2={W - PAD} y2={H - PAD - r * (H - PAD * 2)}
                        stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 4"
                    />
                ))}
                <motion.polyline
                    points={points1} fill="none" stroke={color1}
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />
                <motion.polyline
                    points={points2} fill="none" stroke={color2}
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    strokeDasharray="6 3"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                />
                {weekLabels.map((l, i) => {
                    const stepX = (W - PAD * 2) / (weekLabels.length - 1);
                    return (
                        <text key={l} x={PAD + i * stepX} y={H - 6}
                            textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">
                            {l}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
}

/* ── Composed Weekly Trends Section ── */
export default function WeeklyTrendsCharts() {
    const totalTasks = taskCompletionTrend.reduce((a, b) => a + b, 0);
    const totalMissed = missedDeadlinesTrend.reduce((a, b) => a + b, 0);
    const avgStudy = (studyHoursTrend.reduce((a, b) => a + b, 0) / studyHoursTrend.length).toFixed(1);
    const avgProductivity = Math.round(productivityTrend.reduce((a, b) => a + b, 0) / productivityTrend.length);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl bg-white border border-gray-300 shadow-xl shadow-gray-300/50 p-5"
        >
            {/* Ambient glow blobs */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gray-300/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-gray-300/30 blur-3xl" />

            <div className="relative">
                {/* ── Header ── */}
                <div className="mb-5 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-500/15 p-2.5 ring-1 ring-blue-500/25">
                            <TrendingUp size={18} className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-slate-800 leading-tight">
                                Weekly Performance Trends
                            </h3>
                            <p className="mt-0.5 text-[11px] text-slate-500">Last 7 days overview</p>
                        </div>
                    </div>

                    {/* Live indicator */}
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 ring-1 ring-emerald-300">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                        <span className="text-[10px] font-medium text-emerald-700">Live</span>
                    </div>
                </div>

                {/* ── KPI Stats Row ── */}
                <div className="mb-4 grid grid-cols-4 gap-2">
                    <div className="rounded-xl bg-blue-50 border border-gray-200 px-2.5 py-3 text-center">
                        <p className="text-lg font-bold text-blue-600">{totalTasks}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">Tasks Done</p>
                    </div>
                    <div className={`rounded-xl ${totalMissed > 0 ? "bg-rose-50" : "bg-emerald-50"} border border-gray-200 px-2.5 py-3 text-center`}>
                        <p className={`text-lg font-bold ${totalMissed > 0 ? "text-rose-600" : "text-emerald-600"}`}>{totalMissed}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">Missed</p>
                    </div>
                    <div className="rounded-xl bg-indigo-50 border border-gray-200 px-2.5 py-3 text-center">
                        <p className="text-lg font-bold text-indigo-600">{avgStudy}h</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">Avg Study</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 border border-gray-200 px-2.5 py-3 text-center">
                        <p className="text-lg font-bold text-emerald-600">{avgProductivity}%</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">Productivity</p>
                    </div>
                </div>

                {/* ── Charts (inside gradient containers) ── */}
                <div className="space-y-4">
                    {/* Task Completion */}
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 p-3 shadow-lg shadow-blue-900/30">
                        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-indigo-400/10 blur-3xl" />
                        <div className="relative">
                            <MiniLineChart
                                data={taskCompletionTrend}
                                color="#60A5FA"
                                gradId="taskGrad"
                                label="Task Completion"
                            />
                        </div>
                    </div>

                    {/* Missed Deadlines */}
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 p-3 shadow-lg shadow-blue-900/30">
                        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-indigo-400/10 blur-3xl" />
                        <div className="relative">
                            <MiniBarChart
                                data={missedDeadlinesTrend}
                                color="#e42121ff"
                                label="Missed Deadlines"
                            />
                        </div>
                    </div>

                    {/* Study Hours vs Productivity */}
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 p-3 shadow-lg shadow-blue-900/30">
                        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-indigo-400/10 blur-3xl" />
                        <div className="relative">
                            <DualLineChart
                                data1={studyHoursTrend}
                                data2={productivityTrend}
                                color1="#5f6ad0ff"
                                color2="#35d69bff"
                                label1="Study Hours"
                                label2="Productivity"
                                title="Study Hours vs Productivity"
                            />
                        </div>
                    </div>
                </div>

                {/* ── Legend ── */}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-400" />Task Completion</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" />Missed Deadlines</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-400" />Study Hours</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />Productivity</span>
                </div>
            </div>
        </motion.div>
    );
}
