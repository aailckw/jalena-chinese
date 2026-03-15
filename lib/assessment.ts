/**
 * Rule-based comparison of ASR transcript vs expected Cantonese answer.
 * Supports whole-sentence matching and structure-aware (frame/slot) feedback.
 */

import type { SentenceSlot } from "@/lib/lesson-schema";

function normalize(s: string): string {
  return s
    .replace(/\s+/g, "")
    .replace(/[，。、！？,.\s]/g, "")
    .trim();
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface AssessmentResult {
  correct: boolean;
  message: string;
  matchedCount?: number;
  /** When frame is used: which slots were correct/wrong (for structured feedback). */
  slotFeedback?: { slotId: string; label: string; valid: boolean; got?: string }[];
}

export interface FrameAssessmentInput {
  frame: string;
  slots: SentenceSlot[];
}

/**
 * Parse transcript into slot values by matching the whole frame shape,
 * including the fixed words around each slot.
 * Returns slot results: what was said for each slot and whether it's valid.
 */
function parseTranscriptByFrame(transcript: string, frame: string, slots: SentenceSlot[]): { slotId: string; label: string; got: string | null; valid: boolean }[] {
  const order = frame.match(/\{(\w+)\}/g)?.map((m) => m.slice(1, -1)) ?? [];
  const normalizedTranscript = normalize(transcript);

  const pattern = `^${frame.replace(/\{(\w+)\}/g, (_, id: string) => {
    const slot = slots.find((s) => s.id === id);
    if (!slot) {
      return "(.*?)";
    }
    const options = [...slot.options].sort((a, b) => b.length - a.length);
    return `(${options.map((opt) => escapeRegex(normalize(opt))).join("|")})`;
  })}$`;

  const match = normalizedTranscript.match(new RegExp(pattern));

  return order.map((id, index) => {
    const slot = slots.find((s) => s.id === id);
    const got = match?.[index + 1] ?? null;
    return {
      slotId: id,
      label: slot?.label ?? id,
      got,
      valid: got != null,
    };
  });
}

export function assessTranscript(
  transcript: string,
  expectedAnswer: string,
  alternatives: string[] = [],
  frameInfo?: FrameAssessmentInput
): AssessmentResult {
  const t = normalize(transcript);
  if (!t) {
    return { correct: false, message: "聽唔到，再講一次好嗎？" };
  }

  const expected = normalize(expectedAnswer);
  const allAccepted = [expected, ...alternatives.map(normalize)];

  for (const accepted of allAccepted) {
    if (t === accepted) {
      return { correct: true, message: "好叻！" };
    }
  }

  if (frameInfo) {
    const slotResults = parseTranscriptByFrame(transcript, frameInfo.frame, frameInfo.slots);
    const allValid = slotResults.every((r) => r.valid);
    const validCount = slotResults.filter((r) => r.valid).length;
    const wrongSlots = slotResults.filter((r) => !r.valid);
    const consumed = slotResults.reduce((sum, r) => sum + (r.got?.length ?? 0), 0);
    const mostlyConsumed = consumed >= expected.length * 0.7;

    if (allValid && mostlyConsumed) {
      return {
        correct: true,
        message: "好叻！",
        slotFeedback: slotResults.map((r) => ({ slotId: r.slotId, label: r.label, valid: true, got: r.got ?? undefined })),
      };
    }

    if (wrongSlots.length === 1 && validCount >= slotResults.length - 1) {
      const w = wrongSlots[0];
      return {
        correct: false,
        message: `${w.label}再試一次。`,
        slotFeedback: slotResults.map((r) => ({ slotId: r.slotId, label: r.label, valid: r.valid, got: r.got ?? undefined })),
      };
    }

    if (wrongSlots.length > 1) {
      const labels = wrongSlots.map((w) => w.label).join("、");
      return {
        correct: false,
        message: `${labels}再試一次。`,
        slotFeedback: slotResults.map((r) => ({ slotId: r.slotId, label: r.label, valid: r.valid, got: r.got ?? undefined })),
      };
    }

    if (!mostlyConsumed && validCount > 0) {
      return {
        correct: false,
        message: "差少少，講埋後面。",
        slotFeedback: slotResults.map((r) => ({ slotId: r.slotId, label: r.label, valid: r.valid, got: r.got ?? undefined })),
      };
    }
  }

  const expectedChars = [...expected];
  const transcriptChars = [...t];
  let matched = 0;
  const minLen = Math.min(expectedChars.length, transcriptChars.length);
  for (let i = 0; i < minLen; i++) {
    if (expectedChars[i] === transcriptChars[i]) matched++;
  }
  const ratio = expectedChars.length > 0 ? matched / expectedChars.length : 0;

  if (ratio >= 0.8) {
    return {
      correct: true,
      message: "好叻！差少少就完美。",
      matchedCount: matched,
    };
  }
  if (ratio >= 0.5) {
    return {
      correct: false,
      message: `講得好！再試一次，慢少少。你講啱咗 ${matched} 個字。`,
      matchedCount: matched,
    };
  }
  return {
    correct: false,
    message: "再試一次，跟住讀。",
    matchedCount: matched,
  };
}
