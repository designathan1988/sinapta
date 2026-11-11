// The headings a table of contents lists: those of the page it is on, in
// reading order, without the headings of pages nested inside it.
import {
  isBlockOfType,
  plainText,
  type Block,
  type BlockId,
} from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { HEADING_TYPE, type HeadingBlock } from "../heading/index.ts";
import { PAGE_LIKE_TYPES } from "../page/index.ts";

export interface TocEntry {
  readonly blockId: BlockId;
  readonly level: number;
  readonly text: string;
}

function pageOf(state: AppState, block: Block): Block | undefined {
  let current: Block | undefined = block;
  while (current !== undefined && !PAGE_LIKE_TYPES.includes(current.type)) {
    current =
      current.parentId === null
        ? undefined
        : state.workspace.blocks[current.parentId];
  }
  return current;
}

function headingsIn(state: AppState, block: Block): TocEntry[] {
  return block.childIds.flatMap((id) => {
    const child = state.workspace.blocks[id];
    if (child === undefined || PAGE_LIKE_TYPES.includes(child.type)) return [];
    const inner = headingsIn(state, child);
    if (!isBlockOfType<HeadingBlock>(child, HEADING_TYPE)) return inner;
    const entry = {
      blockId: child.id,
      level: child.props.level,
      text: plainText(child.props.text),
    };
    return [entry, ...inner];
  });
}

export function selectTableOfContents(
  state: AppState,
  blockId: BlockId,
): TocEntry[] {
  const block = state.workspace.blocks[blockId];
  const page = block === undefined ? undefined : pageOf(state, block);
  return page === undefined ? [] : headingsIn(state, page);
}
