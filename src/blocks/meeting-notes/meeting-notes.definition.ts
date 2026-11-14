import { isBlockOfType } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { BlockDefinition } from "../block-definition.ts";
import { PARAGRAPH_TYPE } from "../paragraph/index.ts";
import { meetingNotesCommands } from "./meeting-notes.commands.ts";
import {
  MEETING_NOTES_TYPE,
  meetingNotesPropsSchema,
  type MeetingNotesBlock,
} from "./meeting-notes.schema.ts";
import { renderMeetingNotes } from "./meeting-notes.view.ts";

// Whether this browser can listen: record its microphone for the
// server's speech model, or use its own speech recognition. Without
// either the transcript is typed or pasted.
const CAN_LISTEN =
  "MediaRecorder" in globalThis ||
  "SpeechRecognition" in globalThis ||
  "webkitSpeechRecognition" in globalThis;

export const meetingNotesDefinition: BlockDefinition = {
  type: MEETING_NOTES_TYPE,
  label: COPY.meeting.block,
  propsSchema: meetingNotesPropsSchema,
  continuesAs: PARAGRAPH_TYPE,
  createProps: () => ({
    title: "",
    status: "ready",
    transcript: "",
    summary: "",
    actionItems: "",
  }),
  commands: meetingNotesCommands,
  drawnFrom: () => [],
  render: (block, dispatch) =>
    isBlockOfType<MeetingNotesBlock>(block, MEETING_NOTES_TYPE)
      ? renderMeetingNotes(block, dispatch, CAN_LISTEN)
      : undefined,
};
