// Opening and closing a toggle heading.
import { isBlockOfType, type BlockId } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import { HEADING_TYPE, type HeadingBlock } from "./heading.schema.ts";

export const setHeadingOpen = defineCommand<{
  blockId: BlockId;
  isOpen: boolean;
}>({
  type: "heading.setOpen",
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    if (
      block === undefined ||
      !isBlockOfType<HeadingBlock>(block, HEADING_TYPE)
    ) {
      return {};
    }
    if (block.props.isToggleable !== true) return {};
    if ((block.props.isOpen ?? true) === command.isOpen) return {};
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

export const headingCommands = [setHeadingOpen];
