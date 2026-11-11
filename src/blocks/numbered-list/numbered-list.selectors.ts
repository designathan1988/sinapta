// The marker before a numbered item: 1, 2, 3 at the first level, a, b, c
// at the second, i, ii, iii at the third, and so on in turn, as Notion
// numbers nested lists.
import type { BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { NUMBERED_LIST_TYPE } from "./numbered-list.schema.ts";

const ROMAN: readonly [number, string][] = [
  [1000, "m"],
  [900, "cm"],
  [500, "d"],
  [400, "cd"],
  [100, "c"],
  [90, "xc"],
  [50, "l"],
  [40, "xl"],
  [10, "x"],
  [9, "ix"],
  [5, "v"],
  [4, "iv"],
  [1, "i"],
];

function roman(value: number): string {
  let rest = value;
  let text = "";
  for (const [size, letters] of ROMAN) {
    while (rest >= size) {
      text += letters;
      rest -= size;
    }
  }
  return text;
}

// 1 is "a", 26 is "z", 27 is "aa".
function letters(value: number): string {
  let rest = value;
  let text = "";
  while (rest > 0) {
    const digit = (rest - 1) % 26;
    text = String.fromCharCode(97 + digit) + text;
    rest = Math.floor((rest - 1) / 26);
  }
  return text;
}

const STYLES = [String, letters, roman] as const;

function isItem(state: AppState, id: BlockId | null): boolean {
  if (id === null) return false;
  return state.workspace.blocks[id]?.type === NUMBERED_LIST_TYPE;
}

// How many numbered items enclose the block.
function levelOf(state: AppState, blockId: BlockId): number {
  let level = 0;
  let parentId = state.workspace.blocks[blockId]?.parentId ?? null;
  while (parentId !== null && isItem(state, parentId)) {
    level += 1;
    parentId = state.workspace.blocks[parentId]?.parentId ?? null;
  }
  return level;
}

// The block's place in the run of numbered items it belongs to, from 1.
function positionOf(state: AppState, blockId: BlockId): number {
  const parentId = state.workspace.blocks[blockId]?.parentId ?? null;
  const siblings =
    parentId === null
      ? state.workspace.rootIds
      : (state.workspace.blocks[parentId]?.childIds ?? []);
  let position = 1;
  for (let index = siblings.indexOf(blockId) - 1; index >= 0; index -= 1) {
    if (!isItem(state, siblings[index] ?? null)) break;
    position += 1;
  }
  return position;
}

export function selectListMarker(state: AppState, blockId: BlockId): string {
  const style = STYLES[levelOf(state, blockId) % STYLES.length] ?? String;
  return `${style(positionOf(state, blockId))}.`;
}
