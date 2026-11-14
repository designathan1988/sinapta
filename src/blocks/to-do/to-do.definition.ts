import { isBlockOfType } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { BlockDefinition } from "../block-definition.ts";
import { toDoCommands } from "./to-do.commands.ts";
import { TO_DO_TYPE, toDoPropsSchema, type ToDoBlock } from "./to-do.schema.ts";
import { renderToDo } from "./to-do.view.ts";
import { selectIsEditable } from "../../state/index.ts";

export const toDoDefinition: BlockDefinition = {
  type: TO_DO_TYPE,
  label: COPY.blockNames.toDo,
  propsSchema: toDoPropsSchema,
  continuesAs: TO_DO_TYPE,
  createProps: (text) => ({ text, isChecked: false }),
  commands: toDoCommands,
  drawnFrom: () => [],
  render: (block, dispatch, state) =>
    isBlockOfType<ToDoBlock>(block, TO_DO_TYPE)
      ? renderToDo(block, dispatch, selectIsEditable(state, block.id))
      : undefined,
};
