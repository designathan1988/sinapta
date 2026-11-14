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
// own person while no one is signed in.
export interface PageView {
  readonly viewedAt: string;
  readonly viewer: string | null;
}

export type PageUpdatesTab = "updates" | "analytics";

export interface PageUpdates {
  readonly pageId: BlockId;
  readonly tab: PageUpdatesTab;
  readonly views?: readonly PageView[];
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

// Opens the panel on a tab, moves it to another, or closes it (null);
// the views read stay while the page is the same.
export const showPageUpdates = defineCommand<{
  pageId: BlockId | null;
  tab?: PageUpdatesTab;
}>({
  type: "ui.showPageUpdates",
  handle(state, command) {
    const { pageUpdates: old, ...ui } = state.ui;
    if (command.pageId === null) return { ui };
    const views = old?.pageId === command.pageId ? old.views : undefined;
    const pageUpdates: PageUpdates = {
      pageId: command.pageId,
      tab: command.tab ?? "updates",
      ...(views !== undefined && { views }),
    };
    return { ui: { ...ui, pageUpdates } };
  },
});

// The views read for the page whose panel is open.
export const setPageViews = defineCommand<{
  pageId: BlockId;
  views: readonly PageView[];
}>({
  type: "ui.setPageViews",
  handle(state, command) {
    const open = state.ui.pageUpdates;
    if (open?.pageId !== command.pageId) return {};
    return {
      ui: { ...state.ui, pageUpdates: { ...open, views: command.views } },
    };
  },
});

export const pageVersionCommands = [
  setPageVersions,
  showPageUpdates,
  setPageViews,
];
