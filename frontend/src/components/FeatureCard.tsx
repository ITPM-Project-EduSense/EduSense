"use client";

import { motion } from "framer-motion";
import { BrainCircuit, ListChecks, Users2 } from "lucide-react";

type FeatureIcon = "planner" | "prioritization" | "collaboration";

interface FeatureCardProps {
  icon: FeatureIcon;
  title: string;
  description: string;
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
}: FeatureCardProps) {
  const iconMap = {
    planner: BrainCircuit,
    prioritization: ListChecks,
    collaboration: Users2,
  };
  const ResolvedIcon = iconMap[Icon];

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5 }}
      whileHover={{
        y: -8,
        boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)",
      }}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.07)] transition-all duration-300"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg">
        <ResolvedIcon size={22} />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-slate-900">{title}</h3>
      <p className="text-sm leading-6 text-slate-500">{description}</p>
    </motion.article>
  );
}
