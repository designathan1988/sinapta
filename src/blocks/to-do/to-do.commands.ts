import { isBlockOfType, type BlockId } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import { TO_DO_TYPE, type ToDoBlock } from "./to-do.schema.ts";

export const toggleToDo = defineCommand<{ blockId: BlockId }>({
  type: "toDo.toggle",
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    if (block === undefined || !isBlockOfType<ToDoBlock>(block, TO_DO_TYPE)) {
      return {};
    }
    const props = { ...block.props, isChecked: !block.props.isChecked };
    return {
      operations: [
        {
          type: "record.update",
          kind: "block",
          id: block.id,
          patch: { props, updatedAt: command.meta.now },
        },
      ],
    };
  },
});

export const toDoCommands = [toggleToDo];
