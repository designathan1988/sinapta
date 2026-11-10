# Pagecraft

A workspace app for one person that runs entirely in the browser: nested
pages edited as blocks, and database pages shown as a table. Everything is
saved in the browser as you work and can be exported as one JSON file.
There is no server and no account.

Built with TypeScript, HTML and CSS, without a UI framework.

## Quick start

Requires Node 22.12 or later.

```bash
npm install
```

```bash
npm run dev
```

Open the address the dev server prints. Create a page from the sidebar,
press Enter in its title and start typing.

## What it does

- **Pages.** Nested pages in a sidebar tree: create, rename, give an icon,
  favorite, move (drag, Alt and the arrow keys, or "Move to"), trash and
  restore.
- **Blocks.** Paragraph, three heading levels, bulleted and numbered lists,
  to-do, toggle, quote, callout, divider, code and page link. Type `/` for
  the block menu, or a shortcut at the start of a line: `#`, `##`, `###`,
  `-`, `1.`, `[]`, `>`, `---`, then a space.
- **Text.** Bold (Ctrl+B), italic (Ctrl+I), inline code (Ctrl+E) and links
  (Ctrl+K on selected text). Tab and Shift+Tab indent and outdent.
- **Databases.** A page whose rows are pages, with seven property types:
  text, number, select, multi-select, date, checkbox and URL. Edit cells in
  place with Enter, move with the arrow keys.
- **Views.** Each database has one or more saved table views, each with its
  own sort, filters, column order, widths and hidden columns.
- **Tools.** Search and commands on Ctrl+K, undo and redo, light and dark
  themes, export and import of the whole workspace in Settings.

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
`src/blocks/block-registry.ts`. To add a property type, add one folder under
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
- `docs/tasks.md`: what was built in each milestone and what was left out.
