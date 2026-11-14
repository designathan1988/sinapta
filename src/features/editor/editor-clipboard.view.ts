// Copying selected blocks: their text as plain lines and as HTML for
// other apps, and
// their kinds and nesting in Pagecraft's own clipboard type, so a paste in
// Pagecraft rebuilds them. Cutting also deletes them.
import { isPageLike } from "../../blocks/page/index.ts";
import { isTextBlock, textOf } from "../../blocks/index.ts";
import {
  SIMPLE_TABLE_TYPE,
  type SimpleTableBlock,
} from "../../blocks/simple-table/index.ts";
import {
  BLOCK_CLIPBOARD_TYPE,
  isBlockOfType,
  serializeBlockClipboard,
  type Block,
  type ClipboardBlock,
} from "../../model/index.ts";
import { setClipboard, type AppState } from "../../state/index.ts";
import { selectBlocksHtml } from "../markdown-export/index.ts";
import type { InputContext } from "./editor-input.view.ts";
import { deleteSelectedBlocks } from "./editor-selection.commands.ts";
import { selectSelectedBlocks } from "./editor.selectors.ts";

function depthOf(state: AppState, block: Block): number {
  let depth = 0;
  let parent =
    block.parentId === null
      ? undefined
      : state.workspace.blocks[block.parentId];
  while (parent !== undefined && !isPageLike(parent)) {
    depth += 1;
    parent =
      parent.parentId === null
        ? undefined
        : state.workspace.blocks[parent.parentId];
  }
  return depth;
}

// The props a copy keeps beside the text: a heading's level, a to-do's
// check, an image's source and a code block's language.
type Extras = Pick<
  ClipboardBlock,
  "level" | "isChecked" | "src" | "language" | "sourceId"
>;
const LEVELS = [1, 2, 3, 4] as const;

function extrasOf(props: Block["props"]): Extras {
  const { isChecked, src, language, sourceId } = props;
  const level = LEVELS.find((value) => value === props.level);
  return {
    ...(level !== undefined && { level }),
    ...(typeof isChecked === "boolean" && { isChecked }),
    ...(typeof src === "string" && { src }),
    ...(typeof language === "string" && { language }),
    ...(typeof sourceId === "string" && { sourceId }),
  };
}

// A table keeps its cells and whether its first row is a header.
function tableExtras(block: Block) {
  if (!isBlockOfType<SimpleTableBlock>(block, SIMPLE_TABLE_TYPE)) return {};
  const { rows, hasHeaderRow } = block.props;
  return { rows: rows.map((row) => [...row]), hasHeaderRow };
}

function clipboardBlock(block: Block, depth: number): ClipboardBlock[] {
  const text = isTextBlock(block) ? block.props.text : [];
  const extras = { ...extrasOf(block.props), ...tableExtras(block) };
  const hasContent =
    isTextBlock(block) || extras.src !== undefined || "rows" in extras;
  if (!hasContent) return [];
  return [{ kind: block.type, depth, text, ...extras }];
}

// The selected blocks with their depth counted from the shallowest one.
export function clipboardBlocksOf(state: AppState): ClipboardBlock[] {
  const blocks = selectSelectedBlocks(state);
  const depths = blocks.map((block) => depthOf(state, block));
  const top = Math.min(...depths);
  return blocks.flatMap((block, index) =>
    clipboardBlock(block, (depths[index] ?? top) - top),
  );
}

export function onSelectionCopy(
  event: ClipboardEvent,
  context: InputContext,
): void {
  const blocks = selectSelectedBlocks(context.state);
  if (blocks.length === 0 || event.clipboardData === null) return;
  const lines = blocks.filter(isTextBlock).map(textOf);
  event.clipboardData.setData("text/plain", lines.join("\n"));
  event.clipboardData.setData("text/html", selectedHtml(context.state));
  const copied = serializeBlockClipboard(clipboardBlocksOf(context.state));
  event.clipboardData.setData(BLOCK_CLIPBOARD_TYPE, copied);
  event.preventDefault();
  if (event.type === "cut") context.dispatch(deleteSelectedBlocks.create({}));
}

// "c" or "x" for Ctrl or Command with that key and nothing else.
function copyKey(event: KeyboardEvent): "c" | "x" | undefined {
  const hasMod = (event.ctrlKey || event.metaKey) && !event.altKey;
  const key = event.key.toLowerCase();
  if (!hasMod || event.shiftKey) return undefined;
  return key === "c" || key === "x" ? key : undefined;
}

export function writeSystemClipboard(text: string, html?: string): void {
  if (typeof navigator === "undefined" || !("clipboard" in navigator)) return;
  if (html === undefined || typeof ClipboardItem === "undefined") {
    navigator.clipboard.writeText(text).catch(() => undefined);
    return;
  }
  const item = new ClipboardItem({
    "text/plain": new Blob([text], { type: "text/plain" }),
    "text/html": new Blob([html], { type: "text/html" }),
  });
  navigator.clipboard.write([item]).catch(() => undefined);
}

// The selected blocks as HTML, each once: a block inside a selected one
// comes with it.
function selectedHtml(state: AppState): string {
  const blocks = selectSelectedBlocks(state);
  const ids = new Set(blocks.map((block) => block.id));
  const tops = blocks.filter(
    (block) => block.parentId === null || !ids.has(block.parentId),
  );
  return selectBlocksHtml(state, tops);
}

// Chrome sends no copy event while whole blocks are selected, since no text
// is. Ctrl+C keeps the blocks in the store and puts their text on the
// system clipboard; a paste of that text rebuilds them. Ctrl+X also
// deletes them.
export function copyBlocksByKey(
  event: KeyboardEvent,
  { state, dispatch }: InputContext,
): boolean {
  const key = copyKey(event);
  const blocks = key === undefined ? [] : clipboardBlocksOf(state);
  if (blocks.length === 0) return false;
  const lines = selectSelectedBlocks(state).filter(isTextBlock).map(textOf);
  const text = lines.join("\n");
  dispatch(setClipboard.create({ clipboard: { text, blocks } }));
  writeSystemClipboard(text, selectedHtml(state));
  if (key === "x") dispatch(deleteSelectedBlocks.create({}));
  return true;
}
