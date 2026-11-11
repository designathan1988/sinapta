import {
  isBlockOfType,
  type BlockId,
  type Operation,
} from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import { CALLOUT_TYPE, type CalloutBlock } from "./callout.schema.ts";

// Sets the emoji beside a callout's text; an empty one removes it.
export const setCalloutIcon = defineCommand<{
  blockId: BlockId;
  icon: string;
}>({
  type: "callout.setIcon",
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    if (block === undefined) return {};
    if (!isBlockOfType<CalloutBlock>(block, CALLOUT_TYPE)) return {};
    if (block.props.icon === command.icon) return {};
    const props = { ...block.props, icon: command.icon };
    const operation: Operation = {
      type: "record.update",
      kind: "block",
      id: block.id,
      patch: { props, updatedAt: command.meta.now },
    };
    return { operations: [operation] };
  },
});

export const calloutCommands = [setCalloutIcon];
