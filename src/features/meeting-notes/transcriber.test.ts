import { describe, expect, it } from "vitest";
import {
  meetingNotesDefinition,
  startTranscribing,
  stopTranscribing,
} from "../../blocks/meeting-notes/index.ts";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createTestApp } from "../../state/index.ts";
import { startTranscriber, type Listener } from "./transcriber.ts";

const blockId = toBlockId("m");

function fakeListener() {
  const heard: {
    onText: (text: string) => void;
    onEnd: (hasFailed: boolean) => void;
    stopped: boolean;
  }[] = [];
  const listener: Listener = {
    start: (onText, onEnd) => {
      const session = { onText, onEnd, stopped: false };
      heard.push(session);
      return () => {
        session.stopped = true;
      };
    },
  };
  return { heard, listener };
}

function app() {
  const workspace = buildWorkspace([
    {
      id: "page",
      props: { title: [] },
      children: [
        {
          id: "m",
          type: "meeting-notes",
          props: meetingNotesDefinition.createProps([]),
        },
      ],
    },
  ]);
  return createTestApp({
    workspace,
    commands: meetingNotesDefinition.commands ?? [],
  });
}

describe("the transcriber", () => {
  it("listens while a block records and writes each sentence down", async () => {
    const { store, dispatch } = app();
    const { heard, listener } = fakeListener();
    startTranscriber(store, dispatch, listener);

    dispatch(startTranscribing.create({ blockId }));
    heard[0]?.onText("Hello team.");
    await Promise.resolve();
    dispatch(stopTranscribing.create({ blockId }));

    expect(heard).toHaveLength(1);
    expect(heard[0]?.stopped).toBe(true);
    expect(store.getState().workspace.blocks[blockId]?.props.transcript).toBe(
      "Hello team.",
    );
  });

  it("listens again when the browser stops after a silence", () => {
    const { store, dispatch } = app();
    const { heard, listener } = fakeListener();
    startTranscriber(store, dispatch, listener);

    dispatch(startTranscribing.create({ blockId }));
    heard[0]?.onEnd(false);

    expect(heard).toHaveLength(2);
  });

  it("stops recording when the microphone is refused, and does not ask again", async () => {
    const { store, dispatch } = app();
    const { heard, listener } = fakeListener();
    startTranscriber(store, dispatch, listener);

    dispatch(startTranscribing.create({ blockId }));
    heard[0]?.onEnd(true);
    await Promise.resolve();

    expect(heard).toHaveLength(1);
    expect(store.getState().workspace.blocks[blockId]?.props.status).not.toBe(
      "recording",
    );
  });
});
