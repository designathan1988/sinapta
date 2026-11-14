// An HTML file imported as a page, as Notion's import reads one: its
// first top heading, or else its <title>, or else the file's name, names
// the page; the rest becomes blocks, read as pasted HTML is, which takes
// only text, marks, links and image addresses.
import { parsePastedHtmlBlocks } from "../../ui/rich-text/index.ts";
import type { ImportedPage } from "./archive-pages.ts";

const HTML_FILE = /\.html?$/i;
const TITLE = /<title[^>]*>([^<]*)<\/title>/i;
const ENTITIES: Readonly<Record<string, string>> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

function titleOf(html: string): string {
  const raw = TITLE.exec(html)?.[1] ?? "";
  return raw
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity] ?? "")
    .trim();
}

export function isHtmlFile(name: string): boolean {
  return HTML_FILE.test(name);
}

export function htmlPage(name: string, html: string): ImportedPage {
  const blocks = parsePastedHtmlBlocks(html);
  const [first, ...rest] = blocks;
  if (first?.kind === "heading" && first.level === 1) {
    return {
      title: first.text.map((span) => span.text).join(""),
      blocks: rest,
    };
  }
  const base = name.split("/").at(-1) ?? name;
  const title = titleOf(html);
  return { title: title === "" ? base.replace(HTML_FILE, "") : title, blocks };
}
