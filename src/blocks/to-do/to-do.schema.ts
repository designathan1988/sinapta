import * as v from "valibot";
import { richTextSchema, type TypedBlock } from "../../model/index.ts";

export const TO_DO_TYPE = "to-do";

export const toDoPropsSchema = v.object({
  text: richTextSchema,
  isChecked: v.boolean(),
});

export type ToDoProps = v.InferOutput<typeof toDoPropsSchema>;
export type ToDoBlock = TypedBlock<typeof TO_DO_TYPE, ToDoProps>;
