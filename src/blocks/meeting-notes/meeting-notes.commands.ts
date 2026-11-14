// The meeting notes' own changes: starting and stopping, the words heard
// added to the transcript, the transcript typed or pasted, the title.
import { isBlockOfType, type BlockId } from "../../model/index.ts";
import {
  defineCommand,
  type AppState,
  type CommandEffect,
} from "../../state/index.ts";
import {
  MEETING_NOTES_TYPE,
  type MeetingNotesBlock,
  type MeetingNotesProps,
} from "./meeting-notes.schema.ts";

function meetingUpdate(
  state: AppState,
  command: {
    readonly blockId: BlockId;
    readonly meta: { readonly now: string };
  },
  change: (props: MeetingNotesProps) => Partial<MeetingNotesProps> | null,
): CommandEffect {
  const { blockId } = command;
  const { now } = command.meta;
  const block = state.workspace.blocks[blockId];
  if (
    block === undefined ||
    !isBlockOfType<MeetingNotesBlock>(block, MEETING_NOTES_TYPE)
  ) {
    return {};
  }
  const changed = change(block.props);
  if (changed === null) return {};
  const props = { ...block.props, ...changed };
  return {
    operations: [
      {
        type: "record.update",
        kind: "block",
        id: blockId,
        patch: { props, updatedAt: now },
      },
    ],
  };
}

// Starts listening, again after a summary too: the new words follow.
export const startTranscribing = defineCommand<{ blockId: BlockId }>({
  type: "meeting.start",
  handle: (state, command) =>
    meetingUpdate(state, command, ({ status }) =>
      status === "recording" ? null : { status: "recording" },
    ),
});

// Stops listening; the AI then sums the transcript up.
export const stopTranscribing = defineCommand<{ blockId: BlockId }>({
  type: "meeting.stop",
  handle: (state, command) =>
    meetingUpdate(state, command, ({ status, transcript }) => {
      if (status !== "recording" && status !== "ready") return null;
      return { status: transcript.trim() === "" ? "ready" : "summarizing" };
    }),
});

// What was just heard, at the transcript's end.
export const appendTranscript = defineCommand<{
  blockId: BlockId;
  text: string;
}>({
  type: "meeting.append",
  // One undo step for a whole recording, not one per sentence heard.
  handle: (state, command) => ({
    ...meetingUpdate(state, command, ({ status, transcript }) => {
      const text = command.text.trim();
      if (status !== "recording" || text === "") return null;
      return {
        transcript: transcript === "" ? text : `${transcript} ${text}`,
      };
    }),
    mergeKey: `meeting.append:${command.blockId}`,
  }),
});

// The transcript as typed or pasted, where the browser cannot listen.
export const setTranscript = defineCommand<{ blockId: BlockId; text: string }>({
  type: "meeting.setTranscript",
  handle: (state, command) =>
    meetingUpdate(state, command, () => ({ transcript: command.text })),
});

export const setMeetingTitle = defineCommand<{
  blockId: BlockId;
  title: string;
}>({
  type: "meeting.setTitle",
  handle: (state, command) =>
    meetingUpdate(state, command, () => ({ title: command.title })),
});

export const meetingNotesCommands = [
  startTranscribing,
  stopTranscribing,
  appendTranscript,
  setTranscript,
  setMeetingTitle,
];
