"use client";

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
                            className="pointer-events-auto w-full max-w-6xl aspect-[16/9] overflow-hidden rounded-[2.5rem] bg-white border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] flex"
                        >
                            {/* Left Sidebar: Subject Overview */}
                            <div className="w-1/3 bg-slate-50/50 border-r border-slate-100 flex flex-col p-10">
                                <div className="mb-10 flex items-center gap-4">
                                    <div className="rounded-2xl bg-blue-600 p-4 shadow-lg shadow-blue-600/20 ring-4 ring-white">
                                        <BookOpen className="text-white" size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">{subjectName}</h2>
                                        <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                            Deep Dive Analysis
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6 flex-1">
                                    {/* Overall Progress Large */}
                                    <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Completion Velocity</h4>
                                            <TrendingUp size={14} className="text-emerald-500" />
                                        </div>
                                        <div className="flex items-baseline gap-2 mb-2">
                                            <span className="text-5xl font-black italic tracking-tighter text-slate-900">{stats.completionPct}</span>
                                            <span className="text-xl font-black text-slate-300">%</span>
                                        </div>
                                        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden ring-1 ring-inset ring-slate-200/50">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${stats.completionPct}%` }}
                                                transition={{ duration: 1, ease: "circOut" }}
                                                className="h-full bg-blue-600 rounded-full shadow-[0_0_12px_rgba(37,99,235,0.3)]"
                                            />
                                        </div>
                                    </div>

                                    {/* Quick Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-2xl bg-white border border-slate-100 p-4">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">TOTAL TASKS</p>
                                            <p className="text-2xl font-black text-slate-900 leading-none">{stats.total}</p>
                                        </div>
                                        <div className="rounded-2xl bg-white border border-slate-100 p-4">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">IN PROGRESS</p>
                                            <p className="text-2xl font-black text-blue-600 leading-none">{stats.inProgress}</p>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl bg-white border border-slate-100 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">AUDIT STATUS</p>
                                                <p className="text-sm font-black text-emerald-600">FULLY VERIFIED</p>
                                            </div>
                                            <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                                <CheckCircle2 size={24} className="text-emerald-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={onClose}
                                    className="mt-10 w-full rounded-[1.25rem] bg-slate-900 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-slate-800 hover:shadow-xl active:scale-95"
                                >
                                    Close Analysis
                                </button>
                            </div>

                            {/* Right Content: Task Logs */}
                            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                                <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
                                            <Layers size={20} className="text-slate-400" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Detailed Task Narrative</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            ACTIVE: {ongoingTasks.length}
                                        </div>
                                        <div className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                            RESOLVED: {completedTasks.length}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-10 [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.200)_transparent]">
                                    <div className="space-y-10">
                                        {/* Ongoing Section */}
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
                                                            className="group flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                                                                    task.status === "in_progress" ? "bg-amber-50 text-amber-500 border border-amber-100" : "bg-slate-50 text-slate-400 border border-slate-100"
                                                                }`}>
                                                                    {task.status === "in_progress" ? <Clock3 size={20} /> : <Circle size={20} />}
                                                                </div>
                                                                <div>
                                                                    <p className="text-md font-black text-slate-900 tracking-tight uppercase group-hover:text-blue-600 transition-colors">{task.title}</p>
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {task.id.slice(0, 8)}</p>
                                                                </div>
                                                            </div>
                                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border ${
                                                                task.status === "in_progress" ? "bg-amber-50 border-amber-100 text-amber-600" : "bg-slate-50 border-slate-100 text-slate-400"
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

                                        {/* Completed Section */}
                                        <section>
                                            <div className="flex items-center gap-3 mb-6 text-emerald-500">
                                                <div className="h-1 w-8 rounded-full bg-emerald-500" />
                                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 opacity-60">Success History</h4>
                                            </div>
                                            <div className="grid grid-cols-1 gap-3">
                                                {completedTasks.length > 0 ? (
                                                    completedTasks.map((task, idx) => (
                                                        <div key={task.id} className="flex items-center justify-between p-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-200">
                                                                    <CheckCircle2 size={20} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-md font-black text-slate-600 tracking-tight uppercase line-through opacity-60">{task.title}</p>
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">COMPLETED</p>
                                                                </div>
                                                            </div>
                                                            <div className="h-8 w-8 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center">
                                                                <BarChart3 size={14} className="text-emerald-300" />
                                                            </div>
                                                        </div>
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
