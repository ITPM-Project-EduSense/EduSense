"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    AlertTriangle,
    CheckCircle2,
    GraduationCap,
    PlusCircle,
    Settings2,
    TrendingUp,
    TrendingDown,
    Zap,
    Clock
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { calculateSubjectGpa, calculateOverallCa, GpaPredictionResult, SubjectMarks } from "@/lib/gpaEngine";
import GpaMarksModal from "./GpaMarksModal";

type Task = {
    id: string;
    subject: string;
    status: string;
    title: string;
    completedAt?: string | null;
};

export default function GpaSubjectPrediction() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [marksMap, setMarksMap] = useState<Record<string, SubjectMarks>>({});
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // ── Data Initialization ──
    useEffect(() => {
        const load = async () => {
            try {
                const data = await apiFetch("/tasks");
                setTasks(Array.isArray(data) ? data : []);

                // Load marks from localStorage
                const saved = localStorage.getItem("edusense_gpa_marks");
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        // Ensure all subjects have the new structure
                        const normalized = normalizeMarksStructure(parsed);
                        setMarksMap(normalized);
                    } catch {
                        // Invalid JSON, start fresh
                        initializeMarksFromTasks(Array.isArray(data) ? data : []);
                    }
                } else {
                    // Initialize marks structure from tasks
                    initializeMarksFromTasks(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error("Failed to load data:", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const normalizeMarksStructure = (marks: Record<string, any>): Record<string, SubjectMarks> => {
        const normalized: Record<string, SubjectMarks> = {};
        Object.entries(marks).forEach(([subject, data]: [string, any]) => {
            // If assignments is a number (old format), convert to new format
            if (typeof data.assignments === "number") {
                normalized[subject] = {
                    midterm: data.midterm || 0,
                    assignments: [],
                    midtermLocked: data.midtermLocked || false
                };
            } else if (Array.isArray(data.assignments)) {
                normalized[subject] = {
                    midterm: data.midterm || 0,
                    assignments: data.assignments,
                    midtermLocked: data.midtermLocked || false
                };
            } else {
                normalized[subject] = {
                    midterm: data.midterm || 0,
                    assignments: [],
                    midtermLocked: false
                };
            }
        });
        return normalized;
    };

    const initializeMarksFromTasks = (taskList: Task[]) => {
        const subjects = [...new Set(taskList.map(t => t.subject))];
        const initMarks: Record<string, SubjectMarks> = {};

        subjects.forEach(subject => {
            const subjectTasks = taskList.filter(t => t.subject === subject);
            initMarks[subject] = {
                midterm: 0,
                assignments: subjectTasks.map(t => ({
                    taskId: t.id,
                    taskTitle: t.title,
                    marks: -1,
                    isCompleted: t.status === "completed"
                })),
                midtermLocked: false
            };
        });

        setMarksMap(initMarks);
        localStorage.setItem("edusense_gpa_marks", JSON.stringify(initMarks));
    };

    // ── Get unique subjects ──
    const subjects = useMemo(() => {
        return [...new Set(tasks.map(t => t.subject))].sort();
    }, [tasks]);

    // ── Calculate GPA for each subject ──
    const predictions = useMemo(() => {
        return subjects.map(subject => {
            const marks = marksMap[subject];
            if (!marks) {
                // Return default if not found (shouldn't happen after initialization)
                return calculateSubjectGpa(subject, { midterm: 0, assignments: [], midtermLocked: false });
            }
            return calculateSubjectGpa(subject, marks);
        });
    }, [subjects, marksMap]);

    // ── Overall Aggregate ──
    const overallCa = useMemo(() => {
        if (subjects.length < 4) return null;
        return calculateOverallCa(predictions);
    }, [subjects, predictions]);

    // ── Handlers ──
    const handleOpenModal = (subject: string) => {
        setSelectedSubject(subject);
        setIsModalOpen(true);
    };

    const handleSaveMarks = (newMarks: SubjectMarks) => {
        if (!selectedSubject) return;

        const updated = {
            ...marksMap,
            [selectedSubject]: newMarks
        };
        setMarksMap(updated);
        localStorage.setItem("edusense_gpa_marks", JSON.stringify(updated));
    };

    if (loading) {
        return (
            <div className="overflow-hidden rounded-2xl bg-white border border-gray-300 shadow-xl shadow-gray-300/50">
                <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-indigo-600" />
                <div className="p-10 text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-600" />
                    <p className="mt-4 text-sm font-medium text-slate-500 uppercase tracking-widest text-[10px]">Processing Academic Data...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full"
        >
            <div className="overflow-hidden rounded-2xl bg-white border border-gray-300 shadow-xl shadow-gray-300/50">
                <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-indigo-600" />
                <div className="flex flex-1 flex-col p-5">
                    <div className="relative">
                        {/* Header */}
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-blue-600/15 p-2.5 ring-1 ring-blue-600/25">
                                    <GraduationCap size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-slate-800">
                                        GPA Subject Prediction
                                    </h3>
                                    <p className="mt-0.5 text-[11px] text-slate-500">
                                        Real-time projection across {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 ring-1 ring-emerald-300">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                                <span className="text-[10px] font-medium text-emerald-700">Live Sync</span>
                            </div>
                        </div>

                        {/* Prediction List */}
                        <div className="space-y-3">
                            {predictions.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center">
                                    <GraduationCap size={32} className="mx-auto text-slate-300 mb-3" />
                                    <p className="text-sm text-slate-500">No subjects found. Add tasks to start predictions.</p>
                                </div>
                            ) : (
                                predictions.map((item, i) => (
                                    <motion.div
                                        key={item.subject}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05, duration: 0.3 }}
                                        className="overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 transition-all duration-300 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50"
                                    >
                                        {/* Top accent bar */}
                                        <div className={`h-1 w-full ${item.risk ? 'bg-gradient-to-r from-rose-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`} />

                                        <div className="p-4">
                                            {/* Row 1: Subject & Estimation */}
                                            <div className="mb-3 flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white font-semibold shadow-md ${item.risk ? 'bg-gradient-to-br from-rose-500 to-orange-500' : 'bg-gradient-to-br from-blue-600 to-indigo-600'
                                                        }`}>
                                                        {item.subject.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-slate-800">{item.subject}</p>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${item.risk ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                                            <p className={`text-[9px] font-semibold ${item.risk ? 'text-rose-600' : 'text-emerald-700'}`}>
                                                                {item.risk ? "Needs Improvement" : "On Track"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="flex items-center justify-end gap-1 mb-1">
                                                        {item.estimatedGrade === "A" && <Zap size={13} className="text-amber-500 animate-pulse" />}
                                                        <p className={`text-2xl font-bold leading-none ${item.risk ? 'text-rose-600' : 'text-blue-600'}`}>
                                                            {item.estimatedGrade}
                                                        </p>
                                                    </div>
                                                    <p className="text-[8px] font-medium text-slate-400 uppercase tracking-wide">Grade</p>
                                                </div>
                                            </div>

                                            {/* Row 2: Current CA & Goal */}
                                            <div className="mb-3 grid grid-cols-2 gap-3">
                                                <div>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide">Current CA</span>
                                                        <span className="text-[10px] font-semibold text-slate-700">{item.currentCaPct}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${item.currentCaPct}%` }}
                                                            transition={{ duration: 0.6 }}
                                                            className={`h-full rounded-full ${item.risk ? 'bg-rose-500' : 'bg-blue-600'}`}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 p-3 flex items-center justify-between">
                                                    <div className="min-w-0">
                                                        <p className="text-[8px] font-semibold text-blue-600 uppercase tracking-wide">Final Target</p>
                                                        <p className="text-base font-bold text-blue-800 mt-0.5">
                                                            {item.requiredFinal !== null ? `${item.requiredFinal}%` : "✓ Done"}
                                                        </p>
                                                    </div>
                                                    <TrendingUp size={16} className="text-blue-600 shrink-0" />
                                                </div>
                                            </div>

                                            {/* Row 3: Completion Status */}
                                            {item.hasMissingData && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    transition={{ duration: 0.3 }}
                                                    className="mb-3 p-3 rounded-lg border border-amber-200 bg-amber-50"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={13} className="text-amber-700 shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-medium text-amber-900">
                                                                {item.completedAssignments}/{item.totalAssignments} assignments graded
                                                            </p>
                                                            <p className="text-[8px] text-amber-800/70 mt-0.5">{item.completionRate}% complete</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Row 4: Action Button */}
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-medium text-slate-600">{item.guideline}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleOpenModal(item.subject)}
                                                    className="shrink-0 flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-[10px] font-semibold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 active:scale-95"
                                                >
                                                    <Settings2 size={13} />
                                                    Edit
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Marks Modal */}
            <GpaMarksModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                subject={selectedSubject || ""}
                tasks={tasks}
                currentMarks={selectedSubject ? (marksMap[selectedSubject] || { midterm: 0, assignments: [], midtermLocked: false }) : { midterm: 0, assignments: [], midtermLocked: false }}
                onSave={handleSaveMarks}
            />
        </motion.div>
    );
}
