import "./icon.css";
import { html, svg, type TemplateResult } from "lit-html";

export type IconName =
  | "sidebar"
  | "settings"
  | "close"
  | "plus"
  | "chevron"
  | "more"
  | "star"
  | "trash"
  | "up"
  | "down"
  | "restore"
  | "grip"
  | "duplicate"
  | "download"
  | "back"
  | "check";

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
  back: svg`<path d="M10 4L6 8l4 4" />`,
  check: svg`<path d="M3.5 8.5l3 3 6-7" />`,
  more: svg`<path d="M3.5 8h.01M8 8h.01M12.5 8h.01" />`,
  star: svg`<path
    d="M8 2.2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.4l-3.6 1.9.7-4L2.2 6.5l4-.6z"
  />`,
  trash: svg`<path d="M3 4.5h10M6.5 4.5v-2h3v2M4.5 4.5l.6 9h5.8l.6-9" />`,
  up: svg`<path d="M8 13V3M4 7l4-4 4 4" />`,
  down: svg`<path d="M8 3v10M4 9l4 4 4-4" />`,
  grip: svg`<path
    d="M6 3.5h.01M10 3.5h.01M6 8h.01M10 8h.01M6 12.5h.01M10 12.5h.01"
  />`,
  download: svg`<path d="M8 2.5v8M4.5 7L8 10.5 11.5 7M3 13.5h10" />`,
  restore: svg`<path d="M3 8a5 5 0 1 0 1.6-3.7M3 3v3h3" />`,
  duplicate: svg`<rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
    <path d="M10.5 3.5V3A1.5 1.5 0 0 0 9 1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5" />`,
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
