"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Circle, Clock3, BookOpen, Layers, BarChart3, TrendingUp } from "lucide-react";

type TaskStatus = "pending" | "in_progress" | "completed";

interface Task {
    id: string;
    title: string;
    subject: string;
    status: TaskStatus;
}

interface SubjectDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    subjectName: string;
    tasks: Task[];
    stats: {
        total: number;
        completed: number;
        inProgress: number;
        pending: number;
        completionPct: number;
    };
}

export default function SubjectDetailModal({
    isOpen,
    onClose,
    subjectName,
    tasks,
    stats
}: SubjectDetailModalProps) {
    const ongoingTasks = tasks.filter(t => t.status !== "completed");
    const completedTasks = tasks.filter(t => t.status === "completed");

    // ── Dynamic Theming (Inverted for Positive Metrics) ──
    const theme = useMemo(() => {
        if (stats.completionPct >= 61) {
            return {
                gradient: "from-emerald-700 via-emerald-800 to-emerald-950 border-emerald-400/30",
                glowTop: "bg-emerald-400/30",
                glowBot: "bg-emerald-500/20",
                iconText: "text-emerald-700",
                subText: "text-emerald-200",
                subPulse: "bg-emerald-400",
                btnText: "text-emerald-950",
                btnHover: "hover:bg-emerald-50 hover:text-emerald-700"
            };
        } else if (stats.completionPct >= 31) {
            return {
                gradient: "from-amber-600 via-amber-700 to-amber-950 border-amber-400/30",
                glowTop: "bg-amber-400/30",
                glowBot: "bg-amber-500/20",
                iconText: "text-amber-700",
                subText: "text-amber-200",
                subPulse: "bg-amber-400",
                btnText: "text-amber-950",
                btnHover: "hover:bg-amber-50 hover:text-amber-700"
            };
        } else {
            return {
                gradient: "from-rose-700 via-rose-800 to-rose-950 border-rose-400/30",
                glowTop: "bg-rose-400/30",
                glowBot: "bg-rose-500/20",
                iconText: "text-rose-700",
                subText: "text-rose-200",
                subPulse: "bg-rose-400",
                btnText: "text-rose-950",
                btnHover: "hover:bg-rose-50 hover:text-rose-700"
            };
        }
    }, [stats.completionPct]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="pointer-events-auto w-full max-w-6xl aspect-[16/9] overflow-hidden rounded-[2.5rem] bg-white border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] flex"
                        >
                            {/* Left Sidebar: Dynamic Gradient Overview */}
                            <div className={`w-1/3 relative bg-gradient-to-br transition-colors duration-1000 ${theme.gradient} border-r flex flex-col p-10 overflow-hidden`}>
                                {/* Ambient Glassmorphism Glows */}
                                <div className={`absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors duration-1000 ${theme.glowTop}`} />
                                <div className={`absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-colors duration-1000 ${theme.glowBot}`} />

                                {/* Header Elements */}
                                <div className="relative z-10 mb-10 flex items-center gap-4">
                                    <div className="rounded-2xl bg-white p-4 shadow-xl shadow-black/20 ring-4 ring-white/20">
                                        <BookOpen className={`transition-colors duration-1000 ${theme.iconText}`} size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase">{subjectName}</h2>
                                        <p className={`mt-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors duration-1000 ${theme.subText}`}>
                                            <span className={`h-2 w-2 rounded-full animate-pulse transition-colors duration-1000 ${theme.subPulse}`} />
                                            Deep Dive Analysis
                                        </p>
                                    </div>
                                </div>

                                <div className="relative z-10 space-y-6 flex-1">
                                    {/* Glassmorphic Completion Velocity Large */}
                                    <div className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-6 shadow-xl shadow-black/10">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-1000 ${theme.subText}`}>Completion Velocity</h4>
                                            <TrendingUp size={14} className={stats.completionPct >= 61 ? "text-emerald-400" : stats.completionPct >= 31 ? "text-amber-400" : "text-rose-400"} />
                                        </div>
                                        <div className="flex items-baseline gap-2 mb-2">
                                            <span className="text-5xl font-black italic tracking-tighter text-white">{stats.completionPct}</span>
                                            <span className="text-xl font-black text-white/70">%</span>
                                        </div>
                                        <div className="h-3 w-full rounded-full bg-black/20 overflow-hidden ring-1 ring-inset ring-black/20">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${stats.completionPct}%` }}
                                                transition={{ duration: 1.5, ease: "circOut" }}
                                                className={`h-full rounded-full ${stats.completionPct >= 61 ? "bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_12px_rgba(52,211,153,0.5)]" :
                                                        stats.completionPct >= 31 ? "bg-gradient-to-r from-amber-400 to-amber-600 shadow-[0_0_12px_rgba(251,191,36,0.5)]" :
                                                            "bg-gradient-to-r from-rose-400 to-rose-600 shadow-[0_0_12px_rgba(244,63,94,0.5)]"
                                                    }`}
                                            />
                                        </div>
                                    </div>

                                    {/* Glassmorphic Quick Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-4">
                                            <p className={`text-[9px] font-black uppercase tracking-widest mb-1 transition-colors duration-1000 ${theme.subText}`}>TOTAL TASKS</p>
                                            <p className="text-2xl font-black text-white leading-none">{stats.total}</p>
                                        </div>
                                        <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-4">
                                            <p className={`text-[9px] font-black uppercase tracking-widest mb-1 transition-colors duration-1000 ${theme.subText}`}>IN PROGRESS</p>
                                            <p className="text-2xl font-black text-white leading-none">{stats.inProgress}</p>
                                        </div>
                                    </div>

                                    {/* Glassmorphic Verified Badge */}
                                    <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 transition-colors duration-1000 ${theme.subText}`}>AUDIT STATUS</p>
                                                <p className="text-sm font-black text-white">FULLY VERIFIED</p>
                                            </div>
                                            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                                                <CheckCircle2 size={24} className="text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={onClose}
                                    className={`relative z-10 mt-10 w-full rounded-[1.25rem] bg-white py-4 text-xs font-black uppercase tracking-widest transition-all hover:shadow-xl hover:scale-105 active:scale-95 ${theme.btnText} ${theme.btnHover}`}
                                >
                                    Close Analysis
                                </button>
                            </div>

                            {/* Right Content: Eye-Catching Task Logs */}
                            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                                {/* Header */}
                                <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <div className="flex items-center gap-4">
                                        <div className="rounded-xl bg-slate-100 p-0.5 ring-2 ring-white shadow-sm overflow-hidden">
                                            <div className="rounded-[10px] bg-slate-200 p-2 border border-slate-300">
                                                <Layers size={22} className="text-slate-600" />
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Detailed Task Narrative</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-[10px] font-black uppercase tracking-widest text-amber-700 shadow-sm">
                                            ACTIVE: {ongoingTasks.length}
                                        </div>
                                        <div className="px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-[10px] font-black uppercase tracking-widest text-emerald-700 shadow-sm">
                                            RESOLVED: {completedTasks.length}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-10 [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.200)_transparent]">
                                    <div className="space-y-10">
                                        {/* Vibrant Ongoing Section */}
                                        <section>
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="h-1 w-8 rounded-full bg-blue-500" />
                                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Ongoing Operations</h4>
                                            </div>
                                            {ongoingTasks.length > 0 ? (
                                                <div className="grid grid-cols-1 gap-3">
                                                    {ongoingTasks.map((task, idx) => (
                                                        <motion.div
                                                            key={task.id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: idx * 0.05 }}
                                                            className={`group flex items-center justify-between p-5 rounded-2xl border transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${task.status === "in_progress" ? "bg-amber-50 border-amber-200 hover:border-amber-400" : "bg-slate-50 border-slate-200 hover:border-blue-300"
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`rounded-xl p-0.5 ring-2 ring-white shadow-sm overflow-hidden ${task.status === "in_progress" ? "bg-amber-200" : "bg-slate-200"}`}>
                                                                    <div className={`rounded-[10px] p-2 border ${task.status === "in_progress" ? "bg-amber-100 border-amber-300 text-amber-600" : "bg-slate-100 border-slate-300 text-slate-500"}`}>
                                                                        {task.status === "in_progress" ? <Clock3 size={20} /> : <Circle size={20} />}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <p className={`text-md font-black tracking-tight uppercase transition-colors ${task.status === "in_progress" ? "text-amber-950 group-hover:text-amber-700" : "text-slate-900 group-hover:text-blue-600"}`}>
                                                                        {task.title}
                                                                    </p>
                                                                    <p className={`text-[9px] font-bold uppercase tracking-widest ${task.status === "in_progress" ? "text-amber-600/70" : "text-slate-400"}`}>
                                                                        ID: {task.id.slice(0, 8)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border ${task.status === "in_progress" ? "bg-white border-amber-200 text-amber-600 shadow-sm" : "bg-white border-slate-200 text-slate-400 shadow-sm"
                                                                }`}>
                                                                {task.status === "in_progress" ? "Execution" : "Standby"}
                                                            </span>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs font-bold text-slate-300 italic px-4">No active operations in this sector.</p>
                                            )}
                                        </section>

                                        {/* Vibrant Completed Section */}
                                        <section>
                                            <div className="flex items-center gap-3 mb-6 text-emerald-500">
                                                <div className="h-1 w-8 rounded-full bg-emerald-500" />
                                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 opacity-60">Success History</h4>
                                            </div>
                                            <div className="grid grid-cols-1 gap-3">
                                                {completedTasks.length > 0 ? (
                                                    completedTasks.map((task, idx) => (
                                                        <motion.div
                                                            key={task.id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: ongoingTasks.length * 0.05 + idx * 0.05 }}
                                                            className="group flex items-center justify-between p-5 rounded-2xl bg-emerald-50 border border-emerald-200 hover:border-emerald-400 transition-all hover:shadow-[0_8px_30px_rgba(16,185,129,0.06)]"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="rounded-xl bg-emerald-200 p-0.5 ring-2 ring-white shadow-sm overflow-hidden">
                                                                    <div className="rounded-[10px] bg-emerald-100 p-2 border border-emerald-300 text-emerald-600">
                                                                        <CheckCircle2 size={20} />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <p className="text-md font-black text-emerald-950 tracking-tight uppercase line-through decoration-emerald-400/50 decoration-2 transition-colors group-hover:text-emerald-700">
                                                                        {task.title}
                                                                    </p>
                                                                    <p className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-widest">
                                                                        COMPLETED
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="h-8 w-8 rounded-lg bg-white border border-emerald-200 flex items-center justify-center shadow-sm">
                                                                <BarChart3 size={14} className="text-emerald-500" />
                                                            </div>
                                                        </motion.div>
                                                    ))
                                                ) : (
                                                    <p className="text-xs font-bold text-slate-300 italic px-4">Zero completion records found.</p>
                                                )}
                                            </div>
                                        </section>
                                    </div>
                                </div>

                                {/* Summary Footer */}
                                <div className="px-10 py-4 bg-slate-50/30 border-t border-slate-50 text-right">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        EduSense Behavioral Audit Data Segment · Subject-Wise Inspection
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
