# ADR-0003: Data table engine

**Status:** Accepted
**Date:** 2026-11-10 (approved by the owner at the plan review)
**Deciders:** Project owner

## Context

Sort, filter, column order, width and visibility must live only in the
`View` record (specification 2.1, 5.5). The engine may compute row models
but must not own state. Research: `docs/research/tanstack-table.md`,
`docs/research/web-dynamic-sort.md`, `docs/research/platform-features.md`.

## Decision

`@tanstack/table-core` 9.3.1, fully controlled. The default stands.

- Built with `constructTable` and `tableFeatures`, with
  `storeReactivityBindings()` from
  `@tanstack/table-core/store-reactivity-bindings`.
- `state` is derived from the active `View` record on every call. Each
  `on*Change` callback resolves the updater with `functionalUpdate` and
  dispatches a `view.*` command. The table's internal state is never read.
- One module, `src/features/database/table-model.selectors.ts`, is the only
  file that imports the library. It maps `View` to table state and back.
  The mapping is the one place that knows both vocabularies (`sorts` with
  `direction` on our side, `{ id, desc }` on the library side).
- Sort and filter functions come from the property registry, one set per
  property type.
- Measured in Node on 5,000 rows by 7 columns: first sort and filter 46 ms,
  re-sort 8 ms.

Two findings changed details of the specification, approved at the review:

1. The library brings one transitive runtime dependency,
   `@tanstack/store`. The project still installs five direct runtime
   dependencies.
2. `content-visibility` cannot skip table rows: size containment has no
   effect on `<tr>` and `<tbody>`. Rows are therefore windowed from the
   start once a database passes 200 rows, in a real `<table>` with spacer
   rows, and `aria-rowcount` and `aria-rowindex` keep the full size
   announced.

Arrow-key movement between cells needs `role="grid"` on the `<table>` with
roving `tabindex` on cells; the native table elements stay.

## Measured

Milestone 6, production build, 5,000 rows and three properties: load
548 ms, sort from the header 37 ms, scroll to the middle 43 ms, cell commit
55 ms, a text filter 92 ms. 60 rows are rendered at a time.

The engine is used for sorted and filtered row models only. Column order,
visibility and width are read from the View record directly, which is
simpler than routing them through the engine and back.

## Options considered

| Option | Complexity | Controlled from the store | Risk |
| --- | --- | --- | --- |
| A. table-core 9, controlled | Medium | Yes, verified by a run | New major, API still young |
| B. Own sort and filter selectors | Medium | Yes by construction | Reimplements ordering, sizing and visibility logic |
| C. table-core 8 | Medium | Yes | Old major, docs now default to 9 |

## Consequences

- Easier: column order, visibility and sizing math come for free.
- Harder: one adapter module to keep in step with the library.
- Revisit: if a 9.x release breaks controlled use, switch to B behind the
  same selector module; no other file changes.

## Action items

1. [x] Windowing task in milestone 5, measured at 5,000 rows (`table-model-speed.test.ts`).
