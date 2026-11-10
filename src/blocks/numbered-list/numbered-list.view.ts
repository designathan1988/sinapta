import { html, type TemplateResult } from "lit-html";
import { COPY } from "../../ui/copy.ts";
import { renderRichText } from "../../ui/rich-text/index.ts";
import type { NumberedListBlock } from "./numbered-list.schema.ts";

export function renderNumberedList(block: NumberedListBlock): TemplateResult {
  return html`<div class="numbered-list">
    ${renderRichText({
      text: block.props.text,
      tag: "div",
      placeholder: COPY.blocks.listItem,
    })}
  </div>`;
}
