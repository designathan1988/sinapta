# Ownership

Every concern has exactly one owning module. Code for a concern anywhere
else is a defect. Before adding code, find the owner here. If there is none,
add a row first, then write the code there.

Status: `planned` means the module does not exist yet; it is created in the
milestone shown. The Phase 5 close-out removes this column once every owner
exists.

## State and model

| Concern | Owner | Milestone |
| --- | --- | --- |
| State shape and initial state | `src/state/app-state.ts` | 1 |
| Store instance and subscription | `src/state/store.ts` | 1 |
| Applying commands and transactions | `src/state/dispatch.ts` | 1 |
| Command handler registration and lookup | `src/state/command-registry.ts` | 1 |
| Undo and redo | `src/state/history.ts` | 1 |
| `ui` slice commands that belong to no feature (sidebar, overlay, selection) | `src/state/ui.commands.ts` | 1 |
| Settings commands (theme) | `src/state/settings.commands.ts` | 1 |
| Save status commands | `src/state/persistence.commands.ts` | 1 |
| Cross-feature selectors over `AppState` | `src/state/app-state.selectors.ts` | 1 |
| Loading a whole workspace into the store | `src/state/workspace.commands.ts` | 1 |
| The saved part of the `ui` slice | `src/state/ui.schema.ts` | 1 |
| Test store and dispatcher | `src/state/state-builder.ts` | 1 |
| Domain types and JSON schemas | `src/model/` | 1 |
| Operation types and inverses | `src/model/operation.ts` | 1 |
| Applying operations to workspace data | `src/model/apply-operation.ts` | 1 |
| Workspace invariants (parent and child agreement, no cycles) | `src/model/workspace-invariants.ts` | 1 |
| Id generation and parsing | `src/model/id.ts` | 1 |
| What changed between two workspaces | `src/model/workspace-diff.ts` | 1 |
| Test workspaces | `src/model/workspace-builder.ts` | 1 |
| Rich text editing math (splice, split, merge, marks, links) | `src/model/rich-text.ts` | 3 |
| Finding the edit between two texts | `src/model/text-diff.ts` | 3 |
| Moving a block within the tree | `src/model/block-tree.ts` | 4 |
| Grapheme segmentation and offset conversion | `src/model/grapheme.ts` | 2 |
| Link `href` scheme allow-list | `src/model/link-href.ts` | 3 |

## Persistence

| Concern | Owner | Milestone |
| --- | --- | --- |
| Loading and saving, subscription to the store | `src/persistence/workspace-repository.ts` | 1 |
| IndexedDB access | `src/persistence/indexed-db-adapter.ts` | 1 |
| Storage adapter contract and in-memory adapter for tests | `src/persistence/storage-adapter.ts` | 1 |
| Migrations | `src/persistence/migrations/run-migrations.ts` plus one file per format change | 1 |
| JSON export and import | `src/persistence/workspace-file.ts` | 7 |

## Interface

| Concern | Owner | Milestone |
| --- | --- | --- |
| Composition root, the one root render | `src/app/bootstrap.ts` | 1 |
| URL and active page | `src/app/router.ts` | 2 |
| App shell layout | `src/app/shell.view.ts` | 1 |
| Block type definitions | `src/blocks/block-registry.ts` plus one folder per type | 2 |
| Pages: schema, commands, selectors, tree moves, trash | `src/blocks/page/` | 2 |
| Sidebar tree and favorites | `src/features/sidebar/` | 2 |
| Open page: title and icon | `src/features/editor/` | 2 |
| Page actions menu | `src/features/page-menu/` | 2 |
| Breadcrumbs | `src/features/breadcrumbs/` | 2 |
| Trash dialog | `src/features/trash/` | 2 |
| Move-to dialog | `src/features/move-to/` | 2 |
| Settings dialog | `src/features/settings/` | 1 |
| Property type definitions | `src/features/database/property-registry.ts` plus one folder per type | 5 |
| Table row models (sort, filter, order through the table engine) | `src/features/database/table-model.selectors.ts` | 5 |
| Keyboard shortcuts | `src/ui/shortcuts/shortcut-registry.ts` | 1 |
| Overlay dismissal, anchoring and focus return | `src/ui/overlay/` | 1 |
| Menu primitive | `src/ui/menu/` | 2 |
| Dialog primitive | `src/ui/dialog/` | 1 |
| Button primitive | `src/ui/button/` | 1 |
| Caret reading and restoring in the DOM, selection sync | `src/ui/caret/` | 3 |
| Projecting `RichText` into an editable element | `src/ui/rich-text/` | 3 |
| `beforeinput` to command translation | `src/features/editor/editor-input.view.ts` | 3 |
| Keys inside text blocks | `src/features/editor/editor-keys.view.ts` | 3 |
| Text and block commands | `src/features/editor/*.commands.ts` | 3 |
| Shortcuts typed at the start of a paragraph | `src/features/editor/block-shortcut.ts` | 3 |
| Block handle, block menus, block drag | `src/features/editor/editor-block-menu.view.ts` | 4 |
| Link field | `src/features/editor/editor-link.view.ts` | 4 |
| Slash menu | `src/features/slash-menu/` | 4 |
| What a block type declares | `src/blocks/block-definition.ts` | 3 |
| The shape shared by blocks that hold text | `src/blocks/text-block.ts` | 3 |
| Pointer drag sessions and drop targets | `src/ui/drag/` | 2 |
| Live-region announcements | `src/ui/announcer/` | 2 |
| Icons | `src/ui/icon/` | 1 |
| Interface text | `src/ui/copy.ts` | 1 |

## Styles and tokens

| Concern | Owner | Milestone |
| --- | --- | --- |
| Design token values | `tokens/*.tokens.json` | 1 |
| Token to CSS generation | `scripts/build-tokens.ts` | 1 |
| CSS layer order and global styles | `src/styles/index.css` | 1 |
| A component's styles | The CSS file beside its view, imported by that view | 1 |

## Tooling

| Concern | Owner | Milestone |
| --- | --- | --- |
| Import direction, file and function limits, banned names | `eslint.config.js` | 1 |
| Raw-value ban and class naming in CSS | `stylelint.config.js` | 1 |
| Content Security Policy | `vite.config.ts` (added to the built page) | 1 |
