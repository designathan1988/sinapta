import * as v from "valibot";
import type { TypedBlock } from "../../model/index.ts";

export const COLUMN_TYPE = "column";

// A column of a column list; its ratio is its share of the list's width,
// and the shares of a list's columns add up to 1.
export const columnPropsSchema = v.object({
  ratio: v.pipe(v.number(), v.gtValue(0), v.maxValue(1)),
});

export type ColumnProps = v.InferOutput<typeof columnPropsSchema>;
export type ColumnBlock = TypedBlock<typeof COLUMN_TYPE, ColumnProps>;
