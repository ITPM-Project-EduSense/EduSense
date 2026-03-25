"use client";

import { BarChart3, Sparkles, Brain, Activity } from "lucide-react";
import KpiCards from "@/components/analytics/KpiCards";
import SubjectPerformanceChart from "@/components/analytics/SubjectPerformanceChart";
import WeeklyTrendsCharts from "@/components/analytics/WeeklyTrendsCharts";
import BurnoutStressChart from "@/components/analytics/BurnoutStressChart";
import GpaSubjectPrediction from "@/components/analytics/GpaSubjectPrediction";
import AiRecommendations from "@/components/analytics/AiRecommendations";
import RealTimeAlerts from "@/components/analytics/RealTimeAlerts";

export default function AnalyticsPage() {
    return (
        <div className="mx-auto w-full max-w-7xl space-y-6 p-4 lg:p-6">

            {/* ── Page Header ── */}
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 shadow-2xl shadow-blue-900/40">
                {/* Ambient glow blobs */}
                <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-indigo-400/15 blur-3xl" />
                <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="rounded-2xl bg-white/15 p-3 ring-1 ring-white/25 backdrop-blur-sm">
                            <BarChart3 size={26} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200">
                                EduSense · Analytics
                            </p>
                            <h1 className="text-2xl font-bold text-white lg:text-3xl">
                                AI Performance Dashboard
                            </h1>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-blue-100 ring-1 ring-white/20 backdrop-blur-sm">
                            <Brain size={13} />
                            Behavioral risk model
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-blue-100 ring-1 ring-white/20 backdrop-blur-sm">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                            Updated 5 min ago
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30 backdrop-blur-sm">
                            <Activity size={12} />
                            Live
                        </span>
                    </div>
                </div>
            </section>

            {/* ── Section A — Executive Summary ── */}
            <section>
                <div className="mb-4 flex items-center gap-3">
                    <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-400 to-indigo-600" />
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        Executive Summary
                    </h2>
                </div>
                <KpiCards />
            </section>

            {/* ── Section B — Performance Intelligence ── */}
            <section>
                <div className="mb-4 flex items-center gap-3">
                    <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-400 to-indigo-600" />
                    <Sparkles size={14} className="text-blue-500" />
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        Performance Intelligence
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="space-y-6">
                        <SubjectPerformanceChart />
                        <WeeklyTrendsCharts />
                    </div>
                    <div className="space-y-6">
                        <BurnoutStressChart />
                        <GpaSubjectPrediction />
                    </div>
                </div>
            </section>

            {/* ── Section C — AI Intelligence Zone ── */}
            <section className="mb-8">
                <div className="mb-4 flex items-center gap-3">
                    <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-400 to-indigo-600" />
                    <Brain size={14} className="text-blue-500" />
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        AI Intelligence Zone
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <AiRecommendations />
                    <RealTimeAlerts />
                </div>
            </section>
        </div>
    );
}
