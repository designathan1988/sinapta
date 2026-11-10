import "./bulleted-list.css";
import { html, type TemplateResult } from "lit-html";
import { COPY } from "../../ui/copy.ts";
import { renderRichText } from "../../ui/rich-text/index.ts";
import type { BulletedListBlock } from "./bulleted-list.schema.ts";

export function renderBulletedList(block: BulletedListBlock): TemplateResult {
  return html`<div class="bulleted-list">
    ${renderRichText({
      text: block.props.text,
      tag: "div",
      placeholder: COPY.blocks.listItem,
    })}
  </div>`;
}
