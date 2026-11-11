// Reads pasted HTML as blocks: headings, paragraphs, nested lists and
// to-dos, quotes, code, dividers, images and table rows. Like the line
// reader, it parses into a document that never runs or loads anything and
// takes only text, marks, links and image addresses from it.
import { safeImageSource, type RichText } from "../../model/index.ts";
import { richTextOf } from "./pasted-html.ts";

// A pasted block: its type, how deep it is nested, its text, and the few
// props a paste can carry.
export interface PastedBlock {
  readonly kind: string;
  readonly depth: number;
  readonly text: RichText;
  readonly level?: number | undefined;
  readonly isChecked?: boolean | undefined;
  readonly src?: string | undefined;
}

const SKIPPED = new Set("HEAD NOSCRIPT SCRIPT STYLE TEMPLATE TITLE".split(" "));
const CONTAINERS = new Set(
  "ARTICLE ASIDE BODY DIV FOOTER HEADER MAIN NAV SECTION".split(" "),
);
const LISTS: Readonly<Record<string, string>> = {
  UL: "bulleted-list",
  OL: "numbered-list",
};
const HEADINGS: Readonly<Record<string, number>> = {
  H1: 1,
  H2: 2,
  H3: 3,
  H4: 4,
  H5: 4,
  H6: 4,
};

function block(kind: string, text: RichText, depth = 0): PastedBlock {
  return { kind, depth, text };
}

// A list item's own text, without the lists nested in it.
function itemBlocks(item: Element, kind: string, depth: number): PastedBlock[] {
  const own = [...item.childNodes].filter(
    (node) => !(node instanceof Element && node.tagName in LISTS),
  );
  const box = item.querySelector(":scope > input[type=checkbox]");
  const text = richTextOf(own);
  const first: PastedBlock =
    box instanceof HTMLInputElement
      ? { ...block("to-do", text, depth), isChecked: box.checked }
      : block(kind, text, depth);
  const nested = [...item.children].flatMap((child) =>
    child.tagName in LISTS ? listBlocks(child, depth + 1) : [],
  );
  return [first, ...nested];
}

function listBlocks(list: Element, depth: number): PastedBlock[] {
  const kind = LISTS[list.tagName] ?? "bulleted-list";
  return [...list.children].flatMap((child) =>
    child.tagName === "LI" ? itemBlocks(child, kind, depth) : [],
  );
}

function tableBlocks(table: Element): PastedBlock[] {
  return [...table.querySelectorAll("tr")].map((row) => {
    const cells = [...row.children].map((cell) => cell.textContent.trim());
    return block("paragraph", [{ text: cells.join(" | ") }]);
  });
}

function imageBlock(image: Element): PastedBlock[] {
  const src = safeImageSource(image.getAttribute("src") ?? "");
  return src === undefined ? [] : [{ ...block("image", []), src }];
}

// The blocks one element stands for; undefined for inline content.
function elementBlocks(element: Element): PastedBlock[] | undefined {
  const { tagName } = element;
  const level = HEADINGS[tagName];
  if (level !== undefined) {
    return [{ ...block("heading", richTextOf([element])), level }];
  }
  if (tagName in LISTS) return listBlocks(element, 0);
  if (CONTAINERS.has(tagName)) return blocksOf(element);
  const simple: Readonly<Record<string, () => PastedBlock[]>> = {
    P: () => [block("paragraph", richTextOf([element]))],
    BLOCKQUOTE: () => [block("quote", richTextOf([element]))],
    PRE: () => [block("code", [{ text: element.textContent }])],
    HR: () => [block("divider", [])],
    IMG: () => imageBlock(element),
    TABLE: () => tableBlocks(element),
  };
  return simple[tagName]?.();
}

// Inline content between blocks becomes a paragraph of its own.
function blocksOf(parent: Element): PastedBlock[] {
  const blocks: PastedBlock[] = [];
  let inline: Node[] = [];
  const flush = (): void => {
    const text = richTextOf(inline);
    if (text.length > 0) blocks.push(block("paragraph", text));
    inline = [];
  };
  for (const node of parent.childNodes) {
    if (node instanceof Element && SKIPPED.has(node.tagName)) continue;
    const own = node instanceof Element ? elementBlocks(node) : undefined;
    if (own === undefined) {
      inline.push(node);
      continue;
    }
    flush();
    blocks.push(...own);
  }
  flush();
  return blocks.filter(
    (item) => item.text.length > 0 || item.kind !== "paragraph",
  );
}

export function parsePastedHtmlBlocks(html: string): PastedBlock[] {
  const { body } = new DOMParser().parseFromString(html, "text/html");
  return blocksOf(body);
}
