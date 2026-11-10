import { html, type TemplateResult } from "lit-html";
import { COPY } from "../../ui/copy.ts";
import { renderRichText } from "../../ui/rich-text/index.ts";
import type { CalloutBlock } from "./callout.schema.ts";

export function renderCallout(block: CalloutBlock): TemplateResult {
  const { icon, text } = block.props;
  return html`<div class="callout">
    <span class="callout__icon" aria-hidden="true">${icon}</span>
    ${renderRichText({ text, tag: "div", placeholder: COPY.blocks.callout })}
  </div>`;
}
