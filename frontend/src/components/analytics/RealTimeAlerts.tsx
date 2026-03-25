"use client";

import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, Info, Radio } from "lucide-react";
import { alerts } from "./analyticsData";
import type { Alert } from "./analyticsData";

const alertConfig: Record<Alert["type"], {
    icon: typeof AlertCircle;
    border: string; bg: string; text: string; iconBg: string;
}> = {
    danger: {
        icon: AlertCircle,
        border: "border-rose-500/30",
        bg: "bg-rose-500/8",
        text: "text-rose-400",
        iconBg: "bg-rose-500/15",
    },
    warning: {
        icon: AlertTriangle,
        border: "border-amber-500/30",
        bg: "bg-amber-500/8",
        text: "text-amber-400",
        iconBg: "bg-amber-500/15",
    },
    info: {
        icon: Info,
        border: "border-blue-500/30",
        bg: "bg-blue-500/8",
        text: "text-blue-400",
        iconBg: "bg-blue-500/15",
    },
};

export default function RealTimeAlerts() {
    const dangerCount = alerts.filter((a) => a.type === "danger").length;
    const warningCount = alerts.filter((a) => a.type === "warning").length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-blue-50 to-white border border-blue-200 shadow-xl shadow-blue-200/50 p-5"
        >
            {/* Ambient blob */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-rose-200/20 blur-3xl" />

            <div className="relative">
                {/* Header */}
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative rounded-xl bg-rose-500/15 p-2.5 ring-1 ring-rose-500/25">
                            <Radio size={16} className="text-rose-400" />
                            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-ping rounded-full bg-rose-400 opacity-75" />
                            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-slate-800">Real-Time Alerts</h3>
                            <p className="text-[11px] text-slate-500">Live monitoring feed</p>
                        </div>
                    </div>

                    {/* Summary badges */}
                    <div className="flex items-center gap-1.5">
                        {dangerCount > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-400 ring-1 ring-rose-500/25">
                                {dangerCount} critical
                            </span>
                        )}
                        {warningCount > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400 ring-1 ring-amber-500/25">
                                {warningCount} warning
                            </span>
                        )}
                    </div>
                </div>

                {/* Alert list */}
                <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.700)_transparent]">
                    {alerts.map((alert, i) => {
                        const cfg = alertConfig[alert.type];
                        const Icon = cfg.icon;

                        return (
                            <motion.div
                                key={`${alert.type}-${i}`}
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.06, duration: 0.3 }}
                                className={`flex items-start gap-3 rounded-xl border ${cfg.border} ${cfg.bg} p-3.5 transition-all duration-200 hover:brightness-110`}
                            >
                                <div className={`mt-0.5 shrink-0 rounded-lg p-1.5 ${cfg.iconBg}`}>
                                    <Icon size={13} className={cfg.text} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className={`text-sm font-medium ${cfg.text}`}>{alert.message}</p>
                                    <p className="mt-0.5 text-[10px] text-slate-400">{alert.time}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-blue-200 pt-4">
                    <span className="text-xs text-slate-400">Showing {alerts.length} alerts</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400 ring-1 ring-emerald-500/20">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                        Auto-refreshing
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
