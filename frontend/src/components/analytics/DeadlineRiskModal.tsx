"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Clock, AlertTriangle, CheckCircle2, Ghost, BarChart3 } from "lucide-react";

interface SubjectDeadlineRisk {
    subject:   string;
    riskScore: number;
    level:     string;
    taskCount: number;
}

interface DeadlineRiskModalProps {
    isOpen: boolean;
    onClose: () => void;
    subjects: SubjectDeadlineRisk[];
}

export default function DeadlineRiskModal({ isOpen, onClose, subjects }: DeadlineRiskModalProps) {
    const [search, setSearch] = useState("");

    // ── Input Validation (A-Z only) ──
    const handleSearchChange = (val: string) => {
        const sanitized = val.replace(/[^a-zA-Z]/g, "");
        setSearch(sanitized);
    };

    // ── Filtering Logic ──
    const filteredSubjects = useMemo(() => {
        if (!subjects) return [];
        return subjects.filter((s) =>
            s.subject.toLowerCase().includes(search.toLowerCase())
        );
    }, [subjects, search]);

    // ── Close on Escape ──
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

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
                        className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="pointer-events-auto w-full max-w-5xl aspect-[16/9] overflow-hidden rounded-[2.5rem] bg-white border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] flex flex-col"
                        >
                            {/* Header */}
                            <div className="relative border-b border-slate-100 bg-slate-50/50 px-8 py-6">
                                <button
                                    onClick={onClose}
                                    className="absolute right-6 top-6 rounded-full p-2 text-slate-400 transition-all hover:bg-slate-200 hover:text-slate-600 hover:rotate-90"
                                >
                                    <X size={22} />
                                </button>
                                <div className="flex items-center gap-4">
                                    <div className="rounded-[1.25rem] bg-amber-500 p-4 shadow-lg shadow-amber-500/20">
                                        <Clock className="text-white" size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Predictive Deadline Risk</h3>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Predictive delay analysis by subject</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                {/* Search & Stats Bar */}
                                <div className="px-8 py-6 flex items-center justify-between gap-6 border-b border-slate-50">
                                    <div className="relative flex-1 max-w-md group">
                                        <Search 
                                            size={20} 
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-600 transition-colors" 
                                        />
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => handleSearchChange(e.target.value)}
                                            placeholder="Filter subjects (A-Z only)..."
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-4 pl-12 pr-4 text-sm font-bold text-slate-800 outline-none transition-all focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-400 border border-slate-200 rounded-lg px-2 py-1 uppercase tracking-tighter">
                                            Total: {subjects.length}
                                        </span>
                                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 rounded-lg px-2 py-1 uppercase tracking-tighter">
                                            Found: {filteredSubjects.length}
                                        </span>
                                    </div>
                                </div>

                                {/* Subject List Grid */}
                                <div className="flex-1 overflow-y-auto px-8 py-6 [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.200)_transparent]">
                                    {filteredSubjects.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {filteredSubjects.map((s, idx) => {
                                                const isHigh = s.riskScore >= 61;
                                                const isMod  = s.riskScore >= 31;
                                                const color  = isHigh ? "text-rose-600" : isMod ? "text-amber-600" : "text-emerald-600";
                                                const bg     = isHigh ? "bg-rose-50" : isMod ? "bg-amber-50" : "bg-emerald-50";
                                                const accent = isHigh ? "bg-rose-500" : isMod ? "bg-amber-500" : "bg-emerald-500";
                                                const border = isHigh ? "border-rose-100" : isMod ? "border-amber-100" : "border-emerald-100";

                                                return (
                                                    <motion.div
                                                        key={s.subject}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: idx * 0.04 }}
                                                        className={`group relative flex flex-col rounded-[2rem] border border-slate-200 ${bg.replace('50', '100')} p-6 transition-all hover:border-${accent.split('-')[1]}-300 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] overflow-hidden`}
                                                    >
                                                        {/* High-Contrast Left Accent */}
                                                        <div className={`absolute left-0 top-0 h-full w-1.5 ${accent}`} />

                                                        {/* Header Info with White Bordered Icon Container */}
                                                        <div className="flex items-start justify-between mb-6">
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`rounded-lg bg-slate-50 p-0.5 ring-2 ring-white shadow-sm`}>
                                                                        <div className={`rounded-md ${bg} p-1.5 border ${border}`}>
                                                                            <Clock size={16} className={color} />
                                                                        </div>
                                                                    </div>
                                                                    <h4 className="text-lg font-black text-slate-950 tracking-tight leading-none uppercase">{s.subject}</h4>
                                                                </div>
                                                                <div className={`inline-flex items-center gap-1.5 rounded-full ${bg} px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border ${border} ${color}`}>
                                                                    <div className={`h-1.5 w-1.5 rounded-full ${accent} animate-pulse`} />
                                                                    {s.level} Risk
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="flex items-baseline justify-end gap-1">
                                                                    <span className={`text-3xl font-black italic tracking-tighter ${color}`}>{s.riskScore}</span>
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase">%</span>
                                                                </div>
                                                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Delay Prob.</p>
                                                            </div>
                                                        </div>

                                                        {/* Task Info */}
                                                        <div className="mb-6 flex items-center justify-between px-1">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-white group-hover:border-slate-200 transition-all">
                                                                    <BarChart3 size={18} className="text-slate-400" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black text-slate-900">{s.taskCount}</p>
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Queued Tasks</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Risk Chart (Enhanced Progress Bar) */}
                                                        <div className="mt-auto space-y-2.5">
                                                            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">
                                                                <span>Forecasting Confidence</span>
                                                                <span className={color}>Verified</span>
                                                            </div>
                                                            <div className={`h-2.5 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-50 shadow-inner`}>
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${s.riskScore}%` }}
                                                                    transition={{ duration: 1.5, ease: "circOut", delay: 0.3 + idx * 0.05 }}
                                                                    className={`h-full rounded-full ${accent} shadow-[0_0_12px_rgba(0,0,0,0.1)]`}
                                                                />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full py-12 text-center opacity-40">
                                            <div className="mb-4 rounded-full bg-slate-100 p-6">
                                                <Ghost size={48} className="text-slate-300" />
                                            </div>
                                            <h4 className="text-xl font-bold text-slate-800">No data segment found</h4>
                                            <p className="text-sm text-slate-500">Check filter criteria</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t border-slate-100 bg-slate-50/50 px-8 py-4 flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    Predictive Deadline Audit · EduSense AI
                                </p>
                                <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[9px] font-black text-amber-700 uppercase ring-1 ring-amber-200">
                                    <BarChart3 size={12} /> Probabilistic Model
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
