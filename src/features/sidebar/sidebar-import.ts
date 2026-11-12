// Import, as Notion's: a CSV file becomes a new database, a Markdown file
// a new page.
import type { Dispatch } from "../../state/index.ts";
import { importCsvFile } from "../database/index.ts";
import { importMarkdownFile } from "../markdown-import/index.ts";

const ACCEPTED = ".csv,text/csv,.md,.markdown,text/markdown";

export function importFiles(files: readonly File[], dispatch: Dispatch): void {
  for (const file of files) {
    const isMarkdown = /\.(md|markdown)$/i.test(file.name);
    void (isMarkdown ? importMarkdownFile : importCsvFile)(file, dispatch);
  }
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
