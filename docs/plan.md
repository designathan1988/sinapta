# Pagecraft implementation plan

**Status:** Draft, awaiting approval at the Phase 2 review.
**Source:** `docs/specification.md`. **Branch:** `claude/charming-darwin-7tmtef`.

## Goal

A single-user, local-first workspace app in the browser: nested pages edited
as blocks, database pages shown as a table, saved to IndexedDB, with export
and import as one JSON file. Built in seven milestones, each ending in a
running app that passes `npm run verify`.

## Key findings from research

Full notes are in `docs/research/`; decisions are in `docs/decisions/`.

- All eight defaults in specification section 9 stand (ADR-0001 to 0008).
- The repository is empty, so every file in the specification's folder
  structure is created by this plan. Nothing is already built.
- Current stable majors are newer than older guides assume: Vite 8, Vitest
  5, ESLint 10, Stylelint 18, TypeScript 7 (native compiler).
- `typescript-eslint` 8.72 does not support TypeScript 7 (decision D1).
- `@tanstack/table-core` 9.3.1 runs fully controlled; measured 46 ms for the
  first sort and filter of 5,000 rows.
- `content-visibility` cannot skip `<tr>` rows, so the table needs row
  windowing from the start (decision D6).
- Browser edits can break lit-html's markers inside a `contenteditable`, so
  block text is projected by one imperative owner (ADR-0001, ADR-0006).

## Decisions needed at this review

Each is a place where the specification, the prompt and research disagree.
The recommendation is first. Nothing below is applied until approved; on
approval the specification, the ADR and `CLAUDE.md` change in one commit.

| # | Topic | Specification says | Finding | Recommendation |
| --- | --- | --- | --- | --- |
| D1 | TypeScript version | "current stable release of each" | Current stable is 7.0.2; typescript-eslint supports only below 6.1 | Use TypeScript 6.0.x alone until typescript-eslint supports 7, so there is one compiler. Alternative: 7 for `tsc` plus 6 aliased for lint (two compilers) |
| D2 | lit-html surface | "`html` and `render` only" | Keyed lists and editable blocks need `repeat`, `keyed`, `ref`, `nothing` | Allow these four stateless exports; still no directive or component classes (ADR-0001) |
| D3 | Schema location | Valibot "used only in `src/model/`" and a new block type touches "exactly one new folder" | A block type needs a props schema | Allow `valibot` in `src/model/` and in `*.schema.ts` inside a block or property folder (ADR-0004) |
| D4 | Id type | `string & { readonly __brand: "BlockId" }` | Valibot's inferred brand is a different, equivalent type | Infer id types from the schemas (ADR-0004) |
| D5 | Text offsets | "count grapheme clusters ... never UTF-16 code units" | DOM ranges are UTF-16; cluster rules vary by browser version | Store UTF-16 offsets always snapped to grapheme boundaries; editing still acts on whole clusters (ADR-0006) |
| D6 | Large tables | "`content-visibility` first, windowing only if the target is missed" | Containment has no effect on table rows | Window rows from the start above 200 rows (ADR-0003) |
| D7 | Non-cancelable input | IME is "the one case" | Spellcheck, autocorrect and autofill can also edit first | One read-back path for every non-cancelable edit (ADR-0006) |
| D8 | Theme on reload | No inline scripts; storage only in `src/persistence/` | The guide uses an inline script and `localStorage` to avoid a theme flash | Follow the specification; paint only the background until load completes (ADR-0005) |
| D9 | Overlays | One open overlay in the `ui` slice | The menu guide nests submenus and opens only through the invoker | Store is the truth; flat menus in version 1 (ADR-0007) |
| D10 | Table keyboard | Real `<table>`, "arrow keys move between cells" | Cell navigation needs grid semantics | `<table role="grid">` with roving `tabindex` (ADR-0003) |
| D11 | Polyfills | No runtime dependency beyond the five | Guides name three polyfill packages; table-core brings `@tanstack/store` transitively | No polyfills, small scripted fallbacks; accept the one transitive dependency (ADR-0003, ADR-0007) |
| D12 | Drag alternative | Keyboard and drag | WCAG 2.2 SC 2.5.7 also needs a single-pointer path | Add "Move up", "Move down", "Move to" menu actions (ADR-0007) |
| D13 | Slash menu pattern | A menu | Focus stays in the editor, which is the combobox pattern | `role="listbox"` popover driven by `aria-activedescendant` on the block |
| D14 | Pipeline state file | Not in the folder structure | The SDLC skill writes `.agentic-sdlc/active/` | Keep it git-ignored |

## Architecture in brief

`docs/architecture.md` has the data flow and layer table;
`docs/ownership.md` has the owner of every concern. The parts of the design
that the specification leaves open:

- **Command registry.** `src/state/command-registry.ts` maps a command type
  to its handler. Features export handlers from `*.commands.ts`;
  `src/app/bootstrap.ts` registers them. `state` never imports a feature.
- **Dispatcher contract.**
  `dispatch(command): { ok: true } | { ok: false, error: DispatchError }`.
  It stamps `command.meta = { ids, now }`, runs the handler, applies the
  operations, checks invariants, updates history and calls `setState` once.
- **Operations.** Five types on two record kinds (`block`, `view`) and on id
  lists. `applyOperations(workspace, operations)` returns the next
  workspace, the inverse operations and the changed record ids.
- **History entry.** `{ inverse: Operation[], selectionBefore }`. Undo
  applies the inverse and pushes the inverse of that onto the redo stack.
- **Block definition.**
  `{ type, propsSchema, createProps, convertProps, renderBlock, isText }` in
  `<type>.definition.ts`, one line per type in `block-registry.ts`.
- **Property definition.**
  `{ type, valueSchema, parse, format, renderCell, renderEditor, sortFn, filterOperators }`.
- **Storage adapter.** `{ load(), save(changes), clear() }`, implemented by
  the IndexedDB adapter and by an in-memory adapter for tests.
- **Overlay host.** `ui.overlay` holds `{ kind, anchorId, payload } | null`.
  `src/ui/overlay/` shows the matching `<dialog>` or popover after render
  and turns its `toggle` and `close` events into `ui.closeOverlay`.

Design checks applied (skills named in the build prompt):

- *Module depth.* `dispatch` is the deep module: one function hides
  stamping, validation, history and notification. Registries exist because
  the dependency must be inverted, not as pass-through layers. No wrapper
  around lit-html or Valibot.
- *Connascence.* `parentId` with `childIds` is connascence of values, kept
  inside one transaction and checked by one module. The table engine's
  state names are confined to one adapter module. Commands are objects with
  named fields, so there is no connascence of position.
- *Parse, don't validate.* Schemas produce branded, narrowed types at the
  two boundaries. Below them there are no casts and no shape checks; lint
  bans `as` and `!` outside schemas.
- *Hyrum's Law.* The exported file is the public surface. Tests assert
  parsed content, never serialized key order. Ids are opaque: nothing
  parses a UUID.
- *Expand and contract.* A format change adds a new key and a migration and
  never repurposes a key; a newer `schemaVersion` is rejected, not
  half-read.

## Milestones and tasks

Each task is a vertical slice of about an hour that ends in something
visible. `docs/tasks.md` holds the test-first specification of each task for
the current milestone; the next milestone's specifications are written when
the previous one is accepted.

### Milestone 1: Foundation

| Task | Result on screen |
| --- | --- |
| 1.1 Project setup: Vite, TypeScript, Vitest, Prettier, scripts | A blank page served by `npm run dev`; one passing test |
| 1.2 Lint limits: ESLint layers, size limits, banned names; Stylelint raw-value ban | A deliberate upward import fails `npm run lint` |
| 1.3 Tokens pipeline: three tiers, `build-tokens.ts`, Vite plugin | Page background and text use generated custom properties |
| 1.4 Model core: ids, envelope schema, operations, apply, invariants | Tests only; counts shown in the report |
| 1.5 Store, command registry, dispatcher, history | A temporary status line shows state changing on a key press |
| 1.6 App shell: grid, sidebar and main areas, top bar, CSP | The empty shell with a resizable, collapsible sidebar |
| 1.7 Theme: `ui.setTheme`, `color-scheme`, `data-theme` override | A theme control switches light, dark, system |
| 1.8 Repository: adapter contract, IndexedDB adapter, load, debounced save, migration runner | Theme and sidebar width survive reload; save status shows |
| 1.9 Shortcut registry and overlay host with one dialog | Undo and redo keys work; a settings dialog opens and closes |
| 1.10 Milestone review, UI audit, accessibility review, fixes | Audit findings closed |

### Milestone 2: Pages and sidebar

| Task | Result on screen |
| --- | --- |
| 2.1 Page block, `page.create`, root list | A "New page" button adds pages to the sidebar |
| 2.2 Sidebar tree with nesting, expand and collapse, ARIA tree keys | Arrow keys walk the tree |
| 2.3 Router and active page, title editing, rename | Clicking a page opens it; the URL changes; title edits show in the tree |
| 2.4 Breadcrumbs, back and forward | Breadcrumb trail on a nested page |
| 2.5 Favorite, trash, restore | Favorites section; trash dialog with restore |
| 2.6 Move by keyboard and menu actions | "Move up", "Move down", "Move to" reorder the tree |
| 2.7 Move by drag: pointer drag owner, drop marker, announcements | Dragging a page reorders or re-parents it |
| 2.8 Milestone review and audits | Audit findings closed |

### Milestone 3: Block editor, text

| Task | Result on screen |
| --- | --- |
| 3.1 Block registry, paragraph block, rich text projection | A page shows paragraphs from the store |
| 3.2 Grapheme and rich text math: splice, split, merge | Tests only |
| 3.3 `beforeinput` typing and deleting, caret restore | Typing in a paragraph, including emoji |
| 3.4 Enter to split, Backspace to merge, arrow keys between blocks | Splitting and merging blocks |
| 3.5 Read-back path: IME, spellcheck, autocorrect | Composition input lands in the store |
| 3.6 Headings, bulleted and numbered lists, to-do, quote, divider | All text block types render |
| 3.7 Tab and Shift+Tab to indent and outdent | Nested list items |
| 3.8 Inline marks and links, formatting shortcuts, paste | Bold, italic, code, link |
| 3.9 Typing benchmark on 1,000 blocks; fix if over 16 ms | Benchmark figure in the report |
| 3.10 Milestone review and audits | Audit findings closed |

### Milestone 4: Block editor, structure

| Task | Result on screen |
| --- | --- |
| 4.1 Slash menu: insert a block | Typing "/" opens a filtered list |
| 4.2 Convert block type | "Turn into" changes a block's type |
| 4.3 Block drag to reorder plus menu move actions | Dragging a block by its handle |
| 4.4 Block-level selection across blocks | Shift+Arrow past a block edge selects whole blocks |
| 4.5 Toggle and callout blocks | Collapsible toggle; callout |
| 4.6 Code block and page link block | Code with monospace; a link that opens a page |
| 4.7 Acceptance test: a new block type is one folder and one line | Test passes |
| 4.8 Milestone review and audits | Audit findings closed |

### Milestone 5: Database and table view

| Task | Result on screen |
| --- | --- |
| 5.1 Database block, default view record, empty table | A database page with a header row |
| 5.2 Property registry with text and number; add and remove property | Columns can be added and removed |
| 5.3 Rows as pages, add row, open row as page | A row opens as a page |
| 5.4 Table engine adapter and table rendering | Rows render through the engine |
| 5.5 Cell navigation and editing: Enter, Escape, arrows | Cells edit in place |
| 5.6 Select and multi-select with option chips | Chips in cells; option editor |
| 5.7 Date, checkbox, URL | All seven property types |
| 5.8 Row windowing above 200 rows | 5,000 seeded rows scroll smoothly |
| 5.9 Milestone review and audits | Audit findings closed |

### Milestone 6: Views

| Task | Result on screen |
| --- | --- |
| 6.1 Sort from the header and a sort menu | Sorted rows with `aria-sort` |
| 6.2 Filters with per-type operators | A filter bar narrows rows |
| 6.3 Column resize | Dragging a column edge; keyboard resize |
| 6.4 Column reorder and hide | Columns move and hide |
| 6.5 Several saved views per database | View tabs; each keeps its settings |
| 6.6 5,000-row measurement and fixes | Timing figures in the report |
| 6.7 Milestone review and audits | Audit findings closed |

### Milestone 7: Workspace tools

| Task | Result on screen |
| --- | --- |
| 7.1 Command palette and page search | Ctrl+K opens search and actions |
| 7.2 JSON export | A downloaded workspace file |
| 7.3 JSON import with migrations and error report | Import into an empty profile reproduces the workspace |
| 7.4 Settings dialog: theme, data tools | Settings page complete |
| 7.5 View transitions and motion polish | Page changes animate; none with reduced motion |
| 7.6 Final audit, accessibility review, README, docs in line with code | No AA failures; documents current |

## Testing

- `model` and `state`: pure tests in the Node environment, command in and
  state out. This is where most tests live.
- Features: a few view tests per feature in a DOM environment chosen per
  file, covering only event-to-command translation.
- No end-to-end suite, no snapshots, no coverage gate, no sleeps.
- Interface checks: after each task, a screenshot of the running app taken
  with the pre-installed headless browser by a script in the session
  scratchpad. This is a one-off look, not a test suite, and nothing from it
  is added to the repository or to `package.json`.

## Verification

| Command | Expected |
| --- | --- |
| `npm run verify` | Type check, lint and tests exit 0 in under 30 s |
| `npm run test` | All tests pass in under 10 s |
| `npm run lint` | 0 errors, 0 warnings |
| `npm run build` | Exit 0 in under 20 s |
| Search for `setState` in `src/` | Found only in `src/state/store.ts` and `src/state/dispatch.ts` |
| Search for `idb` or `indexedDB` in `src/` | Found only in `src/persistence/` |

## Out of scope

Everything listed under "Out of scope for version 1" in the specification,
plus: nested submenus, partial text selection across blocks, a
user-selectable density setting, polyfill packages, an end-to-end test
suite.
