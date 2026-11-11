// A label on a tinted background, in one of the option colors: an option
// of a select property, a status, or a group named by one.
import "./chip.css";
import { html, type TemplateResult } from "lit-html";

export function renderChip(label: string, color: string): TemplateResult {
  return html`<span class="chip" data-color=${color}>${label}</span>`;
}

// A color alone, as a square, for a list of colors to choose from.
export function renderChipSwatch(color: string): TemplateResult {
  return html`<span class="chip__swatch" data-color=${color}></span>`;
}
