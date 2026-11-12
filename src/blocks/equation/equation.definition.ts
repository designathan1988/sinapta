import { isBlockOfType, plainText } from "../../model/index.ts";
import { selectOverlayAt } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { BlockDefinition } from "../block-definition.ts";
import { PARAGRAPH_TYPE } from "../paragraph/index.ts";
import { equationCommands } from "./equation.commands.ts";
import {
  EQUATION_TYPE,
  equationPropsSchema,
  type EquationBlock,
} from "./equation.schema.ts";
import { renderEquation } from "./equation.view.ts";

// A block equation. Text it is made from becomes its TeX source.
export const equationDefinition: BlockDefinition = {
  type: EQUATION_TYPE,
  label: COPY.equation.blockName,
  propsSchema: equationPropsSchema,
  continuesAs: PARAGRAPH_TYPE,
  createProps: (text) => ({ expression: plainText(text) }),
  commands: equationCommands,
  drawnFrom: (block, state) => [selectOverlayAt(state, block.id)],
  render: (block, dispatch, state) =>
    isBlockOfType<EquationBlock>(block, EQUATION_TYPE)
      ? renderEquation(block, dispatch, state)
      : undefined,
};
