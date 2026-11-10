import { html, type TemplateResult } from "lit-html";
import { COPY } from "../../ui/copy.ts";
import { renderRichText, type RichTextTag } from "../../ui/rich-text/index.ts";
import type { HeadingBlock } from "./heading.schema.ts";

// The page title is the document's h1, so block headings start at h2.
const TAGS: Record<HeadingBlock["props"]["level"], RichTextTag> = {
  1: "h2",
  2: "h3",
  3: "h4",
};

export function renderHeading(block: HeadingBlock): TemplateResult {
  const { level, text } = block.props;
  return html`<div class="heading" data-level=${level}>
    ${renderRichText({
      text,
      tag: TAGS[level],
      placeholder: `${COPY.blocks.heading} ${String(level)}`,
    })}
  </div>`;
}
