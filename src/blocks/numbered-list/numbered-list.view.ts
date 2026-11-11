import "./numbered-list.css";
import { html, type TemplateResult } from "lit-html";
import { COPY } from "../../ui/copy.ts";
import { renderRichText } from "../../ui/rich-text/index.ts";
import type { NumberedListBlock } from "./numbered-list.schema.ts";

// The marker, such as "2." or "b.", comes from selectListMarker.
export function renderNumberedList(
  block: NumberedListBlock,
  marker: string,
): TemplateResult {
  return html`<div class="numbered-list">
    <span class="numbered-list__marker">${marker}</span>
    ${renderRichText({
      text: block.props.text,
      tag: "div",
      placeholder: COPY.blocks.listItem,
    })}
  </div>`;
}
