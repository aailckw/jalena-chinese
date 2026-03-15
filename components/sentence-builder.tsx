"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { SlotChip } from "./slot-chip";
import { fillFrame } from "@/lib/lesson-schema";
import type { SentenceFrameItem } from "@/lib/lesson-schema";

interface SentenceBuilderProps {
  frameItem: SentenceFrameItem;
  slotValues: Record<string, string>;
  onSlotChoice: (slotId: string, value: string) => void;
  onReadyToSpeak?: (builtSentence: string) => void;
}

/** Build a sentence by choosing one option per slot (color-coded chips). */
export function SentenceBuilder({
  frameItem,
  slotValues,
  onSlotChoice,
  onReadyToSpeak,
}: SentenceBuilderProps) {
  const allFilled = frameItem.slots.every((s) => slotValues[s.id] != null);
  const builtSentence = useMemo(() => {
    if (!allFilled) return "";
    return fillFrame(frameItem.frame, slotValues);
  }, [frameItem.frame, slotValues, allFilled]);

  const parts = frameItem.frame.split(/\{(\w+)\}/);

  return (
    <div className="space-y-5">
      <p className="text-lg font-semibold text-gray-600 sm:text-xl">換一換詞語，砌出新句子</p>
      <div className="rounded-[1.25rem] border-2 border-[var(--line)] bg-white px-4 py-4">
        <p className="mb-3 text-sm font-semibold text-gray-500 sm:text-base">句子預覽</p>
        <div className="flex flex-wrap items-center gap-2 text-2xl font-bold leading-relaxed">
          {parts.map((part, i) => {
            if (i % 2 === 1) {
              const slotId = part;
              const slot = frameItem.slots.find((s) => s.id === slotId);
              if (!slot) return null;
              const value = slotValues[slotId];
              return (
                <span
                  key={i}
                  className="inline-flex min-h-12 items-center rounded-2xl border-2 border-dashed border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2"
                >
                  {value ?? "____"}
                </span>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </div>
      </div>
      <div className="space-y-4">
        {frameItem.slots.map((slot) => (
          <div key={slot.id} className="rounded-[1.25rem] border-2 border-[var(--line)] bg-white px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-base font-semibold text-gray-600 sm:text-lg">
                換這個詞 {slot.label}
              </p>
              {slot.options.length > 1 ? (
                <span className="soft-badge">{slot.options.length} 個選擇</span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2.5">
              {slot.options.map((opt) => (
                <SlotChip
                  key={opt}
                  label={opt}
                  category={slot.category}
                  onClick={() => onSlotChoice(slot.id, opt)}
                  selected={slotValues[slot.id] === opt}
                  size="md"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      {allFilled && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[1.25rem] bg-[var(--primary-soft)] p-4"
        >
          <p className="mb-3 text-2xl font-bold text-[var(--foreground)] sm:text-3xl">{builtSentence}</p>
          {onReadyToSpeak && (
            <motion.button
              type="button"
              onClick={() => onReadyToSpeak(builtSentence)}
              className="kid-button bg-[var(--primary)] px-5 text-white"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              講呢句
            </motion.button>
          )}
        </motion.div>
      )}
    </div>
  );
}
