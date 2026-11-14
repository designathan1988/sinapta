import { describe, expect, it } from "vitest";
import {
  aiCommands,
  askAi,
  createTestApp,
  type Command,
} from "../state/index.ts";
import { startAi } from "./ai-client.ts";

const FRAMES = [
  'event: part\ndata: {"text":"The launch "}\n\n',
  'event: part\ndata: {"text":"moved."}\n\n',
  'event: done\ndata: {"provider":"local"}\n\n',
];

function streamed(frames: readonly string[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const frame of frames) controller.enqueue(encoder.encode(frame));
      controller.close();
    },
  });
  return new Response(body, { status: 200 });
}

describe("the AI client", () => {
  it("records each part as it comes, then the whole answer", async () => {
    const { store, dispatch } = createTestApp({ commands: aiCommands });
    const sent: Command[] = [];
    let done: () => void = () => undefined;
    const finished = new Promise<void>((resolve) => {
      done = resolve;
    });
    startAi({
      store,
      dispatch: (command) => {
        sent.push(command);
        const result = dispatch(command);
        if (command.type === "ai.answer") done();
        return result;
      },
      send: () => Promise.resolve(streamed(FRAMES)),
    });

    dispatch(askAi.create({ blockId: "b1", action: "summarize", text: "x" }));
    await finished;

    expect(sent.map((command) => command.type)).toEqual([
      "ai.answerPart",
      "ai.answerPart",
      "ai.answer",
    ]);
    expect(store.getState().persistence.ai).toMatchObject({
      status: "answered",
      answer: "The launch moved.",
    });
  });
});
