import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createTestApp, setMeetingSummary } from "../../state/index.ts";
import {
  appendTranscript,
  meetingNotesCommands,
  startTranscribing,
  stopTranscribing,
} from "./meeting-notes.commands.ts";

const blockId = toBlockId("m");

function app() {
  const workspace = buildWorkspace([
    {
      id: "page",
      props: { title: [] },
      children: [
        {
          id: "m",
          type: "meeting-notes",
          props: {
            title: "",
            status: "ready",
            transcript: "",
            summary: "",
            actionItems: "",
          },
        },
      ],
    },
  ]);
  return createTestApp({
    workspace,
    commands: [...meetingNotesCommands, setMeetingSummary],
  });
}

const propsOf = (store: ReturnType<typeof app>["store"]) =>
  store.getState().workspace.blocks[blockId]?.props;

describe("AI meeting notes", () => {
  it("writes down what is heard while recording, and only then", () => {
    const { store, dispatch } = app();

    dispatch(appendTranscript.create({ blockId, text: "Too early." }));
    dispatch(startTranscribing.create({ blockId }));
    dispatch(appendTranscript.create({ blockId, text: "We ship Friday." }));
    dispatch(appendTranscript.create({ blockId, text: "Ana tests it." }));

    expect(propsOf(store)).toMatchObject({
      status: "recording",
      transcript: "We ship Friday. Ana tests it.",
    });
  });

  it("sums the meeting up once stopped, and is then done", () => {
    const { store, dispatch } = app();
    dispatch(startTranscribing.create({ blockId }));
    dispatch(appendTranscript.create({ blockId, text: "We ship Friday." }));

    dispatch(stopTranscribing.create({ blockId }));
    const asked = propsOf(store)?.status;
    dispatch(
      setMeetingSummary.create({
        blockId,
        summary: "Shipping Friday.",
        actionItems: "- Ship",
      }),
    );

    expect(asked).toBe("summarizing");
    expect(propsOf(store)).toMatchObject({
      status: "done",
      summary: "Shipping Friday.",
      actionItems: "- Ship",
    });
  });

  it("goes back to ready when nothing was heard", () => {
    const { store, dispatch } = app();
    dispatch(startTranscribing.create({ blockId }));

    dispatch(stopTranscribing.create({ blockId }));

    expect(propsOf(store)?.status).toBe("ready");
  });
});
