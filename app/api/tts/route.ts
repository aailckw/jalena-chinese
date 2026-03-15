import { NextResponse } from "next/server";

const TTS_URL = "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";
const MODEL = "qwen3-tts-flash";
/** Cantonese-capable voice (Qwen3-TTS-Flash) */
const VOICE = "Kiki";

function toKidFriendlySlowText(text: string): string {
  return text
    .replace(/[（(].*?[）)]/g, "")
    .replace(/，/g, "， ")
    .replace(/。/g, "。 ")
    .replace(/,/g, "， ")
    .replace(/\s+/g, " ")
    .trim();
}

async function requestTts(apiKey: string, text: string, languageType: string) {
  return fetch(TTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      input: {
        text,
        voice: VOICE,
        language_type: languageType,
      },
    }),
  });
}

/**
 * TTS route: Qwen TTS via DashScope international endpoint.
 * POST body: { text: string, slow?: boolean }
 * Returns: { url?: string, audioBase64?: string }
 */
export async function POST(request: Request) {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "DASHSCOPE_API_KEY not configured" },
      { status: 503 }
    );
  }
  let body: { text?: string; slow?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const slow = body.slow !== false;
  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }
  const ttsText = slow ? toKidFriendlySlowText(text) : text;

  // Prefer Cantonese voice output first; fallback to generic Chinese if provider rejects it.
  let res = await requestTts(apiKey, ttsText, "Cantonese");
  if (!res.ok) {
    res = await requestTts(apiKey, ttsText, "Chinese");
  }
  if (!res.ok && slow && ttsText !== text) {
    res = await requestTts(apiKey, text, "Cantonese");
  }
  if (!res.ok && slow && ttsText !== text) {
    res = await requestTts(apiKey, text, "Chinese");
  }

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json(
      { error: "TTS request failed", details: err },
      { status: res.status >= 500 ? 502 : res.status }
    );
  }

  const data = (await res.json()) as {
    output?: { audio?: { url?: string; data?: string } };
    code?: string;
    message?: string;
  };

  if (data.code && data.code !== "") {
    return NextResponse.json(
      { error: data.message ?? "TTS error" },
      { status: 400 }
    );
  }

  const url = data.output?.audio?.url;
  const audioBase64 = data.output?.audio?.data;
  if (url) {
    return NextResponse.json({ url });
  }
  if (audioBase64) {
    return NextResponse.json({ audioBase64 });
  }
  return NextResponse.json(
    { error: "No audio in response" },
    { status: 502 }
  );
}
