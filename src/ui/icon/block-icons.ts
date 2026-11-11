// Icons for block types, as the slash menu and the block menus show them,
// drawn like the others: 16 units, outlined in the current text color.
import { svg, type TemplateResult } from "lit-html";

// "H" with the level beside it, for the heading icons.
function heading(level: string): TemplateResult<2> {
  return svg`<path d="M2.5 3.5v9M8 3.5v9M2.5 8H8" />
    <path d="${level}" />`;
}

export const BLOCK_PATHS = {
  "heading-1": heading("M11 5.5l2-1.5v8.5"),
  "heading-2": heading(
    "M10.5 5.5a1.75 1.75 0 0 1 3.5 0c0 1.5-3.5 3.5-3.5 7h3.5",
  ),
  "heading-3": heading("M10.5 4h3.25l-2 3a2 2 0 1 1-1.5 3.5M10.5 4h3.25"),
  "heading-4": heading("M13 12.5V4l-3 5.5h4"),
  "toggle-heading": svg`<path d="M3 4.5l2.5 2.5L3 9.5z" fill="currentColor" />
    <path d="M8.5 4v8M13.5 4v8M8.5 8h5" />`,
  bulleted: svg`<path d="M6.5 4.5h7M6.5 8h7M6.5 11.5h7" />
    <circle cx="3.25" cy="4.5" r=".9" fill="currentColor" />
    <circle cx="3.25" cy="8" r=".9" fill="currentColor" />
    <circle cx="3.25" cy="11.5" r=".9" fill="currentColor" />`,
  numbered: svg`<path d="M7 4.5h6.5M7 8h6.5M7 11.5h6.5" />
    <path d="M2.5 3.5l1-.5v3M2.5 9.5a1 1 0 0 1 2 0c0 .75-2 1.5-2 2.5h2" />`,
  toggle: svg`<path d="M5.5 4l4.5 4-4.5 4z" fill="currentColor" />`,
  quote: svg`<path d="M3.5 3v10" /><path d="M6.5 5h7M6.5 8h7M6.5 11h5" />`,
  callout: svg`<rect x="2" y="3" width="12" height="10" rx="2" />
    <path d="M5 6.5h.01M7.5 6.5H11M5 9.5h6" />`,
  code: svg`<path d="M5.5 4.5L2 8l3.5 3.5M10.5 4.5L14 8l-3.5 3.5" />`,
  divider: svg`<path d="M2 8h12" />`,
  image: svg`<rect x="2" y="2.5" width="12" height="11" rx="1.5" />
    <circle cx="6" cy="6.5" r="1.25" /><path d="M2.5 12l4-4 3 3 2-2 2.5 2.5" />`,
  video: svg`<rect x="2" y="3.5" width="9" height="9" rx="1.5" />
    <path d="M11 7l3-2v6l-3-2" />`,
  audio: svg`<path d="M6 11.5V3.5l7-1.5v8" />
    <circle cx="4.5" cy="11.5" r="1.5" /><circle cx="11.5" cy="10" r="1.5" />`,
  pdf: svg`<path d="M4 1.5h5.5l3 3v10H4z" /><path d="M9.5 1.5v3h3" />
    <path d="M6 9.5h4.5M6 12h3" />`,
  bookmark: svg`<path d="M4 2.5h8v11L8 10.5l-4 3z" />`,
  embed: svg`<rect x="2" y="3" width="12" height="10" rx="1.5" />
    <path d="M6.5 6.5L5 8l1.5 1.5M9.5 6.5L11 8l-1.5 1.5" />`,
  toc: svg`<path d="M2.5 4h11M4.5 8h9M6.5 12h7" />`,
  equation: svg`<path d="M12.5 3.5h-8l4 4.5-4 4.5h8" />`,
  breadcrumb: svg`<path d="M2 8h3M6.5 8h3M11 8h3" /><path d="M4.5 6l1.5 2-1.5 2M9 6l1.5 2L9 10" />`,
  synced: svg`<path d="M3 8a5 5 0 0 1 8.5-3.5L13 6M13 8a5 5 0 0 1-8.5 3.5L3 10" />
    <path d="M13 3v3h-3M3 13v-3h3" />`,
  button: svg`<rect x="2" y="4.5" width="12" height="7" rx="3.5" />
    <path d="M6 8h4" />`,
  columns: svg`<rect x="2" y="3" width="5" height="10" rx="1" />
    <rect x="9" y="3" width="5" height="10" rx="1" />`,
  color: svg`<path d="M5 13.5L8 3l3 10.5M6 10h4" />`,
} satisfies Record<string, TemplateResult<2>>;

export type BlockIconName = keyof typeof BLOCK_PATHS;

export function isBlockIcon(name: string): name is BlockIconName {
  return Object.hasOwn(BLOCK_PATHS, name);
}
