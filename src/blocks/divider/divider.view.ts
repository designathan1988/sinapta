import "./divider.css";
import { html, type TemplateResult } from "lit-html";

export function renderDivider(): TemplateResult {
  return html`<hr class="divider" />`;
}
