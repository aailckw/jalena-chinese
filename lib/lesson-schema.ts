/**
 * Type-safe lesson definitions for kindergarten Cantonese practice.
 * Supports both whole-sentence practice and sentence-frame/slot combinations.
 */

export type SlotCategory =
  | "person"
  | "object"
  | "place"
  | "tool"
  | "action"
  | "transport";

/** Single substitutable slot in a sentence frame (e.g. object, place). */
export interface SentenceSlot {
  id: string;
  /** Short label for UI, e.g. 人物 / 物件 */
  label: string;
  category: SlotCategory;
  options: string[];
}

/**
 * Sentence frame with slots for structure-based practice.
 * frame uses placeholders like {slotId} that are filled by slot options.
 */
export interface SentenceFrameItem {
  id: string;
  /** Template with {slotId} placeholders, e.g. "我把{object}放進{place}" */
  frame: string;
  slots: SentenceSlot[];
  /** One canonical full sentence for display/TTS */
  canonicalAnswer: string;
  /** All accepted full sentences for assessment (frame filled with slot options) */
  acceptedAnswers: string[];
  /** Display text for card (with parentheses hints) */
  displayText: string;
}

/** Backward-compatible practice item: can be frame-based or simple. */
export interface PracticeItem {
  id: string;
  displayText: string;
  expectedAnswer: string;
  alternatives?: string[];
  /** When set, this item uses sentence-frame flow (choose, build, speak). */
  frame?: SentenceFrameItem;
}

export interface LessonWeek {
  id: string;
  dateRange: string;
  theme: string;
  vocabulary: string[];
  sentences: PracticeItem[];
}

/** Fill frame template with slot choices. e.g. {object} -> 報紙 */
export function fillFrame(frame: string, slotValues: Record<string, string>): string {
  return frame.replace(/\{(\w+)\}/g, (_, id) => slotValues[id] ?? "");
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Get slot values that produce the canonical answer (parse order from frame). */
export function getCanonicalSlotValues(frameItem: SentenceFrameItem): Record<string, string> {
  const result: Record<string, string> = {};
  const slotOrder = frameItem.frame.match(/\{(\w+)\}/g)?.map((m) => m.slice(1, -1)) ?? [];

  const pattern = `^${frameItem.frame.replace(/\{(\w+)\}/g, (_, id: string) => {
    const slot = frameItem.slots.find((s) => s.id === id);
    if (!slot) {
      return "(.*?)";
    }
    const options = [...slot.options].sort((a, b) => b.length - a.length);
    return `(${options.map((opt) => escapeRegex(opt)).join("|")})`;
  })}$`;

  const match = frameItem.canonicalAnswer.match(new RegExp(pattern));
  if (!match) {
    return result;
  }

  slotOrder.forEach((slotId, index) => {
    const value = match[index + 1];
    if (value) {
      result[slotId] = value;
    }
  });

  return result;
}

/** Generate all accepted answers from frame + slots (Cartesian product of slot options). */
export function getAcceptedAnswersFromFrame(frame: string, slots: SentenceSlot[]): string[] {
  const slotIds = slots.map((s) => s.id);
  const optionsBySlot = Object.fromEntries(slots.map((s) => [s.id, s.options]));
  const result: string[] = [];
  function recurse(index: number, values: Record<string, string>) {
    if (index === slotIds.length) {
      result.push(fillFrame(frame, values));
      return;
    }
    const id = slotIds[index];
    for (const opt of optionsBySlot[id] ?? []) {
      recurse(index + 1, { ...values, [id]: opt });
    }
  }
  recurse(0, {});
  return result;
}
