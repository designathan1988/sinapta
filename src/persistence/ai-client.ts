// Asks the server's AI each question the store records, and records the
// answer as it is written (ADR-0013): each part as it comes, then the
// whole answer.
import {
  answerAi,
  answerAiPart,
  type AppStore,
  type Command,
  type Dispatch,
} from "../state/index.ts";
import type { Fetch } from "./account-client.ts";
import { readAiFrame } from "./ai-stream.schema.ts";

const FRAME_END = "\n\n";

async function readFrames(
  body: ReadableStream<Uint8Array>,
  onFrame: (frame: string) => void,
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";
  for await (const chunk of body) {
    buffer += decoder.decode(chunk, { stream: true });
    const frames = buffer.split(FRAME_END);
    buffer = frames.pop() ?? "";
    frames.forEach(onFrame);
  }
}

async function ask(send: Fetch, body: unknown, dispatch: Dispatch) {
  const response = await send("/api/ai/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  if (!response.ok || response.body === null) {
    return answerAi.create({ answer: null, error: "network" });
  }
  let answer = "";
  let last: Command = answerAi.create({ answer: null, error: "network" });
  await readFrames(response.body, (text) => {
    const frame = readAiFrame(text);
    if (frame?.kind === "part") {
      answer += frame.text;
      dispatch(answerAiPart.create({ part: frame.text }));
    } else if (frame?.kind === "done") {
      last = answerAi.create({ answer: answer.trim(), error: null });
    } else if (frame?.kind === "error") {
      const error = frame.isModelMissing ? "model-missing" : "network";
      last = answerAi.create({ answer: null, error });
    }
  });
  return last;
}

export function startAi(options: {
  readonly store: AppStore;
  readonly dispatch: Dispatch;
  readonly send?: Fetch;
}): void {
  const {
    store,
    dispatch,
    send = (input, init) => fetch(input, init),
  } = options;
  let asked = store.getState().persistence.ai.requestCount;
  store.subscribe((state) => {
    const { requestCount, status, action, text } = state.persistence.ai;
    if (requestCount === asked || status !== "thinking") return;
    asked = requestCount;
    void ask(send, { action, text }, dispatch).then(
      (command) => dispatch(command),
      () => dispatch(answerAi.create({ answer: null, error: "network" })),
    );
  });
}
