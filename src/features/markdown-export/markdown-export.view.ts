// Saves the open page as a Markdown file. Nothing in the store changes, so
// no command is dispatched.
import { selectPage, selectPageTitle } from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import { downloadTextFile } from "../../ui/download/index.ts";
import {
  markdownFileName,
  selectPageMarkdown,
} from "./markdown-export.selectors.ts";

export function exportPageAsMarkdown(state: AppState, pageId: BlockId): void {
  const page = selectPage(state, pageId);
  if (page === undefined) return;
  downloadTextFile({
    name: markdownFileName(selectPageTitle(page)),
    type: "text/markdown",
    text: selectPageMarkdown(state, pageId),
  });
  announce(COPY.pageMenu.exportedMarkdown);
}
