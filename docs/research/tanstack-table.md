# @tanstack/table-core v9

## Version checked

`@tanstack/table-core@9.3.1` (2026-11-10), types in `dist/**/*.d.ts` plus the
docs shipped in the package (`skills/*/SKILL.md`). Pulls one transitive runtime
dependency: `@tanstack/store@^0.11.2` (no further deps).

## API we will use

Verified exports: `constructTable`, `tableFeatures`, `functionalUpdate`,
`rowSortingFeature`, `columnFilteringFeature`, `columnOrderingFeature`,
`columnSizingFeature`, `columnVisibilityFeature`, `createSortedRowModel`,
`createFilteredRowModel`, `sortFn_*`, `filterFn_*`; and `storeReactivityBindings`
from `@tanstack/table-core/store-reactivity-bindings`.

There is **no `_features` / `_rowModels` option** in 9.3.1 (alpha naming). The
option is `features`; row-model factories and fn registries are slots inside
`tableFeatures({...})`. The core row model is automatic.

Snippet below was type-checked (`strict`, `noUncheckedIndexedAccess`) and run in Node:

```ts
const features = tableFeatures({
  coreReactivityFeature: storeReactivityBindings(),   // required for vanilla
  rowSortingFeature, columnFilteringFeature, columnOrderingFeature,
  columnSizingFeature, columnVisibilityFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
});
type F = typeof features;
const byNumber: SortFn<F, Row> = (a, b, id) => a.getValue<number>(id) - b.getValue<number>(id);
const gt: FilterFn<F, Row> = (row, id, filterValue: number) => row.getValue<number>(id) > filterValue;
const columns: ColumnDef<F, Row>[] = [
  { id: "age", accessorFn: (r) => r.values["age"] as number, sortFn: byNumber, filterFn: gt },
];
const on = <K extends keyof ViewState>(k: K) => (u: Updater<ViewState[K]>) =>
  dispatch(toViewCommand(k, functionalUpdate(u, view[k]))); // table is NOT mutated

const table = constructTable({
  features, columns, data, getRowId: (r) => r.id,
  state: view, // { sorting, columnFilters, columnOrder, columnSizing, columnVisibility }
  onSortingChange: on("sorting"), onColumnFiltersChange: on("columnFilters"),
  onColumnOrderChange: on("columnOrder"), onColumnSizingChange: on("columnSizing"),
  onColumnVisibilityChange: on("columnVisibility"),
});
// after each store commit:
table.setOptions((prev) => ({ ...prev, data: rows, state: viewFromStore }));
table.getRowModel().rows;            // final (filtered, then sorted)
table.getCoreRowModel(); table.getFilteredRowModel(); table.getSortedRowModel();
table.getVisibleLeafColumns();       // honours columnOrder + columnVisibility; c.getSize()
```

Observed: `column.toggleSorting()` / `table.setColumnFilters()` only call the
callback; rows stay unchanged until `setOptions` pushes new `state`. State types:
`SortingState = {id, desc}[]`, `ColumnFiltersState = {id, value: unknown}[]`,
`ColumnOrderState = string[]`, `ColumnSizingState = Record<string, number>`,
`ColumnVisibilityState = Record<string, boolean>` (not `VisibilityState` as in v8).

Timing, 5,000 rows x 7 columns in Node: first sort+filter 46 ms, re-sort 8 ms,
new `data` array 27 ms, unchanged state/data 0 ms (memoised).

## Pitfalls

- Slice precedence: `options.atoms[k]` > `options.state[k]` > internal. Supplying
  `on<Slice>Change` without `state.<slice>` silently drops updates; always pair them.
- `table.getState()` and `onStateChange` are gone. Read `table.store.state` only for
  debugging; the spec forbids treating it as truth.
- Callbacks receive a value or a function: always use `functionalUpdate`.
- Sort fns return ascending order only; the table reverses for `desc`. Built-in
  names (`sortFn: "alphanumeric"`) work only if registered in the `sortFns` slot;
  passing a function per column (from the property registry) needs no registry.
- Keep `features`, `columns` and `data` referentially stable; a new array each
  render recomputes all row models. Feed them from memoised selectors.
- Mapping needed: `View.sorts.direction` to `desc`, `hiddenPropertyIds` to
  `{[id]: false}`, `filters` to `{id, value}` with the operator inside `value`.
- Default filter auto-removal drops `""`/`undefined` values via the callback.
- Drag resize (`columnResizingFeature`) keeps transient `columnResizing` state; leave
  it internal or do our own pointer handling and dispatch `view.resizeProperty` on end.
- Construct one table per mounted database view, in the feature module, and reuse it.

## Decision it supports

Data table engine ADR: default stands. 9.3.1 runs fully controlled from an
outside store (`state` + `on*Change` + `setOptions`); the switch condition is not
met. Record the extra transitive dependency `@tanstack/store` in the ADR.

## Sources

- https://tanstack.com/table/latest/docs/framework/vanilla/quick-start
- https://tanstack.com/table/latest/docs/framework/vanilla/guide/table-state
- `node_modules/@tanstack/table-core/skills/{core,table-state,table-features}/`
- `dist/core/table/coreTablesFeature.types.d.ts`, `dist/helpers/tableFeatures.d.ts`
