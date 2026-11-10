import { isBlockOfType, type BlockId } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import { TOGGLE_TYPE, type ToggleBlock } from "./toggle.schema.ts";

// Shows or hides what is inside a toggle.
export const setToggleOpen = defineCommand<{
  blockId: BlockId;
  isOpen: boolean;
}>({
  type: "toggle.setOpen",
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    if (
      block === undefined ||
      !isBlockOfType<ToggleBlock>(block, TOGGLE_TYPE)
    ) {
      return {};
    }
    if (block.props.isOpen === command.isOpen) return {};
    const props = { ...block.props, isOpen: command.isOpen };
    return {
      operations: [
        {
          type: "record.update",
          kind: "block",
          id: block.id,
          patch: { props },
        },
      ],
    };
  },
});

export const toggleCommands = [setToggleOpen];
