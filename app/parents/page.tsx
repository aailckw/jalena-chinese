import Link from "next/link";

export default function ParentsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      <header className="mb-8">
        <Link
          href="/"
          className="text-[var(--primary)] font-medium mb-2 inline-block"
        >
          ← 返回
        </Link>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          家長設定
        </h1>
      </header>
      <main className="max-w-xl mx-auto space-y-6 text-gray-700">
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            使用方法
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>請先選擇主題，再按「開始練習」。</li>
            <li>按「聽」就可以聽到句子朗讀。</li>
            <li>按「講」並允許使用麥克風，之後照住句子講。</li>
            <li>再按一次就會停止錄音，系統會顯示「好叻」或者「再試一次」。</li>
            <li>進度會儲存在這個瀏覽器入面，可以去「睇吓我嘅進度」查看。</li>
          </ul>
        </section>
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            設定說明
          </h2>
          <ol className="list-decimal pl-5 space-y-3">
            <li>
              <strong>麥克風：</strong>小朋友第一次按「講」時，瀏覽器會要求使用麥克風，請按允許。
            </li>
            <li>
              <strong>金鑰：</strong>請在伺服器環境變數設定 <code className="bg-gray-100 px-1 rounded">DASHSCOPE_API_KEY</code>，例如放在 <code className="bg-gray-100 px-1 rounded">.env.local</code>。
            </li>
            <li>
              <strong>語音辨識：</strong>系統會把錄音轉成 16 kHz WAV。如果畫面顯示需要安裝 ffmpeg，請先在執行程式的電腦安裝 <a href="https://ffmpeg.org/download.html" className="text-[var(--primary)] underline">ffmpeg</a>。
            </li>
          </ol>
        </section>
        <Link
          href="/"
          className="inline-block rounded-xl bg-[var(--primary)] px-6 py-3 text-white font-medium"
        >
          返回練習
        </Link>
      </main>
    </div>
  );
}
