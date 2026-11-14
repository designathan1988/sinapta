// "Copy link to view", from the view tab's menu or the view settings: the
// address of the database the view belongs to, its page or the block that
// holds it on the open page, put on the clipboard.
import { announce } from "../../ui/announcer/index.ts";
import { linkToBlock, linkToPage } from "../../ui/address/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuItem } from "../../ui/menu/index.ts";
import type { TableContext } from "./table-cell.view.ts";

function viewLink(context: TableContext): string {
  const { model, state } = context;
  const pageId = state.ui.activePageId;
  return pageId === null || pageId === model.holderId
    ? linkToPage(model.holderId)
    : linkToBlock(pageId, model.holderId);
}

function copyLink(context: TableContext): void {
  if (typeof navigator === "undefined" || !("clipboard" in navigator)) return;
  navigator.clipboard.writeText(viewLink(context)).then(
    () => {
      announce(COPY.database.viewLinkCopied);
    },
    () => undefined,
  );
}

export function copyViewLinkItem(context: TableContext): MenuItem {
  return {
    label: COPY.database.copyViewLink,
    icon: "link",
    onSelect: () => {
      copyLink(context);
    },
  };
}
