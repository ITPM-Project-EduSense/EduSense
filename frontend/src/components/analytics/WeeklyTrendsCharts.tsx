"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import {
    weekLabels,
    taskCompletionTrend,
    missedDeadlinesTrend,
    studyHoursTrend,
    productivityTrend,
} from "./analyticsData";

/* ── Helper: Build SVG polyline points ── */
function toPolyline(data: number[], width: number, height: number, padding = 20) {
    const max = Math.max(...data, 1);
    const stepX = (width - padding * 2) / (data.length - 1);
    return data
        .map((v, i) => `${padding + i * stepX},${height - padding - (v / max) * (height - padding * 2)}`)
        .join(" ");
}

/* ── Mini line chart ── */
function MiniLineChart({ data, color, gradId, label }: {
    data: number[];
    color: string;
    gradId: string;
    label: string;
}) {
    const W = 320;
    const H = 110;
    const points = toPolyline(data, W, H);
    const max = Math.max(...data, 1);
    const stepX = (W - 40) / (data.length - 1);

    return (
        <div>
            <p className="mb-2 text-xs font-semibold text-slate-600">{label}</p>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                    </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0.25, 0.5, 0.75].map((r) => (
                    <line
                        key={r}
                        x1={20} y1={H - 20 - r * (H - 40)}
                        x2={W - 20} y2={H - 20 - r * (H - 40)}
                        stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4"
                    />
                ))}

                {/* Area fill */}
                <polygon
                    points={`${points} ${W - 20},${H - 20} 20,${H - 20}`}
                    fill={`url(#${gradId})`}
                />

                {/* Line */}
                <polyline
                    points={points} fill="none"
                    stroke={color} strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                />

                {/* Dots */}
                {data.map((v, i) => {
                    const cx = 20 + i * stepX;
                    const cy = H - 20 - (v / max) * (H - 40);
                    return (
                        <circle key={i} cx={cx} cy={cy} r="3.5"
                            fill={color} stroke="#ffffff" strokeWidth="2" />
                    );
                })}

                {/* X labels */}
                {weekLabels.map((l, i) => (
                    <text key={l} x={20 + i * stepX} y={H - 4}
                        textAnchor="middle" fill="#64748B" fontSize="10">
                        {l}
                    </text>
                ))}
            </svg>
        </div>
    );
}

/* ── Mini bar chart ── */
function MiniBarChart({ data, color, label }: {
    data: number[];
    color: string;
    label: string;
}) {
    const W = 320;
    const H = 110;
    const max = Math.max(...data, 1);
    const barW = (W - 40) / data.length - 8;

    return (
        <div>
            <p className="mb-2 text-xs font-semibold text-slate-600">{label}</p>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                {/* Grid lines */}
                {[0.33, 0.66].map((r) => (
                    <line
                        key={r}
                        x1={20} y1={H - 20 - r * (H - 40)}
                        x2={W - 20} y2={H - 20 - r * (H - 40)}
                        stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4"
                    />
                ))}

                {data.map((v, i) => {
                    const barH = (v / max) * (H - 40);
                    const x = 20 + i * ((W - 40) / data.length) + 4;
                    const y = H - 20 - barH;
                    return (
                        <g key={i}>
                            <rect x={x} y={y} width={barW} height={barH} rx={4}
                                fill={color} fillOpacity="0.8" />
                            <text x={x + barW / 2} y={H - 4}
                                textAnchor="middle" fill="#64748B" fontSize="10">
                                {weekLabels[i]}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

/* ── Dual line chart ── */
function DualLineChart({ data1, data2, color1, color2, label1, label2, title }: {
    data1: number[]; data2: number[];
    color1: string; color2: string;
    label1: string; label2: string;
    title: string;
}) {
    const W = 320;
    const H = 110;
    const allMax = Math.max(...data1, ...data2, 1);
    const norm1 = data1.map((v) => (v / allMax) * 100);
    const norm2 = data2.map((v) => (v / allMax) * 100);
    const points1 = toPolyline(norm1, W, H);
    const points2 = toPolyline(norm2, W, H);

    return (
        <div>
            <div className="mb-2 flex items-center gap-4">
                <p className="text-xs font-semibold text-slate-600">{title}</p>
                <div className="flex items-center gap-3 ml-auto">
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        <span className="inline-block h-2 w-4 rounded-sm" style={{ background: color1 }} />
                        {label1}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-blue-300/60">
                        <span className="inline-block h-2 w-4 rounded-sm border-t-2 border-dashed" style={{ borderColor: color2, background: "transparent" }} />
                        {label2}
                    </span>
                </div>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                {[0.25, 0.5, 0.75].map((r) => (
                    <line
                        key={r}
                        x1={20} y1={H - 20 - r * (H - 40)}
                        x2={W - 20} y2={H - 20 - r * (H - 40)}
                        stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4"
                    />
                ))}
                <polyline points={points1} fill="none" stroke={color1}
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points={points2} fill="none" stroke={color2}
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    strokeDasharray="6 3" />
                {weekLabels.map((l, i) => {
                    const stepX = (W - 40) / (weekLabels.length - 1);
                    return (
                        <text key={l} x={20 + i * stepX} y={H - 4}
                            textAnchor="middle" fill="#64748B" fontSize="10">
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
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-blue-50 to-white border border-blue-200 shadow-xl shadow-blue-200/50 p-5"
        >
            {/* Ambient blob */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-200/30 blur-3xl" />

            <div className="relative">
                <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-xl bg-blue-100 p-2 ring-1 ring-blue-200">
                        <TrendingUp size={16} className="text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-slate-800">Weekly Performance Trends</h3>
                        <p className="text-[11px] text-slate-500">Last 7 days overview</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <MiniLineChart
                        data={taskCompletionTrend}
                        color="#60A5FA"
                        gradId="taskGrad"
                        label="Task Completion"
                    />
                    <div className="border-t border-blue-200 pt-5">
                        <MiniBarChart
                            data={missedDeadlinesTrend}
                            color="#F87171"
                            label="Missed Deadlines"
                        />
                    </div>
                    <div className="border-t border-blue-400/20 pt-5">
                        <DualLineChart
                            data1={studyHoursTrend}
                            data2={productivityTrend}
                            color1="#818CF8"
                            color2="#34D399"
                            label1="Study Hours"
                            label2="Productivity"
                            title="Study Hours vs Productivity"
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
