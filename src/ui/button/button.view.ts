import { html, nothing, type TemplateResult } from "lit-html";
import { renderIcon, type IconName } from "../icon/index.ts";

export interface ButtonOptions {
  readonly label: string;
  readonly onClick: (event: Event) => void;
  readonly icon?: IconName;
  // Show only the icon; the label stays as the accessible name.
  readonly isIconOnly?: boolean;
  readonly variant?: "quiet" | "primary" | "danger";
}

export function renderButton(options: ButtonOptions): TemplateResult {
  const isIconOnly = options.isIconOnly === true;
  return html`<button
    type="button"
    class="button"
    data-variant=${options.variant ?? "quiet"}
    aria-label=${isIconOnly ? options.label : nothing}
    title=${isIconOnly ? options.label : nothing}
    @click=${options.onClick}
  >
    ${options.icon === undefined ? nothing : renderIcon(options.icon)}
    ${isIconOnly ? nothing : html`<span>${options.label}</span>`}
  </button>`;
}
