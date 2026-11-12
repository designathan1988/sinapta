// Saves the open page as a Markdown file. Nothing in the store changes, so
// no command is dispatched.
import {
  selectPage,
  selectPageTitle,
  type PageBlock,
} from "../../blocks/page/index.ts";
import { writeZip, type BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import { downloadFile, downloadTextFile } from "../../ui/download/index.ts";
import { selectPageArchive, selectSubpages } from "./page-archive.selectors.ts";
import {
  markdownFileName,
  selectPageMarkdown,
} from "./markdown-export.selectors.ts";

// A page with subpages exports as a ZIP of their Markdown files, in
// folders as the pages nest; a page alone as its Markdown file.
export function exportPageAsMarkdown(state: AppState, pageId: BlockId): void {
  const page = selectPage(state, pageId);
  if (page === undefined) return;
  if (selectSubpages(state, pageId).length > 0) {
    exportArchive(state, page);
    return;
  }
  downloadTextFile({
    name: markdownFileName(selectPageTitle(page)),
    type: "text/markdown",
    text: selectPageMarkdown(state, pageId),
  });
  announce(COPY.pageMenu.exportedMarkdown);
}

function exportArchive(state: AppState, page: PageBlock): void {
  const encoder = new TextEncoder();
  const files = selectPageArchive(state, page.id).map((file) => ({
    path: file.path,
    data: encoder.encode(file.text),
  }));
  const name = markdownFileName(selectPageTitle(page)).replace(/\.md$/, ".zip");
  downloadFile({ name, type: "application/zip", data: writeZip(files) });
  announce(COPY.pageMenu.exportedArchive);
}
