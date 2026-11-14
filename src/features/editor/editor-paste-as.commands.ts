// Notion's "Paste as" for a pasted web address: kept as a link (URL), or
// made a mention of the page, a bookmark card, or an embed.
import { isTextBlock } from "../../blocks/index.ts";
import { BOOKMARK_TYPE } from "../../blocks/bookmark/index.ts";
import { EMBED_TYPE, toEmbedUrl } from "../../blocks/embed/index.ts";
import { insertMention, safeHref } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import { caretAt, setText } from "./editor.commands.ts";
import { closed, placeAt, type Typed } from "./editor-place.ts";

export type PasteAsKind = "mention" | "bookmark" | "embed";

// What a mention of a web page shows: its address without the scheme,
// "www." or a closing slash.
export function linkMentionText(href: string): string {
  const url = URL.parse(href);
  if (url === null) return href;
  const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
  return `${url.hostname.replace(/^www\./, "")}${path}`;
}

const mentionLink = defineCommand<Typed & { href: string }>({
  type: "text.pasteAsMention",
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    const href = safeHref(command.href);
    if (!isTextBlock(block) || href === undefined) return {};
    const { start, end } = command;
    const span = {
      text: linkMentionText(href),
      mention: { kind: "link" as const, href },
    };
    const text = insertMention(block.props.text, { start, end, span });
    const operations = setText(state, {
      blockId: block.id,
      text,
      now: command.meta.now,
    });
    const selection = caretAt(block.id, start + span.text.length);
    return { operations, ui: { ...state.ui, selection, overlay: null } };
  },
});

const cardOf = defineCommand<Typed & { href: string; kind: PasteAsKind }>({
  type: "block.pasteAsCard",
  newBlockIds: 1,
  handle(state, command) {
    const { href, kind } = command;
    if (kind === "embed" && toEmbedUrl(href) === undefined) return {};
    const operations = placeAt(state, command, {
      type: kind === "embed" ? EMBED_TYPE : BOOKMARK_TYPE,
      props: { url: href },
      newId: command.meta.blockIds[0],
      now: command.meta.now,
    });
    return operations.length === 0 ? {} : { operations, ui: closed(state) };
  },
});

// The command for a choice of the "Paste as" menu.
export function pasteAs(typed: Typed & { href: string }, kind: PasteAsKind) {
  return kind === "mention"
    ? mentionLink.create(typed)
    : cardOf.create({ ...typed, kind });
}

export const editorPasteAsCommands = [mentionLink, cardOf];
