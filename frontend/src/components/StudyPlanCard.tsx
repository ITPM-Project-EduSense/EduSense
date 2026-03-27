"use client";

import { motion } from "framer-motion";
import { BrainCircuit } from "lucide-react";

type StudyItem = {
  subject: string;
  duration: string;
};

type StudyPlanCardProps = {
  items: StudyItem[];
};

export default function StudyPlanCard({ items }: StudyPlanCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
      className="rounded-xl bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
          <BrainCircuit size={18} />
        </div>
        <h2 className="text-base font-semibold text-slate-900">AI Study Plan for Today</h2>
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={`${item.subject}-${item.duration}`}
            className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
          >
            <span className="text-sm font-medium text-slate-700">{item.subject}</span>
            <span className="text-xs font-semibold text-cyan-600">{item.duration}</span>
          </li>
        ))}
      </ul>
    </motion.article>
  );
}
