import * as v from "valibot";
import { blockIdSchema } from "./id.schema.ts";

// The envelope every block shares. Props are checked separately, by the
// schema its block type registers.
export const blockSchema = v.object({
  id: blockIdSchema,
  type: v.string(),
  parentId: v.nullable(blockIdSchema),
  childIds: v.array(blockIdSchema),
  props: v.record(v.string(), v.unknown()),
  createdAt: v.string(),
  updatedAt: v.string(),
});

export type Block = v.InferOutput<typeof blockSchema>;
export type BlockProps = Block["props"];

// A block narrowed to one type and its props shape.
export type TypedBlock<TType extends string, TProps extends BlockProps> = Omit<
  Block,
  "type" | "props"
> & { type: TType; props: TProps };

// Props were checked against the type's schema at the boundary, so the type
// tag is enough to narrow.
export function isBlockOfType<TBlock extends TypedBlock<string, BlockProps>>(
  block: Block,
  type: TBlock["type"],
): block is Block & TBlock {
  return block.type === type;
}
