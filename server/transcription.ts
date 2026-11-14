// AI Meeting Notes hear the meeting on the server, as Notion's do
// (ADR-0013): the browser sends what its microphone heard as 16 kHz
// samples, and a local Whisper model (Transformers.js) turns them into
// words. The model is fetched once into .data/models and kept in memory.
import { resolve } from "node:path";
import * as v from "valibot";
import { answer, type RouteTable } from "./api.ts";
import { sessionUser } from "./sessions.ts";
import { membership } from "./workspaces.ts";

export type Transcribe = (samples: Float32Array) => Promise<string>;

export const MODELS_DIR = resolve(".data/models");
const MODEL = process.env.PAGECRAFT_SPEECH_MODEL ?? "Xenova/whisper-base.en";
const SAMPLE_RATE = 16_000;
// A minute of speech at most per request.
const MAX_SECONDS = 60;

function textOf(output: unknown): string {
  const first: unknown = Array.isArray(output) ? output[0] : output;
  if (typeof first !== "object" || first === null) return "";
  const text: unknown = Reflect.get(first, "text");
  return typeof text === "string" ? text.trim() : "";
}

// The local model, loaded on first use.
export function localTranscriber(modelsDir = MODELS_DIR): Transcribe {
  let recognizer:
    Promise<(samples: Float32Array) => Promise<unknown>> | undefined;
  const load = async () => {
    const { env, pipeline } = await import("@huggingface/transformers");
    env.cacheDir = modelsDir;
    const asr = await pipeline("automatic-speech-recognition", MODEL, {
      dtype: "q8",
    });
    return (samples: Float32Array) => asr(samples);
  };
  return async (samples) => {
    recognizer ??= load();
    return textOf(await (await recognizer)(samples));
  };
}

// 16-bit little-endian mono samples, as base64, read as floats.
export function samplesOf(audio: string): Float32Array {
  const bytes = Buffer.from(audio, "base64");
  const count = Math.floor(bytes.length / 2);
  const samples = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    samples[index] = bytes.readInt16LE(index * 2) / 32_768;
  }
  return samples;
}

const audioSchema = v.object({
  audio: v.pipe(
    v.string(),
    v.maxLength(Math.ceil((SAMPLE_RATE * 2 * MAX_SECONDS * 4) / 3) + 4),
  ),
});

export function transcriptionRoutes(transcribe: Transcribe): RouteTable {
  return {
    "POST /api/workspaces/:id/transcribe": async (request, context) => {
      const user = sessionUser(context, request);
      if (user === undefined) return answer(401, { error: "signed-out" });
      const id = request.params.id ?? "";
      if (membership(context, id, user.id) === undefined) {
        return answer(404, { error: "not-found" });
      }
      const { audio } = v.parse(audioSchema, request.body);
      const samples = samplesOf(audio);
      if (samples.length === 0) return answer(200, { text: "" });
      try {
        return answer(200, { text: await transcribe(samples) });
      } catch (error) {
        context.log(`transcription: ${String(error)}`);
        return answer(503, { error: "no-speech-model" });
      }
    },
  };
}
