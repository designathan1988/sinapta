import "./code.css";
import { html, type TemplateResult } from "lit-html";
import { COPY } from "../../ui/copy.ts";
import { renderRichText } from "../../ui/rich-text/index.ts";
import type { CodeBlock } from "./code.schema.ts";

export function renderCode(block: CodeBlock): TemplateResult {
  return html`<div class="code" spellcheck="false">
    ${renderRichText({
      text: block.props.text,
      tag: "div",
      placeholder: COPY.blocks.code,
    })}
  </div>`;
}
