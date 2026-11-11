# Notion Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring Pagecraft to parity with every Notion feature one person can
use offline, with Notion's layout, keys and interactions, after first closing
the gaps the architecture audit found.

**Architecture:** Unchanged from version 1: one zustand store, one
`dispatch`, pure command handlers returning a `CommandEffect`, one owner per
concern, lit-html views, Valibot at the two boundaries, IndexedDB through
`idb`. Every Notion feature lands as a block folder, a property folder, a
view layout or a feature folder, plus one registry line.

**Tech Stack:** TypeScript 6, lit-html 3.3 (`html`, `svg`, `mathml`,
`render`, `nothing`, `repeat`, `keyed`, `ref`), zustand/vanilla, Valibot,
idb, @tanstack/table-core 9, Vite, Vitest, ESLint, Stylelint, Prettier.

**Spec:** `docs/superpowers/specs/2026-11-11-notion-parity-design.md`
(analysis, gap tables, audit findings C1 to C12, decisions D1 to D15), with
`docs/specification.md` and `CLAUDE.md` as the contract.

## Global Constraints

- Runtime libraries stay at five: lit-html, zustand, Valibot, idb,
  @tanstack/table-core. No new runtime dependency (design D4, D5, D12, D15).
- Max 250 lines per file (token JSON exempt, ADR-0009), 40 lines per
  function, 3 parameters per function, complexity 10.
- Import direction `app -> features -> blocks -> ui -> state -> model`;
  `persistence` imports `state` and `model` only; other folders through
  their `index.ts` only (a child folder may import its parent's modules
  after task 11.1).
- `setState` only in `src/state/dispatch.ts`; views keep no state, no
  timers, no subscriptions; DOM events become commands inside the view file.
- JSON is parsed only by schemas, at storage load and file import.
- CSS uses semantic token custom properties only; a new visual value is a
  token in `tokens/` followed by `npm run tokens`.
- Every user-facing string comes from `src/ui/copy.ts` (parts in
  `src/ui/copy/`); English only.
- Named exports only; no files or folders named utils, helpers, common,
  shared, misc or lib.
- Library and web API use is checked in current docs through Context7
  before writing code.
- Every format change: next `SCHEMA_VERSION`, a migration file
  `src/persistence/migrations/00NN-<change>.ts` appended to `MIGRATIONS`,
  and a test that a file of the previous version loads (design D2).
- Budgets: `npm run test` under 10 s, `npm run verify` under 30 s, typing
  under 16 ms per keystroke on 1,000 blocks, a 5,000-row table responsive.
- WCAG 2.2 AA: keyboard path for every action, visible focus, a keyboard
  or single-pointer alternative for every drag.
- Pagecraft keeps its own name, icons, tokens and wording (design D3).
- Commits: Conventional Commits, scope is the folder, trailer
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; push to the
  working branch after each milestone.

### Standard cycle

Every task runs these steps; a task lists only what it adds to them.

- S1. Write the failing tests named in the task.
- S2. Run `npx vitest run <the task's test files>`; expect the new tests
  to FAIL for the stated reason.
- S3. Implement the listed interfaces.
- S4. Run the same command; expect PASS.
- S5. Run `npm run verify`; expect exit 0 inside 30 s. Look at the result
  in the running app (`npm run dev`, already on port 5173).
- S6. Update `docs/ownership.md` for any new owner, then commit with the
  message given in the task.

### Format versions in expected order

| Version | Task | Adds |
| --- | --- | --- |
| 5 | 12.1, 12.2 | Page `font` (`"default"`, `"serif"`, `"mono"`), `isSmallText`, `coverPosition` |
| 6 | 13.4 | `color` on text blocks |
| 7 | 13.5 | Heading `level` 4 and `isToggleable` |
| 8 | 13.7 | Rich text span `mention` |
| 9 | 13.11 | Code `language`, `isWrapped`, `caption` |
| 10 | 13.12 | Callout `color`; image `width` and `align` |
| 11 | 14.3 | Rich text span `equation` |
| 12 | 14.5 | Workspace file `assets`; `assetId` on image |
| 13 | 15.1 | Property `config`, parsed by each property type's schema |
| 14 | 15.3 | Date value object with `end` and `time` |
| 15 | 16.1 | Database `isInline` |
| 16 | 16.2 | View `filter` tree replacing `filters` (a moving migration) |
| 17 | 16.3 | View grouping keys |
| 18 | 16.4 | View `calculations` |
| 19 | 16.5 | View `wrappedPropertyIds`, `frozenCount` |
| 20 | 16.6 | View board and card options |
| 21 | 16.7 | View calendar options |
| 22 | 16.8 | View type `timeline` and its options |
| 23 | 16.9 | View type `chart` and its options |
| 24 | 16.10 | View type `form` and its options |
| 25 | 16.11 | View type `feed` |
| 26 | 16.12 | View `openMode` |
| 27 | 16.13 | Database `templateIds`, `defaultTemplateId` |
| 28 | 16.15 | Page and view `isLocked` |
| 29 | 17.4 | Record kind `comment` |

New block types and new property types do not raise the version (as in
version 1.1); new keys and new enum values do.

If tasks run in another order, each takes the next free number; the table
only predicts it.

## Review Focus

- **Two tabs on one profile.** A second tab must never write; it shows a
  read-only notice and follows the first tab's saves. Test in task 11.5.
- **Input method composition.** Typing `**`, `[[`, `@` or `:` while an IME
  is composing must not trigger inline Markdown, mentions or emoji. Tests in
  tasks 13.2, 13.7 and 13.8.
- **Formula failures.** A formula that refers to itself, forms a cycle
  through another formula, divides by zero or mixes types shows an error
  value in its cell, never throws, never loops. Test in task 15.7.
- **Relations to pages that are gone.** A related page that is trashed or
  deleted, or a related database that is deleted, drops out of relation
  values and rollups without an error. Test in task 15.5.
- **Storage full.** An asset save that exceeds the quota returns a typed
  error, shows a message, and leaves no half-saved block. Test in task 14.5.

---

## Milestone 11: Contract compliance

Closes audit findings C1 to C7 and C9 before any feature work.

### Task 11.1: ADR-0011 and contract clarifications

**Files:**
- Create: `docs/decisions/0011-notion-parity-scope.md`
- Modify: `docs/specification.md` (sections 1, 2.2, 2.4, 6),
  `.claude/rules/state.md`, `docs/architecture.md`, `docs/plan.md`
  (link to this plan), `CLAUDE.md` (no change expected; confirm)

**Interfaces:** none (documents).

- [ ] **Step 1: Write ADR-0011** with status Accepted, context from design
  section 1, decision D1 to D15 as a table, consequences: scope list of
  specification section 1 replaced; formulas, relations and rollups move in.
- [ ] **Step 2: Amend specification section 1** "Out of scope" to the
  design's non-goals list; add the parity table reference.
- [ ] **Step 3: Amend section 2.2 and `.claude/rules/state.md`**: a handler
  is `(state, command) => CommandEffect`; an effect holds `operations`, or a
  whole `workspace` (load, import, seed: not recorded in history, still
  checked against the invariants), plus optional `ui`, `persistence`,
  `mergeKey`.
- [ ] **Step 4: Amend section 2.4**: "A child folder may import its
  parent's modules (a block type its `block-definition.ts`, a layout its
  database feature); a parent imports a child only through the child's
  `index.ts`."
- [ ] **Step 5: Amend section 6**: role suffixes mark the six roles; any
  other module is named for its concept with no suffix; test fixtures end in
  `-builder.ts`; a feature's `index.ts` may hold exactly one gathered
  `xCommands` array besides re-exports.
- [ ] **Step 6: Run** `npx prettier --check docs` → all files pass.
- [ ] **Step 7: Commit** `docs: widen the scope to Notion parity and clarify the contract`

### Task 11.2: `src/blocks/index.ts` and the import rule

**Files:**
- Create: `src/blocks/index.ts`
- Modify: the 30 files that import `blocks/block-registry.ts` or
  `blocks/text-block.ts` from outside `src/blocks/` (list with
  `grep -rnE 'blocks/(block-registry|text-block)\.ts' src/app src/features`),
  `eslint.config.js`
- Test: `src/blocks/block-registry.test.ts` (exists; extend)

**Interfaces:**
- Produces: `src/blocks/index.ts` re-exports `BLOCK_DEFINITIONS`,
  `blockDefinition`, `BLOCK_PROPS_SCHEMAS`, `BLOCK_COMMANDS` from
  `block-registry.ts` and `isTextBlock`, `textOf`, `type TextBlock` (and
  every other symbol those 30 files use) from `text-block.ts`.

- [ ] **Step 1: Add a lint pattern** in the `features` and `app` blocks of
  `no-restricted-imports`: group `["**/blocks/*.ts", "!**/blocks/index.ts"]`
  with message "Import blocks through src/blocks/index.ts".
- [ ] **Step 2: Run** `npx eslint src/app src/features` → 30 errors.
- [ ] **Step 3: Create `src/blocks/index.ts`** and point the 30 imports at it.
- [ ] **Step 4: Run** `npx eslint src` → 0 problems; `npm run verify` → exit 0.
- [ ] **Step 5: Commit** `refactor(blocks): import the registry through an index`

### Task 11.3: `afterRender` owner, no timers in views

**Files:**
- Create: `src/ui/focus/after-render.ts`
- Modify: `src/ui/focus/index.ts`, `src/features/database/table-cell.view.ts:45`,
  `src/features/format-toolbar/format-toolbar.view.ts:43`
- Test: `src/ui/focus/after-render.test.ts`

**Interfaces:**
- Produces: `afterRender(action: () => void): void` — runs `action` once
  the current render task has finished (a microtask), the only place a view
  may defer work.

- [ ] **Step 1: Write the failing test**

```ts
describe("afterRender", () => {
  it("runs the action after the current task, not before", async () => {
    const calls: string[] = [];
    afterRender(() => calls.push("after"));
    calls.push("now");
    await Promise.resolve();
    expect(calls).toEqual(["now", "after"]);
  });
});
```

- [ ] **Step 2: Run** `npx vitest run src/ui/focus/after-render.test.ts` → FAIL (not exported).
- [ ] **Step 3: Implement** with `queueMicrotask`; replace both view call sites.
- [ ] **Step 4: Run** the test → PASS; `grep -rn "queueMicrotask\|setTimeout" src --include=*.view.ts` → no output.
- [ ] **Step 5: Verify in the app**: editing a table cell and pressing Enter keeps focus in the grid; selecting text shows the toolbar above it.
- [ ] **Step 6: Commit** `refactor(ui): defer view work through afterRender`

### Task 11.4: Scoped keys owned by the shortcuts folder

**Files:**
- Create: `src/ui/shortcuts/scoped-keys.ts`
- Modify: `src/ui/shortcuts/index.ts`, `src/features/slash-menu/slash-menu.view.ts`
  (remove `installSlashMenuKeys`, export `slashMenuKeys`),
  `src/features/format-toolbar/format-toolbar-keys.view.ts` (arrow keys,
  Home, End and Escape move to an `@keydown` on the toolbar element in
  `format-toolbar.view.ts`; export `formatToolbarKeys` for Alt+F10),
  `src/app/bootstrap.ts`
- Test: `src/ui/shortcuts/scoped-keys.test.ts`, `src/features/slash-menu/slash-menu.test.ts`

**Interfaces:**
- Produces:

```ts
export interface ScopedKeyContext {
  readonly state: AppState;
  readonly dispatch: Dispatch;
  readonly event: KeyboardEvent;
}
export interface ScopedKeys {
  // True while these keys apply, such as while the slash menu is open.
  readonly isActive: (state: AppState) => boolean;
  // Keyed by `KeyboardEvent.key`, with "Alt+" prefixed when Alt is held.
  readonly keys: Readonly<Record<string, (context: ScopedKeyContext) => void>>;
}
export function matchScopedKey(
  scopes: readonly ScopedKeys[],
  state: AppState,
  event: KeyStroke,
): ((context: ScopedKeyContext) => void) | undefined;
export function installScopedKeys(
  store: AppStore,
  dispatch: Dispatch,
  scopes: readonly ScopedKeys[],
): void; // one capture-phase keydown listener on document
```

- [ ] **Step 1: Write failing tests**: `matchScopedKey` returns the handler
  of the first active scope for "ArrowDown"; returns undefined when no scope
  is active; returns undefined while `isComposing`; "Alt+F10" matches only
  with `altKey`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** and move the slash menu
  and Alt+F10 handlers into `ScopedKeys` values; bootstrap calls
  `installScopedKeys(store, dispatch, [slashMenuKeys, formatToolbarKeys])`.
- [ ] **Step 4: Run** → PASS; `grep -rn 'document.addEventListener("keydown"' src`
  → only `src/app/bootstrap.ts` and `src/ui/shortcuts/scoped-keys.ts` (and
  the drag owner's Escape in `src/ui/drag/pointer-drag.ts`).
- [ ] **Step 5: Verify in the app**: "/" opens the menu, arrows and Enter
  insert; Alt+F10 focuses the toolbar.
- [ ] **Step 6: Commit** `refactor(ui): own scoped keys in the shortcuts folder`

### Task 11.5: One writer across tabs; persistent storage

**Files:**
- Create: `src/persistence/tab-lock.ts`
- Modify: `src/persistence/workspace-repository.ts`, `src/persistence/index.ts`,
  `src/state/app-state.ts` (`PersistenceState.isReadOnly: boolean`),
  `src/state/dispatch.ts`, `src/state/persistence.commands.ts`,
  `src/app/shell.view.ts`, `src/ui/copy/workspace-text.ts`
- Test: `src/persistence/tab-lock.test.ts`, `src/state/dispatch.test.ts`

**Interfaces:**
- Produces:
  - `acquireWriterLock(locks: LockManagerLike): Promise<"writer" | "reader">`
    — requests `navigator.locks.request("pagecraft-writer", { ifAvailable: true }, …)`
    and holds it for the page's life when granted.
  - Command `persistence.setReadOnly` `{ isReadOnly: boolean }`.
  - Dispatch error `{ kind: "read-only" }` for any effect that changes the
    workspace while `persistence.isReadOnly` is true.
  - `BroadcastChannel("pagecraft")` message `{ type: "saved" }` after each
    flush; a reader reloads its workspace from storage on it.
  - `requestPersistentStorage(): Promise<boolean>` calling
    `navigator.storage.persist()` once after the first save.

- [ ] **Step 1: Write failing tests**: with a fake lock manager that is
  already held, `acquireWriterLock` resolves "reader"; with a free one,
  "writer"; a dispatch of `page.create` while read-only returns
  `{ ok: false, error: { kind: "read-only" } }` and leaves the state
  unchanged; ui-only commands still work while read-only.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement**; the shell shows the
  notice `COPY.workspace.readOnlyTab` ("This workspace is open in another
  tab. Close it to edit here.") in the top bar.
- [ ] **Step 4: Run** → PASS. **Step 5: Verify** with two tabs on
  localhost:5173: the second shows the notice and follows edits from the
  first after each save.
- [ ] **Step 6: Commit** `feat(persistence): keep one writer across tabs`

### Task 11.6: Invariants on every returned workspace

**Files:**
- Modify: `src/state/dispatch.ts:50-84`
- Test: `src/state/dispatch.test.ts`

**Interfaces:**
- Consumes: `findInvariantViolation(before, after, changedBlockIds)` from
  `src/model/`.
- Produces: an effect with `workspace` is checked against every block id of
  the new workspace; a violation returns `{ kind: "invariant-broken" }` and
  changes nothing.

- [ ] **Step 1: Write the failing test** "rejects a returned workspace whose
  child lists disagree with parent ids": a test command returns a workspace
  where block `b` has `parentId: "a"` but `a.childIds` is empty; expect
  `ok: false`, `error.kind === "invariant-broken"`, store unchanged.
- [ ] **Step 2: Run** `npx vitest run src/state/dispatch.test.ts` → FAIL.
- [ ] **Step 3: Implement** the check in `applyEffect`.
- [ ] **Step 4: Run** → PASS; seed, load and import tests still pass.
- [ ] **Step 5: Commit** `fix(state): check invariants on replaced workspaces`

### Task 11.7: Architecture fitness tests

**Files:**
- Create: `src/app/architecture.test.ts` (Node environment, reads `src/`
  with `node:fs`)

**Interfaces:** none.

- [ ] **Step 1: Write tests** that fail on a deliberate violation: every
  `*.view.ts` is free of `setTimeout`, `setInterval`, `queueMicrotask`,
  `requestAnimationFrame`; `document.addEventListener("keydown"` appears
  only in the files listed in task 11.4; every file under `src/features/`,
  `src/blocks/`, `src/ui/` is kebab-case; no file or folder uses a banned
  name; every non-index import into another top-level folder ends in
  `index.ts` or `ui/copy.ts`.
- [ ] **Step 2: Run** with one violation planted, expect FAIL; remove it,
  expect PASS; total test time stays under 10 s.
- [ ] **Step 3: Commit** `test(app): add architecture fitness tests`

---

## Milestone 12: Layout and chrome

### Task 12.1: Page layout metrics

**Files:** Modify `tokens/semantic.tokens.json` (`size.page.column`
45rem ≈ 708 px, `size.page.columnWide` 56rem, `size.cover.height` 30vh,
`size.page.icon` 4.875rem), `src/features/editor/editor.css`,
`src/features/editor/editor-cover.css`, `src/features/editor/editor-cover.view.ts`,
`src/features/editor/editor-icon.view.ts`; run `npm run tokens`.
Test: `src/features/editor/editor.test.ts`.

**Interfaces:** command `page.setCoverPosition` `{ pageId, position: number }`
(0 to 100, vertical focus of the image) in `src/blocks/page/page-cover.commands.ts`;
page props gain optional `coverPosition` (fold into version 5, task 12.2).

- [ ] Tests: "renders the cover outside the page column", "sets the cover
  position from Reposition", "the icon overlaps the cover when both exist".
- [ ] Standard cycle; commit `feat(editor): lay pages out like a document column`

### Task 12.2: Page style and small text (format version 5)

**Files:** Modify `src/blocks/page/page.schema.ts`, create
`src/persistence/migrations/0005-page-style.ts`, modify
`src/model/workspace.schema.ts` (`SCHEMA_VERSION = 5`),
`src/features/page-menu/page-menu.view.ts`, `src/features/editor/editor.view.ts`,
tokens `font.family.page.{default,serif,mono}`, `font.size.page.small`.
Test: `src/blocks/page/page.test.ts`, `src/persistence/migrations/run-migrations.test.ts`.

**Interfaces:** commands `page.setFont` `{ pageId, font: "default" | "serif" | "mono" }`,
`page.toggleSmallText` `{ pageId }`; the editor sets `data-font` and
`data-small-text` on the page root.

- [ ] Tests: "a version 4 file loads as version 5 with the default font",
  "setFont is undoable", "toggleSmallText flips the flag".
- [ ] Standard cycle; commit `feat(page): choose the page font and small text`

### Task 12.3: Top bar parity

**Files:** Modify `src/app/shell.view.ts`, `src/app/shell.css`, create
`src/features/page-info/` (`page-info.selectors.ts`, `page-info.view.ts`,
`page-info.css`, `index.ts`), one line in `src/app/bootstrap.ts`.
Test: `src/features/page-info/page-info.test.ts`.

**Interfaces:** `selectEditedLabel(state, pageId, now: string): string`
("Edited just now", "Edited 5m ago", "Edited Nov 3") from the latest
`updatedAt` in the page tree; `selectWordCount(state, pageId): { words: number; characters: number }`
using `Intl.Segmenter` word granularity; a favorite star button dispatching
`page.toggleFavorite`; shortcut Ctrl+Shift+L → `settings.setTheme` toggling
light and dark (registry entry).

- [ ] Tests: edited label buckets at 0 s, 59 s, 5 min, 2 days; word count
  of "Hello, world 👋" is 2 words, 14 characters; Ctrl+Shift+L matches.
- [ ] Standard cycle; commit `feat(page-info): show edit time, word count and favorite in the top bar`

### Task 12.4: Sidebar parity

**Files:** Modify `src/features/sidebar/*` (`sidebar.view.ts`,
`sidebar-row.view.ts`, `sidebar.css`), `src/ui/icon/` (add `page` and
`home` glyphs drawn for Pagecraft), copy in `workspace-text.ts`.
Test: `src/features/sidebar/sidebar.test.ts`.

**Interfaces:** sidebar order: header (workspace name, new page button),
Search (opens palette), Home, Settings; section "Favorites"; section
"Private" with the tree; footer New page, New database, Templates, Trash.
Rows without an icon show the `page` glyph (or a database glyph).

- [ ] Tests: "shows the page glyph for a page without an icon", "the Search
  item opens the command palette", "section titles are headings for screen
  readers".
- [ ] Standard cycle; commit `feat(sidebar): add the header, quick items and sections`

### Task 12.5: Context menus

**Files:** Create `src/ui/menu/context-menu.view.ts` (positions a popover
at the pointer or, from the keyboard, at the focused element); modify
`src/features/editor/editor-block-menu.view.ts`,
`src/features/sidebar/sidebar-row.view.ts`, `src/features/database/table.view.ts`.
Test: `src/ui/menu/context-menu.test.ts`, feature view tests.

**Interfaces:** overlay kinds `block-context`, `page-context`,
`row-context`, opened by `contextmenu` and by Shift+F10 or the Menu key,
with `anchorId` and `ui.overlay.point` `{ x: number; y: number }` (add to
`OpenOverlay`).

- [ ] Tests: "contextmenu on a block opens the block menu at the pointer",
  "Shift+F10 opens it at the block", "Escape returns focus to the block".
- [ ] Standard cycle; commit `feat(ui): open block, page and row menus on right click`

### Task 12.6: Empty page start and block placeholders

**Files:** Modify `src/features/editor/editor.view.ts`,
`src/features/editor/editor.css`, `src/ui/copy/editor-text.ts`.
Test: `src/features/editor/editor.test.ts`.

**Interfaces:** the focused empty paragraph shows the placeholder "Press '/'
for commands"; an empty page body lists Empty page, Table, Board, List,
Calendar, Templates; choosing a database kind dispatches `database.create`
inline (after 16.1, a full-page database before it).

- [ ] Tests: "placeholder only on the focused empty block", "choosing Board
  creates a database with a board view under this page".
- [ ] Standard cycle; commit `feat(editor): offer a start list on empty pages`

### Task 12.7: Home

**Files:** Create `src/features/home/` (`home.selectors.ts`,
`home.view.ts`, `home.css`, `index.ts`); modify `src/app/router.ts`
(route `#/home`), `src/state/app-state.ts` (`ui.recentPageIds: BlockId[]`,
at most 20, persisted with the ui keys in `src/state/ui.schema.ts`).
Test: `src/features/home/home.test.ts`, `src/app/router.test.ts`.

**Interfaces:** `selectRecentPages(state): PageBlock[]` (newest first,
skips trashed), `selectUpcoming(state, today: string): { pageId; date }[]`
from date properties in the next 7 days; `ui.setActivePage` records
recents.

- [ ] Tests: recents dedupe and cap at 20; trashed pages are skipped;
  upcoming lists dates from today to today + 7 inclusive, sorted.
- [ ] Standard cycle; commit `feat(home): add a home page with recents and upcoming dates`

---

## Milestone 13: Editor parity

### Task 13.1: Every Notion block prefix

**Files:** Modify `src/features/editor/block-shortcut.ts`.
Test: `src/features/editor/editor-convert.test.ts`.

**Interfaces:** `matchBlockShortcut` gains `"+"` bullet, `"a."`, `"i."`
numbered, `"\""` quote, `">"` toggle (design D13), triple backtick code,
`"[x]"` checked to-do, `"####"` heading 4 (after 13.5).

- [ ] Tests: one per prefix, each followed by a space, each converting and
  removing the prefix; `">"` now makes a toggle.
- [ ] Standard cycle; commit `feat(editor): accept every Notion block prefix`

### Task 13.2: Inline Markdown while typing

**Files:** Create `src/model/inline-markdown.ts`; modify
`src/features/editor/editor-input.view.ts`.
Test: `src/model/inline-markdown.test.ts`, `src/features/editor/editor-input.test.ts`.

**Interfaces:** `matchInlineMarkdown(text: string, caret: number): { start: number; end: number; mark: Mark } | undefined`
for `**x**` bold, `*x*` and `_x_` italic, `` `x` `` code, `~x~` and `~~x~~`
strikethrough, checked when the closing marker is typed; the edit becomes
one `text.replace` plus `text.toggleMark`, undone in one step.

- [ ] Tests: "**bold** becomes bold without the stars", "a lone * does
  nothing", "markers inside code are left alone", "nothing happens while
  composing" (Review Focus), "one undo restores the typed stars".
- [ ] Standard cycle; commit `feat(editor): format inline Markdown as you type`

### Task 13.3: Block keyboard parity

**Files:** Modify `src/ui/shortcuts/shortcut-registry.ts`,
`src/features/editor/editor-keys.view.ts`,
`src/features/editor/editor-selection.view.ts`; create
`src/features/editor/editor-keys.commands.ts` if a command is new.
Test: `src/features/editor/editor-selection.test.ts`, `src/ui/shortcuts/shortcut-registry.test.ts`.

**Interfaces:** Esc selects the caret's block; Ctrl+A selects the block's
text, a second press the whole page's blocks; Ctrl+D `block.duplicate` on
the selection; Ctrl+Shift+ArrowUp and ArrowDown `block.moveSelectedBy`;
Ctrl+Enter activates (to-do check, toggle open, page link open);
Ctrl+Alt+T opens or closes every toggle on the page (`toggle.setAllOpen`
`{ pageId, isOpen }`); Ctrl+/ opens the block menu; Ctrl+Shift+0 to 9 turn
into text, H1, H2, H3, to-do, bulleted, numbered, toggle, code, page
(design D14); Ctrl+Shift+H applies the last used color
(`ui.lastTone`).

- [ ] Tests: one per key, each asserting the command dispatched or the
  selection state.
- [ ] Standard cycle; update the shortcut reference (`src/features/shortcut-help/`);
  commit `feat(editor): add Notion's block keyboard shortcuts`

### Task 13.4: Block color (format version 6)

**Files:** Modify `src/blocks/text-block.ts` (shared optional
`color: Tone | "{tone}-background"`), each text block schema, migration
`0006-block-color.ts`, `src/features/editor/editor-block-menu.view.ts`
(Color submenu), `src/features/slash-menu/slash-menu.selectors.ts`
(`/red`, `/red background`, `/default`).
Test: `src/features/editor/editor-convert.test.ts`, `src/features/slash-menu/slash-menu.test.ts`.

**Interfaces:** command `block.setColor` `{ blockIds: BlockId[]; color: BlockColor | null }`.

- [ ] Tests: color survives convert between text types; `/blue background`
  sets the background tone; a version 5 file loads.
- [ ] Standard cycle; commit `feat(editor): color whole blocks`

### Task 13.5: Heading 4 and toggle headings (format version 7)

**Files:** `src/blocks/heading/*`, migration `0007-heading-toggle.ts`,
`src/features/editor/editor-blocks.view.ts` (children under a toggleable
heading), slash and turn-into entries.
Test: `src/blocks/heading/heading.test.ts`.

**Interfaces:** heading props `level: 1 | 2 | 3 | 4`, `isToggleable?: boolean`,
`isOpen?: boolean`; reuse `toggle.setOpen`.

- [ ] Tests: Tab under a toggle heading nests; closing hides children;
  table of contents lists level 4.
- [ ] Standard cycle; commit `feat(heading): add heading 4 and toggle headings`

### Task 13.6: Subpages inside the page

**Files:** Modify `src/features/editor/editor.selectors.ts:12` (stop
filtering page-like children), `src/features/editor/editor-blocks.view.ts`
(render a page-like child as a page row), `src/features/slash-menu/` ("Page").
Test: `src/features/editor/editor.test.ts`.

**Interfaces:** `/page` dispatches `page.create` with `parentId` and
`index` at the caret's block; deleting the row moves the page to trash
(`page.trash`); dragging the row moves it like a block.

- [ ] Tests: subpages appear at their `childIds` position; Enter on the row
  opens the page; Backspace on a selected row trashes it and undo restores it.
- [ ] Standard cycle; commit `feat(editor): show subpages where they sit in the page`

### Task 13.7: Mentions and page links (format version 8)

**Files:** Modify `src/model/rich-text.schema.ts` (span `mention?:
{ kind: "page"; pageId } | { kind: "date"; date: string; isReminder?: boolean }`),
migration `0008-mentions.ts`; create `src/features/mention-menu/`
(`mention-menu.selectors.ts`, `.view.ts`, `.css`, `index.ts`); modify
`src/ui/rich-text/rich-text-projection.ts`.
Test: `src/features/mention-menu/mention-menu.test.ts`, `src/model/rich-text.test.ts`.

**Interfaces:** typing `@` opens the menu with pages and dates ("Today",
"Tomorrow", "Next week", a typed date); `[[` opens pages first; `+` at the
start of a block opens "New subpage"; a mention renders the page's current
title and icon; `selectBacklinks(state, pageId): BlockId[]` lists blocks
that mention or link to the page (used in 17.5). A mention is one
indivisible character for caret math.

- [ ] Tests: renaming a page updates every mention; Backspace after a
  mention removes it whole; `@` while composing does nothing (Review Focus);
  Escape leaves a literal `@`.
- [ ] Standard cycle; commit `feat(mention-menu): mention pages and dates`

### Task 13.8: Emoji

**Files:** Create `scripts/build-emoji.ts` (reads a pinned copy of Unicode
`emoji-test.txt` in `scripts/data/`, writes `src/ui/emoji/emoji-data.generated.ts`),
`src/ui/emoji/` (`emoji-search.ts`, `emoji-picker.view.ts`, `emoji.css`,
`index.ts`); modify `src/features/editor/editor-icon.view.ts`,
`src/blocks/callout/callout.view.ts`, `package.json` (`npm run emoji`).
Test: `src/ui/emoji/emoji-search.test.ts`.

**Interfaces:** `searchEmoji(query: string, limit: number): Emoji[]` by
name and keywords; `:name` in text opens an inline list after two letters;
the picker has search, categories, "Random" and "Remove".

- [ ] Tests: ":smi" finds "😄"; ":" alone does nothing; nothing while
  composing (Review Focus); the generated module is under 250 lines per file
  or split by category.
- [ ] Standard cycle; commit `feat(ui): pick emoji by name and from a picker`

### Task 13.9: Structured copy and rich paste

**Files:** Create `src/model/block-clipboard.schema.ts` (the MIME type
`application/x-pagecraft-blocks`, parsed by schema), modify
`src/ui/rich-text/pasted-html.ts` (blocks, not lines),
`src/features/editor/editor-selection.view.ts` (copy writes text/plain,
text/markdown via the Markdown exporter, and the block payload),
`src/features/editor/editor-paste.view.ts`.
Test: `src/ui/rich-text/pasted-html.test.ts`, `src/features/editor/editor-paste-blocks.test.ts`.

**Interfaces:** `parsePastedHtmlBlocks(html: string): PastedBlock[]` for
h1 to h4, p, ul, ol (nested), li with checkbox, blockquote, pre, hr, img,
table, a; pasting a URL over selected text sets a link; pasting a URL into
an empty block opens a small menu: Link, Bookmark, Embed (after 14.7).

- [ ] Tests: copy then paste of a nested list keeps nesting and types; a
  pasted HTML table becomes a simple table (after 14.1, a list of lines
  before); script and style content never appear; 5,000 pasted lines finish
  in under 500 ms.
- [ ] Standard cycle; commit `feat(editor): copy blocks with their structure and paste web pages as blocks`

### Task 13.10: Moving blocks between pages

**Files:** Modify `src/features/editor/editor-move.commands.ts`
(`block.moveToPage` `{ blockIds, pageId }`), `src/features/move-to/` (reuse
the dialog for blocks), `src/ui/drag/pointer-drag.ts` (Alt duplicates),
`src/features/sidebar/sidebar-tree.view.ts` (drop target for blocks),
`src/features/editor/editor-block-menu.view.ts` ("Move to", "Turn into
page", "Copy link to block").
Test: `src/features/editor/editor-move.test.ts`.

**Interfaces:** `block.turnIntoPage` `{ blockId }` creates a page with the
block's text as title and its children as content; links to a block are
`#/page/<pageId>?block=<blockId>`; the router scrolls to and flashes it.

- [ ] Tests: moving keeps children; Alt-drop duplicates; turning into a
  page keeps undo in one step; the router focuses the linked block.
- [ ] Standard cycle; commit `feat(editor): move blocks to other pages`

### Task 13.11: Code block parity (format version 9)

**Files:** `src/blocks/code/` (`code.schema.ts`, `code.view.ts`,
`code.css`, create `code-tokenize.ts` and one grammar file per language
group, `code-highlight.view.ts`), migration `0009-code-options.ts`.
Test: `src/blocks/code/code-tokenize.test.ts`, `src/blocks/code/code.test.ts`.

**Interfaces:** props `language: string` (plain, javascript, typescript,
json, html, css, python, java, c, csharp, go, rust, sql, shell, markdown),
`isWrapped: boolean`, `caption: RichText`; `tokenize(language, text):
{ start: number; end: number; kind: TokenKind }[]`; highlighting registers
one `Highlight` per `TokenKind` in `CSS.highlights` with names
`code-keyword`, `code-string`, `code-number`, `code-comment`,
`code-function`, `code-punctuation` (design D5), styled in `code.css` with
tokens; copy button writes the text.

- [ ] Tests: tokenizer cases per language (keyword, string with escaped
  quote, line and block comment, number); highlighting does not change the
  block's DOM text; typing in a 300-line code block stays under 16 ms.
- [ ] Standard cycle; commit `feat(code): highlight code by language`

### Task 13.12: Callout, image and list details (format version 10)

**Files:** `src/blocks/callout/*` (color, icon via emoji picker),
`src/blocks/image/*` (`width` 10 to 100 percent with resize handles and
arrow keys, `align` left, center, right, full screen view in a `<dialog>`),
`src/blocks/numbered-list/numbered-list.view.ts` (1, a, i by depth),
`src/blocks/to-do/to-do.css` (checked text struck and muted), migration
`0010-display-options.ts`.
Test: each block's test file.

- [ ] Tests: nested numbering shows "a." at depth 2 and "i." at depth 3;
  image width clamps to 10 to 100; full screen opens and Escape closes.
- [ ] Standard cycle; commit `feat(blocks): add callout colors, image sizing and list styles`

---

## Milestone 14: New blocks and files

### Task 14.1: Simple table block

**Files:** Create `src/blocks/simple-table/` (`simple-table.schema.ts`,
`.definition.ts`, `.view.ts`, `.commands.ts`, `.css`, `.test.ts`,
`index.ts`), one line in `block-registry.ts`.

**Interfaces:** props `rows: RichText[][]`, `hasHeaderRow: boolean`,
`hasHeaderColumn: boolean`; commands `simpleTable.setCell`,
`simpleTable.insertRow`, `simpleTable.insertColumn`, `simpleTable.removeRow`,
`simpleTable.removeColumn`, `simpleTable.toggleHeader`; Tab and Shift+Tab
move between cells, Enter adds a row at the end.

- [ ] Tests: insert and remove keep a rectangle; Tab past the last cell
  adds a row; Markdown export writes a pipe table.
- [ ] Standard cycle; commit `feat(simple-table): add the simple table block`

### Task 14.2: Columns

**Files:** Create `src/blocks/column-list/` and `src/blocks/column/`;
modify `src/ui/drag/pointer-drag.ts` (left and right drop zones),
`src/features/editor/editor-blocks.view.ts`.

**Interfaces:** a `column-list` holds 2 to 5 `column` children with
`ratio` props summing to 1; dropping a block on the side of another wraps
both in a column list; a column left with no blocks is removed in the same
transaction; keyboard path: block menu "Move to new column".

- [ ] Tests: drop on the right makes two columns; emptying one column
  unwraps the list; ratios stay summed to 1 after resize.
- [ ] Standard cycle; commit `feat(blocks): add columns`

### Task 14.3: Equations (format version 11)

**Files:** Create `src/model/tex/` (`tex-tokenize.ts`, `tex-parse.ts`,
`tex-tree.ts`, `index.ts`: no DOM), `src/blocks/equation/` (block),
`src/ui/rich-text/equation.view.ts` (`mathml` tag), rich text span
`equation?: string`, migration `0011-equations.ts`; amend
`docs/decisions/0001-rendering.md` to allow `mathml`.
Test: `src/model/tex/tex-parse.test.ts`, `src/blocks/equation/equation.test.ts`.

**Interfaces:** `parseTex(source: string): { ok: true; tree: MathNode } | { ok: false; error: string; offset: number }`
covering `\frac`, `^`, `_`, `\sqrt`, Greek letters, `\sum`, `\int`,
`\prod`, `\lim`, `\left( \right)`, `\begin{matrix}`, `\text{}`, operators
and relations; unknown commands render as red source text; inline equation
from `/equation` or Ctrl+Shift+E on selected text.

- [ ] Tests: `\frac{a}{b}` → mfrac; `x^2_i` → msubsup; an unclosed brace
  reports its offset; rendering produces `<math>` with no innerHTML.
- [ ] Standard cycle; commit `feat(equation): render TeX equations with MathML`

### Task 14.4: Breadcrumb block

**Files:** Create `src/blocks/breadcrumb/`; reuse `selectBreadcrumbs`.

- [ ] Tests: shows the trail of the page it sits in; updates on rename.
- [ ] Standard cycle; commit `feat(breadcrumb): add the breadcrumb block`

### Task 14.5: Asset store (format version 12)

**Files:** Create `src/persistence/asset-store.ts`, `src/model/asset.schema.ts`;
modify `src/persistence/indexed-db-adapter.ts` (object store `assets`,
database version bump), `src/persistence/workspace-file.ts` (export and
import `assets: { id, type, name, size, data: base64 }[]`),
`src/blocks/image/image.view.ts` (no `FileReader` in the view: dispatch
`asset.add` with the `File`, an ephemeral payload handled by persistence),
migration `0012-assets.ts` (moves `data:` image sources into assets).
Test: `src/persistence/asset-store.test.ts`, `src/persistence/workspace-file.test.ts`.

**Interfaces:** `AssetId` branded id; `saveAsset(file: Blob, name): Promise<{ ok: true; id: AssetId } | { ok: false; error: "too-large" | "quota-exceeded" | "unreadable" }>`
(limit 50 MB, design D6); `assetUrl(id): string` (object URL cache owned by
`src/ui/asset/`); CSP `img-src`, `media-src`, `frame-src` gain `blob:`.

- [ ] Tests: export then import round-trips bytes; a version 11 file with a
  data address image becomes an asset; quota error leaves no block and
  shows `COPY.editor.assetQuota` (Review Focus).
- [ ] Standard cycle; commit `feat(persistence): store files as assets`

### Task 14.6: File, PDF, video and audio blocks

**Files:** Create `src/blocks/file/`, `src/blocks/pdf/`,
`src/blocks/video/`, `src/blocks/audio/` (props `source: { kind: "asset"; assetId } | { kind: "url"; url }`,
`caption`); native `<video controls>`, `<audio controls>`, PDF in a
sandboxed `<iframe>` of a blob URL; file shows name, size and a download
button through `src/ui/download/`.

- [ ] Tests: each block renders from an asset and from a URL; a non-https
  URL is refused; captions edit.
- [ ] Standard cycle; commit `feat(blocks): add file, PDF, video and audio blocks`

### Task 14.7: Embed block

**Files:** Create `src/blocks/embed/` with `embed-hosts.ts` (allow-list:
youtube.com, youtube-nocookie.com, player.vimeo.com, figma.com,
loom.com, codepen.io, google.com/maps, docs.google.com, open.spotify.com,
soundcloud.com, twitter.com and x.com through publish frames); modify the
CSP in `vite.config.ts` (`frame-src` lists exactly those hosts).
Test: `src/blocks/embed/embed.test.ts`.

**Interfaces:** `toEmbedUrl(url: string): string | undefined` turns a
watch URL into its embed URL; iframes carry `sandbox="allow-scripts allow-same-origin allow-popups"`,
`referrerpolicy="strict-origin-when-cross-origin"`, `loading="lazy"`.

- [ ] Tests: a YouTube watch URL maps to `youtube-nocookie.com/embed/<id>`;
  a host off the list is refused with a message; resizable height.
- [ ] Standard cycle; commit `feat(embed): embed pages from allowed hosts`

### Task 14.8: Synced block

**Files:** Create `src/blocks/synced-block/` (`original` holds children;
`reference` props `{ sourceId }` renders the source's children editable in
place).

**Interfaces:** commands `syncedBlock.create`, `syncedBlock.copyReference`,
`syncedBlock.unsync` (copies the children into a normal block); deleting
the original turns references into unsynced copies in the same
transaction.

- [ ] Tests: an edit through a reference changes the original; unsync
  keeps the content; deleting the original keeps references' content.
- [ ] Standard cycle; commit `feat(synced-block): add synced blocks`

### Task 14.9: Button block

**Files:** Create `src/blocks/button/` (props `label`, `actions:
ButtonAction[]` where `ButtonAction` is `{ kind: "insert-blocks"; blocks: BlockTemplate[] } | { kind: "add-row"; databaseId; values } | { kind: "open-page"; pageId }`).

- [ ] Tests: pressing inserts a copy of the template blocks below; add-row
  creates a row with the values; actions run in one transaction and one
  undo.
- [ ] Standard cycle; commit `feat(button): add the button block`

---

## Milestone 15: Database properties

### Task 15.1: Property config contract (format version 13)

**Files:** Modify `src/blocks/database/database.schema.ts` (property
`config?: unknown` parsed through the property registry, like block props),
`src/features/database/property-definition.ts` (`configSchema`,
`defaultConfig`, `renderConfigEditor`), migration `0013-property-config.ts`.
Test: `src/features/database/property-registry.test.ts`.

- [ ] Tests: a property with an invalid config for its type is skipped and
  counted, never crashes; a version 12 file loads.
- [ ] Standard cycle; commit `feat(database): give each property type its own config`

### Task 15.2: Status property

**Files:** Create `src/features/database/properties/status/`.

**Interfaces:** config `{ groups: { id; name: "To-do" | "In progress" | "Complete"; optionIds: string[] }[] }`;
options as select; board groups by status by default.

- [ ] Tests: a new status property has Not started, In progress, Done in
  the three groups; filter "is in group Complete".
- [ ] Standard cycle; commit `feat(database): add the status property`

### Task 15.3: Options, number formats and dates (format version 14)

**Files:** `properties/select`, `properties/multi-select` (rename, recolor,
reorder, delete options; deleting removes the value from rows in the same
transaction), `properties/number` (config `format`: number, comma,
percent, currency code from `Intl.supportedValuesOf("currency")` subset,
`display`: number, bar, ring, with `divideBy`), `properties/date` (config
`dateFormat`, `timeFormat`; the value becomes `{ start; end?; time? }`,
migration `0014-date-ranges.ts` turns each `"YYYY-MM-DD"` string into
`{ start }`), property `description`.

- [ ] Tests: 0.256 shows "25.6%"; 1234.5 in BRL for locale pt-BR shows
  "R$ 1.234,50" (a no-break space, as `Intl.NumberFormat` writes it);
  a version 13 date string loads as `{ start }`; deleting an option clears it from rows; a date range filter
  "is within the past week".
- [ ] Standard cycle; commit `feat(database): edit options and format numbers and dates`

### Task 15.4: Files and media, unique ID

**Files:** Create `properties/files/` (value `AssetId[] | url[]`),
`properties/unique-id/` (config `{ prefix: string; next: number }`; ids
assigned by `row.add` from `next`, never reused).

- [ ] Tests: unique ids increase across adds and survive deletes; files
  cell shows thumbnails for images.
- [ ] Standard cycle; commit `feat(database): add files and unique ID properties`

### Task 15.5: Relation

**Files:** Create `properties/relation/` (config `{ databaseId; isTwoWay; inversePropertyId? }`,
value `BlockId[]`), `relation.commands.ts` (`relation.setValue` updates
both sides in one transaction, design D8).

- [ ] Tests: adding a relation on A shows it on B's inverse; removing a
  page drops it from both; a trashed related page is hidden and a deleted
  one removed (Review Focus); a deleted related database turns the
  property into text with the titles.
- [ ] Standard cycle; commit `feat(database): add the relation property`

### Task 15.6: Rollup

**Files:** Create `properties/rollup/` (config `{ relationPropertyId; targetPropertyId; function }`,
computed by `selectRollup(state, rowId, property)`).

**Interfaces:** functions show original, show unique, count all, count
values, count unique, count empty, count not empty, percent empty, percent
not empty, sum, average, median, min, max, range, earliest date, latest
date, date range, checked, unchecked, percent checked, percent unchecked.

- [ ] Tests: one per function on a fixture of 5 related rows; missing
  related rows ignored (Review Focus).
- [ ] Standard cycle; commit `feat(database): add the rollup property`

### Task 15.7: Formula

**Files:** Create `properties/formula/` (`formula-tokenize.ts`,
`formula-parse.ts` (Pratt), `formula-check.ts` (types: number, text,
boolean, date, list), `formula-evaluate.ts`, `formula-functions.ts`,
`formula.definition.ts`, `formula-editor.view.ts`) (design D7).

**Interfaces:** `compileFormula(expression, properties): { ok: true; program } | { ok: false; error; offset }`;
`evaluateFormula(program, row, context): FormulaValue | { error: string }`;
functions: `prop`, `if`, `ifs`, `and`, `or`, `not`, `empty`, `length`,
`contains`, `concat`, `join`, `lower`, `upper`, `replace`, `replaceAll`,
`slice`, `format`, `toNumber`, `round`, `floor`, `ceil`, `abs`, `min`,
`max`, `sum`, `mod`, `pow`, `sqrt`, `now`, `today`, `dateAdd`,
`dateSubtract`, `dateBetween`, `formatDate`, `year`, `month`, `day`, `map`,
`filter`, `at`, `first`, `last`; operators `+ - * / % ^ == != < <= > >=`,
`&&`, `||`, `!`, ternary through `if`.

- [ ] Tests: precedence of `1 + 2 * 3 ^ 2`; `prop("Due")` date math;
  self reference and a two-formula cycle give "Circular reference";
  `1 / 0` gives an error value; text plus number concatenates as Notion
  does; evaluation of 5,000 rows under 50 ms (Review Focus).
- [ ] Standard cycle; commit `feat(database): add the formula property`

### Task 15.8: Button property

**Files:** Create `properties/button/` (config `actions: { kind: "set-values"; values } | { kind: "open-page" }[]`).

- [ ] Tests: pressing sets the values on its row in one undo step.
- [ ] Standard cycle; commit `feat(database): add the button property`

---

## Milestone 16: Database views

### Task 16.1: Inline databases and linked views (format version 15)

**Files:** `src/blocks/database/` (`isInline` prop; an inline database
renders inside the parent page body), create `src/blocks/linked-view/`
(props `{ databaseId; viewIds }`, its own views over another database),
`src/features/database/database.view.ts` (compact header for inline use).

- [ ] Tests: `/table` inline creates a database child at the caret;
  a linked view filters without changing the source's views; deleting the
  source shows "Database not found".
- [ ] Standard cycle; commit `feat(database): place databases inline and link views`

### Task 16.2: Filter groups (format version 16)

**Files:** `src/model/view.schema.ts` (`filter: FilterGroup` where
`FilterGroup = { conjunction: "and" | "or"; items: (Filter | FilterGroup)[] }`,
depth at most 2; `operator` a picklist per property type), migration
`0016-filter-groups.ts` (moves `filters` into an `and` group),
`src/features/database/view-filters.view.ts`, `table-model.selectors.ts`.

- [ ] Tests: a version 15 view with two filters loads as an `and` group of
  two; `or` group matches either; unknown operator fails parse and is
  skipped.
- [ ] Standard cycle; commit `feat(database): group filters with and and or`

### Task 16.3: Grouping (format version 17)

**Files:** `view.schema.ts` (`groupBy?: { propertyId; sort; hideEmpty; collapsed: string[] }`,
`subGroupBy?` for board), `table.view.ts`, `layouts/list`,
`layouts/gallery`, `layouts/board`.

- [ ] Tests: group by select, status, multi-select (row in each group),
  checkbox, date (by day, week, month); collapse persists; 5,000 grouped
  rows render under the table budget.
- [ ] Standard cycle; commit `feat(database): group rows in every layout`

### Task 16.4: Calculations (format version 18)

**Files:** `view.schema.ts` (`calculations: Record<PropertyId, CalculationKind>`),
create `src/features/database/calculations.selectors.ts` (reuses the
rollup function set from 15.6), footer row in `table.view.ts`, group
headers.

- [ ] Tests: sum, average, median, percent checked on a fixture; respects
  filters; per group in grouped tables.
- [ ] Standard cycle; commit `feat(database): calculate columns in the footer`

### Task 16.5: Table power features (format version 19)

**Files:** `table.view.ts`, `table-keys.view.ts`, `row.commands.ts`
(`row.deleteMany`, `row.duplicateMany`, `row.setValueMany`, `row.move`
for manual order when no sort), `view.schema.ts` (`wrappedPropertyIds`,
`frozenCount`).

- [ ] Tests: selection checkbox and Shift+click range; bulk edit sets a
  value on all selected rows in one undo step; Ctrl+D fills down; frozen
  columns stay with `position: sticky`; drag reorder only without sorts.
- [ ] Standard cycle; commit `feat(database): select, bulk edit and order rows`

### Task 16.6: Board and cards (format version 20)

**Files:** `layouts/board/*`, `layouts/row-card/*`, `view.schema.ts`
(`groupOrder`, `hiddenGroups`, `groupColors`, `cardSize: "small" | "medium" | "large"`,
`cardPreview: "none" | "cover" | "content" | PropertyId`, `cardPropertyIds`).

- [ ] Tests: reorder cards within a column (manual order) by drag and
  Alt+Up/Down; move a column; hide a column; group by checkbox and date.
- [ ] Standard cycle; commit `feat(board): order cards and style columns`

### Task 16.7: Calendar options (format version 21)

**Files:** `layouts/calendar/*`, `view.schema.ts` (`calendarMode: "month" | "week"`,
`showWeekends`, `weekStartsOn: 0 | 1`).

- [ ] Tests: week view shows 7 days; ranges span days; weekends hidden.
- [ ] Standard cycle; commit `feat(calendar): add week view and calendar options`

### Task 16.8: Timeline view (format version 22)

**Files:** Create `layouts/timeline/` (`timeline.selectors.ts`,
`timeline.view.ts`, `timeline.css`), `view.schema.ts` view type
`timeline` with `timeline: { startPropertyId; endPropertyId?; zoom: "day" | "week" | "month" | "quarter" | "year"; showTable: boolean }`.

- [ ] Tests: bar position and width from dates at each zoom; drag and
  Alt+Arrow move and resize; rows without dates listed apart.
- [ ] Standard cycle; commit `feat(timeline): add the timeline view`

### Task 16.9: Chart view (format version 23)

**Files:** Create `layouts/chart/` (SVG through lit `svg`), options
`chart: { kind: "bar" | "column" | "line" | "donut"; groupBy; aggregate; propertyId? }`.

- [ ] Tests: aggregates per group; a data table alternative for screen
  readers; colors from tokens only.
- [ ] Standard cycle; commit `feat(chart): add the chart view`

### Task 16.10: Form view (format version 24)

**Files:** Create `layouts/form/` (questions from visible properties,
required flags in `form: { requiredPropertyIds; description }`).

- [ ] Tests: submit creates a row with the answers; a required empty
  answer blocks submit with an error tied to the field.
- [ ] Standard cycle; commit `feat(form): add the form view`

### Task 16.11: Feed view (format version 25)

**Files:** Create `layouts/feed/` (each row as a page preview with its
first blocks).

- [ ] Tests: shows the first 5 blocks of each row page; opens the row.
- [ ] Standard cycle; commit `feat(feed): add the feed view`

### Task 16.12: Peek (format version 26)

**Files:** Create `src/features/row-peek/`; `view.schema.ts`
(`openMode: "side" | "center" | "full"`); shortcuts Ctrl+J and Ctrl+K
inside a peek go to the next and previous row (scoped keys, task 11.4).

- [ ] Tests: opening a row in side peek keeps the database visible; focus
  moves into the peek and returns on close; next and previous follow the
  view's order.
- [ ] Standard cycle; commit `feat(row-peek): open rows in side and center peek`

### Task 16.13: Row templates (format version 27)

**Files:** `src/blocks/database/` (`templateIds`, `defaultTemplateId`;
templates are pages under the database flagged `isTemplate`), `row.add`
applies a template by copying with `copyBlockTree`.

- [ ] Tests: new rows use the default template; templates are hidden from
  views; duplicating a template.
- [ ] Standard cycle; commit `feat(database): add row templates`

### Task 16.14: CSV import and export

**Files:** Create `src/persistence/csv.ts` (RFC 4180 reader and writer),
`src/model/csv-import.schema.ts`, features in `src/features/database/`
(import into a new database, export the current view).

- [ ] Tests: quoted commas and newlines round-trip; column types guessed
  (number, date, checkbox, select under 20 distinct values, else text).
- [ ] Standard cycle; commit `feat(database): import and export CSV`

### Task 16.15: Locks (format version 28)

**Files:** page props `isLocked`, view `isLocked`; editor and database
views read-only while locked.

- [ ] Tests: typing in a locked page does nothing and announces why;
  unlocking restores editing; a locked view refuses filter changes.
- [ ] Standard cycle; commit `feat(page): lock pages and views`

---

## Milestone 17: Workspace tools

### Task 17.1: Search parity

**Files:** `src/features/command-palette/*`, shortcut Ctrl+P.

- [ ] Tests: empty query lists recents; matches in body text show the
  block snippet and open the page scrolled to it; filter "Title only".
- [ ] Standard cycle; commit `feat(command-palette): add recents and block results`

### Task 17.2: Templates

**Files:** Create `src/features/templates/` (built-in templates as seed
trees like onboarding: Meeting notes, To-do list, Journal, Docs, Project
tracker, Reading list; "Save as template" stores a page under a hidden
templates root).

- [ ] Tests: using a template copies it with new ids; saved templates list.
- [ ] Standard cycle; commit `feat(templates): add a template gallery`

### Task 17.3: Page history

**Files:** Create `src/persistence/snapshot-store.ts` (object store
`snapshots`, one snapshot per page per 10 minutes of edits, 50 per page),
`src/features/page-history/`.

- [ ] Tests: snapshots are taken on the cadence and capped; restore is one
  undoable command; preview is read-only.
- [ ] Standard cycle; commit `feat(page-history): keep and restore page versions`

### Task 17.4: Comments (format version 29)

**Files:** `src/model/` (record kind `comment`: `{ id, pageId, blockId?, range?, text, createdAt, isResolved }`),
operations on the new kind, rich text mark `comment` with an id, create
`src/features/comments/`; shortcut Ctrl+Shift+M.

- [ ] Tests: comment on selected text highlights it; resolve hides it;
  deleting the block removes its comments in the same transaction.
- [ ] Standard cycle; commit `feat(comments): comment on pages and text`

### Task 17.5: Backlinks and page options

**Files:** Create `src/features/backlinks/` (uses `selectBacklinks` from
13.7); page menu "Customize page" (show backlinks: expanded, popover, off;
show comments: default, minimal).

- [ ] Tests: count updates when a mention is added or removed.
- [ ] Standard cycle; commit `feat(backlinks): show pages that link here`

### Task 17.6: Import and export

**Files:** Create `src/persistence/zip-writer.ts` (stored ZIP with CRC-32,
design D12), `src/features/markdown-import/`; extend
`src/features/markdown-export/` (page with subpages as a ZIP; HTML export),
print stylesheet in `src/styles/print.css`.

- [ ] Tests: a ZIP opens in the platform unzip (fixture bytes); Markdown
  import of a folder rebuilds the tree; print hides the chrome.
- [ ] Standard cycle; commit `feat(markdown-export): export and import page archives`

### Task 17.7: Navigation keys

**Files:** `src/ui/shortcuts/shortcut-registry.ts`.

**Interfaces:** Ctrl+N new page, Ctrl+[ back, Ctrl+] forward, Ctrl+L copy
link, Ctrl+Shift+U parent page.

- [ ] Tests: one per key; the shortcut reference lists every key.
- [ ] Standard cycle; commit `feat(ui): add Notion's navigation shortcuts`

### Task 17.8: Reminders and inbox

**Files:** Create `src/features/inbox/` (reminders from date mentions with
`isReminder` and date properties with reminders; `Notification` shown
while the app is open, permission asked on the first reminder only).

- [ ] Tests: due reminders appear in the inbox; marking read persists;
  no permission prompt without a reminder.
- [ ] Standard cycle; commit `feat(inbox): remind about dates`

### Task 17.9: Trash parity

**Files:** `src/features/trash/*` (search, filter by parent, automatic
deletion after 30 days as a setting, on load).

- [ ] Tests: pages older than 30 days are removed on load when enabled;
  search filters by title.
- [ ] Standard cycle; commit `feat(trash): search the trash and empty it after 30 days`

---

## Milestone 18: Quality at the new scale

### Task 18.1: Performance

- [ ] Re-run the typing benchmark on 1,000 mixed blocks including code,
  tables, columns and equations; under 16 ms median.
- [ ] 5,000-row table with grouping, calculations, two formulas and a
  rollup: sort and filter under 100 ms.
- [ ] Bundle under 400 kB script before compression; lazy-load the emoji
  data and the TeX module with dynamic `import()`.
- [ ] Commit `perf: hold the budgets at the new scale`

### Task 18.2: Accessibility and audits

- [ ] axe-core run (installed with `--no-save`, then `npm prune`) on every
  new surface in both themes: zero violations.
- [ ] Keyboard-only walk through every new feature; record in `docs/tasks.md`.
- [ ] Commit `fix: close audit findings for version 2`

## Milestone 19: Small screens and offline install

### Task 19.1: Layouts under 768 px

- [ ] Sidebar becomes an overlay drawer; page column has 16 px gutters;
  tables scroll horizontally inside their block; tests for the drawer's
  focus trap.
- [ ] Commit `feat(app): support small screens`

### Task 19.2: Installable and offline

- [ ] `public/manifest.webmanifest`, `src/app/service-worker.ts` built by
  Vite as a separate entry, cache-first for the app shell, CSP
  `worker-src 'self'`; update prompt when a new version is ready.
- [ ] Commit `feat(app): install as an app that works offline`

## Milestone 20: Release

- [ ] Specification, architecture, ownership, README, design system and
  `docs/tasks.md` brought in line with the code; ADR status updated.
- [ ] Final `npm run verify`, build, audits; push the branch.
- [ ] Commit `docs: describe version 2`
