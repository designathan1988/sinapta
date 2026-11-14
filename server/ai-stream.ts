// Notion AI writes its answer as it goes (ADR-0013): the model's words are
// sent as they come, as Server-Sent Events, then "done"; without a model
// the plain-text answer is sent a few words at a time.
import * as v from "valibot";
import { answer, type ApiContext, type RouteTable } from "./api.ts";
import {
  AI_ACTIONS,
  askLocally,
  INSTRUCTIONS,
  MODEL,
  OLLAMA,
  type Action,
} from "./ai.ts";
import type { ApiRequest } from "./http-exchange.ts";
import { sessionUser } from "./sessions.ts";

type Send = (event: string, data: unknown) => void;

const WORDS_PER_PART = 3;
const PART_MS = 40;

const askSchema = v.object({
  action: v.picklist(AI_ACTIONS),
  text: v.pipe(v.string(), v.maxLength(20_000)),
});
const lineSchema = v.object({ response: v.string(), done: v.boolean() });

// Each line Ollama streams is a JSON object with the next words.
function sendLines(buffer: string, send: Send): string {
  const lines = buffer.split("\n");
  for (const line of lines.slice(0, -1)) {
    if (line.trim() === "") continue;
    const parsed = v.safeParse(lineSchema, JSON.parse(line));
    if (parsed.success && parsed.output.response !== "") {
      send("part", { text: parsed.output.response });
    }
  }
  return lines.at(-1) ?? "";
}

async function streamOllama(
  action: Action,
  text: string,
  send: Send,
): Promise<boolean> {
  try {
    const response = await fetch(OLLAMA, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        prompt: `${INSTRUCTIONS[action]}\n\n${text}`,
        stream: true,
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok || response.body === null) return false;
    const decoder = new TextDecoder();
    let buffer = "";
    for await (const chunk of response.body) {
      buffer = sendLines(
        buffer + decoder.decode(chunk, { stream: true }),
        send,
      );
    }
    return true;
  } catch {
    return false;
  }
}

async function streamLocally(text: string, send: Send): Promise<void> {
  const words = text.split(/(?<=\s)/);
  for (let at = 0; at < words.length; at += WORDS_PER_PART) {
    send("part", { text: words.slice(at, at + WORDS_PER_PART).join("") });
    await new Promise((resolve) => setTimeout(resolve, PART_MS));
  }
}

async function streamAnswer(
  body: v.InferOutput<typeof askSchema>,
  send: Send,
): Promise<void> {
  if (await streamOllama(body.action, body.text, send)) {
    send("done", { provider: "ollama" });
    return;
  }
  const local = askLocally(body.action, body.text);
  if (local === undefined) {
    send("error", { error: "model-missing" });
    return;
  }
  await streamLocally(local, send);
  send("done", { provider: "local" });
}

export const AI_STREAM_ROUTES: RouteTable = {
  "POST /api/ai/stream": (request: ApiRequest, context: ApiContext) => {
    if (sessionUser(context, request) === undefined) {
      return answer(401, { error: "signed-out" });
    }
    const body = v.parse(askSchema, request.body);
    return {
      status: 200,
      stream: {
        start: (send, end) => {
          void streamAnswer(body, send).finally(end);
          return () => undefined;
        },
      },
    };
  },
};
