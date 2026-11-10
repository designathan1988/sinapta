import { isBlockOfType } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { BlockDefinition } from "../block-definition.ts";
import { TO_DO_TYPE, toDoPropsSchema, type ToDoBlock } from "./to-do.schema.ts";
import { renderToDo } from "./to-do.view.ts";

export const toDoDefinition: BlockDefinition = {
  type: TO_DO_TYPE,
  label: COPY.blockNames.toDo,
  propsSchema: toDoPropsSchema,
  continuesAs: TO_DO_TYPE,
  createProps: (text) => ({ text, isChecked: false }),
  render: (block, dispatch) =>
    isBlockOfType<ToDoBlock>(block, TO_DO_TYPE)
      ? renderToDo(block, dispatch)
      : undefined,
};
