// The color of whole blocks: a tone for the text, or a tone behind it.
import { isTextBlock } from "../../blocks/index.ts";
import type { BlockColor, BlockId, Operation } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";

export const setBlockColor = defineCommand<{
  blockIds: BlockId[];
  // Null takes the color away.
  color: BlockColor | null;
}>({
  type: "block.setColor",
  handle(state, command) {
    const operations = command.blockIds.flatMap((id): Operation[] => {
      const block = state.workspace.blocks[id];
      if (!isTextBlock(block)) return [];
      const { color: _old, ...rest } = block.props;
      const props =
        command.color === null ? rest : { ...rest, color: command.color };
      return [{ type: "record.update", kind: "block", id, patch: { props } }];
    });
    return { operations };
  },
});

export const editorColorCommands = [setBlockColor];
