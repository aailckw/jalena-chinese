"use client";

import Link from "next/link";
import { useState } from "react";
import { getLessonWeeks } from "@/data/worksheet-lessons";
import { getAllWeeksProgress, getPatternSummaries } from "@/lib/progress";

function formatFrameLabel(frame: string): string {
  return frame.replace(/\{\w+\}/g, "__");
}

export default function ReviewPage() {
  const [progress] = useState<Record<string, string[]>>(() => getAllWeeksProgress());
  const weeks = getLessonWeeks();

  const totalSentences = weeks.reduce((sum, w) => sum + w.sentences.length, 0);
  const totalCompleted = Object.values(progress).reduce((sum, ids) => sum + ids.length, 0);

  return (
    <div className="min-h-screen p-5 sm:p-8">
      <div className="page-shell">
        <header className="page-panel mb-8 rounded-[1.75rem] px-6 py-6">
        <Link
          href="/"
          className="mb-3 inline-block text-lg font-semibold text-[var(--primary)]"
        >
          ← 返回
        </Link>
        <h1 className="text-3xl font-black text-[var(--foreground)] sm:text-4xl">
          睇吓我嘅進度
        </h1>
        </header>
        <main className="mx-auto max-w-4xl space-y-6">
        <section className="page-panel rounded-[1.75rem] p-6">
          <h2 className="mb-2 text-xl font-bold">今個學期</h2>
          <p className="text-3xl font-bold text-[var(--primary)]">
            {totalCompleted} / {totalSentences}{" "}
            <span className="text-lg font-normal text-gray-600">句</span>
          </p>
          <p className="text-gray-600 mt-1">
            {totalSentences > 0
              ? `你已經練咗 ${Math.round((100 * totalCompleted) / totalSentences)}% 喇！`
              : "開始練習啦！"}
          </p>
        </section>
        <section className="page-panel rounded-[1.75rem] p-6">
          <h2 className="mb-4 text-xl font-bold">每個主題</h2>
          <ul className="space-y-3">
            {weeks.map((w) => {
              const done = (progress[w.id] ?? []).length;
              const total = w.sentences.length;
              const stars = total > 0 ? Math.round((3 * done) / total) : 0;
              return (
                <li key={w.id} className="flex items-center justify-between rounded-2xl border-2 border-[var(--line)] bg-white px-4 py-4">
                  <div>
                    <span className="font-medium">{w.theme}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      {done}/{total}
                    </span>
                  </div>
                  <span className="text-2xl" aria-label={`${stars} stars`}>
                    {"★".repeat(stars)}{"☆".repeat(3 - stars)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="page-panel rounded-[1.75rem] p-6">
          <h2 className="mb-4 text-xl font-bold">句式練習</h2>
          <p className="text-gray-600 text-sm mb-3">
            選詞、砌句、講：選詞 / 砌句 / 講
          </p>
          <ul className="space-y-3">
            {weeks.map((w) => {
              const summaries = getPatternSummaries(w.id, w.sentences);
              return summaries.map((ps) => (
                <li key={`${w.id}-${ps.frame}`} className="flex flex-col gap-1 rounded-2xl border-2 border-[var(--line)] bg-white px-4 py-4">
                  <span className="font-medium text-sm">{formatFrameLabel(ps.frame)}</span>
                  <span className="text-gray-500 text-sm">
                    選詞 {ps.choose}/{ps.total} · 砌句 {ps.build}/{ps.total} · 講 {ps.speak}/{ps.total}
                  </span>
                </li>
              ));
            })}
          </ul>
        </section>
        <Link
          href="/"
          className="kid-button block text-center bg-[var(--primary)] px-6 py-4 text-white"
        >
          返去練習
        </Link>
        <Link
          href="/parents"
          className="block text-center text-base font-medium text-gray-500"
        >
          家長設定
        </Link>
        </main>
      </div>
    </div>
  );
}
