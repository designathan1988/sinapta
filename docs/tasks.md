# Tasks: milestone 1, Foundation

**Status:** Approved on 2026-11-10. The specifications use the approved
decisions in the plan (D1 to D22).

Each task is test-first: write the listed scenarios, watch them fail,
implement, then look at the running app. Every task ends with
`npm run verify`, a screenshot, and one Conventional Commit. Specifications
for milestone 2 are written when milestone 1 is accepted.

Rules for every task: only the files listed are created or changed; no file
named `utils`, `helpers`, `common`, `shared`, `misc` or `lib`; no feature
code ahead of its milestone.

---

## Task 1.1: Project setup

> **Status:** done · **Effort:** m · **Depends on:** none

**Delivers:** a Vite project that serves a blank page, type-checks, formats
and runs one test, with every script from specification section 7.

**Test scenarios** (`src/model/id.test.ts`, the first real unit)
- **creates a block id** — GIVEN nothing WHEN `createBlockId()` is called
  THEN it returns a string in UUID form.
- **creates distinct ids** — GIVEN two calls WHEN compared THEN they differ.

**Files:** `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`,
`src/app/main.ts`, `src/model/id.ts`, `src/model/id.test.ts`,
`src/model/index.ts`, `README.md` (commands only).

**Notes:** TypeScript per D1. Vitest uses `pool: "threads"`,
`isolate: false`. `test:watch` is `vitest --watch`; `check:watch` passes
`--preserveWatchOutput`. Exact versions recorded in the ADRs.

**Do not:** add any runtime dependency not in specification section 3; add
a DOM test environment yet.

**Visible result:** blank page at the dev URL; `npm run test` shows 2
passing; `npm run check` exits 0.

## Task 1.2: Lint limits

> **Status:** done · **Effort:** m · **Depends on:** 1.1

**Delivers:** lint as a build failure for layer direction, entry-point
imports, size limits, banned names, casts and default exports; Stylelint
for raw values.

**Test scenarios** (lint is the test; checked by running it on fixtures
created and deleted inside the task, not committed)
- **rejects an upward import** — GIVEN a file in `src/model/` importing
  `src/state/` WHEN `npm run lint` runs THEN it exits non-zero and names the
  rule.
- **rejects a deep import** — GIVEN a file importing
  `src/features/x/x.view.ts` from another folder THEN lint fails.
- **rejects an oversized file and function** — GIVEN 251 lines, or a
  41-line function THEN lint fails.
- **rejects a banned name** — GIVEN `src/ui/utils.ts` THEN lint fails.
- **rejects a raw value in CSS** — GIVEN `color: #fff` or `margin: 4px`
  outside the generated file THEN Stylelint fails.

**Files:** `eslint.config.js`, `stylelint.config.js`, `package.json`
(scripts `lint`, `verify`).

**Notes:** core `no-restricted-imports` per layer
(`docs/research/lint.md`). Exemptions per D19.

**Do not:** add a lint plugin beyond typescript-eslint and the Stylelint
standard config.

**Visible result:** terminal output of the failing fixture, then a clean
`npm run verify`.

## Task 1.3: Tokens pipeline

> **Status:** done · **Effort:** m · **Depends on:** 1.2

**Delivers:** token JSON in three tiers and the script that generates
`src/styles/tokens.generated.css`, rerun by a Vite plugin on change. Token
values here are the minimum for the shell; Phase 3 fills the full set from
`docs/research/visual-direction.md`.

**Test scenarios** (`scripts/build-tokens.test.ts`)
- **emits one custom property per token** — GIVEN
  `color.text.primary` THEN the output contains `--color-text-primary`.
- **resolves aliases** — GIVEN a semantic token aliasing a base token THEN
  the output references `var(--base-...)`.
- **converts camelCase segments** — GIVEN `font.lineHeight.body` THEN
  `--font-line-height-body` (D18).
- **emits themes with `light-dark()`** — GIVEN light and dark values for one
  token THEN one declaration using `light-dark()`.
- **reports an unknown alias** — GIVEN `{color.missing}` THEN a typed error
  naming the token path, and no file written.
- **formats each value type** — dimension, duration, color, font family,
  cubic bezier, shadow.

**Files:** `tokens/base.tokens.json`, `tokens/semantic.tokens.json`,
`tokens/themes/light.tokens.json`, `tokens/themes/dark.tokens.json`,
`scripts/build-tokens.ts`, `scripts/build-tokens.test.ts`,
`src/styles/index.css`, `src/styles/reset.css`, `src/styles/base.css`,
`src/styles/tokens.generated.css`, `vite.config.ts` (plugin).

**Do not:** add Style Dictionary or any token library.

**Visible result:** the page background and text color come from tokens and
change with the system theme.

## Task 1.4: Model records

> **Status:** done · **Effort:** m · **Depends on:** 1.1

**Delivers:** branded ids, the workspace envelope schema (blocks with
opaque props, views, root ids, settings) and typed parse errors.

**Test scenarios** (`src/model/workspace.test.ts`)
- **parses the specification's example file** — GIVEN the JSON from
  section 4 THEN a typed workspace with two blocks.
- **reports an invalid record without throwing** — GIVEN a block missing
  `childIds` THEN an error with the record id and path, and the other
  records still parsed.
- **drops unknown keys** — GIVEN an extra key on a block THEN it parses and
  the key is absent.
- **rejects an unknown theme** — GIVEN `settings.theme: "sepia"` THEN a
  typed error.
- **creates an empty workspace** — THEN `schemaVersion` 1, no blocks,
  theme `"system"`.

**Files:** `src/model/block.schema.ts`, `src/model/view.schema.ts`,
`src/model/workspace.schema.ts`, `src/model/parse-error.ts`,
`src/model/workspace.test.ts`, `src/model/index.ts`.

**Do not:** define any block type's props (milestones 2 and 3); the props
schemas arrive as a parameter (D3).

**Visible result:** none on screen; test counts in the report.

## Task 1.5: Model operations

> **Status:** done · **Effort:** m · **Depends on:** 1.4

**Delivers:** the five operation types, `applyOperations` returning the
next workspace, the inverse and the changed ids, and the invariant check.

**Test scenarios** (`src/model/apply-operation.test.ts`,
`src/model/workspace-invariants.test.ts`)
- **creates, updates and deletes a record** — one scenario each.
- **inserts into and removes from an id list at an index**.
- **returns an inverse that restores the previous workspace** — GIVEN any
  operation list WHEN the inverse is applied THEN the result equals the
  original.
- **does not mutate its input**.
- **lists the changed record ids**.
- **rejects a child whose `parentId` disagrees with the parent's
  `childIds`**.
- **rejects a cycle** and **rejects an id listed twice**.
- **changes nothing when an operation targets a missing record** — THEN a
  typed error and the original workspace.

**Files:** `src/model/operation.ts`, `src/model/apply-operation.ts`,
`src/model/workspace-invariants.ts`, the two test files,
`src/model/index.ts`.

**Do not:** add operation types beyond the five.

**Visible result:** none on screen; test counts in the report.

## Task 1.6: Store, command registry, dispatcher

> **Status:** done · **Effort:** m · **Depends on:** 1.5

**Delivers:** `AppState` with four slices, the one store, handler
registration and `dispatch`.

**Test scenarios** (`src/state/dispatch.test.ts`)
- **applies a registered command in one notification** — GIVEN a
  subscriber THEN it is called once with the new and previous state.
- **stamps ids and time on the command** — GIVEN injected id and clock
  sources THEN the handler receives them and creates none itself.
- **changes nothing when validation fails** — THEN state is the same
  reference and the result carries a typed error.
- **returns an error for an unknown command type**.
- **throws when a subscriber dispatches during notification**.
- **does not notify when a command produces no change**.

**Files:** `src/state/app-state.ts`, `src/state/store.ts`,
`src/state/command-registry.ts`, `src/state/dispatch.ts`,
`src/state/dispatch.test.ts`, `src/state/index.ts`, `src/app/bootstrap.ts`,
`src/app/shell.view.ts`, `src/ui/copy.ts`.

**Notes:** one `setState(next, true)` per command (ADR-0002). The status
line is temporary and removed in task 1.8.

**Visible result:** a line of text showing a counter in `ui` state that
changes when a button dispatches a command.

## Task 1.7: History

> **Status:** done · **Effort:** s · **Depends on:** 1.6

**Delivers:** undo and redo of workspace transactions.

**Test scenarios** (`src/state/history.test.ts`)
- **undoes a workspace command** — THEN the workspace equals the state
  before it.
- **redoes an undone command**.
- **clears redo after a new command**.
- **does not record a command that changes only `ui`**.
- **does not record `settings` changes** (D15).
- **does nothing when the stack is empty**.
- **restores the selection that was current before the transaction**.

**Files:** `src/state/history.ts`, `src/state/history.test.ts`,
`src/state/dispatch.ts`, `src/state/app-state.selectors.ts` (`selectCanUndo`,
`selectCanRedo`).

**Visible result:** temporary Undo and Redo buttons revert and reapply a
test workspace change shown in the status line.

## Task 1.8: App shell

> **Status:** done · **Effort:** m · **Depends on:** 1.6, 1.3

**Delivers:** the grid shell with sidebar and main areas, top bar, sidebar
resize and collapse, and the build-time Content Security Policy.

**Test scenarios** (`src/state/ui.test.ts`; `src/app/shell.test.ts` in the
DOM environment)
- **sets the sidebar width within its limits** — GIVEN a width below the
  minimum THEN it is clamped.
- **toggles the collapsed flag**.
- **dispatches `ui.toggleSidebar` when the collapse button is activated**.
- **dispatches `ui.setSidebarWidth` once when a resize ends** — not on every
  pointer move.
- **resizes with arrow keys on the separator**.

**Files:** `src/state/ui.commands.ts`, `src/state/ui.test.ts`,
`src/app/shell.view.ts`, `src/app/shell.css`, `src/app/shell.test.ts`,
`src/ui/button/`, `src/ui/icon/`, `src/ui/copy.ts`, `index.html`,
`vite.config.ts` (CSP at build, D20).

**Notes:** landmarks `nav` and `main`, a skip link, the separator as
`role="separator"` with `aria-valuenow`. Width applied through the CSSOM.

**Do not:** render any page list yet.

**Visible result:** the empty shell; the sidebar resizes by drag and by
keyboard and collapses.

## Task 1.9: Theme

> **Status:** done · **Effort:** s · **Depends on:** 1.8

**Delivers:** light, dark and system themes with a manual override.

**Test scenarios** (`src/state/settings.test.ts`; shell view test)
- **sets the theme to light, dark and system**.
- **rejects an unknown theme value** — typed error, no change.
- **renders no `data-theme` attribute for system** and **`data-theme="dark"`
  for dark**.
- **dispatches `settings.setTheme` from the theme control**.

**Files:** `src/state/settings.commands.ts`, `src/state/settings.test.ts`,
`src/app/shell.view.ts`, `src/styles/base.css`, `index.html`
(`color-scheme` meta), `src/ui/copy.ts`.

**Notes:** three-state control per `docs/research/web-dark-mode-toggle.md`;
`color-scheme: light dark` stays on the root.

**Visible result:** the theme control switches the shell between light and
dark; screenshots of both.

## Task 1.10: Repository with the in-memory adapter

> **Status:** done · **Effort:** m · **Depends on:** 1.7

**Delivers:** the storage adapter contract, an in-memory adapter, load at
startup and debounced save of changed records with a save status.

**Test scenarios** (`src/persistence/workspace-repository.test.ts`, fake
timers)
- **saves only the records a transaction changed**.
- **waits 300 ms and merges changes made within the window into one save**.
- **saves the `ui` slice and settings in `meta`**.
- **sets the save status to saving, then saved**.
- **sets the save status to failed with a reason when the adapter rejects**
  and keeps the changes queued.
- **loads a stored workspace into the store**.
- **skips and reports a stored record that fails its schema**.
- **loads an empty workspace when storage is empty**.

**Files:** `src/persistence/storage-adapter.ts`,
`src/persistence/workspace-repository.ts`, its test,
`src/persistence/index.ts`, `src/state/persistence.commands.ts`,
`src/app/bootstrap.ts`, `src/app/shell.view.ts` (save status with a polite
live region), `src/ui/copy.ts`.

**Visible result:** "Saved" appears in the top bar after a change.

## Task 1.11: IndexedDB adapter and migrations

> **Status:** done · **Effort:** m · **Depends on:** 1.10

**Delivers:** real persistence and the migration runner with version 1 as
the baseline.

**Test scenarios** (`src/persistence/migrations/run-migrations.test.ts`)
- **returns a version 1 file unchanged**.
- **applies migrations in order from an older version** — using two test
  migrations passed in.
- **rejects a file newer than the app** with a typed error.
- **rejects a file with no `schemaVersion`**.

**Files:** `src/persistence/indexed-db-adapter.ts`,
`src/persistence/migrations/run-migrations.ts`, its test,
`src/persistence/migrations/0001-baseline.ts`, `src/app/bootstrap.ts`.

**Notes:** the adapter is the only file importing `idb`; it is verified in
the running app, not with a fake IndexedDB package (ADR-0005).

**Visible result:** set dark theme and a sidebar width, reload: both
persist. Screenshots before and after reload.

## Task 1.12: Shortcuts and overlay host

> **Status:** done · **Effort:** m · **Depends on:** 1.9, 1.7

**Delivers:** the shortcut registry with undo and redo, and the overlay
host with one settings dialog.

**Test scenarios** (`src/ui/shortcuts/shortcut-registry.test.ts`,
`src/state/ui.test.ts`, `src/ui/overlay/overlay.test.ts`)
- **matches Ctrl+Z and Cmd+Z to `history.undo`**, and Shift variants to
  redo.
- **ignores a key with no registered shortcut**.
- **does not fire while an IME composition is active**.
- **opens an overlay and replaces one that is already open**.
- **dispatches `ui.closeOverlay` when the dialog closes itself** (Escape or
  backdrop).

**Files:** `src/ui/shortcuts/`, `src/ui/overlay/`, `src/ui/dialog/`,
`src/features/settings/` (view, `index.ts`, CSS), `src/app/bootstrap.ts`
(one line), `src/ui/copy.ts`.

**Notes:** `<dialog>` with `showModal()`; light dismiss with the fallback
in `docs/research/web-dialog.md`.

**Visible result:** the settings dialog opens from the top bar and from
its shortcut and closes with Escape; undo keys work.

## Task 1.13: Milestone review

> **Status:** done · **Effort:** m · **Depends on:** 1.1 to 1.12

**Delivers:** the review and audit pass the build prompt requires: code
review, complexity check on the diff, UI audit and accessibility review on
the built app, fixes, and a clean commit series.

**Acceptance (specification section 9, reworded per D15):** an empty
workspace loads; the three watchers run; a `settings.setTheme` command
switches theme and survives reload; an import that breaks the layer
direction fails lint.

**Visible result:** a short report with screenshots in both themes and the
`npm run verify` and `npm run build` timings against their budgets.

---

# Milestone 2, Pages and sidebar: record

Built in the same pass as milestone 1, without separate task
specifications; the tests listed are the specification of each slice.

| Task | Status | Tests |
| --- | --- | --- |
| 2.1 Page block, `page.create`, root list | done | `src/blocks/page/page.test.ts` |
| 2.2 Sidebar tree, expand and collapse, tree keys | done | `src/features/sidebar/sidebar.test.ts`, `sidebar-keys.test.ts` |
| 2.3 Router, active page, title editing | done | `src/app/router.test.ts`, `src/state/ui.test.ts` |
| 2.4 Page icon | done | `src/blocks/page/page-tree.test.ts`, `src/model/grapheme.test.ts` |
| 2.5 Breadcrumbs, back and forward | done | `page-tree.test.ts` |
| 2.6 Favorite, trash, restore, delete | done | `page-tree.test.ts` |
| 2.7 Move by keyboard and menu actions | done | `page-tree.test.ts`, `sidebar-keys.test.ts` |
| 2.8 Move by drag | done | Drop target logic in `page-tree.test.ts`; the gesture checked in the running app |
| 2.9 Review and audits | done | See the review notes below |

## Review notes for milestones 1 and 2

Fixed after review:

- A stored workspace that failed to load was followed by saves that would
  have overwritten it. Saving now stops for the session.
- Enter on a button inside a tree row was swallowed by the tree.
- Row actions had no keyboard path: Shift+F10 opens the row's menu, and the
  open page has a menu button in the top bar.
- The page had no level-one heading; the resizer and menus sat outside
  landmarks; the title field had no focus indicator.
- Secondary and danger text were too faint in the dark theme.
- Moving a page by keyboard dropped focus.
- Two functions were above a complexity of 10; lint now caps it at 10.

Known and not fixed:

- Icon-only buttons relied on the native `title` tooltip, which does not
  show on keyboard focus. Fixed later: see "Completion pass" at the end.
- Each keystroke in the page title was its own undo step. Fixed with text
  editing in milestone 3: `page.rename` merges into one step per pause.
- Back and forward work through the URL; motion between pages came later:
  see "Completion pass" at the end.

---

# Milestones 3 and 4, Block editor: record

| Task | Status | Tests or check |
| --- | --- | --- |
| 3.1 Block registry, paragraph, rich text projection | done | `src/blocks/block-registry.test.ts` |
| 3.2 Grapheme and rich text math | done | `src/model/grapheme.test.ts`, `rich-text.test.ts`, `text-diff.test.ts` |
| 3.3 Typing and deleting through `beforeinput`, caret restore | done | `src/features/editor/editor.test.ts`; typed in the running app, including emoji |
| 3.4 Split, merge, arrow keys between blocks | done | `editor-structure.test.ts` |
| 3.5 Read-back path for composition | done | Composed and committed Japanese text through the browser's input method interface; stored correctly after reload |
| 3.6 Headings, lists, to-do, quote, divider | done | `editor-convert.test.ts` |
| 3.7 Indent and outdent | done | `editor-structure.test.ts` |
| 3.8 Bold, italic, inline code, link | done | `editor.test.ts`, `src/model/link-href.test.ts` |
| 3.9 Typing on 1,000 blocks | done | Production build: median 6.9 ms, worst 10.4 ms per keystroke (remeasured in the completion pass) |
| 4.1 Slash menu | done | `src/features/slash-menu/slash-menu.test.ts` |
| 4.2 Convert block type | done | `editor-convert.test.ts` |
| 4.3 Block drag and menu move actions | done | `editor-move.test.ts`, `src/ui/drag/pointer-drag.test.ts` |
| 4.4 Block-level selection across blocks | done in the completion pass | `editor-selection.test.ts` |
| 4.5 Toggle and callout | done | `block-registry.test.ts` |
| 4.6 Code and page link | done | `block-registry.test.ts` |
| 4.7 A new block type is one folder and one line | done | `block-registry.test.ts`; component styles are imported by their own view |
| Review and audits | done | axe: no violations in 16 state and theme combinations |

Left out of these milestones and done in the completion pass at the end of
this file: selecting several blocks (task 4.4), one block per pasted line,
returning the caret after the block menu, and the tooltip primitive.

---

# Milestones 5 to 7, Database, views and workspace tools: record

| Task | Status | Tests or check |
| --- | --- | --- |
| 5.1 Database block, default view, empty table | done | `src/features/database/database.test.ts` |
| 5.2 Property registry; add and remove property | done | `property-registry.test.ts`, `database.test.ts` |
| 5.3 Rows as pages, add row, open row as page | done | `database.test.ts`, `table-keys.test.ts` |
| 5.4 Table engine adapter and table rendering | done | `table-model.test.ts` |
| 5.5 Cell navigation and editing | done | `table.test.ts`, `table-keys.test.ts` |
| 5.6 Select and multi-select with option chips | done | `table.test.ts`; checked in the running app |
| 5.7 Date, checkbox, URL | done | `property-registry.test.ts` |
| 5.8 Row windowing above 200 rows | done | `table.test.ts`; 60 of 5,000 rows rendered |
| 6.1 Sort from the header and the column menu | done | `table-model.test.ts` |
| 6.2 Filters with per-type operators | done | `property-registry.test.ts`, `table-model.test.ts` |
| 6.3 Column resize by drag and by keyboard | done | `database.test.ts`; checked in the running app |
| 6.4 Column reorder and hide | done, by menu; by drag in the completion pass | `table-model.test.ts`, `table.test.ts` |
| 6.5 Several saved views per database | done | `database.test.ts` |
| 6.6 5,000-row measurement | done | Production build: load 548 ms, sort 37 ms, scroll 43 ms, cell commit 55 ms, filter 92 ms |
| 7.1 Command palette and page search | done | `src/features/command-palette/command-palette.test.ts` |
| 7.2 JSON export | done | `src/persistence/workspace-file.test.ts` |
| 7.3 JSON import with migrations and error report | done | `workspace-file.test.ts`; export, import into an empty profile and export again gave a byte-identical file |
| 7.4 Settings: theme and data tools | done | Checked in the running app |
| 7.5 View transitions and motion polish | done in the completion pass, as entry motion | Measured in the running app |
| 7.6 Final audit, README, documents | done | axe: no violations in 32 state and theme combinations |

Left out of these milestones and done in the completion pass below: column
drag, sorting by several properties, renaming a view, property values on a
row's page, motion between pages and the tooltip primitive.

---

# Completion pass: record

Everything the earlier records listed as not done, plus one gap found
between the specification and the code.

| Item | Status | Tests or check |
| --- | --- | --- |
| Sort by several properties: Shift and a header press, "Then sort" in the column menu, rank shown in the header | done | `src/features/database/view.test.ts` |
| Rename a view, in the Properties popover | done | `view.test.ts` |
| Reorder columns by dragging a header | done | `table.test.ts`, `src/ui/drag/pointer-drag.test.ts` |
| Property values on a row's page, editable there | done | `row-properties.test.ts` |
| Tooltip for icon-only controls | done | `src/ui/tooltip/tooltip.test.ts` |
| Caret returns to the text when the block menu closes | done | `src/ui/caret/caret.test.ts`; checked in the running app |
| One block per pasted line | done | `src/features/editor/editor-paste.test.ts` |
| Paste keeps bold, italic, code and links (specification 5.3; the code pasted plain text only) | done | `src/ui/rich-text/pasted-html.test.ts`, `editor-paste.test.ts` |
| Select whole blocks with Shift and Up or Down; delete, copy and cut them (task 4.4) | done | `editor-selection.test.ts` |
| Select whole blocks with the pointer: drag from one block into another, or Shift and a press in another block | done | `editor-selection.test.ts`; the gestures checked in the running app |
| Indent (Tab), outdent (Shift+Tab) and move (Alt with Up or Down) several selected blocks at once | done | `editor-selection.test.ts` |
| Motion when a page or a menu opens; none with reduced motion (task 7.5) | done | Opacity sampled in the running app: 0, 0.73, 0.98, 1 over 270 ms; constant 1 with reduced motion |

Decisions taken in this pass:

- **Page change motion is an entry animation, not a View Transition.** A
  View Transition runs its update in a callback on a later frame and blocks
  input while it plays. The root render is synchronous, and typing right
  after a page opens must reach the new page. The page element is keyed by
  page id and fades and rises in with `@starting-style`.
- **Tooltips use interest invokers without a polyfill.** One
  `popover="hint"` element in `index.html` takes the control's accessible
  name when interest is shown. Browsers without `interestfor` get the
  native `title` attribute, as before. No dependency was added.
- **A command may ask for a number of new ids that depends on what it
  carries** (`newIds` as a function of the payload). Pasting several lines
  needs one new block per line in one undo step.

Checks after the pass:

- 481 tests pass; type check and lint are clean.
- axe: no violations in the audited states of the shell, the editor and the
  database, in both themes.
- Export, import into an empty profile and export again still give the same
  file.
- 1,000-block typing, production build, same machine and hour: 15 ms median
  before the pass and 16 ms after it. The machine was about twice as slow
  as when 6.9 ms was recorded, so the two figures are not comparable with
  the earlier one; the pass itself added about 1 ms.
- 5,000-row table: load 680 ms, sort 38 ms, scroll 29 ms, cell commit
  36 ms, filter 87 ms.

Nothing in this file is left not done.

## Rule check pass: record

A check of the code against the acceptance lines of specification section 9
and `CLAUDE.md`, on a fresh install.

| Item | Status | Tests or check |
| --- | --- | --- |
| `database.css` had 375 lines; split into one file per view (`database.css`, `table.css`, `database-menus.css`, `row-properties.css`) | done | Table, menus, chips and row properties checked in the running app in both themes |
| `JSON.parse` sat in `workspace-file.ts`, outside the schemas; import now decodes through `src/model/json-text.schema.ts` (Valibot `parseJson`) | done | `src/model/json-text.test.ts`, `workspace-file.test.ts` |
| The row count read "1 rows"; `pluralize` in `src/ui/copy.ts` picks the form | done | `src/ui/copy.test.ts`; "1 row" in the running app |

| Token files over 250 lines against the four fixed files of section 3 | decided | `docs/decisions/0009-token-file-size.md`: token files are exempt from the file limit |

Out of scope by decision, not a task: selecting part of the text of two
blocks at once. The specification (section 5.3) and decision 0006 make a
selection that crosses a block boundary a selection of whole blocks, and
that is what the keyboard and the pointer now do.

---

# Version 1.1, milestones 8 to 10: record

The roadmap is in `docs/plan.md`. Every item was built test first, checked
in the running app, verified and committed on its own.

| Item | Status | Tests or check |
| --- | --- | --- |
| 8.1 A new or untitled page takes the caret in its title | done | Checked in the running app: New page, type, Enter |
| 8.2 Formatting toolbar and color picker over selected text | done | `src/features/format-toolbar/format-toolbar.test.ts`, `format-toolbar-keys.test.ts` |
| 8.3 Underline, strikethrough, text color and highlight (schema version 2) | done | `src/model/rich-text.test.ts`, `src/features/editor/editor.test.ts`, `run-migrations.test.ts` |
| 8.4 "+" beside each block, duplicate a block | done | `src/features/editor/editor-insert.test.ts`, `src/model/block-copy.test.ts` |
| 8.5 Paste Markdown as blocks | done | `src/ui/rich-text/pasted-markdown.test.ts`, `editor-paste-blocks.test.ts` |
| 8.6 Image, web bookmark and table of contents blocks | done | `src/blocks/image/image.test.ts`, `bookmark.test.ts`, `table-of-contents.test.ts` |
| 8.7 Export a page as Markdown | done | `src/features/markdown-export/markdown-export.test.ts` |
| 9.1 to 9.3 Board, gallery, list and calendar views (schema version 3) | done | `layouts/board/board.test.ts`, `gallery.test.ts`, `calendar.test.ts`, `view-layout.test.ts`; drag and Alt with the arrow keys checked in the running app |
| 9.4 Email, phone, created time, last edited time | done | `src/features/database/property-types.test.ts` |
| 9.5 Search the rows of a view | done | `src/features/database/view-search.test.ts` |
| 10.1 First visit: Getting started page and Tasks database | done | `src/features/onboarding/onboarding.test.ts`; loads back with no skipped record |
| 10.2 Duplicate a page with everything inside it | done | `src/blocks/page/page-duplicate.test.ts` |
| 10.3 Page cover and full width (schema version 4) | done | `src/blocks/page/page-cover.test.ts` |
| 10.4 Search page text in the command palette | done | `command-palette.test.ts` |
| 10.5 Keyboard shortcut reference | done | `src/features/shortcut-help/shortcut-help.test.ts`, against the shortcut registry |
| 10.6 Audit, README and documents | done | See below |

Fixed on the way:

- Text typed in a form field inside a block (an image caption, an address)
  was cancelled by the editor.
- Text color had no keyboard path: Alt+F10 now reaches the toolbar.
- Table of contents links were under the 24 pixel minimum target height.
- Every root render rewrote the color-scheme meta, which restyled the whole
  page on each keystroke. Found when the new block controls pushed typing
  past the target; fixed in `src/app/theme.ts`.

Checks after milestone 10:

- 628 tests pass; type check and lint are clean; `npm run verify` about
  7 seconds; `npm run build` under 1 second.
- axe (WCAG 2.2 AA): no violations in the table, board, gallery, list and
  calendar views, the new view menu, the Properties popover, the Getting
  started page, the formatting toolbar, the color picker, the cover picker,
  the shortcut dialog and the palette with text results, in both themes,
  and in samples of every text color and highlight.
- Production build with its content security policy: no console errors;
  images from https addresses show.
- Typing on a page of 1,000 blocks, production build: median 8.5 ms per
  keystroke; version 1 measured 19.7 ms back to back on the same machine.
- Every owner listed in `docs/ownership.md` exists.


## Version 2 record (Notion parity)

Plan: `docs/superpowers/plans/2026-11-11-notion-parity.md`; analysis and
decisions: `docs/superpowers/specs/2026-11-11-notion-parity-design.md`.

### Milestone 11: Contract compliance

| Task | Status | Tests |
| --- | --- | --- |
| 11.1 ADR-0011 and contract clarifications | done | Documents only |
| 11.2 `src/blocks/index.ts` and the import rule | done | Lint pattern; 32 imports moved |
| 11.3 `afterRender`, no timers in views | done | `src/ui/focus/after-render.test.ts` |
| 11.4 Scoped keys in the shortcuts folder | done | `scoped-keys.test.ts`, `slash-menu-keys.test.ts`, `format-toolbar.test.ts` |
| 11.5 One writer across tabs, persistent storage | done | `tab-lock.test.ts`, `workspace-repository-tabs.test.ts`, `dispatch.test.ts` |
| 11.6 Invariants on replaced workspaces | done | `dispatch.test.ts`, `workspace-repository.test.ts`, `workspace-file.test.ts` |
| 11.7 Architecture fitness tests | done | `src/app/architecture.test.ts`, each rule seen failing on a planted violation |

Found on the way: a load, import or seed that returned a broken page tree
was committed without the invariant check; a refused load could then have
saved over stored data. Both fixed test-first in 11.6.

### Milestone 12: Layout and chrome

| Task | Status | Tests |
| --- | --- | --- |
| 12.1 Page column, full-bleed cover, large icon, reposition (format version 5) | done | `page-style.test.ts`, `editor-cover.test.ts` |
| 12.2 Page font and small text | done | `page-style.test.ts`, `menu.test.ts` |
| 12.3 Top bar: edited time, favorite star, word count, Ctrl+Shift+L | done | `page-info.test.ts`, `page-info-view.test.ts`, `settings.test.ts` |
| 12.4 Sidebar header, quick items, sections, page glyphs | done | `sidebar.test.ts`, `sidebar-view.test.ts` |
| 12.5 Right-click menus for blocks, pages and rows | done | `menu.test.ts`, `editor-context-menu.test.ts`, `table-context-menu.test.ts` |
| 12.6 Start list on empty pages, placeholders | done | `database-start.test.ts`, `editor-start.test.ts` |
| 12.7 Home with recents and upcoming dates | done | `home.test.ts`, `home-view.test.ts`, `ui.test.ts`, `router.test.ts` |

Checks after milestone 12: 709 tests pass; `npm run verify` about
10 seconds; every surface checked in the running app in both themes.

### Milestone 13: Editor parity

| Task | Status | Tests |
| --- | --- | --- |
| 13.1 Every Notion block prefix | done | `editor-convert.test.ts` |
| 13.2 Inline Markdown while typing | done | `inline-markdown.test.ts`, `editor-input.test.ts` |
| 13.3 Block keyboard parity | done | `editor-block-keys.test.ts`, `editor-selection-keys.test.ts` |
| 13.4 Block color (format version 6) | done | `editor-color.test.ts`, `editor-color-menu.test.ts` |
| 13.5 Heading 4 and toggle headings (format version 7) | done | `heading.test.ts`, `editor-block-keys.test.ts` |
| 13.6 Subpages inside the page | done | `editor-subpages.test.ts`, `page-row.test.ts` |
| 13.7 Mentions and page links (format version 8) | done | `mention.test.ts`, `editor-mention.test.ts`, `mention-menu.test.ts` |
| 13.8 Emoji | done | `emoji-search.test.ts`, `emoji-menu.test.ts` |
| 13.9 Structured copy and rich paste | done | `block-clipboard.test.ts`, `pasted-html-blocks.test.ts`, `editor-paste-view.test.ts`, `editor-selection-keys.test.ts` |
| 13.10 Moving blocks between pages | done | `editor-move-page.test.ts`, `editor-block-drag.test.ts`, `editor-block-menu.test.ts`, `move-to.test.ts`, `page-address.test.ts`, `router.test.ts` |
| 13.11 Code block parity (format version 9) | done | `code-tokenize.test.ts`, `code-highlight.test.ts`, `code.test.ts`, `code-view.test.ts` |
| 13.12 Callout, image and list details (format version 10) | done | `numbered-list.test.ts`, `image.test.ts`, `image-view.test.ts`, `callout.test.ts` |

Found on the way: keys pressed in a control inside a block (the code
block's language list, the image's width slider) acted on the block that
last held the caret; Ctrl+D duplicated it. Fixed test-first in 13.11.
Chrome sends no copy event while whole blocks are selected, so Ctrl+C and
Ctrl+X on selected blocks keep them in the store for the next paste
(13.9).

Checks after milestone 13: 933 tests pass; `npm run verify` green; each
task checked in the running app. The browser pane's synthetic Ctrl+C and
Ctrl+V fire no native clipboard events, so clipboard paths are covered by
unit tests only.

### Milestone 14: New blocks and files

| Task | Status | Tests |
| --- | --- | --- |
| 14.1 Simple table block | done | `simple-table.test.ts`, `simple-table-view.test.ts`, `pasted-markdown.test.ts`, `pasted-html-blocks.test.ts`, `editor-context-menu.test.ts` |
| 14.2 Columns | done | `column-list.test.ts`, `column-view.test.ts`, `tidy.test.ts`, `pointer-drag.test.ts`, `editor-block-drag.test.ts` |
| 14.3 Equations (format version 11) | done | `tex-parse.test.ts`, `equation.test.ts`, `editor-equation.test.ts`, `editor-equation-view.test.ts` |
| 14.4 Breadcrumb block | done | `breadcrumb.test.ts` |
| 14.5 Asset store (format version 12) | done | `asset-store.test.ts`, `asset.test.ts`, `workspace-repository-assets.test.ts`, `workspace-file.test.ts` |
| 14.6 File, PDF, video and audio blocks | done | `media-blocks.test.ts`, `asset-store.test.ts` |
| 14.7 Embed block | done | `embed.test.ts` |
| 14.8 Synced block | done | `synced-block.test.ts`, `editor-block-menu.test.ts`, `editor-paste-blocks.test.ts` |
| 14.9 Button block | done | `button.test.ts`, `button-view.test.ts`, `slash-menu.test.ts` |

Found on the way: the block context menu opened over a table cell's own
menu (fixed with a `defaultPrevented` guard in 14.1). Files never travel
in commands: the asset saver stores them and dispatches only the outcome
(14.5). The PDF frame is not sandboxed, since Chrome's viewer refuses
sandboxed frames; files are served as `application/octet-stream` unless
their type is passive (14.6).

Checks after milestone 14: 1120 tests pass; `npm run verify` green; each
block checked in the running app.
