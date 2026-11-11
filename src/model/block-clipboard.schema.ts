import * as v from "valibot";
import { richTextSchema } from "./rich-text.schema.ts";

// Blocks copied in Pagecraft travel on the clipboard as JSON of their own
// type, so a paste keeps their kinds and nesting. Like an imported file,
// clipboard text is read here, by a schema, and nowhere else.
export const BLOCK_CLIPBOARD_TYPE = "application/x-pagecraft-blocks";

const clipboardBlockSchema = v.object({
  kind: v.string(),
  depth: v.pipe(v.number(), v.integer(), v.minValue(0)),
  text: richTextSchema,
  level: v.optional(v.picklist([1, 2, 3, 4])),
  isChecked: v.optional(v.boolean()),
  src: v.optional(v.string()),
  language: v.optional(v.string()),
  rows: v.optional(v.array(v.array(richTextSchema))),
  hasHeaderRow: v.optional(v.boolean()),
  // A synced block's original, for a pasted reference.
  sourceId: v.optional(v.string()),
});

const blockClipboardSchema = v.pipe(
  v.string(),
  v.parseJson(),
  v.object({ version: v.literal(1), blocks: v.array(clipboardBlockSchema) }),
);

export type ClipboardBlock = v.InferOutput<typeof clipboardBlockSchema>;

export function serializeBlockClipboard(
  blocks: readonly ClipboardBlock[],
): string {
  return JSON.stringify({ version: 1, blocks });
}

export function parseBlockClipboard(
  text: string,
): ClipboardBlock[] | undefined {
  const result = v.safeParse(blockClipboardSchema, text);
  return result.success ? result.output.blocks : undefined;
}
