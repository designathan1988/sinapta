// A web bookmark's preview, as the server read it (ADR-0013): kept on the
// block whose address it is, unless the address changed meanwhile.
import type { BlockId } from "../model/index.ts";
import { defineCommand } from "./command-registry.ts";

export interface LinkPreview {
  readonly title: string;
  readonly description: string;
  readonly image: string | null;
  readonly icon: string | null;
}

export const setLinkPreview = defineCommand<{
  blockId: BlockId;
  url: string;
  preview: LinkPreview;
}>({
  type: "link.setPreview",
  handle(state, { blockId, url, preview }) {
    const block = state.workspace.blocks[blockId];
    if (block?.props.url !== url) return {};
    const props = { ...block.props, preview };
    return {
      operations: [
        { type: "record.update", kind: "block", id: blockId, patch: { props } },
      ],
    };
  },
});

// A web page's mention shows the page's own title, as Notion's, once the
// server has read it; a mention edited meanwhile keeps its words.
export const setLinkMentionTitle = defineCommand<{
  blockId: BlockId;
  href: string;
  title: string;
}>({
  type: "link.setMentionTitle",
  handle(state, { blockId, href, title }) {
    const block = state.workspace.blocks[blockId];
    const text = block?.props.text;
    if (block === undefined || !Array.isArray(text) || title.trim() === "") {
      return {};
    }
    const titled = text.map((span: unknown) => titledSpan(span, href, title));
    if (titled.every((span, index) => span === text[index])) return {};
    const props = { ...block.props, text: titled };
    return {
      operations: [
        { type: "record.update", kind: "block", id: blockId, patch: { props } },
      ],
    };
  },
});

function titledSpan(span: unknown, href: string, title: string): unknown {
  if (typeof span !== "object" || span === null) return span;
  const mention: unknown = Reflect.get(span, "mention");
  if (typeof mention !== "object" || mention === null) return span;
  const isUntitled =
    Reflect.get(mention, "kind") === "link" &&
    Reflect.get(mention, "href") === href &&
    Reflect.get(mention, "isTitled") !== true;
  if (!isUntitled) return span;
  return {
    ...span,
    text: title.trim(),
    mention: { ...mention, isTitled: true },
  };
}

export const linkPreviewCommands = [setLinkPreview, setLinkMentionTitle];
