/**
 * Client-side progress for kindergarten practice (localStorage).
 * Tracks completed sentence ids and per-sentence stage mastery (choose, build, speak).
 */

const PREFIX = "progress_";
const STAGES_PREFIX = "progress_stages_";

export type StageType = "choose" | "build" | "speak";

export interface StageProgress {
  choose?: boolean;
  build?: boolean;
  speak?: boolean;
}

export function getCompletedSentences(weekId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PREFIX + weekId);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? arr.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function markSentenceCompleted(weekId: string, sentenceId: string): void {
  if (typeof window === "undefined") return;
  const completed = getCompletedSentences(weekId);
  if (completed.includes(sentenceId)) return;
  completed.push(sentenceId);
  try {
    localStorage.setItem(PREFIX + weekId, JSON.stringify(completed));
  } catch {
    // ignore
  }
}

export function getStageProgress(weekId: string): Record<string, StageProgress> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STAGES_PREFIX + weekId);
    if (!raw) return {};
    const obj = JSON.parse(raw) as unknown;
    if (typeof obj !== "object" || obj === null) return {};
    return obj as Record<string, StageProgress>;
  } catch {
    return {};
  }
}

export function markStage(weekId: string, sentenceId: string, stage: StageType): void {
  if (typeof window === "undefined") return;
  const current = getStageProgress(weekId);
  const entry = current[sentenceId] ?? {};
  if (stage === "choose") entry.choose = true;
  if (stage === "build") entry.build = true;
  if (stage === "speak") entry.speak = true;
  current[sentenceId] = entry;
  try {
    localStorage.setItem(STAGES_PREFIX + weekId, JSON.stringify(current));
  } catch {
    // ignore
  }
}

export function getAllWeeksProgress(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  const out: Record<string, string[]> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX) && !key.startsWith(STAGES_PREFIX)) {
      const weekId = key.slice(PREFIX.length);
      out[weekId] = getCompletedSentences(weekId);
    }
  }
  return out;
}

export function getAllStagesProgress(): Record<string, Record<string, StageProgress>> {
  if (typeof window === "undefined") return {};
  const out: Record<string, Record<string, StageProgress>> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STAGES_PREFIX)) {
      const weekId = key.slice(STAGES_PREFIX.length);
      out[weekId] = getStageProgress(weekId);
    }
  }
  return out;
}

/** Pattern summary: frame template -> { total, choose, build, speak } counts. */
export interface PatternSummary {
  frame: string;
  total: number;
  choose: number;
  build: number;
  speak: number;
}

export function getPatternSummaries(
  weekId: string,
  sentences: { id: string; frame?: { frame: string } }[]
): PatternSummary[] {
  const stages = getStageProgress(weekId);
  const byFrame = new Map<string, { total: number; choose: number; build: number; speak: number }>();

  for (const s of sentences) {
    const frameKey = s.frame?.frame ?? s.id;
    const entry = byFrame.get(frameKey) ?? { total: 0, choose: 0, build: 0, speak: 0 };
    entry.total += 1;
    const st = stages[s.id];
    if (st?.choose) entry.choose += 1;
    if (st?.build) entry.build += 1;
    if (st?.speak) entry.speak += 1;
    byFrame.set(frameKey, entry);
  }

  return Array.from(byFrame.entries()).map(([frame, counts]) => ({
    frame,
    ...counts,
  }));
}
