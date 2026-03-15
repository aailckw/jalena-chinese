"use client";

import { useState } from "react";
import { SlotChip } from "./slot-chip";
import { fillFrame, getCanonicalSlotValues } from "@/lib/lesson-schema";
import type { SentenceFrameItem } from "@/lib/lesson-schema";

interface ChoiceGameProps {
  frameItem: SentenceFrameItem;
  onCorrect: () => void;
}

function normalize(s: string): string {
  return s.replace(/\s+/g, "").replace(/[，。、！？,.\s]/g, "").trim();
}

/** Pick the missing word: show sentence with one blank, choose from options. */
export function ChoiceGame({ frameItem, onCorrect }: ChoiceGameProps) {
  const [slotIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");

  const slot = frameItem.slots[slotIndex];
  const options = slot ? slot.options : [];

  const handleChoose = (opt: string) => {
    if (feedback !== "idle") return;
    setSelectedOption(opt);
    const canonicalValues = getCanonicalSlotValues(frameItem);
    const values = { ...canonicalValues, [slot.id]: opt };
    const built = fillFrame(frameItem.frame, values);
    const isCorrect = frameItem.acceptedAnswers.some((a) => normalize(a) === normalize(built));
    setFeedback(isCorrect ? "correct" : "wrong");
    if (isCorrect) setTimeout(onCorrect, 600);
  };

  if (!slot) return null;

  const parts = frameItem.frame.split(/\{(\w+)\}/);
  const displayParts = parts.map((part, i) => {
    if (i % 2 === 1) {
      const slotId = part;
      return frameItem.slots[slotIndex].id === slotId ? (
        <span key={i} className="text-[var(--primary)] underline">______</span>
      ) : (
        <span key={i}>{getCanonicalSlotValues(frameItem)[slotId] ?? ""}</span>
      );
    }
    return <span key={i}>{part}</span>;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-lg font-semibold text-gray-600 sm:text-xl">選一個詞填上去</p>
        <span className="soft-badge">找出可以換的詞</span>
      </div>
      <div className="rounded-[1.25rem] border-2 border-[var(--line)] bg-white px-4 py-4">
        <p className="mb-2 text-sm font-semibold text-gray-500 sm:text-base">原本句子</p>
        <p className="text-xl font-bold text-[var(--foreground)] sm:text-2xl">{frameItem.canonicalAnswer}</p>
      </div>
      <p className="text-2xl font-bold leading-relaxed text-[var(--foreground)] sm:text-3xl">{displayParts}</p>
      <p className="text-base text-gray-500">試吓揀一個可以放入句子入面嘅詞語。</p>
      <div className="flex flex-wrap gap-3">
        {options.map((opt) => (
          <SlotChip
            key={opt}
            label={opt}
            category={slot.category}
            onClick={() => handleChoose(opt)}
            selected={selectedOption === opt}
            size="md"
          />
        ))}
      </div>
      {feedback === "correct" && (
        <p className="rounded-2xl bg-green-50 px-4 py-3 text-lg font-semibold text-green-700">好叻！</p>
      )}
      {feedback === "wrong" && selectedOption && (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-lg font-semibold text-amber-700">
          呢個詞而家唔啱，試另一個。
        </p>
      )}
    </div>
  );
}
