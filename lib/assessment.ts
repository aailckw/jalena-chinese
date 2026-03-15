/**
 * Rule-based comparison of ASR transcript vs expected Cantonese answer.
 * Supports whole-sentence matching and structure-aware (frame/slot) feedback.
 */

import type { SentenceSlot } from "@/lib/lesson-schema";

function normalize(s: string): string {
  const charMap: Record<string, string> = {
    裡: "裏",
    里: "裏",
    进: "進",
    复: "復",
    台: "臺",
  };
  const unified = [...s].map((ch) => charMap[ch] ?? ch).join("");
  return unified
    .replace(/\s+/g, "")
    .replace(/[，。、！？,.\s]/g, "")
    .trim();
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const dist = levenshtein(a, b);
  return 1 - dist / Math.max(a.length, b.length);
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

  const loosePattern = frame
    .split(/\{(\w+)\}/)
    .map((part, idx) => (idx % 2 === 1 ? "(.*?)" : escapeRegex(normalize(part))))
    .join("");
  const match = normalizedTranscript.match(new RegExp(loosePattern));

  return order.map((id, index) => {
    const slot = slots.find((s) => s.id === id);
    const gotRaw = normalize(match?.[index + 1] ?? "");
    const options = slot?.options ?? [];
    const normalizedOptions = options.map((opt) => normalize(opt));

    let got: string | null = gotRaw || null;
    let valid = false;
    for (const opt of normalizedOptions) {
      if (!gotRaw) break;
      if (
        gotRaw === opt ||
        gotRaw.includes(opt) ||
        opt.includes(gotRaw) ||
        similarity(gotRaw, opt) >= 0.72
      ) {
        got = opt;
        valid = true;
        break;
      }
    }

    if (!valid && slot) {
      const found = normalizedOptions.find(
        (opt) => normalizedTranscript.includes(opt) || similarity(normalizedTranscript, opt) >= 0.78
      );
      if (found) {
        got = found;
        valid = true;
      }
    }

    return {
      slotId: id,
      label: slot?.label ?? id,
      got,
      valid,
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
    if (similarity(t, accepted) >= 0.72) {
      return { correct: true, message: "好叻！" };
    }
  }

  if (frameInfo) {
    const slotResults = parseTranscriptByFrame(transcript, frameInfo.frame, frameInfo.slots);
    const allValid = slotResults.every((r) => r.valid);
    const validCount = slotResults.filter((r) => r.valid).length;
    const wrongSlots = slotResults.filter((r) => !r.valid);
    const consumed = slotResults.reduce((sum, r) => sum + (r.got?.length ?? 0), 0);
    const mostlyConsumed = consumed >= expected.length * 0.45;
    const expectedSimilarity = similarity(t, expected);

    if (allValid && mostlyConsumed) {
      return {
        correct: true,
        message: "好叻！",
        slotFeedback: slotResults.map((r) => ({ slotId: r.slotId, label: r.label, valid: true, got: r.got ?? undefined })),
      };
    }

    // Be lenient for ASR noise: if most slots are recognized and sentence is reasonably close,
    // accept it instead of forcing a retry on tiny transcription drift.
    if (validCount >= Math.max(1, slotResults.length - 1) && expectedSimilarity >= 0.5) {
      return {
        correct: true,
        message: "好叻！",
        slotFeedback: slotResults.map((r) => ({ slotId: r.slotId, label: r.label, valid: r.valid, got: r.got ?? undefined })),
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

    if (!mostlyConsumed && validCount > 0 && expectedSimilarity < 0.5) {
      return {
        correct: false,
        message: "差少少，講埋後面。",
        slotFeedback: slotResults.map((r) => ({ slotId: r.slotId, label: r.label, valid: r.valid, got: r.got ?? undefined })),
      };
    }
  }

  const dist = levenshtein(expected, t);
  const maxLen = Math.max(expected.length, t.length);
  const ratio = maxLen > 0 ? 1 - dist / maxLen : 0;
  const matched = Math.max(0, expected.length - dist);

  if (ratio >= 0.65) {
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
