import { html, type TemplateResult } from "lit-html";
import { COPY } from "../../ui/copy.ts";
import { renderRichText } from "../../ui/rich-text/index.ts";
import type { ParagraphBlock } from "./paragraph.schema.ts";

export function renderParagraph(block: ParagraphBlock): TemplateResult {
  return html`<div class="paragraph">
    ${renderRichText({
      text: block.props.text,
      tag: "p",
      placeholder: COPY.blocks.paragraph,
    })}
  </div>`;
}
