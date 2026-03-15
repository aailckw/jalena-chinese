"use client";

import { motion } from "framer-motion";
import { CheckCircle2, RotateCcw } from "lucide-react";

interface FeedbackPanelProps {
  message: string | null | undefined;
  isCorrect: boolean | null | undefined;
}

export function FeedbackPanel({ message, isCorrect }: FeedbackPanelProps) {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      role="status"
      className={`mt-4 rounded-[1.25rem] border-4 p-5 flex flex-col items-center justify-center gap-3 text-center shadow-sm ${
        isCorrect
          ? "border-[var(--success)] bg-green-100 text-green-900"
          : "border-amber-400 bg-amber-100 text-amber-900"
      }`}
    >
      {isCorrect ? (
        <CheckCircle2 size={48} className="text-[var(--success)]" />
      ) : (
        <RotateCcw size={48} className="text-amber-500" />
      )}
      <span className="text-2xl font-bold">{message}</span>
    </motion.div>
  );
}
