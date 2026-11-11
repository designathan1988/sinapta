import { isBlockOfType } from "../../model/index.ts";
import type { BlockDefinition } from "../block-definition.ts";
import { PARAGRAPH_TYPE } from "../paragraph/index.ts";
import { columnCommands } from "./column.commands.ts";
import {
  COLUMN_TYPE,
  columnPropsSchema,
  type ColumnBlock,
} from "./column.schema.ts";
import { renderColumn } from "./column.view.ts";

// A column holds blocks and has no content of its own; it is made by
// dropping blocks beside each other, never picked from a menu.
export const columnDefinition: BlockDefinition = {
  type: COLUMN_TYPE,
  propsSchema: columnPropsSchema,
  continuesAs: PARAGRAPH_TYPE,
  createProps: () => ({ ratio: 0.5 }),
  holdsBlocks: true,
  commands: columnCommands,
  render: (block, dispatch, state) =>
    isBlockOfType<ColumnBlock>(block, COLUMN_TYPE)
      ? renderColumn(block, dispatch, state)
      : undefined,
  customProperties: (block) =>
    isBlockOfType<ColumnBlock>(block, COLUMN_TYPE)
      ? { "--column-share": String(block.props.ratio) }
      : {},
};
