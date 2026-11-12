// What the mention menu offers for the text typed after "@" or "[[": pages
// whose title matches and, after "@", dates.
import { isTextBlock, textOf } from "../../blocks/index.ts";
import {
  isPageLike,
  selectPageTitle,
  type PageBlock,
} from "../../blocks/page/index.ts";
import { type BlockId, type TextSpan } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";

export const MENTION_MENU_OVERLAY = "mention-menu";
export const PAGE_LINK_MENU_OVERLAY = "page-link-menu";

const PAGE_LIMIT = 8;
const DAY_MS = 86_400_000;
const TEXT = COPY.mentionMenu;
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export interface MentionItem {
  readonly label: string;
  // The span that takes the place of what was typed.
  readonly span: TextSpan;
}

function fold(text: string): string {
  return text.normalize("NFKC").toLocaleLowerCase("en-US");
}

function pageItem(page: PageBlock): MentionItem {
  const title = selectPageTitle(page) || COPY.sidebar.untitled;
  const mention = { kind: "page" as const, pageId: page.id };
  return { label: title, span: { text: title, mention } };
}

function pageItems(state: AppState, needle: string): MentionItem[] {
  return Object.values(state.workspace.blocks)
    .flatMap((block) =>
      isPageLike(block) && !block.props.isTrashed ? [pageItem(block)] : [],
    )
    .filter((item) => fold(item.label).includes(needle))
    .slice(0, PAGE_LIMIT);
}

function dayAfter(today: string, days: number): string {
  const time = Date.parse(`${today}T00:00:00Z`) + days * DAY_MS;
  return new Date(time).toISOString().slice(0, 10);
}

function dateItem(label: string, date: string): MentionItem {
  const text = DATE_FORMAT.format(new Date(`${date}T00:00:00Z`));
  return { label, span: { text, mention: { kind: "date", date } } };
}

const REMIND = "remind";

// After "@remind", reminders: a date mention that the inbox brings back
// on its day, as Notion's "@remind tomorrow".
function reminderItems(today: string, needle: string): MentionItem[] {
  if (!needle.startsWith(REMIND)) return [];
  const rest = needle.slice(REMIND.length).trim();
  const days = [
    { label: TEXT.remindToday, date: today },
    { label: TEXT.remindTomorrow, date: dayAfter(today, 1) },
    { label: TEXT.remindNextWeek, date: dayAfter(today, 7) },
  ];
  return days
    .filter((day) => fold(day.label).includes(rest))
    .map((day) => {
      const item = dateItem(day.label, day.date);
      const mention = {
        kind: "date" as const,
        date: day.date,
        isReminder: true,
      };
      return { ...item, span: { ...item.span, mention } };
    });
}

function dateItems(today: string, needle: string): MentionItem[] {
  const named = [
    dateItem(TEXT.today, today),
    dateItem(TEXT.tomorrow, dayAfter(today, 1)),
    dateItem(TEXT.nextWeek, dayAfter(today, 7)),
  ].filter((item) => fold(item.label).includes(needle));
  // A typed day, such as 2026-12-24, is offered as it is.
  const typed = /^\d{4}-\d{2}-\d{2}$/.test(needle)
    ? [dateItem(needle, needle)]
    : [];
  return [...named, ...typed, ...reminderItems(today, needle)];
}

export interface OpenMentionMenu {
  readonly blockId: BlockId;
  // Offsets of the "@" or "[[" and of the caret in the block's text.
  readonly start: number;
  readonly end: number;
  readonly items: readonly MentionItem[];
  readonly activeIndex: number;
}

const MARKERS: Readonly<Record<string, string>> = {
  [MENTION_MENU_OVERLAY]: "@",
  [PAGE_LINK_MENU_OVERLAY]: "[[",
};

interface Typed {
  readonly blockId: BlockId;
  readonly start: number;
  readonly end: number;
  readonly marker: string;
  // What was typed after the marker, folded for matching.
  readonly needle: string;
}

// The marker and what follows it up to the caret, while both are there.
// The text block the menu was opened in, while the caret is still in it.
function menuBlock(state: AppState) {
  const { overlay, selection } = state.ui;
  if (overlay === null || selection === null) return undefined;
  const block = state.workspace.blocks[selection.blockId];
  if (!isTextBlock(block) || block.id !== overlay.anchorId) return undefined;
  return { block, overlay, selection };
}

function typedQuery(state: AppState): Typed | undefined {
  const marker = MARKERS[state.ui.overlay?.kind ?? ""];
  const found = menuBlock(state);
  if (marker === undefined || found === undefined) return;
  const { block, overlay, selection } = found;
  const start = overlay.start ?? -1;
  const end = selection.focusOffset;
  const text = textOf(block);
  const isThere = text.slice(start, start + marker.length) === marker;
  if (!isThere || end < start + marker.length) return;
  const needle = fold(text.slice(start + marker.length, end));
  return { blockId: block.id, start, end, marker, needle };
}

// The open menu, or undefined when it is closed, its marker is gone, the
// caret left it, or nothing matches.
export function selectOpenMentionMenu(
  state: AppState,
  today: string,
): OpenMentionMenu | undefined {
  const typed = typedQuery(state);
  if (typed === undefined) return;
  const { blockId, start, end, marker, needle } = typed;
  const pages = pageItems(state, needle);
  const items =
    marker === "@" ? [...pages, ...dateItems(today, needle)] : pages;
  if (items.length === 0) return;
  const activeIndex = Math.min(
    state.ui.overlay?.activeIndex ?? 0,
    items.length - 1,
  );
  return { blockId, start, end, items, activeIndex };
}
