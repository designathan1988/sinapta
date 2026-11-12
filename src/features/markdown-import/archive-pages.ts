// The pages a Markdown archive holds, as Notion exports them: each page's
// file, and beside it a folder of the same name holding its subpages'
// files and folders. Files whose folder has no page of its name stay at
// the top.
import {
  parseMarkdownBlocks,
  type PastedBlock,
} from "../../ui/rich-text/index.ts";

export interface ImportedPage {
  readonly title: string;
  readonly blocks: readonly PastedBlock[];
  readonly subpages?: readonly ImportedPage[];
}

export interface ArchiveText {
  readonly path: string;
  readonly text: string;
}

const MARKDOWN_FILE = /\.(md|markdown)$/i;

// A file's page: a first "# Title" names it, as Notion's export writes
// one; else the file's name does.
export function markdownPage(name: string, text: string): ImportedPage {
  const blocks = parseMarkdownBlocks(text);
  const [first, ...rest] = blocks;
  if (first?.kind === "heading" && first.level === 1) {
    return {
      title: first.text.map((span) => span.text).join(""),
      blocks: rest,
    };
  }
  const base = name.split("/").at(-1) ?? name;
  return { title: base.replace(MARKDOWN_FILE, ""), blocks };
}

interface Node {
  readonly page: ImportedPage;
  readonly children: Node[];
}

function folderOf(key: string): string {
  return key.includes("/") ? key.slice(0, key.lastIndexOf("/")) : "";
}

function toPage(node: Node): ImportedPage {
  return { ...node.page, subpages: node.children.map(toPage) };
}

function baseOf(key: string): string {
  return key.slice(key.lastIndexOf("/") + 1);
}

function decoded(href: string): string {
  try {
    return decodeURIComponent(href);
  } catch {
    return href;
  }
}

// Notion's export links each subpage from its page's file; here the
// subpage itself takes the link's place, so the link's line goes.
const LINK_LINE = /^\[[^\]]*\]\(([^)]+)\)$/;

function withoutSubpageLinks(
  text: string,
  subpages: ReadonlySet<string>,
): string {
  const keeps = (line: string): boolean => {
    const href = LINK_LINE.exec(line.trim())?.[1];
    if (href === undefined || !MARKDOWN_FILE.test(href)) return true;
    return !subpages.has(baseOf(decoded(href).replace(MARKDOWN_FILE, "")));
  };
  return text.split("\n").filter(keeps).join("\n");
}

interface Entry {
  readonly key: string;
  readonly file: ArchiveText;
}

function nodeOf(entry: Entry, entries: readonly Entry[]): Node {
  const subpages = new Set(
    entries
      .filter((other) => folderOf(other.key) === entry.key)
      .map((other) => baseOf(other.key)),
  );
  const text = withoutSubpageLinks(entry.file.text, subpages);
  return { page: markdownPage(entry.file.path, text), children: [] };
}

export function archivePages(files: readonly ArchiveText[]): ImportedPage[] {
  const entries = files
    .filter((file) => MARKDOWN_FILE.test(file.path))
    .map((file) => ({ key: file.path.replace(MARKDOWN_FILE, ""), file }));
  const nodes = new Map(
    entries.map((entry) => [entry.key, nodeOf(entry, entries)]),
  );
  const roots: Node[] = [];
  for (const { key } of entries) {
    const node = nodes.get(key);
    if (node === undefined) continue;
    const parent = nodes.get(folderOf(key));
    (parent?.children ?? roots).push(node);
  }
  return roots.map(toPage);
}
