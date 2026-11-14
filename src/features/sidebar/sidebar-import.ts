// Import, as Notion's: a CSV file becomes a new database, a Markdown or
// HTML file a new page, and a ZIP archive of Markdown files, as Notion
// exports them, pages with their subpages.
import type { Dispatch } from "../../state/index.ts";
import { importCsvFile } from "../database/index.ts";
import {
  importArchiveFile,
  importHtmlFile,
  importMarkdownFile,
  isHtmlFile,
} from "../markdown-import/index.ts";

const ACCEPTED = [
  ".csv,text/csv",
  ".md,.markdown,text/markdown",
  ".html,.htm,text/html",
  ".zip,application/zip",
].join(",");

function importerOf(file: File) {
  if (/\.zip$/i.test(file.name)) return importArchiveFile;
  if (/\.(md|markdown)$/i.test(file.name)) return importMarkdownFile;
  if (isHtmlFile(file.name)) return importHtmlFile;
  return importCsvFile;
}

export function importFiles(files: readonly File[], dispatch: Dispatch): void {
  for (const file of files) void importerOf(file)(file, dispatch);
}

// The file chooser, opened by Import in the workspace menu. The choice in
// the menu is the person's gesture, which lets the chooser open.
export function chooseImportFiles(dispatch: Dispatch): void {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.accept = ACCEPTED;
  input.addEventListener(
    "change",
    () => {
      importFiles([...(input.files ?? [])], dispatch);
    },
    { once: true },
  );
  input.click();
}
