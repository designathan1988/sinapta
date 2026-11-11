import * as v from "valibot";
import { TEXT_BLOCK_ENTRIES } from "../text-block.schema.ts";
import { type TypedBlock } from "../../model/index.ts";

export const TOGGLE_TYPE = "toggle";

export const togglePropsSchema = v.object({
  ...TEXT_BLOCK_ENTRIES,
  isOpen: v.boolean(),
});

export type ToggleProps = v.InferOutput<typeof togglePropsSchema>;
export type ToggleBlock = TypedBlock<typeof TOGGLE_TYPE, ToggleProps>;
