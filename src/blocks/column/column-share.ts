// A column's share of its list's width. The shares of a list's columns
// add up to 1; none is narrower than MIN_COLUMN_SHARE.
import type { Block, Operation } from "../../model/index.ts";

export const MIN_COLUMN_SHARE = 0.1;

// The column's share, or an even share when it has none.
export function shareOf(column: Block, count: number): number {
  const { ratio } = column.props;
  return typeof ratio === "number" && ratio > 0 ? ratio : 1 / count;
}

export function setShareOps(column: Block, ratio: number): Operation[] {
  const props = { ...column.props, ratio };
  return [
    { type: "record.update", kind: "block", id: column.id, patch: { props } },
  ];
}
