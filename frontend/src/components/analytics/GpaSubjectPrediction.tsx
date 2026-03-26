"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, GraduationCap } from "lucide-react";
import { gpaPredictions } from "./analyticsData";

export default function GpaSubjectPrediction() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl bg-white border border-gray-300 shadow-xl shadow-gray-300/50 p-5"
        >
            {/* Ambient glow blobs */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gray-300/30 blur-3xl opacity-60" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-gray-300/30 blur-3xl opacity-60" />

            <div className="relative">
                {/* ── Header ── */}
                <div className="mb-5 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-500/15 p-2.5 ring-1 ring-blue-500/25">
                            <GraduationCap size={18} className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-slate-800 leading-tight">
                                GPA Subject Prediction
                            </h3>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                                Behavioral Synthesis · {gpaPredictions.length} Subjects
                            </p>
                        </div>
                    </div>

                    {/* Live indicator */}
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 ring-1 ring-emerald-300">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                        <span className="text-[10px] font-medium text-emerald-700">Active Prediction</span>
                    </div>
                </div>

                {/* ── Prediction List ── */}
                <div className="space-y-3">
                    {gpaPredictions.map((item, i) => (
                        <motion.div
                            key={item.subject}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                            className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-4 shadow-lg shadow-blue-900/30 transition-all duration-300 hover:scale-[1.01]"
                        >
                            {/* SVG Grid background for a technical feel */}
                            <svg className="absolute inset-0 h-full w-full text-white/5 opacity-40 pointer-events-none" fill="none">
                                <defs>
                                    <pattern id={`grid-gpa-${i}`} width="20" height="20" patternUnits="userSpaceOnUse">
                                        <path d="M 20 0 L 0 0 0 20" stroke="currentColor" strokeWidth="0.5" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill={`url(#grid-gpa-${i})`} />
                            </svg>

                            <div className="relative">
                                {/* Top row: Icon & Subject */}
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-lg shadow-inner ring-1 ring-white/20">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white tracking-wide">{item.subject}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className={`h-1.5 w-1.5 rounded-full ${item.risk ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                                                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-tighter">
                                                    {item.risk ? "Optimization Required" : "Yielding Performance"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-2xl font-black italic tracking-tighter ${item.risk ? 'text-amber-400' : 'text-white'}`}>
                                            {item.grade}
                                        </p>
                                        <p className="text-[9px] font-bold text-blue-300 uppercase tracking-widest">Est. Grade</p>
                                    </div>
                                </div>

                                {/* Confidence Progress Bar */}
                                <div className="mb-3">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[9px] font-bold text-blue-200 uppercase tracking-widest">AI Confidence</span>
                                        <span className="text-[10px] font-bold text-white">{item.confidence}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.confidence}%` }}
                                            transition={{ delay: 0.6 + i * 0.1, duration: 1, ease: "easeOut" }}
                                            className={`h-full rounded-full ${item.confidence > 85 ? 'bg-emerald-400' : 'bg-blue-400'}`}
                                        />
                                    </div>
                                </div>

                                {/* Impact Tag */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[9px] font-bold text-blue-100 ring-1 ring-white/10 shadow-sm transition-colors group-hover:bg-white/20">
                                            SYST_IMPACT: {item.impact}
                                        </span>
                                    </div>
                                    <button className="text-[10px] font-bold text-blue-300 hover:text-white transition-colors flex items-center gap-1">
                                        Details →
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ── Footer Stats ── */}
                <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-5">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Yield Distribution</span>
                        <div className="mt-1 flex gap-1">
                            {gpaPredictions.map((_, idx) => (
                                <div key={idx} className={`h-1 w-4 rounded-full ${_.risk ? 'bg-amber-400' : 'bg-blue-600'}`} />
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">A.I. Engine v4.2</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
