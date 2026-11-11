import { BLOCK_DEFINITIONS, isTextBlock, textOf } from "../../blocks/index.ts";
import { HEADING_TYPE } from "../../blocks/heading/index.ts";
import { PAGE_LINK_TYPE } from "../../blocks/page-link/index.ts";
import {
  TONES,
  type BlockColor,
  type BlockId,
  type BlockProps,
} from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { selectTreeRows } from "../sidebar/index.ts";
import {
  headingLook,
  lookOf,
  SLASH_GROUPS,
  type SlashLook,
} from "./slash-menu-catalog.ts";

export const SLASH_MENU_OVERLAY = "slash-menu";
const PAGE_LINK_LIMIT = 5;

// One thing the slash menu can turn the block into.
export interface BlockSlashItem extends SlashLook {
  readonly label: string;
  readonly blockType: string;
  readonly extraProps?: BlockProps;
}

// A color for the whole block; null takes the color away.
export interface ColorSlashItem extends SlashLook {
  readonly label: string;
  readonly color: BlockColor | null;
}

// A new subpage, below the block, opened at once.
export interface PageSlashItem extends SlashLook {
  readonly label: string;
  readonly createsPage: true;
}

// A database inside the page, after the block.
export interface DatabaseSlashItem extends SlashLook {
  readonly label: string;
  readonly createsDatabase: true;
}

export type SlashItem =
  BlockSlashItem | ColorSlashItem | PageSlashItem | DatabaseSlashItem;

const DATABASE_ITEM: DatabaseSlashItem = {
  label: COPY.database.inlineDatabase,
  createsDatabase: true,
  icon: "table",
  group: "database",
};

const PAGE_ITEM: PageSlashItem = {
  label: COPY.blockNames.page,
  createsPage: true,
  ...lookOf("page"),
};

const COLOR_LOOK: SlashLook = { icon: "color", group: "colors" };

// Typed as /red, /red background or /default, as in Notion.
function colorItems(): ColorSlashItem[] {
  return [
    { label: COPY.formatToolbar.defaultColor, color: null, ...COLOR_LOOK },
    ...TONES.map((tone) => ({
      label: COPY.tones[tone],
      color: tone,
      ...COLOR_LOOK,
    })),
    ...TONES.map((tone) => ({
      label: `${COPY.tones[tone]} ${COPY.blockMenu.background}`,
      color: `${tone}-background` as const,
      ...COLOR_LOOK,
    })),
  ];
}

const EXTRA_HEADINGS: readonly BlockSlashItem[] = [
  {
    label: COPY.blockNames.heading2,
    blockType: HEADING_TYPE,
    extraProps: { level: 2 },
    ...headingLook(2, false),
  },
  {
    label: COPY.blockNames.heading3,
    blockType: HEADING_TYPE,
    extraProps: { level: 3 },
    ...headingLook(3, false),
  },
  {
    label: COPY.blockNames.heading4,
    blockType: HEADING_TYPE,
    extraProps: { level: 4 },
    ...headingLook(4, false),
  },
  ...[1, 2, 3].map((level) => ({
    label: `${COPY.blockNames.toggleHeading} ${String(level)}`,
    blockType: HEADING_TYPE,
    extraProps: { level, isToggleable: true, isOpen: true },
    ...headingLook(level, true),
  })),
];

function blockItems(): BlockSlashItem[] {
  return BLOCK_DEFINITIONS.flatMap((definition): BlockSlashItem[] => {
    if (definition.label === undefined) return [];
    const item = {
      label: definition.label,
      blockType: definition.type,
      ...lookOf(definition.type),
    };
    return definition.type === HEADING_TYPE
      ? [item, ...EXTRA_HEADINGS]
      : [item];
  });
}

function pageItems(state: AppState): BlockSlashItem[] {
  return selectTreeRows({
    ...state,
    ui: { ...state.ui, expandedPageIds: [] },
  }).map((row) => ({
    label: `${COPY.blockNames.pageLink}: ${row.title === "" ? COPY.sidebar.untitled : row.title}`,
    blockType: PAGE_LINK_TYPE,
    extraProps: { pageId: row.id },
    icon: "link" as const,
    group: "pages" as const,
  }));
}

// Comparison that ignores case in every language.
function fold(text: string): string {
  return text.normalize("NFKC").toLocaleLowerCase("en-US");
}

export function selectSlashItems(state: AppState, query: string): SlashItem[] {
  const needle = fold(query);
  const matches = (item: SlashItem): boolean =>
    fold(item.label).includes(needle);
  const pages = pageItems(state).filter(matches).slice(0, PAGE_LINK_LIMIT);
  const colors = needle === "" ? [] : colorItems().filter(matches);
  const blocks = [PAGE_ITEM, ...blockItems(), DATABASE_ITEM].filter(matches);
  // Sorted by group, keeping the order within each group.
  const rank = (item: SlashItem): number => SLASH_GROUPS.indexOf(item.group);
  return [...blocks, ...pages, ...colors].toSorted((a, b) => rank(a) - rank(b));
}

export interface OpenSlashMenu {
  readonly blockId: BlockId;
  // Offsets of the "/" and of the caret in the block's text.
  readonly start: number;
  readonly end: number;
  readonly items: readonly SlashItem[];
  readonly activeIndex: number;
}

// The "/query" being typed, when the caret is still after the slash that
// opened the menu.
function typedQuery(
  state: AppState,
): { start: number; end: number; query: string } | undefined {
  const { overlay, selection } = state.ui;
  const block =
    selection === null ? undefined : state.workspace.blocks[selection.blockId];
  if (
    selection === null ||
    !isTextBlock(block) ||
    block.id !== overlay?.anchorId
  ) {
    return undefined;
  }
  const start = overlay.start ?? -1;
  const end = selection.focusOffset;
  const text = textOf(block);
  if (text[start] !== "/" || end <= start) return undefined;
  return { start, end, query: text.slice(start + 1, end) };
}

// The open slash menu, or undefined when it is closed, the "/" that opened
// it is gone, or nothing matches.
export function selectOpenSlashMenu(
  state: AppState,
): OpenSlashMenu | undefined {
  const { overlay, selection } = state.ui;
  if (overlay?.kind !== SLASH_MENU_OVERLAY || selection === null)
    return undefined;
  const typed = typedQuery(state);
  if (typed === undefined) return undefined;
  const items = selectSlashItems(state, typed.query);
  if (items.length === 0) return undefined;
  const activeIndex = Math.min(overlay.activeIndex ?? 0, items.length - 1);
  const { start, end } = typed;
  return { blockId: selection.blockId, start, end, items, activeIndex };
}
