// "Get started with" on an empty page, as Notion's: Ask AI adds a line
// with the AI prompt open on it, Transcribe adds AI Meeting Notes.
import { meetingNotesDefinition } from "../../blocks/meeting-notes/index.ts";
import { PARAGRAPH_TYPE } from "../../blocks/paragraph/index.ts";
import type { BlockId } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import { AI_PROMPT_OVERLAY } from "../ai/index.ts";
import { childList, createBlock, withSelection } from "./editor-operations.ts";

export type StartKind = "ai" | "transcribe";

export const startPageWith = defineCommand<{
  pageId: BlockId;
  kind: StartKind;
}>({
  type: "page.startWith",
  newBlockIds: 1,
  handle(state, command) {
    const page = state.workspace.blocks[command.pageId];
    const id = command.meta.blockIds[0];
    if (page === undefined || id === undefined) return {};
    const { now } = command.meta;
    const line = createBlock({
      id,
      type: PARAGRAPH_TYPE,
      parentId: page.id,
      text: [],
      now,
    });
    const record =
      command.kind === "ai"
        ? line
        : {
            ...line,
            type: meetingNotesDefinition.type,
            props: meetingNotesDefinition.createProps([]),
          };
    const index = page.childIds.length;
    const ui = withSelection(state, id, 0);
    const overlay =
      command.kind === "ai" ? { kind: AI_PROMPT_OVERLAY, anchorId: id } : null;
    return {
      operations: [
        { type: "record.create", kind: "block", record },
        { type: "list.insert", list: childList(page.id), id, index },
      ],
      ui: { ...ui, overlay },
    };
  },
});

export const editorStartCommands = [startPageWith];
