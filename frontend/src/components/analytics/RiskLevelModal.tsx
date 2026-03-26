"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, AlertCircle, ShieldCheck, ShieldAlert, ShieldX, Ghost, CheckCircle2, TrendingUp } from "lucide-react";

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

    // ── Input Validation ──
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

    // ── Average Risk Calculation ──
    const averageRisk = useMemo(() => {
        if (!subjects || subjects.length === 0) return 0;
        const total = subjects.reduce((sum, s) => sum + s.riskScore, 0);
        return Math.round(total / subjects.length);
    }, [subjects]);

    // ── Dynamic Theming ──
    const theme = useMemo(() => {
        if (averageRisk >= 61) {
            return {
                gradient: "from-rose-700 via-rose-800 to-rose-950 border-rose-400/30",
                glowTop: "bg-rose-400/20",
                glowBot: "bg-rose-500/20",
                iconText: "text-rose-700",
                subText: "text-rose-200",
                subPulse: "bg-rose-400",
                btnText: "text-rose-950",
                btnHover: "hover:bg-rose-50 hover:text-rose-700"
            };
        } else if (averageRisk >= 31) {
            return {
                gradient: "from-amber-600 via-amber-700 to-amber-950 border-amber-400/30",
                glowTop: "bg-amber-400/20",
                glowBot: "bg-amber-500/20",
                iconText: "text-amber-700",
                subText: "text-amber-200",
                subPulse: "bg-amber-400",
                btnText: "text-amber-950",
                btnHover: "hover:bg-amber-50 hover:text-amber-700"
            };
        } else {
            return {
                gradient: "from-emerald-700 via-emerald-800 to-emerald-950 border-emerald-400/30",
                glowTop: "bg-emerald-400/20",
                glowBot: "bg-emerald-500/20",
                iconText: "text-emerald-700",
                subText: "text-emerald-200",
                subPulse: "bg-emerald-400",
                btnText: "text-emerald-950",
                btnHover: "hover:bg-emerald-50 hover:text-emerald-700"
            };
        }
    }, [averageRisk]);

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
                            className="pointer-events-auto w-full max-w-6xl aspect-[16/9] overflow-hidden rounded-[2.5rem] bg-slate-50 border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] flex"
                        >
                            {/* Left Sidebar: Dynamic Gradient Overview */}
                            <div className={`w-1/3 relative bg-gradient-to-br transition-colors duration-1000 ${theme.gradient} border-r flex flex-col p-10 overflow-hidden`}>
                                {/* Ambient Glassmorphism Glows */}
                                <div className={`absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors duration-1000 ${theme.glowTop}`} />
                                <div className={`absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-colors duration-1000 ${theme.glowBot}`} />

                                {/* Header Elements */}
                                <div className="relative z-10 mb-10 flex items-center gap-4">
                                    <div className="rounded-2xl bg-white p-4 shadow-xl shadow-black/20 ring-4 ring-white/20">
                                        <AlertCircle className={`transition-colors duration-1000 ${theme.iconText}`} size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white tracking-tight leading-none uppercase">Academic Risk Analysis</h2>
                                        <p className={`mt-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors duration-1000 ${theme.subText}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full animate-pulse transition-colors duration-1000 ${theme.subPulse}`} />
                                            Subject Hazard Tracking
                                        </p>
                                    </div>
                                </div>

                                <div className="relative z-10 space-y-6 flex-1">
                                    {/* Glassmorphic Average Risk */}
                                    <div className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-6 shadow-xl shadow-black/10">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-1000 ${theme.subText}`}>Global Average Risk</h4>
                                            <TrendingUp size={14} className={averageRisk >= 61 ? "text-rose-400" : averageRisk >= 31 ? "text-amber-400" : "text-emerald-400"} />
                                        </div>
                                        <div className="flex items-baseline gap-2 mb-2">
                                            <span className="text-5xl font-black italic tracking-tighter text-white">{averageRisk}</span>
                                            <span className="text-xl font-black text-white/70">%</span>
                                        </div>
                                        <div className="h-3 w-full rounded-full bg-black/20 overflow-hidden ring-1 ring-inset ring-black/20">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${averageRisk}%` }}
                                                transition={{ duration: 1.5, ease: "circOut" }}
                                                className={`h-full rounded-full ${
                                                    averageRisk >= 61 ? "bg-gradient-to-r from-rose-400 to-rose-600 shadow-[0_0_12px_rgba(244,63,94,0.5)]" : 
                                                    averageRisk >= 31 ? "bg-gradient-to-r from-amber-400 to-amber-600 shadow-[0_0_12px_rgba(251,191,36,0.5)]" : 
                                                    "bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_12px_rgba(52,211,153,0.5)]"
                                                }`}
                                            />
                                        </div>
                                    </div>

                                    {/* Glassmorphic Quick Stats */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-4">
                                            <p className={`text-[9px] font-black uppercase tracking-widest mb-1 transition-colors duration-1000 ${theme.subText}`}>SUBJECTS IN FOCUS</p>
                                            <p className="text-2xl font-black text-white leading-none">{subjects.length}</p>
                                        </div>
                                        <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-4">
                                            <p className={`text-[9px] font-black uppercase tracking-widest mb-1 transition-colors duration-1000 ${theme.subText}`}>CRITICAL RISKS</p>
                                            <p className="text-2xl font-black text-white leading-none">{subjects.filter(s => s.riskScore >= 61).length}</p>
                                        </div>
                                    </div>

                                    {/* Glassmorphic Verified Badge */}
                                    <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 transition-colors duration-1000 ${theme.subText}`}>SYSTEM AUDIT</p>
                                                <p className="text-sm font-black text-white">DATA SYNCHRONIZED</p>
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
                                    Dismiss Overlay
                                </button>
                            </div>

                            {/* Right Content: Search & Subject Risk Data */}
                            <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
                                {/* Search Bar Header */}
                                <div className="px-10 py-8 border-b border-slate-200 bg-white flex items-center justify-between shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] z-10">
                                    <div className="relative flex-1 max-w-md group">
                                        <Search size={22} className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:${theme.iconText}`} />
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => handleSearchChange(e.target.value)}
                                            placeholder="Find subject assessment (A-Z)..."
                                            className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 py-3.5 pl-12 pr-4 text-sm font-bold text-slate-800 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            MATCHES: {filteredSubjects.length}
                                        </div>
                                    </div>
                                </div>

                                {/* Results Grid */}
                                <div className="flex-1 overflow-y-auto px-10 py-8 [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.300)_transparent]">
                                    {filteredSubjects.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {filteredSubjects.map((s, idx) => {
                                                const risk = 
                                                    s.riskScore >= 61 ? { label: "High Risk", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", accent: "bg-rose-500", icon: ShieldX } :
                                                    s.riskScore >= 31 ? { label: "Medium Risk", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", accent: "bg-amber-500", icon: ShieldAlert } :
                                                    { label: "Low Risk", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", accent: "bg-emerald-500", icon: ShieldCheck };
                                                
                                                const RiskIcon = risk.icon;

                                                return (
                                                    <motion.div
                                                        key={s.subject}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: idx * 0.04 }}
                                                        className={`group relative flex flex-col rounded-[2rem] border ${risk.border} ${risk.bg.replace('50', '100')} p-6 transition-all hover:border-${risk.accent.split('-')[1]}-300 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] overflow-hidden`}
                                                    >
                                                        {/* High-Contrast Left Accent */}
                                                        <div className={`absolute left-0 top-0 h-full w-1.5 ${risk.accent}`} />

                                                        {/* Header Info */}
                                                        <div className="flex items-start justify-between mb-6 pl-2">
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`rounded-xl bg-slate-50 p-0.5 ring-2 ring-white shadow-sm`}>
                                                                        <div className={`rounded-lg ${risk.bg} p-2 border border-${risk.accent.split('-')[1]}-100`}>
                                                                            <RiskIcon size={18} className={risk.color} />
                                                                        </div>
                                                                    </div>
                                                                    <h4 className="text-lg font-black text-slate-950 tracking-tight leading-none uppercase">{s.subject}</h4>
                                                                </div>
                                                                <div className={`inline-flex items-center gap-1.5 rounded-full ${risk.bg} px-3 py-1 text-[9px] font-black uppercase tracking-widest border border-${risk.accent.split('-')[1]}-100 ${risk.color}`}>
                                                                    <div className={`h-1.5 w-1.5 rounded-full ${risk.accent} animate-pulse`} />
                                                                    {risk.label}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="flex items-baseline justify-end gap-1">
                                                                    <span className={`text-4xl font-black italic tracking-tighter ${risk.color}`}>{s.riskScore}</span>
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase">%</span>
                                                                </div>
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Hazard Probability</p>
                                                            </div>
                                                        </div>

                                                        {/* Stats Row */}
                                                        <div className="mb-6 flex items-center gap-6 pl-2">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                                                    <CheckCircle2 size={18} className="text-emerald-600" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black text-slate-900 leading-none">{s.completedCount}</p>
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Done</p>
                                                                </div>
                                                            </div>
                                                            <div className="w-px h-8 bg-slate-200/50" />
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                                                                    <Ghost size={18} className="text-rose-600" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black text-slate-900 leading-none">{s.overdueCount}</p>
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Late</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Target Progress Line */}
                                                        <div className="mt-auto pl-2">
                                                            <div className={`h-2 w-full overflow-hidden rounded-full ${risk.bg.replace('50', '200')} border border-white/50 shadow-inner`}>
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${s.riskScore}%` }}
                                                                    transition={{ duration: 1.5, ease: "circOut", delay: 0.2 + idx * 0.05 }}
                                                                    className={`h-full rounded-full ${risk.accent} shadow-[0_0_12px_rgba(0,0,0,0.1)]`}
                                                                />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full py-12 text-center opacity-50">
                                            <div className="mb-6 rounded-[2rem] bg-white border border-slate-200 p-8 shadow-sm">
                                                <Ghost size={48} className="text-slate-300" />
                                            </div>
                                            <h4 className="text-2xl font-black tracking-tight text-slate-800 uppercase">No Matches Found</h4>
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">Try adjusting your filters (A-Z)</p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="px-10 py-4 bg-white border-t border-slate-200 flex justify-end">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        EduSense System · AI Risk Core
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
