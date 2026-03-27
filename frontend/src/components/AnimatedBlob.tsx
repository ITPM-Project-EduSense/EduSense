"use client";

import { motion } from "framer-motion";

interface AnimatedBlobProps {
  className?: string;
  gradient: string;
  duration?: number;
}

export default function AnimatedBlob({
  className = "",
  gradient,
  duration = 16,
}: AnimatedBlobProps) {
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
      style={{
        background: gradient,
        opacity: 0.2,
      }}
      animate={{
        x: [0, 18, -12, 0],
        y: [0, -22, 12, 0],
        scale: [1, 1.08, 0.96, 1],
      }}
      transition={{
        duration,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
    />
  );
}
