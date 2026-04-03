"use client";

import { X, Save, RotateCcw, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AssignmentMark, SubjectMarks } from "@/lib/gpaEngine";

interface Task {
    id: string;
    title: string;
    subject: string;
    status: string;
    completedAt?: string | null;
}

interface GpaMarksModalProps {
    isOpen: boolean;
    onClose: () => void;
    subject: string;
    tasks: Task[]; // Tasks for this subject
    currentMarks: SubjectMarks;
    onSave: (marks: SubjectMarks) => void;
}

export default function GpaMarksModal({
    isOpen,
    onClose,
    subject,
    tasks,
    currentMarks,
    onSave,
}: GpaMarksModalProps) {
    const [midterm, setMidterm] = useState<string>(currentMarks.midterm.toString());
    const [credits, setCredits] = useState<string>((currentMarks.credits ?? 3).toString());
    const [assignmentMarks, setAssignmentMarks] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Filter tasks for current subject
    const subjectTasks = tasks.filter(t => t.subject === subject);
    const completedTasks = subjectTasks.filter(t => t.status === "completed");
    const incompleteTasks = subjectTasks.filter(t => t.status !== "completed");

    useEffect(() => {
        if (isOpen) {
            setMidterm(currentMarks.midterm.toString());
            setCredits((currentMarks.credits ?? 3).toString());
            // Initialize assignment marks from current state
            const initMarks: Record<string, string> = {};
            currentMarks.assignments.forEach(a => {
                initMarks[a.taskId] = a.marks >= 0 ? a.marks.toString() : "";
            });
            setAssignmentMarks(initMarks);
        }
    }, [isOpen, currentMarks]);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            // Build assignment marks array
            const updatedAssignments: AssignmentMark[] = completedTasks.map(task => ({
                taskId: task.id,
                taskTitle: task.title,
                marks: parseFloat(assignmentMarks[task.id]) || -1,
                isCompleted: true
            }));

            onSave({
                midterm: parseFloat(midterm) || 0,
                assignments: updatedAssignments,
                midtermLocked: parseFloat(midterm) > 0,
                credits: Math.max(1, Math.min(4, parseFloat(credits) || 3))
            });
            setIsSaving(false);
            onClose();
        }, 600);
    };

    const handleCreditPointChange = (creditValue: string) => {
        const newCredits = Math.max(1, Math.min(4, parseInt(creditValue) || 3));
        setCredits(newCredits.toString());
        
        // Immediately save with current state
        const updatedAssignments: AssignmentMark[] = completedTasks.map(task => ({
            taskId: task.id,
            taskTitle: task.title,
            marks: parseFloat(assignmentMarks[task.id]) || -1,
            isCompleted: true
        }));

        onSave({
            midterm: parseFloat(midterm) || 0,
            assignments: updatedAssignments,
            midtermLocked: parseFloat(midterm) > 0,
            credits: newCredits
        });
    };

    const handleReset = () => {
        setMidterm("0");
        setCredits("3");
        setAssignmentMarks({});
    };

    const handleMarkChange = (taskId: string, value: string) => {
        setAssignmentMarks(prev => ({
            ...prev,
            [taskId]: value
        }));
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-[2rem] border border-white/20 bg-white/95 shadow-2xl backdrop-blur-md"
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 text-white z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-blue-100/70">
                                    Assignment-Level Input
                                </h3>
                                <h2 className="text-2xl font-black italic tracking-tighter mt-1 truncate max-w-[280px]">
                                    {subject}
                                </h2>
                                <p className="mt-1 text-xs text-blue-100/60 font-medium">
                                    {completedTasks.length} completed, {incompleteTasks.length} pending
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-full bg-white/10 p-2 text-white/80 transition-colors hover:bg-white/20"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Midterm Input */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                                Midterm Exam Score (%)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={midterm}
                                    onChange={(e) => setMidterm(e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-2xl font-black italic tracking-tighter text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-300"
                                    placeholder="0"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold italic tracking-tighter text-xl">
                                    %
                                </div>
                            </div>
                        </div>

                        {/* Credit Points Input */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                                Credit Points (Affects GPA)
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {[1, 2, 3, 4].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => handleCreditPointChange(num.toString())}
                                        className={`relative py-3 px-1 rounded-lg font-semibold text-sm transition-all duration-200 ${
                                            credits === num.toString()
                                                ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white ring-2 ring-blue-400 shadow-lg shadow-blue-600/30"
                                                : "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 hover:border-slate-300"
                                        }`}
                                    >
                                        {num}
                                        <div className={`text-[9px] font-medium mt-0.5 ${
                                            credits === num.toString() ? "text-blue-100" : "text-slate-500"
                                        }`}>
                                            pts
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <p className="mt-3 text-xs text-slate-500">
                                Select credit points for {subject} (1-4) — Each level weighted differently for GPA
                            </p>
                        </div>

                        {/* Completed Assignments Section */}
                        {completedTasks.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle2 size={16} className="text-emerald-600" />
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                                        Completed Assignments ({completedTasks.length})
                                    </label>
                                </div>
                                <div className="space-y-3">
                                    {completedTasks.map((task, idx) => (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm text-slate-800 truncate">{task.title}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">Completed & ready for marks</p>
                                                </div>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-200/50 px-2 py-1 text-xs font-bold text-emerald-700">
                                                    <CheckCircle2 size={12} />
                                                    Done
                                                </span>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={assignmentMarks[task.id] || ""}
                                                    onChange={(e) => handleMarkChange(task.id, e.target.value)}
                                                    className="w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-lg font-semibold text-slate-800 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                                    placeholder="Enter marks (0-100)"
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                                                    %
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Incomplete Tasks Warning */}
                        {incompleteTasks.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm"
                            >
                                <div className="flex gap-3">
                                    <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm text-amber-900 mb-2">
                                            {incompleteTasks.length} Incomplete Assignment{incompleteTasks.length > 1 ? 's' : ''}
                                        </p>
                                        <div className="space-y-1">
                                            {incompleteTasks.map(task => (
                                                <div key={task.id} className="flex items-center gap-2 text-xs text-amber-800">
                                                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                    <span className="font-medium">{task.title}</span>
                                                    <span className="text-amber-600/60">— Not Completed</span>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="mt-2 text-xs text-amber-700 font-medium">
                                            ℹ️ Complete these assignments to include them in your grade calculation.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* No Tasks Message */}
                        {subjectTasks.length === 0 && (
                            <div className="p-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center">
                                <p className="text-sm text-slate-600">No tasks found for this subject yet.</p>
                                <p className="text-xs text-slate-500 mt-1">Add tasks in the Tasks section to enable assignment-level grading.</p>
                            </div>
                        )}

                        {/* Weightage Insight */}
                        <div className="flex gap-3 rounded-2xl bg-blue-50 p-4 border border-blue-100/50 items-start">
                            <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
                            <p className="text-xs leading-relaxed text-blue-800 font-medium">
                                <span className="font-bold block mb-1">Scoring Information:</span>
                                Assignments (25%) + Midterm (25%) = Current CA Score. Final Exam will count for 50%. Missing data excludes items from calculations.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-4 flex gap-3">
                        <button
                            onClick={handleReset}
                            className="flex grow items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-100 hover:border-slate-300 active:scale-[0.98]"
                        >
                            <RotateCcw size={16} />
                            Reset
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:scale-100"
                        >
                            {isSaving ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                                    Syncing...
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    Update Prediction
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

