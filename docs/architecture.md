# Architecture

How data flows through Pagecraft and what each layer may do. The rules come
from specification section 2; the reasons are in `docs/decisions/`. This
file is kept current with the code.

## Data flow

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

One command, step by step:

1. A view translates a DOM event into a command object and calls
   `dispatch(command)`.
2. The dispatcher stamps the command with what purity forbids handlers to
   create: new ids and the current time. A command declares how many ids
   it needs, as a fixed count or as a function of what it carries.
3. The dispatcher looks up the handler in the command registry and calls it:
   `(state, command) => CommandEffect`. The effect holds the operations for
   workspace data and, when the command also changes them, the next `ui` or
   `persistence` slice. Workspace data changes only through operations.
4. `applyOperations` in `src/model/` produces the next workspace and the
   inverse operations. `workspace-invariants` checks the result. On failure
   nothing changes and `dispatch` returns a typed error.
5. The dispatcher builds the next `AppState` (workspace, `ui`, `history`,
   `persistence`) and writes it with one `setState` call. A command whose
   effect is a whole workspace instead of operations (loading from storage,
   importing a file, the starting pages of a first visit) clears history,
   since there is nothing before it to undo. The invariants are checked on
   that workspace too.
6. Subscribers run: the root render re-renders from the new state; the
   repository compares the previous and next workspace, queues the changed
   record ids and saves them after 300 ms; the router writes the URL.

## AppState

| Slice | Holds | Saved | In history |
| --- | --- | --- | --- |
| `workspace` | `blocks`, `views`, `rootIds`, `settings` (theme) | Yes, per record | Yes, except `settings` |
| `ui` | Active page, expanded pages, text selection, block selection, sidebar, open overlay, active view per database, active table cell, calendar month, search text per view | The lasting part, as one `meta` value | No |
| `history` | Undo and redo stacks of inverse transactions | No | Is the history |
| `persistence` | Save status, skipped record count, export and import requests | No | No |

- Workspace data is normalized: maps keyed by id, relations by id.
- Derived values (breadcrumbs, visible tree, table row models, board
  columns, calendar days, a page's Markdown, the formatting toolbar's range
  and style) come from selectors and are never written back. Values the app
  keeps on a record, such as a row's created time, are read into row values
  by `src/features/database/row-values.selectors.ts`.
- The browser owns two things during an interaction: the caret inside the
  focused block and the pointer position during a drag. Both are written to
  the store when the interaction ends.

## Layers

```text
app ──> features ──> blocks ──> ui ──> state ──> model
                                         ^          ^
persistence ─────────────────────────────┴──────────┘
```

| Layer | May do | Must not do |
| --- | --- | --- |
| `model` | Types, schemas, operations, pure text and tree math | Import the project, touch DOM, storage, clock |
| `state` | Store, dispatch, history, registries, cross-feature selectors | Touch DOM or storage, import upward |
| `ui` | Shared primitives, overlay host, shortcuts, caret, drag, copy | Know any feature or block type |
| `blocks` | One folder per block type: definition, view, styles; `src/blocks/index.ts` is the entry for other layers | Import a feature |
| `features` | One folder per feature: views, commands, selectors | Import another feature except through its `index.ts` |

Inside a layer, other folders are reached through their `index.ts`. A child
folder may import its parent's modules: a block type imports
`block-definition.ts`, a property type `property-definition.ts`, a database
layout the database feature's selectors and views. A parent reaches a child
only through the child's `index.ts` (ADR-0011).
| `app` | Compose: register handlers, features, shortcuts; root render; router | Hold logic that belongs to a feature |
| `persistence` | Load, save, migrate, export, import | Import anything but `state` and `model` |

Dependencies that would point upward are inverted through registries owned
by a lower layer and filled in `src/app/bootstrap.ts`:

- Command handlers: `src/state/command-registry.ts`.
- Block types: `src/blocks/block-registry.ts`. A block type's own commands
  are part of its definition, and bootstrap registers them all from the
  registry.
- Property types: `src/features/database/property-registry.ts`.
- Shortcuts: `src/ui/shortcuts/shortcut-registry.ts`.

The registries are filled once at startup and are read-only afterwards, so
they are configuration, not state.

## Boundaries

- JSON enters at storage load and file import, passes through the schemas in
  `src/model/`, and becomes typed values or a typed error. Nothing below the
  boundary re-checks shapes. Imported text is decoded by
  `src/model/json-text.schema.ts`, then migrated, then typed by the
  workspace schema; no other module calls `JSON.parse`.
- Effects live at the edges: the root render (DOM), the repository
  (IndexedDB), the router (URL) and the dispatcher's id and clock stamping.
  Everything between is pure.
- The exported workspace file is a public contract, changed only through a
  `schemaVersion` bump and a migration.

## Requests to the edges

Some things a view asks for are effects, not state changes: writing an
export file, reading an imported one. A view cannot reach the persistence
layer, and a command handler is pure. So the view dispatches a command that
only records the request in the `persistence` slice
(`persistence.requestExport`, `persistence.requestImport`), and
`src/persistence/workspace-file.ts`, which subscribes to the store, carries
it out after the store has finished notifying and dispatches the outcome.

Saving one page as Markdown changes no state, so the page menu builds the
text with a selector and hands it to `src/ui/download/` directly.

On startup, `startRepository` reports whether storage was empty. Bootstrap
then dispatches `workspace.seedGettingStarted`, after saving has started,
so the starting pages are saved like any change.

## Overlays

`ui.overlay` holds at most one open overlay: its kind, the element it is
anchored to and, where needed, a text range, a highlighted option or a
search query. The shell renders the overlay that matches the kind. Dialogs
use `<dialog>` with `showModal()`; menus and popovers use the Popover API
in manual mode, with dismissal owned by `src/ui/overlay/`.

## Rendering

One root render in `src/app/bootstrap.ts` subscribes to the store and calls
lit-html `render` with the shell template. Lists are keyed by record id.
After a render the caret is restored from `ui.selection` by `src/ui/caret/`.

The render runs on every keystroke, so it writes nothing to the document
that has not changed: `src/app/theme.ts` touches the theme attribute and the
color-scheme meta only when the theme changes (rewriting the meta restyles
the whole page), and restoring the caret does not refocus a block that has
focus.

## Where things go

See `docs/ownership.md` for the owner of each concern and `CLAUDE.md` for
the short rules on adding a block type, feature, property type, shortcut,
string or token.
