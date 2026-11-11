# Notion parity: analysis and design

**Status:** Decided on 2026-11-11 under the owner's standing delegation
("decide yourself, always with the best option", 2026-11-10).
**Asked for by:** the owner, 2026-11-11: the app must have the features,
layout and interactivity of Notion; analyse what exists and what is missing,
check the architecture contract, and plan the work.
**Plan:** `docs/superpowers/plans/2026-11-11-notion-parity.md`.

## 1. Intent

Pagecraft should feel like Notion to someone who uses Notion every day:
the same building blocks, the same keyboard and Markdown habits, the same
database power, and the same calm page layout. It stays what the
specification made it: one person, one browser, no server, data in
IndexedDB, one JSON file to move it.

**Goals**

- Every Notion feature that one person can use alone, offline, is present.
- Notion's keyboard and Markdown shortcuts work as written in Notion's own
  help page (`notion.com/help/keyboard-shortcuts`, read 2026-11-11).
- Layout and interaction follow Notion's patterns: sidebar, centered page
  column, full-bleed cover, hover handles, peeks, context menus.
- The architecture contract (`CLAUDE.md`, specification section 2) holds
  for every line, and the gaps found by the audit in section 5 are closed
  first.

**Non-goals** (need a server, other people, or Notion's own services)

Real-time collaboration, sharing, permissions, guests, publishing to the
web, notifications to other people or devices, sync, AI features,
integrations and the public API, link previews that need a server to fetch
page metadata, transcription, the people, created by, last edited by and
verification properties (one user makes them constant), the map view and
place property (they need a map tile service), multiple workspaces.

**Anti-goals** (would be a failure even if it worked)

- A copy of Notion's brand: its name, logo, icons, illustrations, fonts or
  wording. Pagecraft keeps its own name, icon set, tokens and copy; it
  follows Notion's interaction patterns, not its trade dress.
- A sixth runtime library to save effort. Every feature below is planned
  with the platform and the five libraries; the two that tempt a library
  (equations, code highlighting) have platform answers (section 6, D4, D5).
- Losing data: a feature that can corrupt the workspace, or two tabs that
  overwrite each other, is worse than the feature missing.

## 2. Sources

- Notion API reference through Context7 (`/websites/developers_notion_reference`):
  block types, property types, rich text mentions and equations, view types.
- Notion help, keyboard shortcuts page (Portuguese edition), read in the
  built-in browser on 2026-11-11.
- MDN through Context7 (`/mdn/content`): CSS Custom Highlight API, MathML.
- lit-html 3.3.3 as installed: exports a `mathml` tag
  (`node_modules/lit-html/lit-html.d.ts:314`).
- The code at commit `dd8eeb1` and the running app.

## 3. What Pagecraft has today

Version 1.1 at `dd8eeb1`: 290 source files, 68 test files, 628 tests,
`npm run verify` in 10 s, production build in 0.2 s (235 kB script, 61 kB
style before compression).

| Area | Present |
| --- | --- |
| Blocks (16) | Page, database, paragraph, heading 1 to 3, bulleted list, numbered list, to-do, toggle, quote, callout, code, divider, link to page, image (URL or file up to 5 MB), web bookmark, table of contents |
| Editing | `beforeinput` editing, split and merge, Tab indent, IME read-back, Markdown block prefixes (`#`, `##`, `###`, `-`, `*`, `1.`, `[]`, `>`, `---`), paste of Markdown and sanitized HTML as text, block selection by Shift+Arrow and pointer, block drag, "+" and block menu (add, duplicate, turn into, move up, move down, delete), slash menu, undo and redo |
| Inline | Bold, italic, underline, strikethrough, code, link, 8 text colors and 8 highlights; toolbar over selected text; Ctrl+B, I, U, E, K, Shift+S |
| Pages | Title, one-emoji icon, cover (6 gradients or image URL), full width, duplicate, move to, favorite, trash and restore, export as Markdown |
| Sidebar | Nested tree with ARIA tree keys, drag to move, favorites, hover "+" and "…", collapse and resize, trash |
| Databases | 11 property types (text, number, select, multi-select, date, checkbox, URL, email, phone, created time, last edited time); views table, board (by select), gallery, list, month calendar; sort, AND filters, row search, resize, reorder and hide columns, cell editing, 200-row windowing, saved views; rows open as pages |
| Workspace | Command palette with page title and text search, breadcrumbs, back and forward, shortcut reference, light, dark and system themes, settings, JSON export and import with 4 schema migrations, first-run tour and sample database |

Global shortcuts in the registry: Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y, Ctrl+\\,
Ctrl+K, Ctrl+, and Ctrl+Shift+/.

## 4. What is missing

Status: **Partial** means the feature exists with less than Notion offers;
**Missing** means it is absent. Rows marked out of scope in section 1 are
not repeated here. The milestone column points to the plan.

### 4.1 Layout and chrome

| Notion behavior | Pagecraft today | Status | Milestone |
| --- | --- | --- | --- |
| Page column about 708 px wide, 900 px or full with "Full width" | Column width from tokens; full width works | Partial | 12 |
| Cover bleeds across the whole main area, about 30 vh, with "Reposition" | Cover sits inside the column with rounded corners; no reposition | Partial | 12 |
| Large icon overlaps the bottom of the cover | Icon sits below the cover | Partial | 12 |
| Hover row over the title: Add icon, Add cover, Add comment | Add icon and Add cover only | Partial | 12, 17 |
| Page style: Default (sans), Serif, Mono; Small text | Serif title, no choice | Missing | 12 |
| Top bar: breadcrumbs, "Edited 5m ago", comments, favorite star, "…" | Breadcrumbs, "…", theme button | Partial | 12 |
| Sidebar header with workspace name and new page; Search, Home, Settings, Trash items; "Favorites" and "Private" section titles; a default page glyph for pages without an icon | Name and collapse button; New page, New database, Trash at the end; no section titles; blank where the icon is missing | Partial | 12 |
| Right-click context menus on blocks, sidebar rows and database rows | None | Missing | 12 |
| Empty page offers a start list (empty, table, board, list, calendar, templates) and a placeholder "Press '/' for commands" in the focused empty block | Placeholder "Type something"; no start list | Partial | 12 |
| Home: recent pages, favorites, upcoming dates | None | Missing | 12 |

### 4.2 Editing

| Notion behavior | Pagecraft today | Status | Milestone |
| --- | --- | --- | --- |
| Block prefixes `+`, `a.`, `i.`, `"` (quote), `>` (toggle), triple backtick (code), `[x]`, `####` | `>` makes a quote; the others are absent | Partial | 13 |
| Inline Markdown while typing: `**bold**`, `*italic*`, backtick code, `~strike~` | Only on paste | Missing | 13 |
| Esc selects the current block; Ctrl+A selects the block then the page | Esc clears; Ctrl+A is the browser's | Missing | 13 |
| Ctrl+D duplicate, Ctrl+Shift+Arrow move, Ctrl+Enter activate (check, open, expand), Ctrl+/ block menu, Ctrl+Alt+T all toggles, Ctrl+Shift+H last color, Ctrl+Shift+0 to 9 turn into | Alt+Arrow moves selected blocks; the rest absent | Missing | 13 |
| Block color and background for whole blocks; `/red`, `/red background`, `/default` | Inline colors only | Missing | 13 |
| Heading 4; toggle headings | Absent | Missing | 13 |
| A subpage is a block at its place in the parent page; `/page` creates one | Subpages are in `childIds` but the editor hides them; only the sidebar shows them | Partial | 13 |
| `@` mentions of pages and dates (today, tomorrow, a date), reminders; `[[` links; `+` new subpage | Absent | Missing | 13, 17 |
| `:name` emoji autocomplete; an emoji picker for icons | Icon is a typed emoji | Missing | 13 |
| Copy blocks with their structure; paste web HTML as blocks (headings, lists, tables, links, images) | Copy gives text lines; HTML paste gives text lines | Partial | 13 |
| Paste a URL over selected text makes a link; paste a URL in an empty block offers bookmark, embed or link | Absent | Missing | 13 |
| Alt+drag duplicates; drag a block onto a sidebar page moves it there; block "Move to" another page; "Turn into page"; "Copy link to block" | Drag reorders within a page | Partial | 13 |
| Code: language, syntax highlighting, wrap, copy button, caption | Plain monospace text | Partial | 13 |
| Callout icon and color; image width, alignment, full screen; nested numbered list styles (1, a, i) | Fixed callout look; image caption only | Partial | 13 |
| Word and character count of the page or the block selection | Absent | Missing | 12 |

### 4.3 Blocks

| Notion block | Status | Milestone |
| --- | --- | --- |
| Simple table with header row and header column | Missing | 14 |
| Columns (2 to 5, resizable) | Missing | 14 |
| Equation block and inline equation (TeX) | Missing | 14 |
| Breadcrumb block | Missing | 14 |
| File, PDF, video, audio (local file or address) | Missing | 14 |
| Embed (YouTube, Vimeo, Figma, Loom, CodePen, Google Maps and other allowed hosts) | Missing | 14 |
| Synced block | Missing | 14 |
| Button block that inserts blocks or adds a database row | Missing | 14 |
| Inline database and linked view of a database | Missing | 16 |

### 4.4 Database properties

| Notion property | Status | Milestone |
| --- | --- | --- |
| Status (groups To-do, In progress, Complete) | Missing | 15 |
| Option editing: rename, recolor, reorder, delete; property description | Partial (add only) | 15 |
| Number formats (comma, percent, currencies, bar, ring) | Missing | 15 |
| Date end, time, date format, relative dates | Partial (single day) | 15 |
| Files and media | Missing | 15 |
| Unique ID with prefix | Missing | 15 |
| Relation (one or two way) | Missing | 15 |
| Rollup (all Notion functions) | Missing | 15 |
| Formula | Missing | 15 |
| Button property (set values, open page) | Missing | 15 |

### 4.5 Database views and behavior

| Notion behavior | Status | Milestone |
| --- | --- | --- |
| Filter groups with AND and OR, typed operators | Partial (flat AND, operator is free text in the schema) | 16 |
| Group by in table, list and gallery; collapse, hide empty groups; board sub-groups | Missing | 16 |
| Column calculations (count, sum, average, median, min, max, range, percent checked, date range) | Missing | 16 |
| Row selection with bulk delete, duplicate and edit; manual row order by drag; wrap cells; freeze columns; fill down | Missing | 16 |
| Board: reorder within a column, column order, hide and color, card size and preview, group by status, multi-select, checkbox or date | Partial (move between select columns) | 16 |
| Gallery card preview and size; calendar week view, weekends, week start, multi-day ranges | Partial | 16 |
| Timeline view | Missing | 16 |
| Chart view (bar, column, line, donut) | Missing | 16 |
| Form view | Missing | 16 |
| Feed view | Missing | 16 |
| Open rows in side peek, center peek or full page; previous and next row | Partial (full page only) | 16 |
| Row templates and a default template | Missing | 16 |
| CSV import and export | Missing | 16 |
| Lock database, lock view | Missing | 16 |

### 4.6 Workspace

| Notion behavior | Status | Milestone |
| --- | --- | --- |
| Search on Ctrl+P and Ctrl+K with recent pages and filters | Partial (Ctrl+K, no recents) | 17 |
| Templates: built-in gallery and "Save as template" | Missing | 17 |
| Page history with preview and restore | Missing | 17 |
| Comments on a page and on selected text, resolve, Ctrl+Shift+M (one author, kept locally) | Missing | 17 |
| Backlinks | Missing | 17 |
| Lock page; customize page (show backlinks, comments) | Missing | 17 |
| Import Markdown, HTML and CSV; export Markdown or HTML archive; print to PDF | Partial (page Markdown export, workspace JSON) | 16, 17 |
| Ctrl+N new page, Ctrl+[ and Ctrl+] back and forward, Ctrl+L copy link, Ctrl+Shift+U parent page, Ctrl+Shift+L theme | Missing | 12, 17 |
| Reminders and an inbox (local, while the app is open) | Missing | 17 |
| Trash search and automatic emptying after 30 days | Partial | 17 |
| Two open tabs do not overwrite each other | Missing (no single-writer guard) | 11 |
| Ask the browser to keep the data (`navigator.storage.persist`) | Missing | 11 |
| Layouts under 768 px; install as an app that works offline | Out of scope in version 1 | 19 |

## 5. Architecture compliance audit

Checked on 2026-11-11 against `CLAUDE.md`, `.claude/rules/ui.md` and
specification sections 2 and 6, by `npm run verify` plus searches of the
source tree.

**Holds:** `setState(` only in `src/state/dispatch.ts`; `idb` and
`indexedDB` only in `src/persistence/`; Valibot only in `src/model/` and
`*.schema.ts`; no `JSON.parse` outside schemas; no `innerHTML`,
`unsafeHTML` or `insertAdjacentHTML`; no default exports; no banned file
names; no `TODO`; no module-level `let` in views; no classes; no type casts
outside the allowed files; every TypeScript file under 250 lines and every
CSS file under 220; ESLint, Stylelint and Prettier clean with zero
warnings; tests 1.4 s, verify 10 s, both inside budget.

**Findings**, most important first:

| # | Rule | Finding | Fix (plan task) |
| --- | --- | --- | --- |
| C1 | "Import other folders through their index.ts only" | `src/blocks/` has no `index.ts`; 30 imports of `blocks/block-registry.ts` and `blocks/text-block.ts` from `src/app/` and `src/features/` reach past it. Lint does not catch the case | Add `src/blocks/index.ts`, move the imports, add a lint pattern (11.2) |
| C2 | Same rule, inside one feature | `features/database/layouts/*` import `row.commands.ts`, `table-cell.view.ts`, `table-model.selectors.ts` and `property-registry.ts` of their parent feature (16 imports); block and property type folders import their parent's `block-definition.ts` and `property-definition.ts` (26 imports) | The second pattern is the designed contract. State the rule: a child folder may import its parent's modules, never the reverse except through the child's `index.ts`; add it to specification 2.4 (11.1) |
| C3 | "Global keys are registered in shortcut-registry.ts" | `slash-menu.view.ts:87` and `format-toolbar-keys.view.ts:49` add `keydown` listeners on `document` | Scoped shortcuts in the registry: an entry may carry `when(state)`; move both (11.4) |
| C4 | Views have "no timers" | `queueMicrotask` in `table-cell.view.ts:45` and `format-toolbar.view.ts:43` | Route both through `src/ui/focus/` (`afterRender`), which owns waiting for the render (11.3) |
| C5 | Specification 2.2 and `.claude/rules/state.md`: a handler returns `Operation[]`; a transaction that fails validation changes nothing | Handlers return `CommandEffect` (operations, ui, workspace, merge key); `architecture.md` says so, the specification and the rule file do not. Worse, an effect that carries a whole `workspace` skips `findInvariantViolation` (`src/state/dispatch.ts:58-61`), so a faulty load, import or seed could commit a broken tree | Check invariants on every returned workspace; update specification 2.2 and the rule file (11.1, 11.6) |
| C6 | Role suffixes are a closed list | 30 modules have no suffix (`block-definition.ts`, `text-block.ts`, `caret.ts`, `pointer-drag.ts`, …), while the specification itself names suffix-less owners (`store.ts`, `dispatch.ts`, `block-registry.ts`, `copy.ts`) | Clarify: the six suffixes mark those six roles; any other module is named for its concept without a suffix; test fixtures end in `-builder.ts` (11.1), checked by a fitness test (11.7) |
| C7 | `index.ts` holds "re-exports only, no logic" | `features/database/index.ts` and `features/editor/index.ts` gather command lists with spreads | Allow exactly one gathered `xCommands` list in a feature's `index.ts`, the composition bootstrap needs (11.1) |
| C8 | Views "no subscriptions"; I/O has owners | `blocks/image/image.view.ts` reads files with `FileReader`; images are stored as data addresses inside block props | The asset store becomes the owner of file reading and storage (14.5) |
| C9 | Data safety (quality target "reload restores the exact last state") | No guard against two tabs writing IndexedDB at once; storage persistence never requested | Single writer with Web Locks, other tabs read-only with a notice, `BroadcastChannel` refresh; `navigator.storage.persist()` (11.5) |
| C10 | Filters are parsed at the boundary | `filterSchema.operator` is `v.string()` and `value` is `v.unknown()` | Typed filter tree in schema version 8 (16.2) |
| C11 | ADR-0001 lists the lit-html exports allowed | Equations need `mathml` | Amend ADR-0001 in the equation task (14.3) |
| C12 | ADR-0010 and specification section 1 keep formulas, relations and rollups out of scope | This request brings them in | ADR-0011 widens the scope (11.1) |

Nothing found breaks the data flow: every write still goes through
`dispatch`, and the store remains the only home of state.

## 6. Approaches and decisions

### How to reach parity

- **A. Feature by feature in the current architecture (chosen).** Each
  Notion feature becomes a block folder, a property folder, a view layout
  or a feature folder, one slice at a time, with schema migrations for each
  format change. Keeps every rule, keeps the five libraries, keeps the 628
  tests meaningful. Slow but safe; every slice ships.
- **B. Adopt an editor framework (ProseMirror, Lexical, TipTap).** Faster
  for rich text features, but it replaces the store as the source of truth
  for text, breaks "one store, one dispatcher", adds large dependencies and
  throws away the editing work already verified. Rejected.
- **C. Rewrite on a UI framework.** Rejected for the same reasons and
  because the specification forbids it.

### Decisions

| # | Topic | Decision | Why |
| --- | --- | --- | --- |
| D1 | Scope | Notion features usable by one person offline are in scope (section 4); section 1 non-goals stay out | The owner asked for parity; the specification's local-first premise stays |
| D2 | Format changes | One schema version per format change, each with its own identity or moving migration, as ADR-0010 does | Each released state reads what it writes |
| D3 | Brand | Follow Notion's interaction patterns; keep Pagecraft's name, icons, tokens and words | Avoid copying another product's trade dress |
| D4 | Equations | A TeX subset parsed by our own `src/model/tex/` into a MathML tree, rendered with lit-html's `mathml` tag; amend ADR-0001 | MathML Core renders natively; no library |
| D5 | Code highlighting | Own tokenizers for 12 languages in `src/blocks/code/`; ranges painted with the CSS Custom Highlight API (`CSS.highlights`, `::highlight()`), so the editable DOM is untouched | No library, no spans inside `contenteditable` |
| D6 | Files | An asset store in IndexedDB (`assets` object store) owned by `src/persistence/`; blocks hold an `assetId`; the workspace file carries assets as base64; 50 MB per file | Data addresses inside props bloat every save |
| D7 | Formulas | Own expression language, a subset of Notion formulas 2.0, in `features/database/properties/formula/`: tokenizer, Pratt parser, type checker, evaluator; values computed by selectors, never stored | Derived values are never stored (specification 2.1) |
| D8 | Relations | Two-way relations update both sides inside one transaction; the inverse property is a real property of the other database | Keeps the operation model atomic |
| D9 | Embeds | `<iframe sandbox>` for an allow-list of https hosts; the production CSP gains `frame-src` for those hosts only | Least privilege |
| D10 | Multiple tabs | One writer per profile through `navigator.locks`; other tabs show a read-only notice and reload changes from `BroadcastChannel` | No silent overwrite |
| D11 | Comments and history | Kept locally like any other record: comments as a new record kind, page history as capped snapshots in their own object store | No server needed for one author |
| D12 | Archives | Markdown and HTML exports of many pages are written as an uncompressed ZIP by our own writer in `src/persistence/` | No library for a stored ZIP |
| D13 | `>` prefix | Becomes a toggle as in Notion; a quote is `"` followed by a space | Muscle memory from Notion |
| D14 | Shortcuts on Windows | Turn-into shortcuts use Ctrl+Shift+0 to 9 as Notion does on Windows and Linux; Cmd+Option on macOS | Notion's documented keys |
| D15 | Emoji data | Generated at build from the Unicode `emoji-test.txt` into a TypeScript module by `scripts/build-emoji.ts`, like tokens | No JSON parsing at runtime, no library |

## 7. What is left to the builder

Visual details inside the token system, exact copy wording within
`src/ui/copy/`, the order of tasks inside a milestone when they do not
depend on each other, and the tokenizer grammar details for each code
language, as long as the tests named in the plan pass.
