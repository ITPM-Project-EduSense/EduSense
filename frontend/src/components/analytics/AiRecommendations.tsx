"use client";

import { motion } from "framer-motion";
import { Lightbulb, Sparkles } from "lucide-react";
import { aiRecommendations } from "./analyticsData";

const priorityStyles = {
    High:       "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/25",
    Medium:     "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25",
    Suggestion: "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/25",
};

const priorityDot = {
    High:       "bg-rose-400",
    Medium:     "bg-amber-400",
    Suggestion: "bg-blue-400",
};

export default function AiRecommendations() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 border border-blue-400/35 shadow-xl shadow-blue-900/30 p-5"
        >
            {/* Ambient blob */}
            <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/8 blur-3xl" />

            <div className="relative">
                {/* Header */}
                <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 shadow-lg shadow-blue-600/30">
                        <Sparkles size={16} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-white">AI Recommendations</h3>
                        <p className="text-[11px] text-blue-300/70">Personalized suggestions from your learning AI</p>
                    </div>
                </div>

                <div className="space-y-2.5">
                    {aiRecommendations.map((rec, i) => (
                        <motion.div
                            key={rec.title}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25 + i * 0.08, duration: 0.35 }}
                            whileHover={{ x: 4, transition: { duration: 0.15 } }}
                            className="group flex items-start gap-3 rounded-xl border border-blue-400/20 bg-blue-800/40 p-3.5 transition-all duration-200 hover:border-blue-400/40 hover:bg-blue-700/50"
                        >
                            {/* Priority dot */}
                            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${priorityDot[rec.priority]}`} />

                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-semibold text-white">{rec.title}</p>
                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${priorityStyles[rec.priority]}`}>
                                        {rec.priority}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs leading-relaxed text-blue-100/75">{rec.explanation}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-4 flex items-center gap-2 border-t border-blue-400/20 pt-4">
                    <div className="rounded-lg bg-blue-500/10 p-1.5 ring-1 ring-blue-500/20">
                        <Lightbulb size={12} className="text-blue-400" />
                    </div>
                    <span className="text-xs text-blue-300/70">AI generated insight · Updated 5 minutes ago</span>
                </div>
            </div>
        </motion.div>
    );
}
