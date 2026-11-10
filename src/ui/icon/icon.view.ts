import { html, svg, type TemplateResult } from "lit-html";

export type IconName = "sidebar" | "settings" | "close" | "plus" | "chevron";

// 16-unit outline icons, drawn with the current text color.
// Fragments use the `svg` tag so that they are parsed as SVG, not HTML.
const PATHS: Record<IconName, TemplateResult<2>> = {
  sidebar: svg`<rect x="2" y="3" width="12" height="10" rx="1.5" />
    <path d="M6 3v10" />`,
  settings: svg`<circle cx="8" cy="8" r="2" />
    <path
      d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"
    />`,
  close: svg`<path d="M4 4l8 8M12 4l-8 8" />`,
  plus: svg`<path d="M8 3v10M3 8h10" />`,
  chevron: svg`<path d="M6 4l4 4-4 4" />`,
};

// Icons are decoration; the control that holds one carries the name.
export function renderIcon(name: IconName): TemplateResult {
  return html`<svg
    class="icon"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    ${PATHS[name]}
  </svg>`;
}
