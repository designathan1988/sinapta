// Icons for database views and property types, drawn like the others:
// 16 units, outlined in the current text color.
import { svg, type TemplateResult } from "lit-html";

export const DATA_PATHS = {
  "peek-close": svg`<path d="M3.5 4l4 4-4 4M8.5 4l4 4-4 4" />`,
  "peek-side": svg`<rect x="2" y="3" width="12" height="10" rx="1.5" />
    <path d="M9 3v10" />`,
  "peek-center": svg`<rect x="2" y="3" width="12" height="10" rx="1.5" />
    <rect x="5" y="5.5" width="6" height="5" rx=".5" />`,
  "peek-full": svg`<rect x="2" y="3" width="12" height="10" rx="1.5" />
    <rect x="4" y="5" width="8" height="6" rx=".5" />`,
  eye: svg`<path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" />
    <circle cx="8" cy="8" r="2" />`,
  "eye-off": svg`<path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" />
    <path d="M2.5 2.5l11 11" />`,
  group: svg`<rect x="2.5" y="2.5" width="3" height="3" rx=".5" />
    <rect x="2.5" y="10.5" width="3" height="3" rx=".5" />
    <path d="M8 4h5.5M8 12h5.5" />`,
  wrap: svg`<path d="M2 4h12M2 8h9a2.5 2.5 0 0 1 0 5H8M2 12h3M9.5 11.5 8 13l1.5 1.5" />`,
  freeze: svg`<path d="M6 2h4l-.5 4 2 2.5h-7l2-2.5zM8 8.5V14" />`,
  table: svg`<rect x="2" y="2.5" width="12" height="11" rx="1.5" />
    <path d="M2 6.5h12M2 10h12M6 6.5v7" />`,
  board: svg`<rect x="2" y="2.5" width="3.5" height="11" rx="1" />
    <rect x="6.25" y="2.5" width="3.5" height="7" rx="1" />
    <rect x="10.5" y="2.5" width="3.5" height="9" rx="1" />`,
  gallery: svg`<rect x="2" y="2" width="5" height="5" rx="1" />
    <rect x="9" y="2" width="5" height="5" rx="1" />
    <rect x="2" y="9" width="5" height="5" rx="1" />
    <rect x="9" y="9" width="5" height="5" rx="1" />`,
  list: svg`<path d="M5.5 4h8M5.5 8h8M5.5 12h8M2.5 4h.01M2.5 8h.01M2.5 12h.01" />`,
  feed: svg`<rect x="2.5" y="2" width="11" height="5" rx="1" />
    <rect x="2.5" y="9" width="11" height="5" rx="1" />`,
  form: svg`<rect x="2.5" y="2" width="11" height="12" rx="1.5" />
    <path d="M5 5.5h6M5 8.5h6M5 11.5h3" />`,
  chart: svg`<path d="M3 13.5V8.5M8 13.5V3.5M13 13.5V6.5M2 13.5h12" />`,
  timeline: svg`<path d="M2.5 4h6M5.5 8h7M3.5 12h5" />`,
  calendar: svg`<rect x="2" y="3" width="12" height="11" rx="1.5" />
    <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />`,
  filter: svg`<path d="M2 3h12l-4.5 5.5v4.5l-3-1.5v-3z" />`,
  sort: svg`<path d="M5 2.5v11M2.5 11l2.5 2.5L7.5 11M11 13.5v-11M8.5 5L11 2.5 13.5 5" />`,
  title: svg`<path d="M1.5 12.5L5 3.5l3.5 9M2.8 9.5h4.4" />
    <path d="M14.5 8.5v4M14.5 10.5a2 2 0 1 1-2-2 2 2 0 0 1 2 2z" />`,
  text: svg`<path d="M2.5 4h11M2.5 8h11M2.5 12h7" />`,
  number: svg`<path d="M6 2.5L5 13.5M11 2.5l-1 11M2.5 6h11M2 10.5h11" />`,
  select: svg`<circle cx="8" cy="8" r="5.5" /><path d="M5.5 7l2.5 2.5L10.5 7" />`,
  "multi-select": svg`<path d="M6 4.5h7.5M6 8h7.5M6 11.5h7.5M2.5 4.5h1M2.5 8h1M2.5 11.5h1" />`,
  status: svg`<circle cx="8" cy="8" r="5.5" />
    <path d="M8 2.5a5.5 5.5 0 0 1 0 11z" fill="currentColor" />`,
  checkbox: svg`<rect x="2.5" y="2.5" width="11" height="11" rx="2" />
    <path d="M5 8l2 2 4-4.5" />`,
  email: svg`<circle cx="8" cy="8" r="2.5" />
    <path d="M10.5 8v1a2 2 0 0 0 4 0V8a6.5 6.5 0 1 0-2.5 5.1" />`,
  phone: svg`<path
    d="M5.5 2.5h-2a1 1 0 0 0-1 1C2.5 9 7 13.5 12.5 13.5a1 1 0 0 0 1-1v-2l-2.5-1-1.5 1.5a6 6 0 0 1-3-3L8 7.5l-1-2.5z"
  />`,
  file: svg`<path
    d="M13 7.5l-5.2 5.2a3.2 3.2 0 0 1-4.5-4.5l5.5-5.5a2.1 2.1 0 0 1 3 3L6.3 11.2a1 1 0 0 1-1.5-1.5l5-5"
  />`,
  relation: svg`<rect x="2" y="2" width="12" height="12" rx="2" />
    <path d="M5.5 10.5l5-5M6.5 5.5h4v4" />`,
  rollup: svg`<path d="M2.5 4h6M2.5 8h4M2.5 12h4" />
    <circle cx="11" cy="10" r="2.5" /><path d="M13 12l1.5 1.5" />`,
  formula: svg`<path d="M12.5 3.5h-8l4 4.5-4 4.5h8" />`,
  clock: svg`<circle cx="8" cy="8" r="5.5" /><path d="M8 5v3.5l2 1.5" />`,
  id: svg`<rect x="2" y="3.5" width="12" height="9" rx="1.5" />
    <path d="M5 6.5v3M7.5 6.5v3h1.5a1.5 1.5 0 0 0 0-3z" />`,
  // The column menu's own: settings as sliders, a type swapped by two
  // arrows, a calculation as a sigma, and columns put in beside a bar.
  sliders: svg`<path d="M2.5 4.5h3M8.5 4.5h5M2.5 11.5h7M12.5 11.5h1" />
    <circle cx="7" cy="4.5" r="1.5" /><circle cx="11" cy="11.5" r="1.5" />`,
  swap: svg`<path d="M2.5 5.5h10M10 3l2.5 2.5L10 8M13.5 10.5h-10M6 8l-2.5 2.5L6 13" />`,
  sigma: svg`<path d="M12 3.5H4l4 4.5-4 4.5h8" />`,
  "insert-left": svg`<path d="M13.5 2.5v11M10.5 8h-8M5 5.5L2.5 8 5 10.5" />`,
  "insert-right": svg`<path d="M2.5 2.5v11M5.5 8h8M11 5.5l2.5 2.5-2.5 2.5" />`,
} satisfies Record<string, TemplateResult<2>>;

export type DataIconName = keyof typeof DATA_PATHS;

export function isDataIcon(name: string): name is DataIconName {
  return Object.hasOwn(DATA_PATHS, name);
}
