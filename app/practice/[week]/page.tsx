import Link from "next/link";
import { notFound } from "next/navigation";
import { getLessonWeek } from "@/data/worksheet-lessons";
import { PracticeCard } from "@/components/practice-card";
import { ProgressIndicator } from "@/components/progress-indicator";

interface PageProps {
  params: Promise<{ week: string }>;
}

export default async function PracticePage({ params }: PageProps) {
  const { week } = await params;
  const lesson = getLessonWeek(week);
  if (!lesson) notFound();

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
          <div className="flex flex-wrap items-center gap-3">
            <span className="soft-badge">{lesson.dateRange}</span>
            <span className="soft-badge">慢慢聽 + 砌句 + 自己講</span>
          </div>
          <h1 className="mt-4 text-3xl font-black text-[var(--foreground)] sm:text-4xl">
            {lesson.theme}
          </h1>
          <ProgressIndicator weekId={lesson.id} totalSentences={lesson.sentences.length} />
        </header>
        <main className="mx-auto max-w-4xl space-y-8">
          {lesson.sentences.map((item) => (
            <PracticeCard key={item.id} item={item} weekId={lesson.id} />
          ))}
        </main>
      </div>
    </div>
  );
}
