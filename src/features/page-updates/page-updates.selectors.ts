// What Notion's "Updates & analytics" panel shows of a page: each run of
// edits with the blocks it changed, newest first; the page's views by day
// over the last 28 days; who viewed it; who made it and edited it last.
import {
  isPageLike,
  selectPageTitle,
  type PageBlock,
} from "../../blocks/page/index.ts";
import { isTextBlock, type TextBlock } from "../../blocks/index.ts";
import type { Block, BlockId } from "../../model/index.ts";
import type {
  AppState,
  PageVersion,
  PageView,
  ViewsPeriod,
} from "../../state/index.ts";
import {
  pageContent,
  selectVersionAuthor,
  selectVersionChanges,
} from "../page-history/index.ts";
import { selectPageLastEdit } from "../page-info/index.ts";

const DAY_MS = 86_400_000;

export interface ChangedLine {
  readonly id: string;
  readonly text: string;
  readonly isTitle: boolean;
}

export interface UpdateEntry {
  readonly at: string;
  readonly author: string | undefined;
  // The version the page's history opens on for this entry, or null for
  // the page as it is now.
  readonly versionIndex: number | null;
  readonly lines: readonly ChangedLine[];
}

function titleOf(block: Block | undefined): string | undefined {
  return block !== undefined && isPageLike(block)
    ? selectPageTitle(block)
    : undefined;
}

function changedLines(all: readonly PageVersion[], index: number) {
  const newer = all[index];
  const older = all[index + 1];
  if (newer === undefined || older === undefined) return [];
  const lines: ChangedLine[] = [];
  const title = titleOf(newer.blocks[0]);
  if (title !== undefined && title !== titleOf(older.blocks[0]))
    lines.push({ id: `${newer.id}:title`, text: title, isTitle: true });
  const changes = selectVersionChanges(all, index);
  const before = new Map(older.blocks.map((block) => [block.id, block]));
  for (const block of newer.blocks.slice(1)) {
    if (!changes.has(block.id) || !isTextBlock(block)) continue;
    const text = settledText(block);
    const old = before.get(block.id);
    const was = isTextBlock(old) ? settledText(old) : "";
    if (text !== was) lines.push({ id: block.id, text, isTitle: false });
  }
  return lines;
}

// A block's text without the insertions only suggested: Notion lists a
// suggestion apart, and counts it as an edit once accepted.
function settledText(block: TextBlock): string {
  return block.props.text
    .filter((span) => span.suggestion !== "insert")
    .map((span) => span.text)
    .join("");
}

// The page as it is now, then its versions, each against the one before.
export function selectUpdateEntries(
  state: AppState,
  pageId: BlockId,
): UpdateEntry[] {
  const kept = state.ui.pageVersions;
  if (kept?.pageId !== pageId) return [];
  const edited = selectPageLastEdit(state, pageId);
  const now: PageVersion = {
    id: "now",
    takenAt: new Date(edited).toISOString(),
    blocks: pageContent(state.workspace, pageId),
  };
  const all = [now, ...kept.versions];
  return all.slice(0, -1).flatMap((version, index) => {
    const lines = changedLines(all, index);
    if (lines.length === 0) return [];
    const author = selectVersionAuthor(version);
    const versionIndex = index === 0 ? null : index - 1;
    return [{ at: version.takenAt, author, versionIndex, lines }];
  });
}

function dayOf(time: number): number {
  return Math.floor(time / DAY_MS);
}

// Views per day, from the first day with one (or yesterday) to today,
// within the period (the last 28 days unless another is given); and how
// many views the page has had in all.
export function selectDailyViews(
  views: readonly PageView[],
  now: string,
  period: ViewsPeriod = 28,
): { readonly days: readonly { day: string; count: number }[]; total: number } {
  const today = dayOf(Date.parse(now));
  const first = period === "all" ? -Infinity : today - period + 1;
  const counts = new Map<number, number>();
  for (const view of views) {
    const day = dayOf(Date.parse(view.viewedAt));
    if (day >= first && day <= today)
      counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  const start = Math.min(today - 1, ...counts.keys());
  const days = Array.from({ length: today - start + 1 }, (_, offset) => ({
    day: new Date((start + offset) * DAY_MS).toISOString().slice(0, 10),
    count: counts.get(start + offset) ?? 0,
  }));
  return { days, total: views.length };
}

// Each viewer once, at their latest view, the latest first; those who do
// not show their view history are left out.
export function selectViewers(
  views: readonly PageView[],
): { readonly viewer: string | null; readonly viewedAt: string }[] {
  const latest = new Map<string | null, string>();
  for (const { viewer, viewedAt, isHidden } of views) {
    if (isHidden === true) continue;
    const seen = latest.get(viewer);
    if (seen === undefined || viewedAt > seen) latest.set(viewer, viewedAt);
  }
  return [...latest]
    .map(([viewer, viewedAt]) => ({ viewer, viewedAt }))
    .sort((a, b) => b.viewedAt.localeCompare(a.viewedAt));
}

// Who made the page and who edited it last, with when; a name is absent
// for a page made or edited before anyone signed in.
export function selectEditors(state: AppState, page: PageBlock) {
  const edited = selectPageLastEdit(state, page.id);
  const lastBlock = pageContent(state.workspace, page.id)
    .filter((block) => block.editedBy !== undefined)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  return {
    created: { name: page.createdBy?.name, at: page.createdAt },
    edited: {
      name: lastBlock?.editedBy?.name,
      at: new Date(edited).toISOString(),
    },
  };
}

// "53 seconds ago", "1 day ago", as Notion's panel says it.
export function selectTimeAgo(at: string, now: string): string {
  const seconds = Math.round((Date.parse(at) - Date.parse(now)) / 1000);
  const format = new Intl.RelativeTimeFormat("en", { numeric: "always" });
  const units = [
    [86_400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ] as const;
  for (const [size, unit] of units) {
    if (Math.abs(seconds) >= size)
      return format.format(Math.trunc(seconds / size), unit);
  }
  return format.format(Math.min(seconds, -1), "second");
}
