import { NextResponse } from "next/server";
import { createReadStream, unlinkSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { spawn } from "child_process";
import WebSocket from "ws";

const ASR_WS_URL = "wss://dashscope-intl.aliyuncs.com/api-ws/v1/inference/";
const MODEL = "fun-asr-realtime";
const SAMPLE_RATE = 16000;

function generateTaskId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

function runFfmpegToWav(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(
      "ffmpeg",
      [
        "-y",
        "-i",
        inputPath,
        "-ar",
        String(SAMPLE_RATE),
        "-ac",
        "1",
        "-f",
        "wav",
        outputPath,
      ],
      { stdio: "pipe" }
    );
    ffmpeg.on("error", (err) => reject(err));
    ffmpeg.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with ${code}`));
    });
  });
}

async function runAsrWithWebSocket(wavPath: string, apiKey: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const taskId = generateTaskId();
    const transcripts: string[] = [];
    const ws = new WebSocket(ASR_WS_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    ws.on("open", () => {
      ws.send(
        JSON.stringify({
          header: {
            action: "run-task",
            task_id: taskId,
            streaming: "duplex",
          },
          payload: {
            task_group: "audio",
            task: "asr",
            function: "recognition",
            model: MODEL,
            parameters: {
              format: "wav",
              sample_rate: SAMPLE_RATE,
            },
            input: {},
          },
        })
      );
    });

    ws.on("message", (data: Buffer | string) => {
      const raw = data.toString();
      if (raw.startsWith("{")) {
        try {
          const msg = JSON.parse(raw) as {
            header?: { event?: string };
            payload?: { output?: { sentence?: { text?: string } } };
          };
          const event = msg.header?.event;
          if (event === "task-started") {
            const stream = createReadStream(wavPath);
            stream.on("data", (chunk: Buffer | string) => {
              if (Buffer.isBuffer(chunk) && ws.readyState === WebSocket.OPEN) ws.send(chunk);
            });
            stream.on("end", () => {
              ws.send(
                JSON.stringify({
                  header: {
                    action: "finish-task",
                    task_id: taskId,
                    streaming: "duplex",
                  },
                  payload: { input: {} },
                })
              );
            });
            stream.on("error", (err) => {
              ws.close();
              reject(err);
            });
            return;
          }
          if (event === "result-generated") {
            const text = msg.payload?.output?.sentence?.text;
            if (text) transcripts.push(text);
          }
          if (event === "task-finished" || event === "task-failed") {
            ws.close();
            resolve(transcripts.join("").trim() || "");
          }
        } catch {
          // ignore non-JSON
        }
      }
    });

    ws.on("error", reject);
    ws.on("close", () => {
      resolve(transcripts.join("").trim() || "");
    });
  });
}

/**
 * ASR route: Fun-ASR realtime (supports Cantonese 粤语) via WebSocket.
 * POST: multipart/form-data with "audio" file (webm or wav).
 * Converts to 16kHz mono WAV via ffmpeg, then streams to DashScope.
 * Returns: { transcript: string }
 */
export async function POST(request: Request) {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "DASHSCOPE_API_KEY not configured",
        code: "MISSING_API_KEY",
        hint: "Add DASHSCOPE_API_KEY in Vercel (or your host) Environment Variables.",
      },
      { status: 503 }
    );
  }
  const formData = await request.formData();
  const audio = formData.get("audio");
  if (!audio || !(audio instanceof Blob)) {
    return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
  }

  const tmpDir = tmpdir();
  const ext = audio.type.includes("wav") ? "wav" : "webm";
  const inputPath = join(tmpDir, `asr-in-${Date.now()}.${ext}`);
  const wavPath = join(tmpDir, `asr-${Date.now()}.wav`);
  let pathToRecognize = wavPath;

  try {
    const buf = Buffer.from(await audio.arrayBuffer());
    const { writeFile } = await import("fs/promises");
    await writeFile(inputPath, buf);

    if (ext !== "wav") {
      try {
        await runFfmpegToWav(inputPath, wavPath);
      } catch {
        if (existsSync(inputPath)) unlinkSync(inputPath);
        return NextResponse.json(
          {
            error: "Server needs ffmpeg to convert audio. Install ffmpeg and try again.",
            code: "FFMPEG_REQUIRED",
            hint: "On Vercel, ASR may be unavailable unless you use a custom runtime with ffmpeg.",
          },
          { status: 503 }
        );
      }
      if (existsSync(inputPath)) unlinkSync(inputPath);
    } else {
      pathToRecognize = inputPath;
    }

    const transcript = await runAsrWithWebSocket(pathToRecognize, apiKey);
    if (existsSync(pathToRecognize)) unlinkSync(pathToRecognize);
    return NextResponse.json({ transcript });
  } catch (err) {
    if (existsSync(inputPath)) try { unlinkSync(inputPath); } catch {}
    if (existsSync(wavPath)) try { unlinkSync(wavPath); } catch {}
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "ASR failed", code: "ASR_ERROR" },
      { status: 502 }
    );
  }
}
