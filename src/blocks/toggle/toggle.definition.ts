import { isBlockOfType } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { BlockDefinition } from "../block-definition.ts";
import { PARAGRAPH_TYPE } from "../paragraph/index.ts";
import { toggleCommands } from "./toggle.commands.ts";
import {
  TOGGLE_TYPE,
  togglePropsSchema,
  type ToggleBlock,
} from "./toggle.schema.ts";
import { renderToggle } from "./toggle.view.ts";

export const toggleDefinition: BlockDefinition = {
  type: TOGGLE_TYPE,
  label: COPY.blockNames.toggle,
  propsSchema: togglePropsSchema,
  continuesAs: PARAGRAPH_TYPE,
  createProps: (text) => ({ text, isOpen: true }),
  commands: toggleCommands,
  showsChildren: (block) =>
    !isBlockOfType<ToggleBlock>(block, TOGGLE_TYPE) || block.props.isOpen,
  render: (block, dispatch) =>
    isBlockOfType<ToggleBlock>(block, TOGGLE_TYPE)
      ? renderToggle(block, dispatch)
      : undefined,
};
