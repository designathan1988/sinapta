// A new block put where text was typed or pasted: a line that holds only
// that text becomes the block itself; otherwise the text goes and the new
// block comes after the line. One step to undo.
import { isTextBlock } from "../../blocks/index.ts";
import {
  deleteRange,
  plainText,
  siblingIds,
  type BlockId,
  type BlockProps,
  type Operation,
} from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { setText } from "./editor.commands.ts";

export interface Typed {
  readonly blockId: BlockId;
  // Where the typed or pasted text is in the block.
  readonly start: number;
  readonly end: number;
}

export interface Placed {
  readonly type: string;
  readonly props: BlockProps;
  readonly newId: BlockId | undefined;
  readonly now: string;
}

export function placeAt(
  state: AppState,
  typed: Typed,
  placed: Placed,
): Operation[] {
  const block = state.workspace.blocks[typed.blockId];
  const parentId = block?.parentId ?? null;
  if (!isTextBlock(block) || parentId === null) return [];
  const { type, props, newId, now } = placed;
  const text = deleteRange(block.props.text, typed.start, typed.end);
  if (plainText(text).trim() === "") {
    const patch = { type, props, updatedAt: now };
    return [{ type: "record.update", kind: "block", id: block.id, patch }];
  }
  if (newId === undefined) return [];
  const index = siblingIds(state.workspace, parentId).indexOf(block.id) + 1;
  const record = {
    ...{ id: newId, type, parentId, childIds: [], props },
    ...{ createdAt: now, updatedAt: now },
  };
  return [
    ...setText(state, { blockId: block.id, text, now }),
    { type: "record.create", kind: "block", record },
    {
      type: "list.insert",
      list: { kind: "childIds", blockId: parentId },
      id: newId,
      index,
    },
  ];
}

export function closed(state: AppState): AppState["ui"] {
  return { ...state.ui, selection: null, overlay: null };
}
