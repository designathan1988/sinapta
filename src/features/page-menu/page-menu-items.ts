// Page menu rows that act on the page or show more of it: its link, a
// duplicate, a move, the trash, its files, its history and its resolved
// comments.
import {
  duplicatePage,
  selectPageCopySize,
  trashPage,
} from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import {
  openOverlay,
  PAGE_HISTORY_OVERLAY,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { linkToPage } from "../../ui/address/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuItem } from "../../ui/menu/index.ts";
import {
  RESOLVED_COMMENTS_OVERLAY,
  selectResolvedDiscussions,
} from "../comments/index.ts";
import { writeSystemClipboard } from "../editor/index.ts";
import {
  exportPageAsHtml,
  exportPageAsMarkdown,
} from "../markdown-export/index.ts";

// Opened from this menu; rendered by the move-to feature.
export const MOVE_TO_OVERLAY_KIND = "move-to";

// Notion's first group: copy the link, duplicate, move, and the trash.
export function pageActionItems(
  state: AppState,
  pageId: BlockId,
  dispatch: Dispatch,
): MenuItem[] {
  return [
    {
      label: COPY.pageMenu.copyLink,
      icon: "link",
      shortcut: COPY.pageMenu.copyLinkKeys,
      onSelect: () => {
        writeSystemClipboard(linkToPage(pageId));
        announce(COPY.shell.linkCopied);
      },
    },
    {
      label: COPY.pageMenu.duplicate,
      icon: "duplicate",
      onSelect: () => {
        const size = selectPageCopySize(state, pageId);
        dispatch(duplicatePage.create({ pageId, ...size }));
      },
    },
    {
      label: COPY.pageMenu.moveToAction,
      icon: "move",
      onSelect: () =>
        dispatch(
          openOverlay.create({
            overlay: { kind: MOVE_TO_OVERLAY_KIND, anchorId: pageId },
          }),
        ),
    },
    {
      label: COPY.pageMenu.trash,
      icon: "trash",
      onSelect: () => dispatch(trashPage.create({ pageId })),
    },
  ];
}

// The page as files: Markdown, HTML, or printed.
export function exportItems(state: AppState, pageId: BlockId): MenuItem[] {
  return [
    {
      label: COPY.pageMenu.exportMarkdown,
      icon: "download",
      onSelect: () => {
        exportPageAsMarkdown(state, pageId);
      },
    },
    {
      label: COPY.pageMenu.exportHtml,
      icon: "download",
      onSelect: () => {
        exportPageAsHtml(state, pageId);
      },
    },
    {
      label: COPY.pageMenu.print,
      icon: "page",
      onSelect: () => {
        window.print();
      },
    },
  ];
}

// "Page history": the page's versions, to look at and restore.
export function historyItem(pageId: BlockId, dispatch: Dispatch): MenuItem {
  const overlay = { kind: PAGE_HISTORY_OVERLAY, anchorId: pageId };
  return {
    label: COPY.pageHistory.open,
    icon: "history",
    onSelect: () => dispatch(openOverlay.create({ overlay })),
  };
}

// "Resolved comments", with how many, while the page has any.
export function resolvedItems(
  state: AppState,
  pageId: BlockId,
  dispatch: Dispatch,
): MenuItem[] {
  const count = selectResolvedDiscussions(state, pageId).length;
  if (count === 0) return [];
  const overlay = { kind: RESOLVED_COMMENTS_OVERLAY, anchorId: pageId };
  return [
    {
      label: COPY.comments.resolved,
      icon: "comment",
      value: String(count),
      onSelect: () => dispatch(openOverlay.create({ overlay })),
    },
  ];
}
