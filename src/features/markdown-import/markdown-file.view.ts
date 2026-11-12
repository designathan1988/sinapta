// Reading a Markdown file the person chose into a new page, or a ZIP
// archive of them, as Notion's Markdown export makes, into pages with
// their subpages inside them.
import { readZip, type ZipEntry } from "../../model/index.ts";
import type { Dispatch } from "../../state/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  archivePages,
  markdownPage,
  type ArchiveText,
} from "./archive-pages.ts";
import { importMarkdown } from "./markdown-import.commands.ts";

const STORED = 0;
const DEFLATED = 8;
const MARKDOWN_FILE = /\.(md|markdown)$/i;

export async function importMarkdownFile(
  file: File,
  dispatch: Dispatch,
): Promise<void> {
  dispatch(importMarkdown.create(markdownPage(file.name, await file.text())));
  announce(COPY.sidebar.importedMarkdown);
}

// A file's bytes as stored, inflated by the browser when deflated.
async function inflated(entry: ZipEntry): Promise<Uint8Array | undefined> {
  if (entry.method === STORED) return entry.data;
  if (entry.method !== DEFLATED) return undefined;
  const stream = new Blob([new Uint8Array(entry.data)])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function archiveTexts(file: File): Promise<ArchiveText[]> {
  const entries = readZip(new Uint8Array(await file.arrayBuffer()));
  const pages = entries.filter((entry) => MARKDOWN_FILE.test(entry.path));
  const texts = await Promise.all(
    pages.map(async (entry): Promise<ArchiveText[]> => {
      const data = await inflated(entry);
      if (data === undefined) return [];
      return [{ path: entry.path, text: new TextDecoder().decode(data) }];
    }),
  );
  return texts.flat();
}

export async function importArchiveFile(
  file: File,
  dispatch: Dispatch,
): Promise<void> {
  const pages = archivePages(await archiveTexts(file));
  if (pages.length === 0) {
    announce(COPY.sidebar.importedNothing);
    return;
  }
  for (const page of pages) dispatch(importMarkdown.create(page));
  announce(COPY.sidebar.importedArchive);
}
