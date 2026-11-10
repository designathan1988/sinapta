import * as v from "valibot";
import { richTextSchema, type TypedBlock } from "../../model/index.ts";

export const TOGGLE_TYPE = "toggle";

export const togglePropsSchema = v.object({
  text: richTextSchema,
  isOpen: v.boolean(),
});

export type ToggleProps = v.InferOutput<typeof togglePropsSchema>;
export type ToggleBlock = TypedBlock<typeof TOGGLE_TYPE, ToggleProps>;
