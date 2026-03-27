"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, CheckCheck, Gauge, Timer } from "lucide-react";
import { apiFetch } from "@/lib/api";
import MetricCard from "@/components/MetricCard";
import StudyPlanCard from "@/components/StudyPlanCard";
import DeadlineCard from "@/components/DeadlineCard";
import ProgressChart from "@/components/ProgressChart";

type Task = {
  id: string;
  title: string;
  subject: string;
  deadline: string;
  status: "pending" | "in_progress" | "completed";
};

function daysUntil(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const defaultPlan = [
  { subject: "Database Systems", duration: "1.5h" },
  { subject: "Parallel Computing", duration: "1h" },
  { subject: "ITPM Research", duration: "45min" },
];

const weeklyFallback = [
  { day: "Mon", hours: 2.5 },
  { day: "Tue", hours: 3.2 },
  { day: "Wed", hours: 2.8 },
  { day: "Thu", hours: 3.6 },
  { day: "Fri", hours: 2.2 },
  { day: "Sat", hours: 4.1 },
  { day: "Sun", hours: 3.0 },
];

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const taskData = await apiFetch("/tasks");
        setTasks(Array.isArray(taskData) ? (taskData as Task[]) : []);
      } catch (error) {
        console.error("Failed to load dashboard tasks:", error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === "completed").length;
    const pendingOrProgress = tasks.filter((task) => task.status !== "completed");
    const nearDeadlines = pendingOrProgress.filter(
      (task) => daysUntil(task.deadline) >= 0 && daysUntil(task.deadline) <= 2
    ).length;

    const studyHours = Math.max(6, Math.round((total * 1.25 + completed * 0.5) * 10) / 10);
    const focusScore = Math.min(100, Math.max(65, 72 + completed * 2 - nearDeadlines * 3));
    const productivityIndex = Math.min(
      100,
      total === 0 ? 70 : Math.round((completed / total) * 100 + Math.max(0, 20 - nearDeadlines * 2))
    );

    return {
      studyHours,
      completed,
      focusScore,
      productivityIndex,
    };
  }, [tasks]);

  const upcomingDeadlines = useMemo(() => {
    const upcoming = tasks
      .filter((task) => task.status !== "completed")
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 3);

    if (upcoming.length === 0) {
      return [
        { task: "SE3082 Assignment", dueText: "Due in 2 days", urgent: true },
        { task: "Database Lab", dueText: "Due tomorrow", urgent: true },
        { task: "ITPM Meeting", dueText: "Friday", urgent: false },
      ];
    }

    return upcoming.map((item) => {
      const days = daysUntil(item.deadline);
      return {
        task: item.title,
        dueText:
          days < 0 ? `Overdue by ${Math.abs(days)} day(s)` : days === 0 ? "Due today" : `Due in ${days} day(s)`,
        urgent: days <= 1,
      };
    });
  }, [tasks]);

  const weeklyChartData = useMemo(() => {
    if (tasks.length === 0) {
      return weeklyFallback;
    }

    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return labels.map((label, index) => {
      const taskWeight = tasks.filter((task) => {
        const day = new Date(task.deadline).getDay();
        const mapped = day === 0 ? 6 : day - 1;
        return mapped === index;
      }).length;

      return {
        day: label,
        hours: Number((2 + taskWeight * 0.8 + (index % 3) * 0.4).toFixed(1)),
      };
    });
  }, [tasks]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 p-6 text-white"
        >
          <p className="text-sm text-indigo-100">Today&apos;s Snapshot</p>
          <h2 className="mt-1 text-2xl font-semibold">Welcome back to EduSense</h2>
          <p className="mt-2 text-sm text-cyan-50">
            Keep momentum strong. Your AI planner already prepared today&apos;s best study flow.
          </p>
        </motion.section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Timer}
            label="Study Hours"
            value={loading ? "--" : `${metrics.studyHours}h`}
          />
          <MetricCard
            icon={CheckCheck}
            label="Tasks Completed"
            value={loading ? "--" : String(metrics.completed)}
          />
          <MetricCard
            icon={BrainCircuit}
            label="Focus Score"
            value={loading ? "--" : `${metrics.focusScore}%`}
          />
          <MetricCard
            icon={Gauge}
            label="Productivity Index"
            value={loading ? "--" : `${metrics.productivityIndex}%`}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <StudyPlanCard items={defaultPlan} />
          </div>
          <div className="xl:col-span-7">
            <DeadlineCard items={upcomingDeadlines} />
          </div>
        </section>

        <section>
          <ProgressChart data={weeklyChartData} />
        </section>
      </div>
    </div>
  );
}
