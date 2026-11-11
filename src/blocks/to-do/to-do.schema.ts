import * as v from "valibot";
import { TEXT_BLOCK_ENTRIES } from "../text-block.schema.ts";
import { type TypedBlock } from "../../model/index.ts";

export const TO_DO_TYPE = "to-do";

export const toDoPropsSchema = v.object({
  ...TEXT_BLOCK_ENTRIES,
  isChecked: v.boolean(),
});

export type ToDoProps = v.InferOutput<typeof toDoPropsSchema>;
export type ToDoBlock = TypedBlock<typeof TO_DO_TYPE, ToDoProps>;
