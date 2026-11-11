import * as v from "valibot";
import {
  blockIdSchema,
  richTextSchema,
  type TypedBlock,
} from "../../model/index.ts";

export const BUTTON_TYPE = "button";

// The kinds of block a button can insert, all of them text.
export const TEMPLATE_TYPES = [
  "paragraph",
  "heading",
  "bulleted-list",
  "numbered-list",
  "to-do",
  "toggle",
  "quote",
  "code",
] as const;

const templateSchema = v.object({
  type: v.picklist(TEMPLATE_TYPES),
  text: richTextSchema,
  level: v.optional(v.picklist([1, 2, 3, 4])),
  isChecked: v.optional(v.boolean()),
});

const actionSchema = v.variant("kind", [
  v.object({
    kind: v.literal("insert-blocks"),
    blocks: v.array(templateSchema),
  }),
  v.object({
    kind: v.literal("add-row"),
    databaseId: blockIdSchema,
    values: v.record(v.string(), v.unknown()),
  }),
  v.object({ kind: v.literal("open-page"), pageId: blockIdSchema }),
]);

// A button runs its actions in order, all in one step.
export const buttonPropsSchema = v.object({
  label: v.string(),
  actions: v.array(actionSchema),
});

export type BlockTemplate = v.InferOutput<typeof templateSchema>;
export type ButtonAction = v.InferOutput<typeof actionSchema>;
export type ButtonProps = v.InferOutput<typeof buttonPropsSchema>;
export type ButtonBlock = TypedBlock<typeof BUTTON_TYPE, ButtonProps>;
