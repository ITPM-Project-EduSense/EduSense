"use client";

import { motion } from "framer-motion";
import { CalendarClock } from "lucide-react";

type DeadlineItem = {
  task: string;
  dueText: string;
  urgent?: boolean;
};

type DeadlineCardProps = {
  items: DeadlineItem[];
};

export default function DeadlineCard({ items }: DeadlineCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay: 0.05 }}
      className="rounded-xl bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
          <CalendarClock size={18} />
        </div>
        <h2 className="text-base font-semibold text-slate-900">Upcoming Deadlines</h2>
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={`${item.task}-${item.dueText}`}
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            <p className="text-sm font-medium text-slate-700">{item.task}</p>
            <p className={`mt-1 text-xs ${item.urgent ? "text-rose-600" : "text-slate-500"}`}>
              {item.dueText}
            </p>
          </li>
        ))}
      </ul>
    </motion.article>
  );
}
