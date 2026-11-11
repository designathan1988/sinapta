import * as v from "valibot";
import {
  richTextSchema,
  type RichText,
  type TypedBlock,
} from "../../model/index.ts";

export const SIMPLE_TABLE_TYPE = "simple-table";

// Rows of cells, every row as long as the first: a rectangle of at least
// one cell.
const rowsSchema = v.pipe(
  v.array(v.pipe(v.array(richTextSchema), v.minLength(1))),
  v.minLength(1),
  v.check(
    (rows) => rows.every((row) => row.length === rows[0]?.length),
    "Every row of a table has the same number of cells.",
  ),
);

// A table of text cells inside a page, unlike a database: no properties,
// views or rows of its own.
export const simpleTablePropsSchema = v.object({
  rows: rowsSchema,
  hasHeaderRow: v.boolean(),
  hasHeaderColumn: v.boolean(),
});

export type SimpleTableProps = v.InferOutput<typeof simpleTablePropsSchema>;
export type SimpleTableBlock = TypedBlock<
  typeof SIMPLE_TABLE_TYPE,
  SimpleTableProps
>;

export function emptyRow(columns: number): RichText[] {
  return Array.from({ length: columns }, () => []);
}
