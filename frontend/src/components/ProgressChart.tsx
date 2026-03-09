"use client";

import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ProgressPoint = {
  day: string;
  hours: number;
};

type ProgressChartProps = {
  data: ProgressPoint[];
};

export default function ProgressChart({ data }: ProgressChartProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay: 0.1 }}
      className="rounded-xl bg-white p-5 shadow-sm"
    >
      <h2 className="mb-4 text-base font-semibold text-slate-900">Weekly Progress</h2>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="day" stroke="#64748B" fontSize={12} />
            <YAxis stroke="#64748B" fontSize={12} />
            <Tooltip
              cursor={{ fill: "#EEF2FF" }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #E2E8F0",
                fontSize: 12,
              }}
            />
            <Bar dataKey="hours" fill="url(#studyGradient)" radius={[8, 8, 0, 0]} />
            <defs>
              <linearGradient id="studyGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.article>
  );
}
