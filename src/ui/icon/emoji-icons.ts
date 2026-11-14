// The emoji picker's category icons, as Notion's bar under the grid, and
// other glyphs Notion draws filled or composed: drawn like the others, 16 units, outlined in the current text color.
import { svg, type TemplateResult } from "lit-html";

export const EMOJI_PATHS = {
  leaf: svg`<path d="M3 13c0-5.5 4-9.5 10-10 0 6-4 10-10 10zM3 13l6-6" />`,
  food: svg`<path d="M2.5 13.5l6.5-6.5 1.5 1.5-6.5 6.5zM10 6l3-3M10.5 7.5l3-.5M8.5 5.5l.5-3" />`,
  ball: svg`<circle cx="8" cy="8" r="5.5" />
    <path d="M8 5.5l2.4 1.7-.9 2.8h-3l-.9-2.8zM8 2.5v3M13.2 6.3l-2.8.9M11.3 12.5l-1.8-2.5M4.7 12.5l1.8-2.5M2.8 6.3l2.8.9" />`,
  plane: svg`<path d="M2 9l11.5-5.5L10 14l-2.5-3.5zM7.5 10.5L13.5 3.5" />`,
  bulb: svg`<path d="M6 13.5h4M6.5 11.5h3M8 2.5a4 4 0 0 0-2.5 7.1v1.9h5V9.6A4 4 0 0 0 8 2.5z" />`,
  symbols: svg`<circle cx="8" cy="8" r="5.5" /><path d="M5.5 8l1.8 1.8 3.2-3.3" />`,
  flag: svg`<path d="M3.5 14V2.5M3.5 3h8L10 6l1.5 3h-8" />`,
  // "Add reaction": a smiling face open at its lower right for a plus.
  "add-reaction": svg`<path d="M13.4 7A5.5 5.5 0 1 0 7 13.4" />
    <path d="M5.5 9.5a3 3 0 0 0 3 1.4M6 6.5h.01M10 6.5h.01M12.5 10v4.5M10.25 12.25h4.5" />`,
  // The sidebar's tabs, filled as Notion's.
  "home-solid": svg`<path
    fill="currentColor"
    stroke="none"
    d="M8 2.2l6 4.9v6.4a1 1 0 0 1-1 1H9.8v-3.8H6.2v3.8H3a1 1 0 0 1-1-1V7.1z"
  />`,
  "calendar-solid": svg`<path
      fill="currentColor"
      stroke="none"
      d="M3.5 3h9A1.5 1.5 0 0 1 14 4.5V6H2V4.5A1.5 1.5 0 0 1 3.5 3zM2 7h12v5.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12.5z"
    />
    <path d="M5 1.5V4M11 1.5V4" />`,
  // Notion's teamspace: a building with its windows.
  building: svg`<path d="M2.5 13.5V3.5h6v10M8.5 6.5h5v7M1.5 13.5h13M4.5 5.5h.01M6.5 5.5h.01M4.5 8h.01M6.5 8h.01M4.5 10.5h.01M6.5 10.5h.01M10.5 9h.01M10.5 11.5h.01" />`,
  "plus-circle": svg`<circle cx="8" cy="8" r="5.5" /><path d="M8 5.5v5M5.5 8h5" />`,
  // A view's menu, as Notion's: Rename's pencil over a line, Display as's
  // brush, Source's path, and Manage in Calendar's dated sheet.
  pencil: svg`<path d="M3 13.5h10M4.5 10.5l6.5-6.5 1.5 1.5-6.5 6.5-2.2.7z" />`,
  brush: svg`<path d="M9.5 2l4.5 4.5-3.5 3.5-4.5-4.5zM6.5 6.5l3 3-2 2v2a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-1.5a1 1 0 0 1 1-1h2" />`,
  source: svg`<circle cx="12" cy="3.5" r="1.5" />
    <circle cx="3.5" cy="12.5" r="1" fill="currentColor" />
    <path d="M10.5 3.5H5.25a2.25 2.25 0 0 0 0 4.5h5.5a2.25 2.25 0 0 1 0 4.5H4.5" />`,
  "calendar-date": svg`<path d="M2 11V3.5A1.5 1.5 0 0 1 3.5 2H11" />
    <rect x="4.5" y="4.5" width="9.5" height="9.5" rx="1.5" />
    <path d="M4.5 7h9.5" />
    <text x="9.25" y="12.6" font-size="5" text-anchor="middle" fill="currentColor" stroke="none">13</text>`,
} satisfies Record<string, TemplateResult<2>>;

export type EmojiIconName = keyof typeof EMOJI_PATHS;

export function isEmojiIcon(name: string): name is EmojiIconName {
  return Object.hasOwn(EMOJI_PATHS, name);
}
