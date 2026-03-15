"use client";

import Image from "next/image";
import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Play, Volume2 } from "lucide-react";
import { RecordButton } from "./record-button";
import { FeedbackPanel } from "./feedback-panel";
import { SlotChip } from "./slot-chip";
import { markSentenceCompleted, markStage } from "@/lib/progress";
import { fillFrame, getCanonicalSlotValues } from "@/lib/lesson-schema";
import type { PracticeItem } from "@/lib/lesson-schema";

interface PracticeCardProps {
  item: PracticeItem;
  weekId: string;
}

export function PracticeCard({ item, weekId }: PracticeCardProps) {
  const hasFrame = !!item.frame;
  const canonicalSlotValues = item.frame ? getCanonicalSlotValues(item.frame) : {};
  const [slotValues, setSlotValues] = useState<Record<string, string>>(canonicalSlotValues);
  const [status, setStatus] = useState<"idle" | "listening" | "recording" | "checking" | "success" | "retry">("idle");
  const [feedback, setFeedback] = useState<{ message: string; isCorrect: boolean } | null>(null);
  const [lastRecordingUrl, setLastRecordingUrl] = useState<string | null>(null);
  const [showCardImage, setShowCardImage] = useState(true);
  
  const [cachedAudioUrl, setCachedAudioUrl] = useState<string | null>(null);
  const [cachedAudioText, setCachedAudioText] = useState<string>("");

  const currentSentence = item.frame
    ? fillFrame(item.frame.frame, { ...canonicalSlotValues, ...slotValues }) || item.frame.canonicalAnswer
    : item.expectedAnswer;
    
  const swappableSlots = item.frame?.slots.filter((slot) => slot.options.length > 1) ?? [];
  const imageSrc = `/generated/card-images/${item.id}.png`;

  useEffect(() => {
    return () => {
      if (lastRecordingUrl) URL.revokeObjectURL(lastRecordingUrl);
    };
  }, [lastRecordingUrl]);

  const playAudioUrl = useCallback(
    (url: string) => {
      setStatus("listening");
      const audio = new Audio(url);
      audio.onended = () => setStatus("idle");
      audio.onerror = () => setStatus("idle");
      audio.play();
    },
    []
  );

  const handlePlay = useCallback(async () => {
    setFeedback(null);
    if (cachedAudioUrl && cachedAudioText === currentSentence) {
      playAudioUrl(cachedAudioUrl);
      return;
    }
    setStatus("listening");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentSentence, slow: true }),
      });
      if (!res.ok) {
        setFeedback({ message: "請稍後再試", isCorrect: false });
        setStatus("idle");
        return;
      }
      const data = await res.json();
      const url = data.url ? data.url : data.audioBase64 ? "data:audio/wav;base64," + data.audioBase64 : null;
      if (url) {
        setCachedAudioUrl(url);
        setCachedAudioText(currentSentence);
        playAudioUrl(url);
      } else {
        setStatus("idle");
      }
    } catch {
      setFeedback({ message: "請稍後再試", isCorrect: false });
      setStatus("idle");
    }
  }, [currentSentence, cachedAudioUrl, cachedAudioText, playAudioUrl]);

  const handleReplay = useCallback(() => {
    if (cachedAudioUrl && cachedAudioText === currentSentence) playAudioUrl(cachedAudioUrl);
  }, [cachedAudioUrl, cachedAudioText, currentSentence, playAudioUrl]);

  const canReplay = cachedAudioUrl != null && cachedAudioText === currentSentence;

  const handleSlotChoice = useCallback((slotId: string, value: string) => {
    setSlotValues((prev) => ({ ...prev, [slotId]: value }));
    // Clear feedback and status when sentence changes
    setFeedback(null);
    setStatus("idle");
  }, []);

  const handleRecordDone = useCallback(
    async (audioBlob: Blob) => {
      setStatus("checking");
      setFeedback(null);
      setLastRecordingUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(audioBlob);
      });
      const accepted = item.frame ? item.frame.acceptedAnswers : [item.expectedAnswer, ...(item.alternatives ?? [])];
      try {
        const form = new FormData();
        form.append("audio", audioBlob, "recording.webm");
        const asrRes = await fetch("/api/asr", { method: "POST", body: form });
        if (!asrRes.ok) {
          const errBody = await asrRes.json().catch(() => ({}));
          const code = errBody?.code;
          const msg =
            asrRes.status === 503 && (code === "MISSING_API_KEY" || code === "FFMPEG_REQUIRED")
              ? "語音辨識喺呢度未設定好，請稍後再試。"
              : "請再講一次";
          setFeedback({ message: msg, isCorrect: false });
          setStatus("retry");
          return;
        }
        const asrData = await asrRes.json();
        const transcript = asrData.transcript ?? "";

        const assessRes = await fetch("/api/assessment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript,
            expectedAnswer: currentSentence,
            alternatives: accepted.filter((a) => a !== currentSentence),
            frame: item.frame ? { frame: item.frame.frame, slots: item.frame.slots } : undefined,
          }),
        });
        const assessData = await assessRes.ok ? await assessRes.json() : { correct: false, message: "再試一次" };
        const baseMessage = assessData.message ?? (assessData.correct ? "好叻！" : "再試一次");
        setFeedback({
          message: assessData.correct || !transcript ? baseMessage : `${baseMessage}（識別到：${transcript}）`,
          isCorrect: !!assessData.correct,
        });
        if (assessData.correct) {
          markStage(weekId, item.id, "speak");
          markSentenceCompleted(weekId, item.id);
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ff6b6b', '#4ade80', '#3b82f6', '#f43f5e', '#facc15']
          });
        }
        setStatus(assessData.correct ? "success" : "retry");
      } catch {
        setFeedback({ message: "請再講一次", isCorrect: false });
        setStatus("retry");
      }
    },
    [item.id, item.frame, item.expectedAnswer, item.alternatives, currentSentence, weekId]
  );

  const handlePlayLastRecording = useCallback(async () => {
    if (!lastRecordingUrl) return;
    try {
      const audio = new Audio(lastRecordingUrl);
      await audio.play();
    } catch {
      setFeedback({ message: "錄音播放唔到，請再錄一次。", isCorrect: false });
    }
  }, [lastRecordingUrl]);

  return (
    <section className="flashcard p-4 sm:p-5" aria-label="練習句子">
      <div className="flashcard-body">
        <div className="mb-5 flex items-start justify-between gap-3 pt-4">
          <span className="soft-badge">學習卡</span>
          {hasFrame ? (
            <span className="soft-badge">句式卡</span>
          ) : (
            <span className="soft-badge">朗讀卡</span>
          )}
        </div>

        {showCardImage ? (
          <div className="relative mb-6 h-56 overflow-hidden rounded-[1.6rem] border-2 border-[var(--line)] bg-[var(--surface-strong)] shadow-sm sm:h-72">
            <Image
              src={imageSrc}
              alt={item.expectedAnswer}
              fill
              sizes="(min-width: 640px) 768px, 100vw"
              className="object-cover"
              onError={() => setShowCardImage(false)}
            />
          </div>
        ) : null}

        <div className="mb-6 rounded-[1.4rem] border-2 border-[var(--line)] bg-white/90 px-5 py-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <p className="text-3xl font-bold leading-[1.6] tracking-wide text-[var(--foreground)] sm:text-4xl">
            {currentSentence}
          </p>
          {hasFrame ? (
            <p className="mt-3 text-base text-gray-500 sm:text-lg">
              撳下面啲詞語可以換字。
            </p>
          ) : null}
        </div>

        {hasFrame && swappableSlots.length > 0 && (
          <div className="mb-6 rounded-[1.4rem] border-2 border-[var(--line)] bg-white/85 p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-lg font-semibold text-gray-600 sm:text-xl">換詞語</p>
            </div>
            <div className="space-y-3">
              {swappableSlots.map((slot) => (
                <div key={slot.id} className="rounded-[1rem] bg-[var(--surface-strong)] px-4 py-4">
                  <p className="mb-3 text-sm font-semibold text-gray-500 sm:text-base">{slot.label}</p>
                  <div className="flex flex-wrap gap-2.5">
                    {slot.options.map((opt) => (
                      <SlotChip
                        key={`${slot.id}-${opt}`}
                        label={opt}
                        category={slot.category}
                        selected={slotValues[slot.id] === opt}
                        onClick={() => handleSlotChoice(slot.id, opt)}
                        size="md"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 rounded-[1.4rem] border-2 border-[var(--line)] bg-white/85 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex gap-2">
              <motion.button
                type="button"
                onClick={handlePlay}
                disabled={status === "listening"}
                className="kid-button flex-1 bg-[var(--listen)] px-5 text-white disabled:opacity-70 flex items-center justify-center gap-2"
                whileHover={status === "listening" ? {} : { scale: 1.02 }}
                whileTap={status === "listening" ? {} : { scale: 0.98 }}
              >
                <Play size={20} fill={status === "listening" ? "none" : "currentColor"} />
                {status === "listening" ? "播放中…" : "慢慢聽"}
              </motion.button>
              {canReplay && (
                <motion.button
                  type="button"
                  onClick={handleReplay}
                  disabled={status === "listening"}
                  className="kid-button bg-white px-4 text-[var(--listen)] ring-2 ring-[var(--listen)]/15 disabled:opacity-70 flex items-center justify-center gap-2"
                  whileHover={status === "listening" ? {} : { scale: 1.02 }}
                  whileTap={status === "listening" ? {} : { scale: 0.98 }}
                  aria-label="再播"
                >
                  <Volume2 size={20} />
                </motion.button>
              )}
            </div>

            <RecordButton
              onRecordComplete={handleRecordDone}
              disabled={status === "checking" || status === "listening"}
              isRecording={status === "recording"}
              onRecordingChange={(recording) =>
                setStatus(recording ? "recording" : status === "recording" ? "checking" : status)
              }
            />
          </div>
          {lastRecordingUrl ? (
            <motion.button
              type="button"
              onClick={handlePlayLastRecording}
              className="kid-button bg-white px-5 text-[var(--foreground)] ring-2 ring-[var(--line)]/60 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Volume2 size={20} />
              播放我嘅錄音
            </motion.button>
          ) : null}
        </div>

        <FeedbackPanel message={feedback?.message} isCorrect={feedback?.isCorrect} />
      </div>
    </section>
  );
}
