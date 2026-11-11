// Text typed at the start of a paragraph that turns it into another kind
// of block when followed by a space.
import { BULLETED_LIST_TYPE } from "../../blocks/bulleted-list/index.ts";
import { CODE_TYPE } from "../../blocks/code/index.ts";
import { DIVIDER_TYPE } from "../../blocks/divider/index.ts";
import { HEADING_TYPE } from "../../blocks/heading/index.ts";
import { NUMBERED_LIST_TYPE } from "../../blocks/numbered-list/index.ts";
import { QUOTE_TYPE } from "../../blocks/quote/index.ts";
import { TO_DO_TYPE } from "../../blocks/to-do/index.ts";
import { TOGGLE_TYPE } from "../../blocks/toggle/index.ts";
import type { BlockProps } from "../../model/index.ts";

export interface BlockShortcut {
  readonly blockType: string;
  // Props beyond the text, such as a heading's level.
  readonly extraProps?: BlockProps;
}

// The prefixes Notion accepts, with ">" for a toggle and a double quote
// for a quote (design decision D13).
const SHORTCUTS: Readonly<Record<string, BlockShortcut>> = {
  "#": { blockType: HEADING_TYPE, extraProps: { level: 1 } },
  "##": { blockType: HEADING_TYPE, extraProps: { level: 2 } },
  "###": { blockType: HEADING_TYPE, extraProps: { level: 3 } },
  "-": { blockType: BULLETED_LIST_TYPE },
  "*": { blockType: BULLETED_LIST_TYPE },
  "+": { blockType: BULLETED_LIST_TYPE },
  "1.": { blockType: NUMBERED_LIST_TYPE },
  "a.": { blockType: NUMBERED_LIST_TYPE },
  "i.": { blockType: NUMBERED_LIST_TYPE },
  "[]": { blockType: TO_DO_TYPE },
  "[x]": { blockType: TO_DO_TYPE, extraProps: { isChecked: true } },
  '"': { blockType: QUOTE_TYPE },
  ">": { blockType: TOGGLE_TYPE },
  "```": { blockType: CODE_TYPE },
  "---": { blockType: DIVIDER_TYPE },
};

export function matchBlockShortcut(prefix: string): BlockShortcut | undefined {
  return Object.hasOwn(SHORTCUTS, prefix) ? SHORTCUTS[prefix] : undefined;
}
