"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { getCompletedSentences } from "@/lib/progress";

interface ProgressIndicatorProps {
  weekId: string;
  totalSentences: number;
}

export function ProgressIndicator({ weekId, totalSentences }: ProgressIndicatorProps) {
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    // Initial load
    setCompletedCount(getCompletedSentences(weekId).length);

    // Poll for changes since other components might update it
    const interval = setInterval(() => {
      setCompletedCount(getCompletedSentences(weekId).length);
    }, 1000);

    return () => clearInterval(interval);
  }, [weekId]);

  const progressPercentage = Math.min(100, Math.round((completedCount / totalSentences) * 100));

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold text-gray-700">進度 Progress</span>
        <span className="text-lg font-bold text-[var(--primary)]">{completedCount} / {totalSentences}</span>
      </div>
      <div className="h-6 w-full bg-[var(--surface-strong)] rounded-full overflow-hidden border-2 border-[var(--line)] relative">
        <motion.div
          className="h-full bg-[var(--success)]"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ type: "spring", stiffness: 50, damping: 15 }}
        />
        <div className="absolute inset-0 flex items-center justify-around px-2">
          {Array.from({ length: totalSentences }).map((_, i) => (
            <Star
              key={i}
              size={16}
              className={`z-10 transition-colors duration-500 ${
                i < completedCount ? "text-white fill-white" : "text-gray-300/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}