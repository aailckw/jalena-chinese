import Link from "next/link";
import Image from "next/image";
import { getLessonWeeks } from "@/data/worksheet-lessons";

export default function Home() {
  const weeks = getLessonWeeks();
  return (
    <div className="min-h-screen p-5 sm:p-8">
      <div className="page-shell">
        <header className="mb-8 rounded-[2rem] border-2 border-[var(--line)] bg-white/75 px-6 py-8 text-center shadow-[var(--shadow-soft)]">
          <p className="mb-3 inline-flex rounded-full bg-[var(--primary-soft)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]">
            幼兒廣東話練習
          </p>
          <h1 className="mb-3 text-4xl font-black tracking-wide text-[var(--foreground)] sm:text-5xl">
            學廣東話
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-8 text-gray-600 sm:text-xl">
            慢慢聽、砌句子、自己講。用好大張字卡同 AI 朗讀，幫小朋友自己練習。
          </p>
        </header>
        <main className="mx-auto flex max-w-3xl flex-col gap-6">
        <Link
          href="/practice/2-7"
          className="kid-button flex min-h-24 items-center justify-center rounded-[1.5rem] bg-[var(--primary)] px-6 text-center text-2xl text-white hover:bg-[var(--primary-hover)]"
        >
          開始練習
        </Link>
        <section className="page-panel rounded-[1.75rem] p-6 sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">選擇主題</h2>
            <span className="soft-badge">4 個主題</span>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {weeks.map((w) => (
              <li key={w.id}>
                <Link
                  href={`/practice/${w.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-[1.4rem] border-2 border-[var(--line)] bg-white text-left text-[var(--foreground)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--surface-strong)]"
                >
                  <div className="relative h-40 w-full overflow-hidden border-b-2 border-[var(--line)] bg-[var(--surface-strong)] sm:h-48">
                    <Image
                      src={`/generated/card-images/theme-${w.id}.png`}
                      alt={w.theme}
                      fill
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <span className="mb-2 inline-flex w-fit rounded-full bg-[var(--primary-soft)] px-3 py-1 text-sm font-semibold text-gray-700">
                      {w.dateRange}
                    </span>
                    <div className="text-xl font-bold">{w.theme}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <Link
          href="/review"
          className="kid-button flex items-center justify-center border-2 border-[var(--line)] bg-white text-gray-700"
        >
          睇吓我嘅進度
        </Link>
        <Link
          href="/parents"
          className="text-center text-base font-medium text-gray-500 hover:underline"
        >
          家長設定
        </Link>
        </main>
      </div>
    </div>
  );
}
