// The versions of a page, read from where they are kept when the page's
// history opens, for it to show.
import type { Block, BlockId } from "../model/index.ts";
import { defineCommand } from "./command-registry.ts";

export const PAGE_HISTORY_OVERLAY = "page-history";

export interface PageVersion {
  readonly id: string;
  readonly takenAt: string;
  // The page and its own blocks, as they were.
  readonly blocks: readonly Block[];
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

export const pageVersionCommands = [setPageVersions];
