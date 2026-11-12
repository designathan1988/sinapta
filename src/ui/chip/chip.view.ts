// A label on a tinted background, in one of the option colors: an option
// of a select property, a status, or a group named by one.
import "./chip.css";
import { html, type TemplateResult } from "lit-html";
import { renderIcon } from "../icon/index.ts";

export function renderChip(label: string, color: string): TemplateResult {
  return html`<span class="chip" data-color=${color}>${label}</span>`;
}

// A chip with an x that takes it off, as a chosen option in its editor.
export function renderRemovableChip(
  label: string,
  color: string,
  remove: { readonly label: string; readonly onRemove: () => void },
): TemplateResult {
  return html`<span class="chip" data-color=${color}
    >${label}<button
      type="button"
      class="chip__remove"
      aria-label=${remove.label}
      tabindex="-1"
      @click=${(event: Event) => {
        event.stopPropagation();
        remove.onRemove();
      }}
    >
      ${renderIcon("close")}
    </button></span
  >`;
}

// A color alone, as a square, for a list of colors to choose from.
export function renderChipSwatch(color: string): TemplateResult {
  return html`<span class="chip__swatch" data-color=${color}></span>`;
}
