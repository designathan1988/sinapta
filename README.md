# Pagecraft

A workspace app for one person that runs entirely in the browser: nested
pages edited as blocks, and databases shown as a table, a board, a gallery,
a list or a calendar. Everything is saved in the browser as you work and
can be exported as one JSON file, or a page as Markdown. There is no server
and no account.

Built with TypeScript, HTML and CSS, without a UI framework.

## Quick start

Requires Node 24 or later (the server uses Node's own `node:sqlite`).

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

Pagecraft follows Notion's layout, keys and behavior for everything one
person can use offline.

- **Pages.** Nested pages in a sidebar with favorites and sections; icon,
  cover (presets, an image, repositioned), font, small text, full width,
  lock; duplicate, move ("Move to", drag, Alt and the arrows), trash and
  restore, with the trash emptied after 30 days. The page menu holds Copy
  link, Copy page contents, Duplicate, Move to, Version history,
  Appearance and layout, Lock page, Move to trash and More (export).
- **Blocks.** Text, four heading levels and toggle headings, lists, to-do,
  toggle, quote, callout, divider, code with highlighting, equations,
  simple tables, columns, images, files, PDF, video, audio, embeds,
  bookmarks, synced blocks, buttons, breadcrumbs, table of contents,
  subpages, linked and inline databases. Every Notion prefix and inline
  Markdown while typing; `/`, `@` mentions and dates, `:` emoji, the block
  menu and colors; structured copy and rich paste.
- **Databases.** Text, number (with formats), select, multi-select,
  status, date (ranges, times, reminders), created and last edited
  times, checkbox, URL, email, phone, files, relation, rollup, formula,
  button and unique ID properties. Table, board (with sub-groups), gallery,
  list, calendar (month and week), timeline, chart, form and feed views,
  each with its own filters (rules and groups), sorts, grouping,
  calculations, frozen and wrapped columns. Rows open as pages, in a side
  or center peek, from templates; CSV import and export.
- **Comments.** Discussions on a page, on selected text, or on a row's
  property value from its cell's bar; replies, resolving, and deleting
  after a question.
- **Tools.** Search on Ctrl+K with Title only, In page and Date filters;
  Home with recents; inbox reminders; version history marking what each
  version wrote; backlinks; Markdown, HTML and ZIP export and import; undo
  and redo; light and dark themes; keyboard shortcuts for every action.
  Installs as an app and works offline.
- **Integrations and the API.** Settings › Connections makes an internal
  integration and shows its secret once; a page's menu connects it under
  Connections. Programs then call Notion's REST shapes at `/v1` with
  `Authorization: Bearer <secret>`: `GET /v1/users/me`, `POST /v1/search`,
  `GET` and `PATCH /v1/pages/:id`, `POST /v1/pages`,
  `GET /v1/databases/:id`, `POST /v1/databases/:id/query`, `GET` and
  `PATCH /v1/blocks/:id/children`, reaching only the connected pages and
  the pages inside them. Bookmarks show the page's own title, description
  and image, read by the server.
- **AI Meeting Notes.** `/meeting` records the microphone; signed in to
  the server, a local Whisper model (`Xenova/whisper-base.en`, set with
  `PAGECRAFT_SPEECH_MODEL`) writes the words, fetched once into
  `.data/models`. Stopping asks the AI for a summary and action items.

On macOS, use Command where this file says Ctrl.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run check:watch` | Type check in watch mode |
| `npm run test:watch` | Tests in watch mode |
| `npm run tokens` | Rebuild `src/styles/tokens.generated.css` from `tokens/` |
| `npm run capture -- pagecraft\|notion [steps.json\|url]` | Photograph Pagecraft or Notion headless at 1440 × 900 @2x |
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
- `docs/notion-study.md`: what Notion looks like and does, measured, and
  how far Pagecraft matches it.
- `docs/design-system.md`: tokens, primitives, states and interface text.
- `docs/decisions/`: decisions and their reasons.
- `docs/research/`: notes behind the decisions.
- `docs/plan.md`: the plan, and the version 1.1 roadmap.
- `docs/tasks.md`: what was built in each milestone and what was left out.
