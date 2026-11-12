import { isBlockOfType, type RichText } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { BlockDefinition } from "../block-definition.ts";
import { PARAGRAPH_TYPE } from "../paragraph/index.ts";
import { simpleTableCommands } from "./simple-table.commands.ts";
import {
  emptyRow,
  SIMPLE_TABLE_TYPE,
  simpleTablePropsSchema,
  type SimpleTableBlock,
} from "./simple-table.schema.ts";
import { renderSimpleTable } from "./simple-table.view.ts";

const ROWS = 3;
const COLUMNS = 3;

// A new table is three by three; text it is made from goes in the first
// cell, as plain text.
function createRows(text: RichText): RichText[][] {
  const rows = Array.from({ length: ROWS }, () => emptyRow(COLUMNS));
  const first = rows[0];
  if (first !== undefined && text.length > 0) {
    first[0] = [{ text: text.map((span) => span.text).join("") }];
  }
  return rows;
}

export const simpleTableDefinition: BlockDefinition = {
  type: SIMPLE_TABLE_TYPE,
  label: COPY.simpleTable.name,
  propsSchema: simpleTablePropsSchema,
  continuesAs: PARAGRAPH_TYPE,
  createProps: (text) => ({
    rows: createRows(text),
    hasHeaderRow: false,
    hasHeaderColumn: false,
  }),
  commands: simpleTableCommands,
  // Its cell menu is anchored to a cell, so the whole overlay is read.
  drawnFrom: (_block, state) => [state.ui.overlay],
  render: (block, dispatch, state) =>
    isBlockOfType<SimpleTableBlock>(block, SIMPLE_TABLE_TYPE)
      ? renderSimpleTable(block, dispatch, state)
      : undefined,
};
