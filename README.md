# Pagecraft

A workspace app for one person that runs entirely in the browser: nested
pages edited as blocks, and databases shown as a table, a board, a gallery,
a list or a calendar. Everything is saved in the browser as you work and
can be exported as one JSON file, or a page as Markdown. There is no server
and no account.

Built with TypeScript, HTML and CSS, without a UI framework.

## Quick start

Requires Node 22.12 or later.

```bash
npm install
```

```bash
npm run dev
```

Open the address the dev server prints. A first visit opens a Getting
started page and a sample Tasks database. Press Ctrl+Shift+/ to see every
keyboard shortcut.

## What it does

- **Pages.** Nested pages in a sidebar tree: create, rename, give an icon
  and a cover (six color presets or an image address), use the full width,
  favorite, duplicate with everything inside, move (drag, Alt and the arrow
  keys, or "Move to"), trash and restore. A page exports as Markdown from
  its menu.
- **Blocks.** Paragraph, three heading levels, bulleted and numbered lists,
  to-do, toggle, quote, callout, divider, code, page link, image (from an
  address or a file), web bookmark and table of contents. Type `/` for the
  block menu, press the `+` beside a block, or type a shortcut at the start
  of a line: `#`, `##`, `###`, `-`, `1.`, `[]`, `>`, `---`, then a space.
  The block menu also duplicates, moves and deletes.
- **Text.** Select text for the formatting toolbar: bold (Ctrl+B), italic
  (Ctrl+I), underline (Ctrl+U), strikethrough (Ctrl+Shift+S), inline code
  (Ctrl+E), link (Ctrl+K), text color and highlight. Alt+F10 moves to the
  toolbar from the keyboard. Pasted Markdown becomes headings, nested lists,
  to-dos, quotes and code blocks with their marks; other pasted text keeps
  its marks, one block per line. Tab and Shift+Tab indent and outdent.
  Shift with Up or Down past the end of a block, or a drag from one block
  into another, selects whole blocks: delete, copy, cut, indent or move
  them (Alt and Up or Down).
- **Databases.** A page whose rows are pages, with eleven property types:
  text, number, select, multi-select, date, checkbox, URL, email, phone,
  created time and last edited time. Edit cells in place with Enter, move
  with the arrow keys. A row opens as a page that shows and edits its
  property values.
- **Views.** Each database has saved views, each a table, a board grouped by
  a select property, a gallery of cards with the first image of each row, a
  list, or a month calendar placed by a date property. Cards and calendar
  rows move by drag or by Alt and the arrow keys. Every view keeps its own
  name, sort (by one property or several: Shift and a header), filters,
  column order, widths and hidden columns, and a search field narrows its
  rows.
- **Tools.** Search pages by title or by their text, and run commands, on
  Ctrl+K. Undo and redo, light and dark themes, export and import of the
  whole workspace in Settings.

On macOS, use Command where this file says Ctrl.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run check:watch` | Type check in watch mode |
| `npm run test:watch` | Tests in watch mode |
| `npm run tokens` | Rebuild `src/styles/tokens.generated.css` from `tokens/` |
| `npm run lint` | ESLint, Stylelint and a Prettier check |
| `npm run test` | Full test suite |
| `npm run verify` | Type check, lint and tests; run before every commit |
| `npm run build` | Production build in `dist/` |
| `npm run preview` | Serve the production build |

## How the code is organized

One store holds all state and one function, `dispatch(command)`, changes
it. Views are functions from state to a template. Every concern has one
owning module.

```text
src/
├─ app/          composition root, router, app shell
├─ features/     one folder per feature (sidebar, editor, database, ...)
├─ blocks/       one folder per block type, plus the block registry
├─ ui/           shared primitives, shortcuts, interface text
├─ state/        store, dispatcher, history, interface commands
├─ model/        pure domain: schemas, operations, text and tree math
├─ persistence/  IndexedDB, migrations, export and import
└─ styles/       layer order, reset, base, generated tokens
tokens/          design tokens (Design Tokens Format 2025.10)
scripts/         the token build
```

Imports point one way: `app` → `features` → `blocks` → `ui` → `state` →
`model`. Lint enforces the direction, a 250-line file limit, a 40-line
function limit and the ban on raw values in CSS.

To add a block type, add one folder under `src/blocks/` and one line in
`src/blocks/block-registry.ts`; a type's own commands are declared in its
definition. To add a property type, add one folder under
`src/features/database/properties/` and one line in
`src/features/database/property-registry.ts`.

## Data

Workspace data is stored in IndexedDB, in the database `pagecraft`. The
exported file has the same shape as stored data and carries a
`schemaVersion`. A change to that shape adds a migration under
`src/persistence/migrations/`, so older files keep importing.

Importing a file replaces everything stored in that browser. Export first
if you want to keep what is there.

## Browser support

The latest two versions of Chrome, Edge, Firefox and Safari. Layouts below
768 CSS pixels wide are not tuned.

## Documents

- `docs/specification.md`: scope, architecture, naming and workflow.
- `docs/architecture.md`: data flow and layers.
- `docs/ownership.md`: the one owner of each concern.
- `docs/design-system.md`: tokens, primitives, states and interface text.
- `docs/decisions/`: decisions and their reasons.
- `docs/research/`: notes behind the decisions.
- `docs/plan.md`: the plan, and the version 1.1 roadmap.
- `docs/tasks.md`: what was built in each milestone and what was left out.
