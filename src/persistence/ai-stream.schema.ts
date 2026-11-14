// The frames of the AI's streamed answer (ADR-0013), read at the boundary:
// "part" with the next words, "done", or "error".
import * as v from "valibot";

const partSchema = v.object({ text: v.string() });
const errorSchema = v.object({ error: v.string() });

export type AiFrame =
  | { readonly kind: "part"; readonly text: string }
  | { readonly kind: "done" }
  | { readonly kind: "error"; readonly isModelMissing: boolean };

function dataOf(frame: string): unknown {
  const line = frame.split("\n").find((each) => each.startsWith("data: "));
  if (line === undefined) return undefined;
  try {
    const value: unknown = JSON.parse(line.slice("data: ".length));
    return value;
  } catch {
    return undefined;
  }
}

export function readAiFrame(frame: string): AiFrame | undefined {
  const event = frame
    .split("\n")
    .find((each) => each.startsWith("event: "))
    ?.slice("event: ".length);
  const data = dataOf(frame);
  if (event === "done") return { kind: "done" };
  if (event === "part") {
    const part = v.safeParse(partSchema, data);
    return part.success ? { kind: "part", text: part.output.text } : undefined;
  }
  if (event === "error") {
    const error = v.safeParse(errorSchema, data);
    const isModelMissing =
      error.success && error.output.error === "model-missing";
    return { kind: "error", isModelMissing };
  }
  return undefined;
}
