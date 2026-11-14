// Notion's AI Meeting Notes (ADR-0013): a block that listens to a meeting,
// writes down what is said as it is said, then gives a summary and the
// action items, written by the server's AI.
import * as v from "valibot";
import type { TypedBlock } from "../../model/index.ts";

export const MEETING_NOTES_TYPE = "meeting-notes";

// Ready to start; listening and writing; the AI summing it up; done.
export const MEETING_STATUSES = [
  "ready",
  "recording",
  "summarizing",
  "done",
] as const;

export const meetingNotesPropsSchema = v.object({
  title: v.string(),
  status: v.picklist(MEETING_STATUSES),
  transcript: v.string(),
  summary: v.string(),
  actionItems: v.string(),
});

export type MeetingNotesProps = v.InferOutput<typeof meetingNotesPropsSchema>;
export type MeetingNotesBlock = TypedBlock<
  typeof MEETING_NOTES_TYPE,
  MeetingNotesProps
>;
