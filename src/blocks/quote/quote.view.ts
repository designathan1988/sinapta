import "./quote.css";
import { html, type TemplateResult } from "lit-html";
import { COPY } from "../../ui/copy.ts";
import { renderRichText } from "../../ui/rich-text/index.ts";
import type { QuoteBlock } from "./quote.schema.ts";

export function renderQuote(
  block: QuoteBlock,
  isEditable = true,
): TemplateResult {
  return html`<div class="quote">
    ${renderRichText({
      isEditable,
      text: block.props.text,
      tag: "div",
      placeholder: COPY.blocks.quote,
    })}
  </div>`;
}
