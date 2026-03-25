"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, GraduationCap } from "lucide-react";
import { gpaPredictions } from "./analyticsData";

export default function GpaSubjectPrediction() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 border border-blue-400/35 shadow-xl shadow-blue-900/30 p-5"
        >
            {/* Ambient blob */}
            <div className="pointer-events-none absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-indigo-500/8 blur-3xl" />

            <div className="relative">
                {/* Header */}
                <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 shadow-lg shadow-blue-600/30">
                        <GraduationCap size={18} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-white">GPA Subject Prediction</h3>
                        <p className="text-[11px] text-blue-300/70">Predicted using behavioral risk model</p>
                    </div>
                </div>

                <div className="space-y-2.5">
                    {gpaPredictions.map((item, i) => (
                        <motion.div
                            key={item.subject}
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 + i * 0.08, duration: 0.35 }}
                            className={`flex items-center justify-between rounded-xl border p-3.5 transition-all duration-200 ${
                                item.risk
                                    ? "border-amber-500/25 bg-amber-500/8 hover:border-amber-500/40 hover:bg-amber-500/12"
                                    : "border-blue-400/25 bg-blue-800/40 hover:border-blue-400/40 hover:bg-blue-800/60"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{item.icon}</span>
                                <div>
                                    <p className="text-sm font-semibold text-white">{item.subject}</p>
                                    <p className="text-[10px] text-blue-300/70">Behavioral analysis</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <span className={`text-sm font-bold ${item.risk ? "text-amber-400" : "text-white"}`}>
                                    {item.grade}
                                </span>
                                {item.risk ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-semibold text-amber-400 ring-1 ring-amber-500/25">
                                        <AlertTriangle size={10} /> At Risk
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/25">
                                        <CheckCircle2 size={10} /> On Track
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-blue-400/20 pt-4">
                    <span className="text-[10px] text-blue-300/50">Powered by EduSense AI</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-medium text-blue-400 ring-1 ring-blue-500/20">
                        {gpaPredictions.filter((g) => !g.risk).length} on track · {gpaPredictions.filter((g) => g.risk).length} at risk
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
