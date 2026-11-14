// Pagecraft's blocks in the public API's own shapes (ADR-0013), as
// Notion's API writes them: pages, blocks and rich text out, and the
// blocks a program may append, read back in.
import type { Block, Workspace } from "../src/model/index.ts";

interface Span {
  readonly text: string;
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly strikethrough?: boolean;
  readonly underline?: boolean;
  readonly code?: boolean;
}

function spansOf(value: unknown): Span[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((span: unknown) =>
    typeof span === "object" &&
    span !== null &&
    "text" in span &&
    typeof span.text === "string"
      ? [{ ...span, text: span.text }]
      : [],
  );
}

export function richTextOut(value: unknown) {
  return spansOf(value).map((span) => ({
    type: "text",
    text: { content: span.text, link: null },
    annotations: {
      bold: span.bold === true,
      italic: span.italic === true,
      strikethrough: span.strikethrough === true,
      underline: span.underline === true,
      code: span.code === true,
      color: "default",
    },
    plain_text: span.text,
    href: null,
  }));
}

export const plainOf = (value: unknown): string =>
  spansOf(value)
    .map((span) => span.text)
    .join("");

// Each Pagecraft type and the API type it is; the props of a heading say
// which of the three.
const TYPES: Readonly<Record<string, string>> = {
  paragraph: "paragraph",
  "bulleted-list": "bulleted_list_item",
  "numbered-list": "numbered_list_item",
  "to-do": "to_do",
  toggle: "toggle",
  quote: "quote",
  callout: "callout",
  code: "code",
  divider: "divider",
  page: "child_page",
  database: "child_database",
};

function typeOut(block: Block): string {
  if (block.type === "heading") {
    const level = Number(block.props.level);
    return `heading_${String(Math.min(3, Math.max(1, level)))}`;
  }
  return TYPES[block.type] ?? "unsupported";
}

function contentOut(block: Block, type: string): Record<string, unknown> {
  if (type === "child_page" || type === "child_database") {
    return { title: plainOf(block.props.title) };
  }
  if (type === "divider" || type === "unsupported") return {};
  const rich = { rich_text: richTextOut(block.props.text), color: "default" };
  if (type === "to_do")
    return { ...rich, checked: block.props.isChecked === true };
  if (type === "callout") {
    return { ...rich, icon: { type: "emoji", emoji: block.props.icon } };
  }
  if (type === "code")
    return { ...rich, language: block.props.language ?? "plain text" };
  return rich;
}

export function blockOut(block: Block) {
  const type = typeOut(block);
  return {
    object: "block",
    id: block.id,
    type,
    created_time: block.createdAt,
    last_edited_time: block.updatedAt,
    has_children: block.childIds.length > 0,
    archived: block.props.isTrashed === true,
    [type]: contentOut(block, type),
  };
}

function parentOut(block: Block, workspace: Workspace) {
  if (block.parentId === null) return { type: "workspace", workspace: true };
  const parent = workspace.blocks[block.parentId];
  if (parent?.type === "database") {
    return { type: "database_id", database_id: parent.id };
  }
  return { type: "page_id", page_id: block.parentId };
}

export function pageOut(block: Block, workspace: Workspace) {
  return {
    object: block.type === "database" ? "database" : "page",
    id: block.id,
    created_time: block.createdAt,
    last_edited_time: block.updatedAt,
    archived: block.props.isTrashed === true,
    icon:
      typeof block.props.icon === "string"
        ? { type: "emoji", emoji: block.props.icon }
        : null,
    parent: parentOut(block, workspace),
    properties: {
      title: {
        id: "title",
        type: "title",
        title: richTextOut(block.props.title),
      },
    },
  };
}
