import { isBlockOfType, type BlockId } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import { EQUATION_TYPE, type EquationBlock } from "./equation.schema.ts";

// Sets a block equation's TeX source. Typing in the editor undoes as one
// step.
export const setEquation = defineCommand<{
  blockId: BlockId;
  expression: string;
}>({
  type: "equation.set",
  handle(state, command) {
    const block = state.workspace.blocks[command.blockId];
    if (block === undefined) return {};
    if (!isBlockOfType<EquationBlock>(block, EQUATION_TYPE)) return {};
    const expression = command.expression.normalize("NFC");
    if (expression === block.props.expression) return {};
    const props = { ...block.props, expression };
    return {
      operations: [
        {
          type: "record.update",
          kind: "block",
          id: block.id,
          patch: { props, updatedAt: command.meta.now },
        },
      ],
      mergeKey: `equation.set:${block.id}`,
    };
  },
});

export const equationCommands = [setEquation];
