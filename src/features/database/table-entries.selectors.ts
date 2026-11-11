// What the table's body shows, in order: its rows, or for a grouped view
// each group's header, then its rows and a row that adds one to it while
// the group is open. The row window runs over this list.
import { selectRowGroups, type RowGroup } from "./row-groups.selectors.ts";
import type { TableModel, TableRow } from "./table-model.selectors.ts";

export type TableEntry =
  | { readonly kind: "row"; readonly key: string; readonly row: TableRow }
  | { readonly kind: "group"; readonly key: string; readonly group: RowGroup }
  | { readonly kind: "add"; readonly key: string; readonly group: RowGroup };

function groupEntries(group: RowGroup): TableEntry[] {
  const header: TableEntry = { kind: "group", key: `g:${group.key}`, group };
  if (group.isCollapsed) return [header];
  // A row with several options shows in several groups.
  const rows = group.rows.map((row): TableEntry => ({
    kind: "row",
    key: `${group.key}:${row.id}`,
    row,
  }));
  const add: TableEntry = { kind: "add", key: `a:${group.key}`, group };
  return [header, ...rows, add];
}

const cache = new WeakMap<TableModel, readonly TableEntry[]>();

export function selectTableEntries(model: TableModel): readonly TableEntry[] {
  const cached = cache.get(model);
  if (cached !== undefined) return cached;
  const grouped = selectRowGroups(model);
  const entries =
    grouped === undefined
      ? model.rows.map((row): TableEntry => ({ kind: "row", key: row.id, row }))
      : grouped.groups.filter((group) => !group.isHidden).flatMap(groupEntries);
  cache.set(model, entries);
  return entries;
}

// Where a row first shows in the table's body; -1 when it does not.
export function selectEntryIndex(model: TableModel, rowId: string): number {
  return selectTableEntries(model).findIndex(
    (entry) => entry.kind === "row" && entry.row.id === rowId,
  );
}
