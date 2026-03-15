"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Mic, Square } from "lucide-react";
import { getRecorder } from "@/lib/audio/recorder";

interface RecordButtonProps {
  onRecordComplete: (blob: Blob) => void;
  disabled?: boolean;
  isRecording?: boolean;
  onRecordingChange?: (recording: boolean) => void;
}

export function RecordButton({
  onRecordComplete,
  disabled,
  isRecording,
  onRecordingChange,
}: RecordButtonProps) {
  const [recording, setRecording] = useState(false);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = getRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onRecordComplete(blob);
      };

      recorder.start(200);
      setRecording(true);
      onRecordingChange?.(true);
    } catch (err) {
      console.error(err);
      onRecordingChange?.(false);
    }
  }, [onRecordComplete, onRecordingChange]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recording) {
      recorderRef.current.stop();
      recorderRef.current = null;
      setRecording(false);
      onRecordingChange?.(false);
    }
  }, [recording, onRecordingChange]);

  const isActive = isRecording ?? recording;

  return (
    <motion.button
      type="button"
      onClick={isActive ? stopRecording : startRecording}
      disabled={disabled}
      className={`kid-button w-full px-5 text-white disabled:opacity-50 flex items-center justify-center gap-2 ${isActive ? 'bg-gray-800' : 'bg-[var(--record)]'}`}
      aria-label={isActive ? "停止錄音" : "開始錄音"}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {isActive ? <Square size={24} fill="currentColor" /> : <Mic size={24} />}
      {isActive ? "按一下停止" : "開口講"}
    </motion.button>
  );
}
