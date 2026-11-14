// The AI's summary of a meeting's transcript (ADR-0013): kept on the
// meeting notes block that asked for it, which is then done.
import type { BlockId } from "../model/index.ts";
import { defineCommand } from "./command-registry.ts";

export const setMeetingSummary = defineCommand<{
  blockId: BlockId;
  summary: string;
  actionItems: string;
}>({
  type: "meeting.setSummary",
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    if (block?.props.status !== "summarizing") return {};
    const props = {
      ...block.props,
      summary: command.summary,
      actionItems: command.actionItems,
      status: "done",
    };
    return {
      operations: [
        {
          type: "record.update",
          kind: "block",
          id: block.id,
          patch: { props, updatedAt: command.meta.now },
        },
      ],
    };
  },
});

export const meetingCommands = [setMeetingSummary];
