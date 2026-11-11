import "./icon.css";
import { html, svg, type TemplateResult } from "lit-html";
import { BLOCK_PATHS, isBlockIcon, type BlockIconName } from "./block-icons.ts";
import { DATA_PATHS, isDataIcon, type DataIconName } from "./data-icons.ts";

export type BaseIconName =
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
  | "arrow-left"
  | "arrow-right"
  | "check"
  | "page"
  | "database"
  | "search"
  | "home"
  | "compose"
  | "link"
  | "move"
  | "align-left"
  | "align-center"
  | "align-right"
  | "expand"
  | "lock"
  | "help";

export type IconName = BaseIconName | DataIconName | BlockIconName;

// 16-unit outline icons, drawn with the current text color.
// Fragments use the `svg` tag so that they are parsed as SVG, not HTML.
const PATHS: Record<BaseIconName, TemplateResult<2>> = {
  sidebar: svg`<rect x="2" y="3" width="12" height="10" rx="1.5" />
    <path d="M6 3v10" />`,
  settings: svg`<circle cx="8" cy="8" r="2" />
    <path
      d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"
    />`,
  close: svg`<path d="M4 4l8 8M12 4l-8 8" />`,
  lock: svg`<rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />`,
  help: svg`<circle cx="8" cy="8" r="6" />
    <path d="M6.25 6.25a1.75 1.75 0 1 1 2.5 1.6c-.5.25-.75.6-.75 1.15M8 11.25h.01" />`,
  plus: svg`<path d="M8 3v10M3 8h10" />`,
  chevron: svg`<path d="M6 4l4 4-4 4" />`,
  back: svg`<path d="M10 4L6 8l4 4" />`,
  "arrow-left": svg`<path d="M13 8H3M7 4L3 8l4 4" />`,
  "arrow-right": svg`<path d="M3 8h10M9 4l4 4-4 4" />`,
  check: svg`<path d="M3.5 8.5l3 3 6-7" />`,
  link: svg`<path d="M6.5 9.5a2.5 2.5 0 0 0 3.5 0l2.5-2.5A2.5 2.5 0 0 0 9 3.5l-.75.75" />
    <path d="M9.5 6.5a2.5 2.5 0 0 0-3.5 0L3.5 9A2.5 2.5 0 0 0 7 12.5l.75-.75" />`,
  move: svg`<path d="M2 8h9M8 5l3 3-3 3" /><path d="M13.5 2.5v11" />`,
  "align-left": svg`<path d="M2.5 3.5h11M2.5 6.5h7M2.5 9.5h11M2.5 12.5h7" />`,
  "align-center": svg`<path d="M2.5 3.5h11M4.5 6.5h7M2.5 9.5h11M4.5 12.5h7" />`,
  "align-right": svg`<path d="M2.5 3.5h11M6.5 6.5h7M2.5 9.5h11M6.5 12.5h7" />`,
  expand: svg`<path d="M9.5 2.5h4v4M13.5 2.5l-4.5 4.5M6.5 13.5h-4v-4M2.5 13.5L7 9" />`,
  page: svg`<path d="M4 1.5h5.5l3 3v10H4z" /><path d="M9.5 1.5v3h3M6 8h4.5M6 10.5h4.5" />`,
  database: svg`<rect x="2" y="2.5" width="12" height="11" rx="1.5" />
    <path d="M2 6.5h12M2 10h12M6.5 6.5v7" />`,
  search: svg`<circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5l3.5 3.5" />`,
  home: svg`<path d="M2.5 7.5L8 3l5.5 4.5M4 6.5v7h8v-7" />`,
  compose: svg`<path d="M7.5 2.5h-4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-4" />
    <path d="M11.5 2l2.5 2.5L8.5 10H6V7.5z" />`,
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

function pathsOf(name: IconName): TemplateResult<2> {
  if (isDataIcon(name)) return DATA_PATHS[name];
  return isBlockIcon(name) ? BLOCK_PATHS[name] : PATHS[name];
}

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
    data-icon=${name}
  >
    ${pathsOf(name)}
  </svg>`;
}
