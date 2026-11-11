import type { BlockDefinition } from "../block-definition.ts";
import { PARAGRAPH_TYPE } from "../paragraph/index.ts";
import { columnListCommands } from "./column-list.commands.ts";
import {
  COLUMN_LIST_TYPE,
  columnListPropsSchema,
} from "./column-list.schema.ts";
import { tidyColumns } from "./column-list-tidy.ts";

// Columns side by side. The list has no content of its own; its columns
// are its children and hold the blocks.
export const columnListDefinition: BlockDefinition = {
  type: COLUMN_LIST_TYPE,
  propsSchema: columnListPropsSchema,
  continuesAs: PARAGRAPH_TYPE,
  createProps: () => ({}),
  commands: columnListCommands,
  tidy: tidyColumns,
};
