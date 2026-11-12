// Reading a Markdown file the person chose into a new page.
import type { Dispatch } from "../../state/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import { parseMarkdownBlocks } from "../../ui/rich-text/index.ts";
import { importMarkdown } from "./markdown-import.commands.ts";

export async function importMarkdownFile(
  file: File,
  dispatch: Dispatch,
): Promise<void> {
  const blocks = parseMarkdownBlocks(await file.text());
  const [first, ...rest] = blocks;
  // A first "# Title" names the page, as Notion's export writes it.
  const isTitle = first?.kind === "heading" && first.level === 1;
  const title = isTitle
    ? first.text.map((span) => span.text).join("")
    : file.name.replace(/\.(md|markdown)$/i, "");
  dispatch(importMarkdown.create({ title, blocks: isTitle ? rest : blocks }));
  announce(COPY.sidebar.importedMarkdown);
}
