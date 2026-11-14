// The versions of a page, read from where they are kept when the page's
// history opens, for it to show; and Notion's "Updates & analytics"
// panel docked beside the page, with the page's views once read.
import type { Block, BlockId } from "../model/index.ts";
import { defineCommand } from "./command-registry.ts";

export const PAGE_HISTORY_OVERLAY = "page-history";

export interface PageVersion {
  readonly id: string;
  readonly takenAt: string;
  // The page and its own blocks, as they were.
  readonly blocks: readonly Block[];
}

// One opening of a page; the viewer's name, or null for this browser's
// own person while no one is signed in, or for a member who does not
// allow their view history (isHidden): counted, not named.
export interface PageView {
  readonly viewedAt: string;
  readonly viewer: string | null;
  readonly isHidden?: boolean;
}

export type PageUpdatesTab = "updates" | "analytics";

// How far back the panel counts views, as Notion's: 7, 28 or 90 days, or
// all of them; 28 until another is chosen.
export type ViewsPeriod = 7 | 28 | 90 | "all";

export interface PageUpdates {
  readonly pageId: BlockId;
  readonly tab: PageUpdatesTab;
  readonly views?: readonly PageView[];
  readonly period?: ViewsPeriod;
  // "Show your view history", as the server keeps it for this person; and
  // the choice just made in the panel, which is sent to it.
  readonly showsHistory?: boolean;
  readonly historyChoice?: boolean;
}

export const setPageVersions = defineCommand<{
  pageId: BlockId;
  versions: readonly PageVersion[];
}>({
  type: "ui.setPageVersions",
  handle: (state, command) => ({
    ui: {
      ...state.ui,
      pageVersions: { pageId: command.pageId, versions: command.versions },
    },
  }),
});

function withoutChoice(open: PageUpdates): PageUpdates {
  const { historyChoice: _sent, ...kept } = open;
  return kept;
}

// Opens the panel on a tab, moves it to another, or closes it (null);
// what was read and chosen stays while the page is the same.
export const showPageUpdates = defineCommand<{
  pageId: BlockId | null;
  tab?: PageUpdatesTab;
}>({
  type: "ui.showPageUpdates",
  handle(state, command) {
    const { pageUpdates: old, ...ui } = state.ui;
    if (command.pageId === null) return { ui };
    const tab = command.tab ?? "updates";
    // The same page keeps what was read and chosen, but not a choice
    // still to send.
    const pageUpdates: PageUpdates =
      old?.pageId === command.pageId
        ? { ...withoutChoice(old), tab }
        : { pageId: command.pageId, tab };
    return { ui: { ...ui, pageUpdates } };
  },
});

// The views read for the page whose panel is open.
export const setPageViews = defineCommand<{
  pageId: BlockId;
  views: readonly PageView[];
  showsHistory: boolean | null;
}>({
  type: "ui.setPageViews",
  handle(state, command) {
    const open = state.ui.pageUpdates;
    if (open?.pageId !== command.pageId) return {};
    const { views, showsHistory } = command;
    const read = showsHistory === null ? { views } : { views, showsHistory };
    return { ui: { ...state.ui, pageUpdates: { ...open, ...read } } };
  },
});

// "Show your view history": Allow or Don't allow.
export const setShowsHistory = defineCommand<{ allowed: boolean }>({
  type: "ui.setShowsHistory",
  handle(state, command) {
    const open = state.ui.pageUpdates;
    if (open === undefined) return {};
    const { allowed } = command;
    const chosen = { showsHistory: allowed, historyChoice: allowed };
    return { ui: { ...state.ui, pageUpdates: { ...open, ...chosen } } };
  },
});

export const setViewsPeriod = defineCommand<{ period: ViewsPeriod }>({
  type: "ui.setViewsPeriod",
  handle(state, command) {
    const open = state.ui.pageUpdates;
    if (open === undefined) return {};
    return {
      ui: { ...state.ui, pageUpdates: { ...open, period: command.period } },
    };
  },
});

export const pageVersionCommands = [
  setShowsHistory,
  setViewsPeriod,
  setPageVersions,
  showPageUpdates,
  setPageViews,
];
