import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const SCENE_FILE = path.join(projectRoot, "data", "card-image-scenes.json");
const OUTPUT_DIR = path.join(projectRoot, "public", "generated", "card-images");
const DEFAULT_BASE_URL = "https://dashscope-intl.aliyuncs.com/api/v1";
const DEFAULT_MODEL = "wan2.6-image";
const DEFAULT_SIZE = "1280*960";
const DEFAULT_POLL_MS = 10000;
const STYLE_PROMPT = [
  "Create one polished illustration for a kindergarten Cantonese learning flashcard.",
  "Use a consistent 2D cartoon picture-book style across the whole series.",
  "Warm pastel colors, clean rounded outlines, soft shading, simple uncluttered background, friendly expressions, and clear main subject.",
  "Make it kid-safe, cheerful, and easy to understand at a glance.",
  "No text, no speech bubbles, no letters, no watermark, no logo."
].join(" ");
const NEGATIVE_PROMPT = [
  "photorealistic",
  "real photo",
  "3d render",
  "dark",
  "scary",
  "violent",
  "messy composition",
  "blurry",
  "low quality",
  "distorted anatomy",
  "extra fingers",
  "text",
  "letters",
  "watermark",
  "logo",
  "signature"
].join(", ");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function hasArg(flag) {
  return process.argv.includes(flag);
}

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const equalIndex = trimmed.indexOf("=");
  if (equalIndex === -1) return null;
  const key = trimmed.slice(0, equalIndex).trim();
  if (!key) return null;
  let value = trimmed.slice(equalIndex + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return { key, value };
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed) continue;
    if (!(parsed.key in process.env)) {
      process.env[parsed.key] = parsed.value;
    }
  }
}

function loadProjectEnv() {
  loadEnvFile(path.join(projectRoot, ".env.local"));
  loadEnvFile(path.join(projectRoot, ".env"));
}

function buildPrompt(entry) {
  return `${STYLE_PROMPT} Scene: ${entry.scene}`;
}

function createRequestBody(entry, index, model, size) {
  return {
    model,
    input: {
      messages: [
        {
          role: "user",
          content: [{ text: buildPrompt(entry) }]
        }
      ]
    },
    parameters: {
      enable_interleave: true,
      max_images: 1,
      size,
      negative_prompt: NEGATIVE_PROMPT,
      watermark: false,
      seed: 20260315 + index
    }
  };
}

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Expected JSON response but received: ${text.slice(0, 300)}`);
  }
}

async function createImageTask(entry, index, apiKey, baseUrl, model, size) {
  const response = await fetch(`${baseUrl}/services/aigc/image-generation/generation`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-DashScope-Async": "enable"
    },
    body: JSON.stringify(createRequestBody(entry, index, model, size))
  });

  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(data.message ?? `Task creation failed with status ${response.status}`);
  }

  const taskId = data.output?.task_id;
  if (!taskId) {
    throw new Error(`Task creation succeeded but no task_id was returned for ${entry.itemId}.`);
  }
  return { taskId, requestId: data.request_id ?? null };
}

async function fetchTaskResult(taskId, apiKey, baseUrl) {
  const response = await fetch(`${baseUrl}/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(data.message ?? `Task fetch failed with status ${response.status}`);
  }
  return data;
}

function extractImageUrl(taskData) {
  const choices = taskData.output?.choices ?? [];
  for (const choice of choices) {
    const content = choice.message?.content ?? [];
    for (const part of content) {
      if (part.type === "image" && typeof part.image === "string" && part.image) {
        return part.image;
      }
    }
  }
  return null;
}

async function waitForImageUrl(taskId, apiKey, baseUrl, pollMs) {
  for (;;) {
    const taskData = await fetchTaskResult(taskId, apiKey, baseUrl);
    const status = taskData.output?.task_status;

    if (status === "SUCCEEDED") {
      const imageUrl = extractImageUrl(taskData);
      if (!imageUrl) {
        throw new Error(`Task ${taskId} succeeded but did not return an image URL.`);
      }
      return {
        imageUrl,
        usage: taskData.usage ?? null,
        requestId: taskData.request_id ?? null
      };
    }

    if (status === "FAILED" || status === "CANCELED" || status === "UNKNOWN") {
      throw new Error(taskData.message ?? `Task ${taskId} ended with status ${status}.`);
    }

    console.log(`  waiting on task ${taskId} (${status ?? "PENDING"})`);
    await sleep(pollMs);
  }
}

async function downloadImage(imageUrl, outputPath) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Image download failed with status ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, buffer);
}

async function main() {
  loadProjectEnv();

  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing DASHSCOPE_API_KEY. Put it in your shell or .env/.env.local.");
  }

  const baseUrl = (process.env.DASHSCOPE_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const model = process.env.DASHSCOPE_IMAGE_MODEL || DEFAULT_MODEL;
  const size = process.env.DASHSCOPE_IMAGE_SIZE || DEFAULT_SIZE;
  const pollMs = Number(process.env.DASHSCOPE_IMAGE_POLL_MS || DEFAULT_POLL_MS);
  const onlyItemId = getArgValue("--only");
  const limitValue = getArgValue("--limit");
  const limit = limitValue ? Number(limitValue) : undefined;
  const force = hasArg("--force");

  const sceneEntries = JSON.parse(await readFile(SCENE_FILE, "utf8"));
  const filteredEntries = sceneEntries.filter((entry) => {
    if (!onlyItemId) return true;
    return entry.itemId === onlyItemId;
  });
  const entries = Number.isFinite(limit)
    ? filteredEntries.slice(0, limit)
    : filteredEntries;

  if (entries.length === 0) {
    throw new Error("No image scenes matched. Check --only or the scene manifest.");
  }

  await mkdir(OUTPUT_DIR, { recursive: true });

  console.log(`Generating ${entries.length} card image(s) with ${model}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Output: ${OUTPUT_DIR}`);

  const failures = [];
  let generated = 0;
  let skipped = 0;

  for (const [index, entry] of entries.entries()) {
    const outputPath = path.join(OUTPUT_DIR, `${entry.itemId}.png`);
    if (!force && existsSync(outputPath)) {
      console.log(`Skipping ${entry.itemId} (already exists)`);
      skipped += 1;
      continue;
    }

    console.log(`Generating ${entry.itemId}...`);
    try {
      const { taskId, requestId } = await createImageTask(entry, index, apiKey, baseUrl, model, size);
      if (requestId) {
        console.log(`  request id: ${requestId}`);
      }
      const result = await waitForImageUrl(taskId, apiKey, baseUrl, pollMs);
      await downloadImage(result.imageUrl, outputPath);
      console.log(`  saved: ${path.relative(projectRoot, outputPath)}`);
      if (result.usage?.size || result.usage?.image_count) {
        console.log(
          `  usage: ${result.usage.image_count ?? 1} image, ${result.usage.size ?? "unknown size"}`
        );
      }
      generated += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  failed: ${message}`);
      failures.push({ itemId: entry.itemId, message });
    }
  }

  console.log("");
  console.log(`Done. Generated ${generated}, skipped ${skipped}, failed ${failures.length}.`);

  if (failures.length > 0) {
    process.exitCode = 1;
    for (const failure of failures) {
      console.error(`- ${failure.itemId}: ${failure.message}`);
    }
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
