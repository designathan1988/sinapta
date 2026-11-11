import { isBlockOfType } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { BlockDefinition } from "../block-definition.ts";
import { PARAGRAPH_TYPE } from "../paragraph/index.ts";
import { buttonCommands } from "./button.commands.ts";
import {
  BUTTON_TYPE,
  buttonPropsSchema,
  type ButtonBlock,
} from "./button.schema.ts";
import { renderButtonBlock } from "./button.view.ts";

export const buttonDefinition: BlockDefinition = {
  type: BUTTON_TYPE,
  label: COPY.buttonBlock.name,
  propsSchema: buttonPropsSchema,
  continuesAs: PARAGRAPH_TYPE,
  createProps: () => ({ label: "", actions: [] }),
  commands: buttonCommands,
  render: (block, dispatch, state) =>
    isBlockOfType<ButtonBlock>(block, BUTTON_TYPE)
      ? renderButtonBlock(block, dispatch, state)
      : undefined,
};
