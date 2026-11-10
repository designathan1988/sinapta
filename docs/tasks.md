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

- Icon-only buttons rely on the native `title` tooltip, which does not show
  on keyboard focus. A tooltip primitive is planned with milestone 7.
- Each keystroke in the page title is its own undo step. Coalescing comes
  with text editing in milestone 3.
- Back and forward work through the URL; View Transitions between pages are
  planned with milestone 7.

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
| 3.9 Typing on 1,000 blocks | done | Production build: median 6.9 ms, worst 10.4 ms per keystroke |
| 4.1 Slash menu | done | `src/features/slash-menu/slash-menu.test.ts` |
| 4.2 Convert block type | done | `editor-convert.test.ts` |
| 4.3 Block drag and menu move actions | done | `editor-move.test.ts`, `src/ui/drag/pointer-drag.test.ts` |
| 4.4 Block-level selection across blocks | not done | See below |
| 4.5 Toggle and callout | done | `block-registry.test.ts` |
| 4.6 Code and page link | done | `block-registry.test.ts` |
| 4.7 A new block type is one folder and one line | done | `block-registry.test.ts`; component styles are imported by their own view |
| Review and audits | done | axe: no violations in 16 state and theme combinations |

Not done in these milestones:

- Selecting across several blocks (task 4.4). Selection works inside one
  block only.
- Pasting several lines keeps them in one block instead of creating one
  block per line.
- The block menu returns focus to the handle, not to the caret.
- A tooltip primitive for icon-only buttons (carried from milestone 2).
