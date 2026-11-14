// What a program sends the public API (ADR-0013), in Notion's shapes,
// read into Pagecraft's blocks: the rich text, the blocks it appends and
// a new page's title.
import * as v from "valibot";
import type { Block, BlockId } from "../src/model/index.ts";

const richItem = v.object({
  text: v.optional(v.object({ content: v.string() })),
  plain_text: v.optional(v.string()),
  annotations: v.optional(
    v.object({
      bold: v.optional(v.boolean()),
      italic: v.optional(v.boolean()),
      strikethrough: v.optional(v.boolean()),
      underline: v.optional(v.boolean()),
      code: v.optional(v.boolean()),
    }),
  ),
});
const richText = v.array(richItem);

export function textIn(items: v.InferOutput<typeof richText>) {
  return items.map((item) => {
    const marks = Object.fromEntries(
      Object.entries(item.annotations ?? {}).filter(([, on]) => on === true),
    );
    return { text: item.text?.content ?? item.plain_text ?? "", ...marks };
  });
}

const textual = v.object({
  rich_text: v.optional(richText, []),
  checked: v.optional(v.boolean()),
});

const blockInput = v.looseObject({ type: v.string() });

// The API's types a program may append, and the Pagecraft type each is.
const IN_TYPES: Readonly<Record<string, string>> = {
  paragraph: "paragraph",
  heading_1: "heading",
  heading_2: "heading",
  heading_3: "heading",
  bulleted_list_item: "bulleted-list",
  numbered_list_item: "numbered-list",
  to_do: "to-do",
  quote: "quote",
  divider: "divider",
};

function propsIn(apiType: string, content: unknown): Record<string, unknown> {
  if (apiType === "divider") return {};
  const parsed = v.safeParse(textual, content ?? {});
  const text = parsed.success ? textIn(parsed.output.rich_text) : [];
  if (apiType.startsWith("heading_")) {
    return { text, level: Number(apiType.slice(-1)) };
  }
  if (apiType === "to_do") {
    return {
      text,
      isChecked: parsed.success && parsed.output.checked === true,
    };
  }
  return { text };
}

export interface Placing {
  readonly id: BlockId;
  readonly parentId: BlockId;
  readonly now: string;
  readonly by: { readonly id: string; readonly name: string };
}

export function blockIn(input: unknown, placing: Placing): Block | undefined {
  const parsed = v.safeParse(blockInput, input);
  if (!parsed.success) return undefined;
  const apiType = parsed.output.type;
  const type = IN_TYPES[apiType];
  if (type === undefined) return undefined;
  const content: unknown = Object.entries(parsed.output).find(
    ([key]) => key === apiType,
  )?.[1];
  return {
    id: placing.id,
    type,
    parentId: placing.parentId,
    childIds: [],
    props: propsIn(apiType, content),
    createdAt: placing.now,
    updatedAt: placing.now,
    createdBy: placing.by,
    editedBy: placing.by,
  };
}

const titleProperty = v.object({ title: richText });

// A new page's title: its "title" property, or whichever property holds
// a title, as Notion takes a database's title property by its name.
export function titleIn(properties: unknown) {
  if (typeof properties !== "object" || properties === null) return [];
  for (const value of Object.values(properties)) {
    const parsed = v.safeParse(titleProperty, value);
    if (parsed.success) return textIn(parsed.output.title);
  }
  return [];
}

export const appendSchema = v.object({ children: v.array(v.unknown()) });
export const createPageSchema = v.object({
  parent: v.union([
    v.object({ page_id: v.string() }),
    v.object({ database_id: v.string() }),
  ]),
  properties: v.optional(v.unknown(), {}),
  children: v.optional(v.array(v.unknown()), []),
});
export const updatePageSchema = v.object({
  properties: v.optional(v.unknown()),
  archived: v.optional(v.boolean()),
  in_trash: v.optional(v.boolean()),
});
export const searchSchema = v.object({ query: v.optional(v.string(), "") });
