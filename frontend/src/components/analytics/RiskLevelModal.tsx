"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, AlertCircle, ShieldCheck, ShieldAlert, ShieldX, Ghost, CheckCircle2 } from "lucide-react";

interface SubjectRisk {
    subject:        string;
    riskScore:      number;
    completedCount: number;
    overdueCount:   number;
}

interface RiskLevelModalProps {
    isOpen: boolean;
    onClose: () => void;
    subjects: SubjectRisk[];
}

export default function RiskLevelModal({ isOpen, onClose, subjects }: RiskLevelModalProps) {
    const [search, setSearch] = useState("");

    // ── Input Validation (A-Z only, case insensitive) ──
    const handleSearchChange = (val: string) => {
        // Sanitize: allow only letters
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

                    {/* Modal Container */}
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
                                    <div className="rounded-[1.25rem] bg-blue-600 p-4 shadow-lg shadow-blue-600/20">
                                        <AlertCircle className="text-white" size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Academic Risk Analysis</h3>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Subject-wise task tracking & hazard levels</p>
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
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" 
                                        />
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => handleSearchChange(e.target.value)}
                                            placeholder="Filter subjects (A-Z only)..."
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-4 pl-12 pr-4 text-sm font-bold text-slate-800 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-400 border border-slate-200 rounded-lg px-2 py-1 uppercase tracking-tighter">
                                            Total: {subjects.length}
                                        </span>
                                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 rounded-lg px-2 py-1 uppercase tracking-tighter">
                                            Found: {filteredSubjects.length}
                                        </span>
                                    </div>
                                </div>

                                {/* Subject List Grid */}
                                <div className="flex-1 overflow-y-auto px-8 py-6 [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.200)_transparent]">
                                    {filteredSubjects.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {filteredSubjects.map((s, idx) => {
                                                const risk = 
                                                    s.riskScore >= 61 ? { label: "High Risk", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", accent: "bg-rose-500", icon: ShieldX, shadow: "shadow-rose-100" } :
                                                    s.riskScore >= 31 ? { label: "Medium Risk", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", accent: "bg-amber-500", icon: ShieldAlert, shadow: "shadow-amber-100" } :
                                                    { label: "Low Risk", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", accent: "bg-emerald-500", icon: ShieldCheck, shadow: "shadow-emerald-100" };
                                                
                                                const RiskIcon = risk.icon;
                                                const hasTasks = s.completedCount > 0 || s.overdueCount > 0;

                                                return (
                                                    <motion.div
                                                        key={s.subject}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: idx * 0.04 }}
                                                        className={`group relative flex flex-col rounded-[2rem] border border-slate-200 ${risk.bg.replace('50', '100')} p-6 transition-all hover:border-${risk.accent.split('-')[1]}-300 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] overflow-hidden`}
                                                    >
                                                        {/* High-Contrast Left Accent */}
                                                        <div className={`absolute left-0 top-0 h-full w-1.5 ${risk.accent}`} />

                                                        {/* Header Info with White Bordered Icon Container (Synced Pattern) */}
                                                        <div className="flex items-start justify-between mb-6">
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`rounded-lg bg-slate-50 p-0.5 ring-2 ring-white shadow-sm`}>
                                                                        <div className={`rounded-md ${risk.bg} p-1.5 border border-${risk.accent.split('-')[1]}-100`}>
                                                                            <RiskIcon size={16} className={risk.color} />
                                                                        </div>
                                                                    </div>
                                                                    <h4 className="text-lg font-black text-slate-950 tracking-tight leading-none uppercase">{s.subject}</h4>
                                                                </div>
                                                                <div className={`inline-flex items-center gap-1.5 rounded-full ${risk.bg} px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border border-${risk.accent.split('-')[1]}-100 ${risk.color}`}>
                                                                    <div className={`h-1.5 w-1.5 rounded-full ${risk.accent} animate-pulse`} />
                                                                    {risk.label}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="flex items-baseline justify-end gap-1">
                                                                    <span className={`text-3xl font-black italic tracking-tighter ${risk.color}`}>{s.riskScore}</span>
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase">%</span>
                                                                </div>
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Hazard</p>
                                                            </div>
                                                        </div>

                                                        {/* Stats Row (Refined) */}
                                                        <div className="mb-6 flex items-center justify-between px-1">
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-8 w-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
                                                                        <CheckCircle2 size={14} className="text-teal-600" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs font-black text-slate-900">{s.completedCount}</p>
                                                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Done</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-8 w-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
                                                                        <Ghost size={14} className="text-rose-600" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs font-black text-slate-900">{s.overdueCount}</p>
                                                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Late</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Risk Chart (Enhanced Sparkline) */}
                                                        <div className="mt-auto space-y-2.5">
                                                            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">
                                                                <span>Confidence Rating</span>
                                                                <span className={risk.color}>Verified Audit</span>
                                                            </div>
                                                            <div className={`h-2.5 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-50 shadow-inner`}>
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${s.riskScore}%` }}
                                                                    transition={{ duration: 1.5, ease: "circOut" }}
                                                                    className={`h-full rounded-full ${risk.accent} shadow-[0_0_12px_rgba(0,0,0,0.1)]`}
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
                                            <h4 className="text-xl font-bold text-slate-800">No subjects found</h4>
                                            <p className="text-sm text-slate-500">Refine your search parameters</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t border-slate-100 bg-slate-50/50 px-8 py-4 flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    AI-Powered Behavioral Risk Analysis · EduSense
                                </p>
                                <div className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-[9px] font-black text-blue-700 uppercase ring-1 ring-blue-200">
                                    <ShieldCheck size={12} /> Live Audit
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
