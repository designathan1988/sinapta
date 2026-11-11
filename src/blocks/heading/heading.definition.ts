import { isBlockOfType } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { BlockDefinition } from "../block-definition.ts";
import { PARAGRAPH_TYPE } from "../paragraph/index.ts";
import {
  HEADING_TYPE,
  headingPropsSchema,
  type HeadingBlock,
} from "./heading.schema.ts";
import { headingCommands } from "./heading.commands.ts";
import { renderHeading } from "./heading.view.ts";

export const headingDefinition: BlockDefinition = {
  type: HEADING_TYPE,
  label: COPY.blockNames.heading,
  propsSchema: headingPropsSchema,
  // Enter after a heading starts body text.
  continuesAs: PARAGRAPH_TYPE,
  createProps: (text) => ({ text, level: 1 }),
  commands: headingCommands,
  // A closed toggle heading keeps its blocks but does not show them.
  showsChildren: (block) =>
    !isBlockOfType<HeadingBlock>(block, HEADING_TYPE) ||
    block.props.isToggleable !== true ||
    block.props.isOpen !== false,
  render: (block, dispatch) =>
    isBlockOfType<HeadingBlock>(block, HEADING_TYPE)
      ? renderHeading(block, dispatch)
      : undefined,
};
