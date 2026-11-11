# Pagecraft specification

Save this file as `docs/specification.md`. It is the source of truth for
scope, architecture, naming and workflow.

Contents:

1. Product scope
2. Architecture rules
3. Tech stack and folder structure
4. Data model and persistence
5. Interface, tokens and data table
6. Naming and consistency standards
7. Fast feedback workflow
8. CLAUDE.md
9. Milestones, acceptance and open decisions

---

## 1. Product scope

Pagecraft version 1 is a browser app for one person: nested pages edited as
blocks, plus database pages shown as a table, saved locally as JSON. It runs
with no server and no account.

### In scope

| Area | Version 1 behavior |
| --- | --- |
| Workspace | Sidebar tree of nested pages: create, rename, move by drag, favorite, move to trash, restore |
| Page | Title, icon (one emoji), cover (color preset or image address), full width option, body made of blocks; duplicate a page with everything inside it; export a page as Markdown |
| Block types | Paragraph, heading 1 to 3, bulleted list, numbered list, to-do, toggle, quote, callout, divider, code, page link, image (web address or a file kept in the workspace), web bookmark, table of contents |
| Block editing | Type, split and merge with Enter and Backspace, indent and outdent with Tab, drag to reorder, slash menu and a "+" beside each block to insert or convert, duplicate, paste Markdown as blocks |
| Inline formatting | Bold, italic, underline, strikethrough, inline code, link, text color and highlight, from shortcuts or a toolbar over selected text |
| Database | A page type with typed properties: text, number, select, multi-select, date, checkbox, URL, email, phone, created time, last edited time. Each row is a page |
| Views | Table, board grouped by a select property, gallery, list, and month calendar by a date property; sort, filter, search, resize, reorder and hide columns, edit cells in place, add rows and properties, several saved views per database |
| Navigation | Command palette and search of page titles and page text on Ctrl+K or Cmd+K, breadcrumbs, back and forward, a keyboard shortcut reference |
| History | Undo and redo for every change to workspace data |
| Appearance | Light and dark themes following the system setting, with a manual override |
| Data | Autosave to the browser, export and import of the whole workspace as one JSON file; a first visit starts with a tour page and a sample database |

### Out of scope for version 1

Real-time collaboration, accounts and permissions, a server or sync,
comments, uploads to a server, formulas, relations and rollups, mobile
layouts below 768 px, offline install as a PWA.

Version 1.1 widened the scope at the owner's request (2026-11-10): board,
gallery, list and calendar views, and the other additions in the table
above. `docs/plan.md` lists them as milestones 8 to 10.

### Quality targets

- Typing latency under 16 ms per keystroke on a page of 1,000 blocks.
- Table view stays responsive with 5,000 rows.
- Every action reachable by keyboard; WCAG 2.2 AA contrast and focus
  visibility.
- Reload restores the exact last state, including the open page and sidebar
  expansion.

---

## 2. Architecture rules

One store holds all state, one dispatcher changes it, and every concern has
one owning module. Data flows one way: a view dispatches a command, the
dispatcher applies a transaction to the store, and subscribers render and
save.

```text
View ──> dispatch(command) ──> Command handler ──> Transaction
 ^        the only write        pure, returns       atomic, keeps its
 │        path                  operations          inverse for undo
 │                                                       │
 │                                                       v
 └── Root render <──────── Selectors <──────────────── Store
     one subscription      derived, never stored     the single AppState
                                                         │ after each commit
                                                         v
                                                     Repository
                                                     saves changed records
```

Views never write state; the store never knows about views.

### 2.1 Single source of truth

- `AppState` in `src/state/store.ts` is the only place state lives. It has
  four slices: `workspace` (blocks, views and settings, including the
  theme), `ui` (active page, selection, sidebar, open overlay), `history`
  (undo and redo stacks) and `persistence` (save status).
- Workspace data is normalized: records in maps keyed by id, relations by
  id. A record is never nested inside another or copied.
- Views hold no state. The only exception is what the browser owns during an
  interaction: the caret inside the focused block and the pointer position
  during a drag. Both are written to the store when the interaction ends.
- Derived values (breadcrumbs, filtered rows, the visible tree) come from
  selectors. A derived value is never written to the store or to storage.
- The data table library computes row models only. Sort, filter, column
  order, width and visibility live in the `View` record in the store and are
  passed in as controlled state.

### 2.2 One state controller

- The only way to change state is `dispatch(command)` from
  `src/state/dispatch.ts`.
- A command is a plain serializable object:
  `{ type: "block.move", blockId, targetParentId, index }`. Command types
  are named `domain.action`.
- A command handler is a pure function `(state, command) => Operation[]`.
  Operations are the smallest record changes: `record.create`,
  `record.update`, `record.delete`, `list.insert`, `list.remove`.
- The dispatcher groups a command's operations into one transaction and
  applies it atomically. A transaction that fails validation changes
  nothing.
- Each workspace transaction stores its inverse, which is what undo applies.
  Commands that change only the `ui` slice or only `settings` are not
  recorded in history.
- Subscribers react after a transaction: the renderer updates the DOM, the
  repository saves the changed records. Subscribers never dispatch during
  notification.

### 2.3 Single owner

Each concern below has one module. Code for that concern anywhere else is a
defect. `docs/ownership.md` holds the full, current table.

| Concern | Owner |
| --- | --- |
| State shape and initial state | `src/state/app-state.ts` |
| Store instance and subscription | `src/state/store.ts` |
| Applying commands and transactions | `src/state/dispatch.ts` |
| Undo and redo | `src/state/history.ts` |
| Domain types and JSON schemas | `src/model/` |
| Applying operations to workspace data | `src/model/apply-operation.ts` |
| Id generation | `src/model/id.ts` |
| Block type definitions | `src/blocks/block-registry.ts` plus one folder per type |
| Property type definitions | `src/features/database/property-registry.ts` plus one folder per type |
| Loading, saving, import, export, migrations | `src/persistence/` |
| Keyboard shortcuts | `src/ui/shortcuts/shortcut-registry.ts` |
| Overlays: menus, dialogs, popovers | `src/ui/overlay/` |
| URL and active page | `src/app/router.ts` |
| Design token values | `tokens/*.tokens.json` |
| CSS layer order and global styles | `src/styles/index.css` |
| Interface text | `src/ui/copy.ts` |

### 2.4 Module boundaries

- Imports point one way: `app` → `features` → `blocks` → `ui` → `state` →
  `model`. `persistence` imports `state` and `model` only. `model` imports
  nothing from the project.
- Every folder under `features/` and `blocks/` exposes one `index.ts`. Other
  folders import from that file only.
- `model` and `state` never touch the DOM or storage. Command handlers and
  operations are pure: the dispatcher creates ids and timestamps and passes
  them in.
- The lint configuration enforces the import direction, the 250-line file
  limit and the 40-line function limit. A lint error is a build failure.
  Three exemptions: the function limit is off in `*.test.ts` files, where a
  `describe` callback is one long function; default exports are allowed in
  root `*.config.*` files, where the tools require them; and the file limit
  does not apply to `tokens/*.tokens.json`, which hold values, not behavior
  (`docs/decisions/0009-token-file-size.md`).
- New block type: one new folder under `src/blocks/` and one line in the
  registry. New feature: one new folder under `src/features/` and one line
  in `src/app/bootstrap.ts`. A change that needs edits in more places than
  that signals a missing owner.

### 2.5 Parse at the boundary

JSON enters the app in two places: storage load and file import. Both pass
through the schemas and produce typed values or a typed error. The envelope
schemas live in `src/model/`; the props schema of a block type and the value
schema of a property type live in that type's folder as `<type>.schema.ts`
and are passed to the envelope schema through the registries. No other code
checks the shape of workspace data.

---

## 3. Tech stack and folder structure

The stack is TypeScript, HTML and CSS with five small runtime libraries and
no UI framework. Install the current stable release of each, confirm its API
in the official docs first, and record the exact version in its ADR.

| Concern | Choice | Rule |
| --- | --- | --- |
| Language | TypeScript 6.0, `strict` and `noUncheckedIndexedAccess` on | No `any`, no non-null `!`, no type casts outside schema files and `src/model/id.ts`. Move to TypeScript 7 when typescript-eslint supports it |
| Markup | Semantic HTML, one `index.html` | Native `<dialog>`, `popover`, `<details>`, `<table>` before any custom widget |
| Styles | Native CSS with `@layer`, nesting and custom properties | No preprocessor, no utility framework, no CSS-in-JS |
| Dev server and build | Vite | Hot reload stays on during all work |
| Tests | Vitest | Watch mode during work; see section 7 |
| Templates | `lit-html`: `html`, `svg`, `render`, `nothing` and the directives `repeat`, `keyed`, `ref` | No component classes, no directive classes, no component state |
| Store | `createStore` from `zustand/vanilla` | Exactly one store instance |
| Data table | `@tanstack/table-core` | Row models only, state controlled from the store |
| Schemas | Valibot | Imported only in `src/model/` and in `*.schema.ts` files |
| Storage | IndexedDB through `idb` | Used only in `src/persistence/` |
| Tokens | Design Tokens Format 2025.10 JSON, built to CSS by `scripts/build-tokens.ts` | See section 5.4 |
| Lint and format | ESLint with typescript-eslint, Stylelint, Prettier | Zero warnings allowed |

The TanStack Table docs now default to version 9, whose vanilla entry point
differs from version 8: tables are built with `constructTable` and
`tableFeatures`, and vanilla use must pass `storeReactivityBindings()`.
Follow the docs for the version actually installed.

### Folder structure

```text
pagecraft/
├─ CLAUDE.md                    project memory for Claude Code (section 8)
├─ README.md                    setup and commands for humans
├─ index.html                   the single HTML entry
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ eslint.config.js
├─ stylelint.config.js
├─ .claude/
│  └─ rules/                    path-scoped rules, one file per area (section 8)
├─ docs/
│  ├─ specification.md          this specification
│  ├─ architecture.md           data flow and layer rules, kept current
│  ├─ ownership.md              concern -> owner table, kept current
│  ├─ decisions/                ADRs: 0001-rendering.md, 0002-store.md, ...
│  └─ research/                 one note per researched topic
├─ tokens/
│  ├─ base.tokens.json          raw scales: color, space, size, font, radius, duration
│  ├─ semantic.tokens.json      roles that alias base tokens
│  └─ themes/
│     ├─ light.tokens.json
│     └─ dark.tokens.json
├─ scripts/
│  └─ build-tokens.ts           tokens/*.tokens.json -> src/styles/tokens.generated.css
└─ src/
   ├─ app/                      composition root: main.ts, bootstrap.ts, router.ts
   ├─ model/                    pure domain: types, schemas, operations
   ├─ state/                    store, app-state, dispatch, history
   ├─ persistence/              repository, IndexedDB adapter, JSON import/export, migrations/
   ├─ blocks/                   block-registry.ts + one folder per block type
   │  └─ to-do/                 to-do.definition.ts, to-do.view.ts, to-do.css, to-do.test.ts, index.ts
   ├─ features/                 one folder per feature
   │  ├─ sidebar/               sidebar.view.ts, sidebar.commands.ts, sidebar.selectors.ts,
   │  │                         sidebar.css, sidebar.test.ts, index.ts
   │  ├─ editor/
   │  ├─ slash-menu/
   │  ├─ database/              property-registry.ts + properties/<type>/
   │  ├─ command-palette/
   │  └─ settings/
   ├─ ui/                       shared primitives: button/, menu/, dialog/, icon/, overlay/,
   │                            shortcuts/, copy.ts
   └─ styles/                   index.css (layer order), reset.css, base.css, tokens.generated.css
```

Tests sit next to the file they test. There is no top-level `tests/` folder
and no `__tests__` folders.

---

## 4. Data model and persistence

Everything is a block, stored as a flat JSON record with an id, a type,
typed props, an ordered list of child ids and a parent id. This follows the
model Notion describes for its own blocks, where pages are blocks too and
user actions become operations grouped into transactions.

### Records

```ts
// Id types are inferred from the schemas, which brand them:
// v.pipe(v.string(), v.brand("BlockId")), and likewise for the others.
type BlockId = v.InferOutput<typeof blockIdSchema>;
type ViewId = v.InferOutput<typeof viewIdSchema>;
type PropertyId = v.InferOutput<typeof propertyIdSchema>;

interface Block {
  id: BlockId;
  type: BlockType;            // "page" | "database" | "paragraph" | "heading" | "to-do" | ...
  parentId: BlockId | null;   // null only for top-level pages
  childIds: BlockId[];        // the only source of order
  props: BlockProps;          // discriminated by type
  createdAt: string;          // ISO 8601, UTC
  updatedAt: string;
}

type RichText = TextSpan[];
interface TextSpan {
  text: string;
  marks?: ("bold" | "italic" | "code")[];
  href?: string;
}

interface View {
  id: ViewId;
  databaseId: BlockId;
  name: string;
  type: "table";
  sorts: { propertyId: PropertyId; direction: "ascending" | "descending" }[];
  filters: Filter[];
  propertyOrder: PropertyId[];
  propertyWidths: Record<PropertyId, number>;
  hiddenPropertyIds: PropertyId[];
}
```

- A page is a block of type `page` with
  `props: { title, icon, isFavorite, isTrashed }`.
- A database is a block of type `database` with
  `props: { title, properties: PropertyDefinition[], viewIds }`.
- A database row is a `page` block whose parent is the database. Its cell
  values live in `props.values`, keyed by property id.
- `parentId` and the parent's `childIds` are changed together in one
  transaction, never separately.
- Ids come from `crypto.randomUUID()`, wrapped only in `src/model/id.ts`.

### Workspace file

Export, import and storage all use this one shape. `schemaVersion` is an
integer that increases by one with every format change.

```json
{
  "schemaVersion": 1,
  "rootIds": ["b-01"],
  "blocks": {
    "b-01": {
      "id": "b-01",
      "type": "page",
      "parentId": null,
      "childIds": ["b-02"],
      "props": { "title": [{ "text": "Roadmap" }], "icon": null, "isFavorite": false, "isTrashed": false },
      "createdAt": "2026-11-10T12:00:00Z",
      "updatedAt": "2026-11-10T12:00:00Z"
    },
    "b-02": {
      "id": "b-02",
      "type": "to-do",
      "parentId": "b-01",
      "childIds": [],
      "props": { "text": [{ "text": "Ship " }, { "text": "version 1", "marks": ["bold"] }], "isChecked": false },
      "createdAt": "2026-11-10T12:00:00Z",
      "updatedAt": "2026-11-10T12:00:00Z"
    }
  },
  "views": {},
  "settings": { "theme": "system" }
}
```

The ids above are shortened for reading; real ids are UUIDs.

### Persistence

- `src/persistence/workspace-repository.ts` is the only module that reads or
  writes storage. It subscribes to the store and saves only the records each
  transaction changed, debounced by 300 ms.
- IndexedDB holds one object store per record kind (`blocks`, `views`) plus
  one `meta` store for `schemaVersion`, `rootIds`, `settings` and the last
  `ui` slice.
- Loading runs every stored record through its schema. A record that fails
  is reported in the save status and skipped, never silently repaired.
- Each format change adds one migration file,
  `src/persistence/migrations/0002-<what-changed>.ts`, a pure function from
  version n to n + 1. Import runs the same migrations, so old export files
  keep working.
- The exported file is a public contract: key names and value formats do not
  change without a `schemaVersion` bump and a migration.

---

## 5. Interface, tokens and data table

The interface is a pure function of the store: each view takes state,
returns a template, and reports user intent only by dispatching commands.
Every visual value comes from a design token.

### 5.1 Layout

- App shell: a CSS grid with two areas, `sidebar` and `main`. The sidebar is
  resizable and collapsible; its width and collapsed flag live in the `ui`
  slice.
- `main` holds the top bar (breadcrumbs, save status, page menu) and the
  page: title, then either the block list or the database table.
- Overlays (slash menu, command palette, property menus, dialogs) render in
  the browser top layer through `src/ui/overlay/`. The `ui` slice holds at
  most one open overlay at a time and is the truth: the overlay owner shows
  the element after render and turns its `toggle` and `close` events into a
  close command. Menus are flat in version 1, with no nested submenus.
- The slash menu follows the combobox pattern: focus stays in the block and
  the list is driven by `aria-activedescendant`.

### 5.2 View rules

- A view file exports one function:
  `(state slice, dispatch) => TemplateResult`. No classes, no module-level
  variables, no timers.
- One root render in `src/app/bootstrap.ts` subscribes to the store and
  re-renders. Views never subscribe on their own.
- Views read state only through selectors from their own feature or from
  `src/state/`.
- DOM events are translated to commands in the view file and nowhere else.
  Global keys go through the shortcut registry.
- Each view's styles sit in the CSS file next to it, inside
  `@layer features` or `@layer blocks`, with class names prefixed by the
  folder name.

### 5.3 Text editing

- Each text block is one `contenteditable` element. The store's `RichText`
  is the truth; the DOM is a projection of it.
- Handle `beforeinput`: cancel the browser default, translate the
  `inputType` into a command, dispatch it, and restore the caret from the
  selection in the `ui` slice. Input the browser will not let the app cancel
  (IME composition, spellcheck replacement, autocorrect, autofill) is the
  one case where the browser edits first; the result is read back on `input`
  or `compositionend` and dispatched as one command.
- The inside of an editable block is projected from `RichText` by one owner,
  `src/ui/rich-text/`, with plain DOM calls, not by a template binding.
- Offsets in commands, history and the `ui` slice are UTF-16 code unit
  indices that always sit on a grapheme cluster boundary, snapped through
  `Intl.Segmenter` in `src/model/grapheme.ts`. Caret movement, deletion and
  length limits act on whole clusters, never on single code units.
- A selection that crosses a block boundary becomes a selection of whole
  blocks.
- Paste is parsed to plain text and the four supported marks. Pasted HTML is
  never inserted as HTML.

### 5.4 Design tokens

Tokens are authored as JSON in the Design Tokens Format 2025.10, the first
stable version of the W3C Design Tokens Community Group specification
(October 28, 2025).

- Three tiers: `base` (raw scales), `semantic` (roles such as
  `color.text.primary` that alias base tokens), and theme files that
  reassign semantic color tokens for light and dark.
- `scripts/build-tokens.ts` generates `src/styles/tokens.generated.css`: one
  custom property per token, `color.text.primary` becoming
  `--color-text-primary`. Each camelCase segment becomes kebab-case:
  `font.lineHeight.body` becomes `--font-line-height-body`. Base tokens sit
  under a top-level `base` group and become `--base-*`. The generated file
  is never edited by hand.
- CSS uses semantic tokens only. Base tokens and raw values (hex colors, px,
  ms, font names) are forbidden outside the generated file; Stylelint
  enforces this.
- Token groups: `color`, `space`, `size`, `radius`, `shadow`, `font`
  (family, size, weight, line height), `duration`, `easing`, `layer`
  (z-order).
- Theme: `color-scheme: light dark` on the root, with `data-theme="light"`
  or `"dark"` set only when the user overrides the system setting. The
  override is applied after the workspace loads; until then only the page
  background paints, in the system theme.

### 5.5 Data table

- Markup is a real `<table>` with `<thead>`, `<tbody>`, `<th scope="col">`;
  column headers that sort are buttons with `aria-sort` on the header cell.
  The table carries `role="grid"` with a roving `tabindex` on cells, which
  cell-to-cell arrow keys require.
- `@tanstack/table-core` receives rows from a selector and sort, filter,
  order, width and visibility from the active `View` record. Every change it
  reports is turned into a `view.*` command; its internal state is never
  read as truth.
- Cells render by property type through one registry,
  `src/features/database/property-registry.ts`: each property type defines
  its parser, formatter, cell view, editor and filter operators in one
  folder under `src/features/database/properties/`.
- Editing: Enter or a double click opens the cell editor, Enter commits one
  `row.setValue` command, Escape cancels. Arrow keys move between cells.
- Rows beyond the viewport are not rendered once a database passes 200 rows.
  Rows are windowed with spacer rows, because `content-visibility` has no
  effect on table rows; `aria-rowcount` and `aria-rowindex` keep the full
  size announced.

### 5.6 Web best practices

- Use the platform first: `<dialog>` for modals, the Popover API for menus,
  CSS anchor positioning with the fallback the web guidance specifies, View
  Transitions for page changes, `:focus-visible` for focus rings.
- CSS: one `@layer` order declared in `src/styles/index.css`
  (`reset, tokens, base, ui, blocks, features`), logical properties,
  container queries for component layout, no `!important`, no id selectors.
- Accessibility: WCAG 2.2 AA, a visible focus ring on every interactive
  element, the sidebar as an ARIA tree with roving tabindex, live-region
  announcements for save status and drag results, `prefers-reduced-motion`
  respected by every animation. Every drag action also has a keyboard path
  and a single-pointer path ("Move up", "Move down", "Move to").
- Performance: no layout reads inside render, event delegation on list
  containers, fonts from the system stack, no direct runtime dependency
  beyond the five in section 3 (the table engine brings `@tanstack/store`
  with it) and no polyfill packages: a missing platform feature gets a small
  scripted fallback.
- Security: a Content Security Policy without `unsafe-inline` scripts or
  styles, added to `index.html` by the production build (the dev server
  needs injected styles for hot reload), link `href` values limited to
  `http`, `https` and `mailto`.

---

## 6. Naming and consistency standards

One convention per kind of name, applied everywhere, in English, with no
abbreviations except `id`, `url`, `ui`, `css`, `html` and `json`.

| What | Convention | Example |
| --- | --- | --- |
| Folders | kebab-case, singular for a concept, plural for a collection of peers | `slash-menu/`, `blocks/`, `features/` |
| Files | kebab-case name plus a role suffix | `sidebar.view.ts`, `sidebar.commands.ts`, `sidebar.selectors.ts`, `sidebar.css`, `sidebar.test.ts` |
| Role suffixes | Closed list: `.view`, `.commands`, `.selectors`, `.definition`, `.schema`, `.test` | `to-do.definition.ts` |
| Folder entry | `index.ts`, re-exports only, no logic | `features/sidebar/index.ts` |
| Types and interfaces | PascalCase nouns, no `I` or `T` prefix | `Block`, `View` |
| Id types | Branded, suffix `Id` | `BlockId`, `ViewId` |
| Functions | camelCase, verb first | `moveBlock`, `parseWorkspace` |
| Selectors | `select` prefix | `selectVisibleRows` |
| View functions | `render` prefix | `renderSidebar` |
| Booleans | `is`, `has`, `can`, `should` prefix | `isTrashed`, `hasChildren` |
| Constants | SCREAMING_SNAKE_CASE, only for true constants | `SAVE_DEBOUNCE_MS` |
| Command types | `domain.action`, lower camelCase parts | `block.move`, `view.setSort` |
| Operation types | `record.*` and `list.*` | `record.update`, `list.insert` |
| JSON keys | camelCase | `childIds`, `schemaVersion` |
| String enum values | kebab-case | `"to-do"`, `"multi-select"` |
| CSS classes | Folder name prefix, then `__part`, state through `data-*` or ARIA attributes | `.sidebar__item[aria-expanded="true"]` |
| CSS custom properties | Token path joined by hyphens, segments in kebab-case | `--color-text-primary` |
| Token paths | Dot-separated, lower camelCase segments | `color.text.primary` |
| Tests | `describe` names the unit, `it` states the behavior in present tense | `it("moves a block to a new parent")` |
| Docs | kebab-case `.md`; ADRs numbered with four digits | `docs/decisions/0003-data-table.md` |
| Commits | Conventional Commits, scope is the folder | `feat(sidebar): add drag to reorder` |
| Branches | `type/short-description` | `feat/table-view` |

### Code standards

- Named exports only. No default exports, no `export *` outside `index.ts`.
- One concept per file. A file named `x.commands.ts` contains only command
  handlers for `x`.
- No `utils`, `helpers`, `common`, `shared`, `misc` or `lib` files or
  folders. A function with no obvious owner means an owner is missing; name
  it and add it to `docs/ownership.md`.
- Functions take at most three parameters; more become one named options
  object.
- Errors are typed values returned from boundary functions. `throw` is
  reserved for programmer errors.
- Comments explain why, never what. No commented-out code. No `TODO` without
  a matching entry in `docs/decisions/` or the task list.
- All user-facing strings come from `src/ui/copy.ts`.
- Formatting is whatever Prettier produces with its defaults; it is never
  discussed or overridden per file.

---

## 7. Fast feedback workflow

Three watchers run in the background for the whole build phase, so every
save shows its result within about a second and nothing waits on anything
else.

### Commands

| Command | What it runs | Mode | Budget |
| --- | --- | --- | --- |
| `npm run dev` | Vite dev server with hot reload | Background, always on | Reload under 1 s |
| `npm run check:watch` | `tsc --noEmit --watch` | Background, always on | Incremental check under 2 s |
| `npm run test:watch` | `vitest` in watch mode | Background, always on | Affected tests under 2 s |
| `npm run tokens` | `scripts/build-tokens.ts`, also run by a Vite plugin when a token file changes | On change | Under 1 s |
| `npm run lint` | ESLint and Stylelint with caching | On demand | Under 5 s |
| `npm run test` | `vitest run` | On demand | Under 10 s for the full suite |
| `npm run verify` | Type check, lint, full tests | Before each commit | Under 30 s |
| `npm run build` | Production build | End of each milestone | Under 20 s |

### Rules

- Never wait silently. A command that can exceed 10 seconds runs in the
  background with its output streamed, and work continues on the next task.
- Never hide output: no `--silent`, no redirecting to null, no piping
  through a filter that drops errors.
- Never restart a watcher to see a result. Read its latest output.
- No sleeps and no polling loops in scripts or tests. Tests that need time
  use fake timers.
- A budget that is exceeded is a defect and is fixed before the next task
  starts.

### Testing shape

- `model` and `state` are pure, so they get most of the tests: command in,
  state out, no DOM. These run in the default Node environment.
- Each feature gets a few view tests with a light DOM environment, covering
  only event-to-command translation.
- No end-to-end browser suite, no visual snapshot suite, no coverage gate.
  The interface is verified by looking at the running app after each task,
  and by the UI audit at the end of each milestone.
- Every bug fix starts with a failing test in the layer where the bug lives.

### Task rhythm

1. Pick one task: a vertical slice that ends in something visible.
2. Write or update the tests for its command handlers and selectors.
3. Implement until the watchers are green.
4. Look at the running app and confirm the behavior.
5. Run `npm run verify`, commit, report the live result, start the next
   task.

---

## 8. CLAUDE.md

`CLAUDE.md` holds only what must be true in every session, in about 60
lines; everything else goes in path-scoped rules or `docs/`. The Claude Code
memory docs recommend staying under 200 lines per file, writing instructions
concrete enough to verify, and moving area-specific instructions into
`.claude/rules/` files that load only when matching files are read.

### Root file

Write `CLAUDE.md` with exactly this content, then keep it current.

```text
# Pagecraft

Local-first, single-user, Notion-style workspace app. TypeScript, HTML, CSS.
No UI framework. Full specification: docs/specification.md.

## Commands
- npm run dev            dev server with hot reload (keep running in background)
- npm run check:watch    type check in watch mode (keep running in background)
- npm run test:watch     tests in watch mode (keep running in background)
- npm run verify         type check + lint + full tests; run before every commit
- npm run tokens         rebuild src/styles/tokens.generated.css

## Architecture rules
- All state lives in the one store: src/state/store.ts. Views keep no state.
- All changes go through dispatch(command) in src/state/dispatch.ts.
- Derived values come from selectors and are never stored.
- Every concern has one owner, listed in docs/ownership.md. Find the owner
  before adding code. No owner: add a row there first.
- Import direction: app -> features -> blocks -> ui -> state -> model.
  persistence imports state and model only. model imports nothing.
- Import other folders through their index.ts only.
- JSON is parsed only by schemas (src/model/ and *.schema.ts files), at
  storage load and file import.

## Where new code goes
- New block type: one folder in src/blocks/ + one line in block-registry.ts.
- New feature: one folder in src/features/ + one line in src/app/bootstrap.ts.
- New property type: one folder in src/features/database/properties/ + one
  line in property-registry.ts.
- New shortcut: src/ui/shortcuts/shortcut-registry.ts.
- New interface text: src/ui/copy.ts.
- New visual value: a token in tokens/, then npm run tokens.

## Limits
- Max 250 lines per file, 40 lines per function, 3 parameters per function.
- No files or folders named utils, helpers, common, shared, misc or lib.
- Named exports only.
- CSS uses semantic token custom properties only. No raw colors, sizes,
  durations or font names.
- English only: code, comments, names, commits, docs, interface text.

## Naming
- Files: kebab-case + role suffix (.view, .commands, .selectors,
  .definition, .schema, .test). Full table: docs/specification.md section 6.
- Commands: domain.action (block.move). Selectors: selectX. Views: renderX.

## Workflow
- Research current docs before using any library or web API. Use the
  modern-web-guidance skill before writing HTML or CSS for a component.
- One small vertical slice at a time; show the running result after each.
- Never run a command that hides output or blocks for more than 10 seconds;
  run it in the background and continue.
- Budgets: full tests under 10 s, npm run verify under 30 s.
- Commit after each task with Conventional Commits; scope = folder name.
- If a rule blocks the task, stop and ask. Do not work around it.

## Read on demand
- Data flow and layers: docs/architecture.md
- Decisions and their reasons: docs/decisions/
```

### Path-scoped rules

Each file in `.claude/rules/` starts with YAML front matter listing the
`paths` it applies to, and holds at most 30 lines.

| File | Paths | Holds |
| --- | --- | --- |
| `model.md` | `src/model/**/*.ts` | Purity, schema rules, branded ids, operation shapes |
| `state.md` | `src/state/**/*.ts` | Command handler signature, transaction and history rules |
| `ui.md` | `src/{ui,features,blocks}/**/*.ts` | View function rules, event-to-command translation, text editing rules |
| `styles.md` | `src/**/*.css`, `tokens/**/*.json` | Layer order, token tiers, class naming, forbidden raw values |
| `tests.md` | `src/**/*.test.ts` | Test naming, environments, time budgets, no sleeps |
| `persistence.md` | `src/persistence/**/*.ts` | Repository rules, migrations, contract stability |

### Keeping it correct

- Add a line when the same mistake happens twice; delete a line when the
  lint configuration starts enforcing it.
- A rule in `CLAUDE.md` never contradicts the specification. When the
  architecture changes, update the ADR, the specification and `CLAUDE.md` in
  the same commit.

---

## 9. Milestones, acceptance and open decisions

Seven milestones, built in order; each ends with a running app, a passing
`npm run verify`, a UI audit and a commit series. A milestone is not started
until the previous one meets its acceptance line.

1. **Foundation.** Project setup, lint limits, tokens pipeline, app shell,
   store, dispatcher, history, repository.
   - Accept: an empty workspace loads, the three watchers run, a
     `settings.setTheme` command switches theme and survives reload, and an
     import that breaks the layer direction fails lint.
2. **Pages and sidebar.** Page blocks, tree, create, rename, move, favorite,
   trash, router, breadcrumbs.
   - Accept: nested pages can be created and reordered by keyboard and by
     drag, every action can be undone, and reload restores the tree and the
     open page.
3. **Block editor, text.** Paragraph, headings, lists, to-do, quote,
   divider; split, merge, indent; inline marks.
   - Accept: typing, Enter, Backspace and Tab behave as in section 5.3,
     including emoji and IME input, with typing latency inside the target on
     1,000 blocks.
4. **Block editor, structure.** Slash menu, convert block type, drag to
   reorder, toggle, callout, code, page link.
   - Accept: adding a new block type in a test touches exactly one new
     folder and one registry line.
5. **Database and table view.** Database block, property types, rows as
   pages, table rendering, cell editing.
   - Accept: all seven property types can be added, edited and removed, and
     a row opens as a page.
6. **Views.** Sort, filter, column resize, reorder, hide, several saved
   views.
   - Accept: view settings live only in `View` records, survive reload, and
     the table stays responsive at 5,000 rows.
7. **Workspace tools.** Command palette, search, JSON export and import with
   migrations, settings, final audit and README.
   - Accept: export then import into an empty browser profile reproduces the
     workspace exactly, and the accessibility review reports no AA failures.

### Acceptance for the whole project

- No file over 250 lines (exemptions in section 2.4), no function over 40,
  zero lint warnings.
- Searching the code for calls to the store's `setState` finds them only in
  `src/state/dispatch.ts` (`src/state/store.ts` creates the store and
  exports `setState` to the dispatcher alone); searching for `indexedDB` or
  `idb` finds them only in `src/persistence/`.
- Outside media and container query conditions, hex colors and px values
  appear in the CSS only in `tokens.generated.css`.
- `docs/ownership.md` matches the code: every listed owner exists and no
  concern has two.
- Full test suite under 10 seconds; `npm run verify` under 30 seconds.

### Open decisions

Each row becomes one ADR in Phase 1 of the build prompt. The default stands
unless research gives a concrete reason to change it; a change needs
approval at the plan review.

| Decision | Default | Switch if |
| --- | --- | --- |
| Rendering | `lit-html` templates, one root render | Profiling shows re-render cost breaks the typing target; then render per block with keyed updates |
| Store | `zustand/vanilla` | Its API cannot express atomic transactions cleanly; then a store of about 100 lines owned by `src/state/store.ts` |
| Data table engine | `@tanstack/table-core`, controlled state | The installed version cannot run fully controlled from an outside store; then own sort and filter selectors |
| Schema library | Valibot | Type inference for discriminated block props is inadequate; then Zod |
| Storage layout | IndexedDB, one record per key | Never for version 1 |
| Text editing | One `contenteditable` per block with `beforeinput` | Cross-block selection proves unworkable; then one `contenteditable` per page with the same model |
| Browser support | Latest two versions of Chrome, Edge, Firefox and Safari | A required platform feature is missing in one of them; then use the fallback from the web guidance |
| Product name | Pagecraft | The owner picks another |

### Later versions

Sync and collaboration would build on the existing operation and transaction
log, which is why every change already flows through serializable commands.
Board and calendar views would be new `View` types over the same rows.

---

## References

- The data model behind Notion's flexibility: https://www.notion.com/blog/data-model-behind-notion
- How Claude remembers your project (CLAUDE.md): https://code.claude.com/docs/en/memory
- TanStack Table vanilla quick start: https://tanstack.com/table/latest/docs/framework/vanilla/quick-start
- Design Tokens Format 2025.10: https://www.designtokens.org/tr/2025.10/
- Zustand reference: https://zustand.docs.pmnd.rs/reference/index
- Modern Web Guidance: https://github.com/GoogleChrome/modern-web-guidance
