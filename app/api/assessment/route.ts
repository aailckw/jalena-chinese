import { NextResponse } from "next/server";
import { assessTranscript } from "@/lib/assessment";
import type { SentenceSlot } from "@/lib/lesson-schema";

/**
 * POST body: { transcript, expectedAnswer, alternatives?, frame?: { frame: string, slots: SentenceSlot[] } }
 */
export async function POST(request: Request) {
  let body: {
    transcript?: string;
    expectedAnswer?: string;
    alternatives?: string[];
    frame?: { frame: string; slots: SentenceSlot[] };
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const transcript = typeof body.transcript === "string" ? body.transcript : "";
  const expectedAnswer = typeof body.expectedAnswer === "string" ? body.expectedAnswer : "";
  const alternatives = Array.isArray(body.alternatives)
    ? body.alternatives.filter((a): a is string => typeof a === "string")
    : [];
  const frameInfo =
    body.frame && typeof body.frame.frame === "string" && Array.isArray(body.frame.slots)
      ? { frame: body.frame.frame, slots: body.frame.slots }
      : undefined;

  const result = assessTranscript(transcript, expectedAnswer, alternatives, frameInfo);
  return NextResponse.json({
    correct: result.correct,
    message: result.message,
    matchedCount: result.matchedCount,
    slotFeedback: result.slotFeedback,
  });
}
