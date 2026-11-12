// A page written as one HTML file, as Notion's "Export as HTML": its title
// and its blocks as their elements, marks and links kept, every text
// escaped, and a little style of its own so the file reads well alone.
import { isTextBlock } from "../../blocks/index.ts";
import { selectPage, selectPageTitle } from "../../blocks/page/index.ts";
import {
  plainText,
  safeHref,
  type Block,
  type BlockId,
  type RichText,
  type TextSpan,
} from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  markdownFileName,
  selectPageContent,
} from "./markdown-export.selectors.ts";

const ESCAPES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (character) => ESCAPES[character] ?? "");
}

const MARK_TAGS = [
  ["code", "code"],
  ["strikethrough", "s"],
  ["underline", "u"],
  ["italic", "em"],
  ["bold", "strong"],
] as const;

function spanToHtml(span: TextSpan): string {
  if (span.equation !== undefined) {
    return `<code>${escapeHtml(span.equation)}</code>`;
  }
  let html = escapeHtml(span.text);
  for (const [mark, tag] of MARK_TAGS) {
    if (span.marks?.includes(mark) === true) html = `<${tag}>${html}</${tag}>`;
  }
  const href = span.href === undefined ? undefined : safeHref(span.href);
  return href === undefined
    ? html
    : `<a href="${escapeHtml(href)}">${html}</a>`;
}

export function richTextToHtml(rich: RichText): string {
  return rich.map(spanToHtml).join("");
}

function richOf(block: Block): string {
  return isTextBlock(block) ? richTextToHtml(block.props.text) : "";
}

// A prop that holds text, or "" for anything else.
function textProp(block: Block, key: string): string {
  const value = block.props[key];
  return typeof value === "string" ? value : "";
}

// The element of a block that is not one of a list.
const ELEMENTS: Readonly<Record<string, (block: Block) => string>> = {
  paragraph: (block) => `<p>${richOf(block)}</p>`,
  heading: (block) => {
    const level = Math.min(Number(block.props.level ?? 1) + 1, 4);
    return `<h${String(level)}>${richOf(block)}</h${String(level)}>`;
  },
  quote: (block) => `<blockquote>${richOf(block)}</blockquote>`,
  callout: (block) =>
    `<aside class="callout">${escapeHtml(textProp(block, "icon"))} ${richOf(block)}</aside>`,
  code: (block) =>
    `<pre><code>${escapeHtml(isTextBlock(block) ? plainText(block.props.text) : "")}</code></pre>`,
  divider: () => "<hr>",
  equation: (block) =>
    `<pre class="equation">${escapeHtml(textProp(block, "expression"))}</pre>`,
  bookmark: (block) => {
    const href = safeHref(textProp(block, "url"));
    return href === undefined
      ? ""
      : `<p><a href="${escapeHtml(href)}">${escapeHtml(href)}</a></p>`;
  },
};

// Lists gather their neighbors of the same kind into one element.
const LISTS: Readonly<Record<string, { tag: string; open: string }>> = {
  "bulleted-list": { tag: "ul", open: "<ul>" },
  "numbered-list": { tag: "ol", open: "<ol>" },
  "to-do": { tag: "ul", open: '<ul class="to-do">' },
};

function listItem(state: AppState, block: Block): string {
  const box =
    block.type === "to-do"
      ? `<input type="checkbox" disabled${block.props.isChecked === true ? " checked" : ""}> `
      : "";
  return `<li>${box}${richOf(block)}${childrenHtml(state, block)}</li>`;
}

function ownHtml(state: AppState, block: Block): string {
  if (block.type === "toggle") {
    return `<details><summary>${richOf(block)}</summary>${blocksHtml(state, selectPageContent(state, block.childIds))}</details>`;
  }
  const element = ELEMENTS[block.type];
  if (element !== undefined) return element(block);
  return isTextBlock(block) ? `<p>${richTextToHtml(block.props.text)}</p>` : "";
}

function childrenHtml(state: AppState, block: Block): string {
  const children = selectPageContent(state, block.childIds);
  return children.length === 0 ? "" : blocksHtml(state, children);
}

function blocksHtml(state: AppState, blocks: readonly Block[]): string {
  let html = "";
  blocks.forEach((block, index) => {
    const list = LISTS[block.type];
    if (list === undefined) {
      const nested = block.type === "toggle" ? "" : childrenHtml(state, block);
      html += ownHtml(state, block) + nested;
      return;
    }
    if (blocks[index - 1]?.type !== block.type) html += list.open;
    html += listItem(state, block);
    if (blocks[index + 1]?.type !== block.type) html += `</${list.tag}>`;
  });
  return html;
}

const STYLE =
  "body{max-width:42rem;margin:4rem auto;padding:0 1rem;font-family:system-ui,sans-serif;line-height:1.5;color:#37352f}" +
  "pre{padding:1rem;background:#f7f6f3;overflow:auto}blockquote{margin:0;padding-left:1rem;border-left:3px solid currentColor}" +
  ".callout{padding:1rem;background:#f1f1ef;border-radius:4px}.to-do{list-style:none;padding-left:0}";

export function selectPageHtml(state: AppState, pageId: BlockId): string {
  const page = selectPage(state, pageId);
  if (page === undefined) return "";
  const title = escapeHtml(selectPageTitle(page) || COPY.sidebar.untitled);
  const body = blocksHtml(state, selectPageContent(state, page.childIds));
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><style>${STYLE}</style></head><body><article><h1>${title}</h1>${body}</article></body></html>\n`;
}

export function htmlFileName(title: string): string {
  return markdownFileName(title).replace(/\.md$/, ".html");
}
