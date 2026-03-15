"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Play, Volume2 } from "lucide-react";
import { RecordButton } from "./record-button";
import { FeedbackPanel } from "./feedback-panel";
import { ChoiceGame } from "./choice-game";
import { SentenceBuilder } from "./sentence-builder";
import { SlotChip } from "./slot-chip";
import { markSentenceCompleted, markStage } from "@/lib/progress";
import { fillFrame, getCanonicalSlotValues } from "@/lib/lesson-schema";
import type { PracticeItem } from "@/lib/lesson-schema";

interface PracticeCardProps {
  item: PracticeItem;
  weekId: string;
}

type Stage = "listen" | "choose" | "build" | "speak";

export function PracticeCard({ item, weekId }: PracticeCardProps) {
  const hasFrame = !!item.frame;
  const canonicalSlotValues = item.frame ? getCanonicalSlotValues(item.frame) : {};
  const [stage, setStage] = useState<Stage>(hasFrame ? "listen" : "speak");
  const [slotValues, setSlotValues] = useState<Record<string, string>>(canonicalSlotValues);
  const [sentenceToSay, setSentenceToSay] = useState<string>(item.expectedAnswer);
  const [status, setStatus] = useState<"idle" | "listening" | "recording" | "checking" | "success" | "retry">("idle");
  const [feedback, setFeedback] = useState<{ message: string; isCorrect: boolean } | null>(null);
  const [lastRecordingUrl, setLastRecordingUrl] = useState<string | null>(null);

  const previewSentence =
    item.frame
      ? fillFrame(item.frame.frame, { ...canonicalSlotValues, ...slotValues }) || item.frame.canonicalAnswer
      : item.expectedAnswer;
  const flashcardSentence = stage === "speak" ? sentenceToSay : previewSentence;
  const swappableSlots = item.frame?.slots.filter((slot) => slot.options.length > 1) ?? [];
  const textToPlay = flashcardSentence;

  useEffect(() => {
    return () => {
      if (lastRecordingUrl) URL.revokeObjectURL(lastRecordingUrl);
    };
  }, [lastRecordingUrl]);

  const handlePlay = useCallback(async () => {
    setStatus("listening");
    setFeedback(null);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToPlay, slow: true }),
      });
      if (!res.ok) {
        setFeedback({ message: "請稍後再試", isCorrect: false });
        setStatus("idle");
        return;
      }
      const data = await res.json();
      if (data.url) {
        const audio = new Audio(data.url);
        await audio.play();
        audio.onended = () => {
          setStatus("idle");
          if (hasFrame && stage === "listen") setStage("choose");
        };
      } else if (data.audioBase64) {
        const audio = new Audio("data:audio/wav;base64," + data.audioBase64);
        await audio.play();
        audio.onended = () => {
          setStatus("idle");
          if (hasFrame && stage === "listen") setStage("choose");
        };
      } else {
        setStatus("idle");
      }
    } catch {
      setFeedback({ message: "請稍後再試", isCorrect: false });
      setStatus("idle");
    }
  }, [textToPlay, hasFrame, stage]);

  const handleChooseCorrect = useCallback(() => {
    markStage(weekId, item.id, "choose");
    setStage("build");
    if (item.frame) setSlotValues(getCanonicalSlotValues(item.frame));
  }, [item.frame, item.id, weekId]);

  const handleSlotChoice = useCallback((slotId: string, value: string) => {
    setSlotValues((prev) => ({ ...prev, [slotId]: value }));
  }, []);

  const handleReadyToSpeak = useCallback((built: string) => {
    markStage(weekId, item.id, "build");
    setSentenceToSay(built);
    setStage("speak");
  }, [item.id, weekId]);

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
          setFeedback({ message: "請再講一次", isCorrect: false });
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
            expectedAnswer: sentenceToSay,
            alternatives: accepted.filter((a) => a !== sentenceToSay),
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
    [item.id, item.frame, item.expectedAnswer, item.alternatives, sentenceToSay, weekId]
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

  const showListen = stage === "listen" || (!hasFrame && status === "idle");
  const showChoose = hasFrame && stage === "choose";
  const showBuild = hasFrame && stage === "build";
  const showSpeak = stage === "speak" || !hasFrame;
  const showSpeakSection = showSpeak && (!hasFrame || stage === "speak");
  const stageLabel = hasFrame
    ? {
        listen: "1. 慢慢聽",
        choose: "2. 揀詞語",
        build: "3. 砌句子",
        speak: "4. 跟住講",
      }[stage]
    : "聽完再講";

  return (
    <section
      className="flashcard p-4 sm:p-5"
      aria-label="練習句子"
    >
      <div className="flashcard-body">
        <div className="mb-5 flex items-start justify-between gap-3 pt-4">
          <span className="soft-badge">{stageLabel}</span>
          {hasFrame ? (
            <span className="soft-badge">句式卡</span>
          ) : (
            <span className="soft-badge">朗讀卡</span>
          )}
        </div>

        <div className="mb-6 rounded-[1.4rem] border-2 border-[var(--line)] bg-white/90 px-5 py-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <p className="text-3xl font-bold leading-[1.6] tracking-wide text-[var(--foreground)] sm:text-4xl">
            {flashcardSentence}
          </p>
          {hasFrame ? (
            <p className="mt-3 text-base text-gray-500 sm:text-lg">
              呢句會慢慢讀出嚟，下面啲詞語可以換。
            </p>
          ) : null}
        </div>

        {hasFrame && swappableSlots.length > 0 && (
          <div className="mb-6 rounded-[1.4rem] border-2 border-[var(--line)] bg-white/85 p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-lg font-semibold text-gray-600 sm:text-xl">可以換嘅詞語</p>
              <span className="soft-badge">句子會跟住改變</span>
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
                        disabled={stage === "choose"}
                        onClick={stage === "choose" ? undefined : () => handleSlotChoice(slot.id, opt)}
                        size="md"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showListen && (
          <motion.div
            key="listen"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-5"
          >
            <motion.button
              type="button"
              onClick={handlePlay}
              disabled={status === "listening"}
              className="kid-button w-full bg-[var(--listen)] px-5 text-white disabled:opacity-70 flex items-center justify-center gap-2"
              whileHover={status === "listening" ? {} : { scale: 1.02 }}
              whileTap={status === "listening" ? {} : { scale: 0.98 }}
            >
              <Play size={24} fill={status === "listening" ? "none" : "currentColor"} />
              {status === "listening" ? "慢慢播放中…" : "慢慢聽"}
            </motion.button>
            <p className="mt-3 text-center text-base text-gray-600 sm:text-lg">
              {hasFrame ? "先聽句子，再揀一個可以換嘅詞語。之後你可以砌句子同自己講。" : "先慢慢聽，再自己講一次。"}
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {showChoose && item.frame && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6 rounded-[1.4rem] border-2 border-[var(--line)] bg-white/85 p-5"
            >
              <ChoiceGame frameItem={item.frame} onCorrect={handleChooseCorrect} />
            </motion.div>
          )}

          {showBuild && item.frame && (
            <motion.div
              key="build"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6 rounded-[1.4rem] border-2 border-[var(--line)] bg-white/85 p-5"
            >
              <SentenceBuilder
                frameItem={item.frame}
                slotValues={slotValues}
                onSlotChoice={handleSlotChoice}
                onReadyToSpeak={handleReadyToSpeak}
              />
            </motion.div>
          )}

          {showSpeakSection && (
            <motion.div
              key="speak"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col gap-4 rounded-[1.4rem] border-2 border-[var(--line)] bg-white/85 p-5"
            >
              {(hasFrame ? sentenceToSay : item.expectedAnswer) && (
                <div className="rounded-2xl bg-[var(--primary-soft)] px-4 py-4 text-center">
                  <p className="mb-1 text-base font-semibold text-[var(--foreground)] sm:text-lg">
                    講呢句
                  </p>
                  <p className="text-2xl font-bold leading-relaxed text-[var(--foreground)] sm:text-3xl">
                    {hasFrame ? sentenceToSay : item.expectedAnswer}
                  </p>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <motion.button
                  type="button"
                  onClick={handlePlay}
                  disabled={status === "listening"}
                  className="kid-button bg-white px-5 text-[var(--listen)] ring-2 ring-[var(--listen)]/15 disabled:opacity-70 flex items-center justify-center gap-2"
                  whileHover={status === "listening" ? {} : { scale: 1.02 }}
                  whileTap={status === "listening" ? {} : { scale: 0.98 }}
                >
                  <Play size={20} />
                  再聽一次
                </motion.button>
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
            </motion.div>
          )}
        </AnimatePresence>

        <FeedbackPanel message={feedback?.message} isCorrect={feedback?.isCorrect} />
      </div>
    </section>
  );
}
