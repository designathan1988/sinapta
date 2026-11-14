// How the slash menu shows each kind of item: its icon, the group it is
// listed under and the Markdown that makes the same block, as in Notion.
import type { IconName } from "../../ui/icon/index.ts";

export type SlashGroup =
  "basic" | "media" | "database" | "advanced" | "pages" | "colors";

// Groups in the order the menu lists them.
export const SLASH_GROUPS: readonly SlashGroup[] = [
  "basic",
  "media",
  "database",
  "advanced",
  "pages",
  "colors",
];

export interface SlashLook {
  readonly icon: IconName;
  readonly group: SlashGroup;
  // The Markdown typed at the start of a line that makes the same block.
  readonly hint?: string;
}

const BASIC = "basic";
const MEDIA = "media";
const ADVANCED = "advanced";

// Block type to its look; a type that is not here is listed as advanced.
export const BLOCK_LOOKS: Readonly<Record<string, SlashLook>> = {
  page: { icon: "page", group: BASIC },
  paragraph: { icon: "text", group: BASIC },
  heading: { icon: "heading-1", group: BASIC, hint: "#" },
  "bulleted-list": { icon: "bulleted", group: BASIC, hint: "-" },
  "numbered-list": { icon: "numbered", group: BASIC, hint: "1." },
  "to-do": { icon: "checkbox", group: BASIC, hint: "[]" },
  toggle: { icon: "toggle", group: BASIC, hint: ">" },
  quote: { icon: "quote", group: BASIC, hint: '"' },
  divider: { icon: "divider", group: BASIC, hint: "---" },
  callout: { icon: "callout", group: BASIC },
  "simple-table": { icon: "table", group: BASIC },
  image: { icon: "image", group: MEDIA },
  video: { icon: "video", group: MEDIA },
  audio: { icon: "audio", group: MEDIA },
  code: { icon: "code", group: MEDIA, hint: "```" },
  file: { icon: "file", group: MEDIA },
  pdf: { icon: "pdf", group: MEDIA },
  bookmark: { icon: "bookmark", group: MEDIA },
  embed: { icon: "embed", group: MEDIA },
  "table-of-contents": { icon: "toc", group: ADVANCED },
  equation: { icon: "equation", group: ADVANCED, hint: "$$" },
  breadcrumb: { icon: "breadcrumb", group: ADVANCED },
  "synced-block": { icon: "synced", group: ADVANCED },
  button: { icon: "button", group: ADVANCED },
  "meeting-notes": { icon: "sparkles", group: ADVANCED },
};

const HEADING_ICONS: readonly IconName[] = [
  "heading-1",
  "heading-2",
  "heading-3",
  "heading-4",
];

// A heading's look by its level; a toggle heading starts with ">".
export function headingLook(level: number, isToggle: boolean): SlashLook {
  const hashes = "#".repeat(level);
  return isToggle
    ? { icon: "toggle-heading", group: BASIC, hint: `> ${hashes}` }
    : {
        icon: HEADING_ICONS[level - 1] ?? "heading-1",
        group: BASIC,
        hint: hashes,
      };
}

export function lookOf(blockType: string): SlashLook {
  return BLOCK_LOOKS[blockType] ?? { icon: "text", group: ADVANCED };
}
