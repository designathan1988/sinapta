# Ownership

Every concern has exactly one owning module. Code for a concern anywhere
else is a defect. Before adding code, find the owner here. If there is none,
add a row first, then write the code there.

The last column is the milestone in which the owner was created. Every
owner listed here exists.

## State and model

| Concern | Owner | Milestone |
| --- | --- | --- |
| State shape and initial state | `src/state/app-state.ts` | 1 |
| Store instance and subscription | `src/state/store.ts` | 1 |
| Applying commands and transactions | `src/state/dispatch.ts` | 1 |
| Tidying the workspace after every command (block types' tidiers) | `src/state/tidy.ts` | 14 |
| Command handler registration and lookup | `src/state/command-registry.ts` | 1 |
| Undo and redo | `src/state/history.ts` | 1 |
| `ui` slice commands that belong to no feature (sidebar, overlay, selection) | `src/state/ui.commands.ts` | 1 |
| Inside the open overlay: its panel, the list open in it, its search | `src/state/ui-overlay.commands.ts` | 16 |
| Settings commands (theme) | `src/state/settings.commands.ts` | 1 |
| Save status, export and import request commands | `src/state/persistence.commands.ts` | 1 |
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
| Rich text editing math (splice, split, merge, marks, links, colors) | `src/model/rich-text.ts` | 3 |
| Finding the edit between two texts | `src/model/text-diff.ts` | 3 |
| Moving a block within the tree | `src/model/block-tree.ts` | 4 |
| Grapheme segmentation and offset conversion | `src/model/grapheme.ts` | 2 |
| Link `href` and image address allow-list | `src/model/link-href.ts` | 3 |
| Decoding imported JSON text into an unchecked value | `src/model/json-text.schema.ts` | 7 |
| Copying a block with everything inside it, under new ids | `src/model/block-copy.ts` | 8 |

## Persistence

| Concern | Owner | Milestone |
| --- | --- | --- |
| Loading and saving, subscription to the store, reloading in a read-only tab, asking for persistent storage | `src/persistence/workspace-repository.ts` | 1 |
| IndexedDB access | `src/persistence/indexed-db-adapter.ts` | 1 |
| Storage adapter contract and in-memory adapter for tests | `src/persistence/storage-adapter.ts` | 1 |
| One writer tab per browser profile (Web Locks) and save messages between tabs (BroadcastChannel) | `src/persistence/tab-lock.ts` | 11 |
| Migrations | `src/persistence/migrations/run-migrations.ts` plus one file per format change | 1 |
| JSON export and import, and carrying out export and import requests | `src/persistence/workspace-file.ts` | 7 |
| Keeping files beside the workspace: asset ids, blobs, base64 | `src/persistence/asset-store.ts` | 14 |
| Handing files people add to the asset store | `src/ui/asset/` | 14 |

## Interface

| Concern | Owner | Milestone |
| --- | --- | --- |
| Composition root, the one root render | `src/app/bootstrap.ts` | 1 |
| Applying the theme to the document | `src/app/theme.ts` | 10 |
| URL and active page | `src/app/router.ts` | 2 |
| Addresses of pages and blocks (`#/page/<id>?block=<id>`) | `src/ui/address/` | 13 |
| App shell layout | `src/app/shell.view.ts` | 1 |
| Block type definitions | `src/blocks/block-registry.ts` plus one folder per type | 2 |
| What file, PDF, video and audio blocks share: props, commands, empty field, caption | `src/blocks/media/` | 14 |
| Pages: schema, commands, selectors, tree moves, trash | `src/blocks/page/` | 2 |
| Sidebar tree and favorites | `src/features/sidebar/` | 2 |
| Open page: title and icon | `src/features/editor/` | 2 |
| Page actions menu | `src/features/page-menu/` | 2 |
| Breadcrumbs | `src/features/breadcrumbs/` | 2 |
| Trash dialog | `src/features/trash/` | 2 |
| Move-to dialog | `src/features/move-to/` | 2 |
| Settings dialog | `src/features/settings/` | 1 |
| Property type definitions | `src/features/database/property-registry.ts` plus one folder per type | 5 |
| What a property type declares | `src/features/database/property-definition.ts` | 5 |
| Database columns | `src/features/database/database.commands.ts` | 5 |
| Database rows: adding and setting values | `src/features/database/row.commands.ts` | 5 |
| A row's values as views read them, stored and kept by the app | `src/features/database/row-values.selectors.ts` | 9 |
| Saved views of a database | `src/features/database/view.commands.ts` | 6 |
| A view's layout and the properties it lays rows out by | `src/features/database/view-layout.commands.ts`, `view-layout.view.ts` | 9 |
| Searching the rows of a view | `src/features/database/view-search.commands.ts`, `view-search.selectors.ts` | 9 |
| Board, gallery, list and calendar layouts | `src/features/database/layouts/<layout>/` | 9 |
| A row shown as a card | `src/features/database/layouts/row-card/` | 9 |
| Table interface state (active cell, scroll window) | `src/features/database/table.commands.ts` | 5 |
| Row window, cell navigation and column drop order | `src/features/database/table.selectors.ts` | 5 |
| Property values on a row's page | `src/features/database/row-properties.view.ts` | 7 |
| Table markup, headers, cells and their events | `src/features/database/table*.view.ts` | 5 |
| Table menus and popovers | `src/features/database/*-menu.view.ts`, `view-*.view.ts`, `cell-options.view.ts` | 6 |
| The database block type | `src/blocks/database/` | 5 |
| Command palette and search | `src/features/command-palette/` | 7 |
| The pages a first visit starts with | `src/features/onboarding/` | 10 |
| The keyboard shortcut reference | `src/features/shortcut-help/` | 10 |
| Finding pages by the text of their blocks | `src/features/command-palette/command-palette-text.selectors.ts` | 10 |
| Focusing and showing elements once they are in the page, and the only deferral views use (`afterRender`) | `src/ui/focus/` | 5 |
| Table row models (sort, filter, order through the table engine) | `src/features/database/table-model.selectors.ts` | 5 |
| Keyboard shortcuts | `src/ui/shortcuts/shortcut-registry.ts` | 1 |
| Keys that apply only while one part is active (slash menu, Alt+F10), and the one capture listener for them | `src/ui/shortcuts/scoped-keys.ts` | 11 |
| Overlay dismissal, anchoring and focus return | `src/ui/overlay/` | 1 |
| Menu primitive: every menu and option list (panel, header, search, rows, sections, switch rows) | `src/ui/menu/` | 2 |
| Select: a control showing a choice that opens its option list, in place of every browser `<select>` | `src/ui/select/` | 16 |
| Chips: option labels on their color | `src/ui/chip/` | 16 |
| Switches: the look of an on and off setting | `src/ui/switch/` | 16 |
| Dialog primitive | `src/ui/dialog/` | 1 |
| Button primitive | `src/ui/button/` | 1 |
| Caret reading and restoring in the DOM, selection sync | `src/ui/caret/` | 3 |
| Tooltips for icon-only controls | `src/ui/tooltip/` | 7 |
| Reading pasted HTML as rich text | `src/ui/rich-text/pasted-html.ts` | 7 |
| Reading pasted Markdown as blocks and marks | `src/ui/rich-text/pasted-markdown.ts` | 8 |
| Projecting `RichText` into an editable element | `src/ui/rich-text/` | 3 |
| `beforeinput` to command translation | `src/features/editor/editor-input.view.ts` | 3 |
| Keys inside text blocks | `src/features/editor/editor-keys.view.ts` | 3 |
| Text and block commands | `src/features/editor/*.commands.ts` | 3 |
| Shortcuts typed at the start of a paragraph | `src/features/editor/block-shortcut.ts` | 3 |
| Block handle, block menus, block drag | `src/features/editor/editor-block-menu.view.ts` | 4 |
| Selection of whole blocks: commands, keys and clipboard | `src/features/editor/editor-selection.commands.ts`, `editor-selection.view.ts` | 7 |
| Paste and drop into a block | `src/features/editor/editor-paste.commands.ts`, `editor-paste.view.ts` | 7 |
| Pasted Markdown becoming typed, nested blocks | `src/features/editor/editor-paste-blocks.commands.ts` | 8 |
| Link field | `src/features/editor/editor-link.view.ts` | 4 |
| Slash menu | `src/features/slash-menu/` | 4 |
| Adding a block below another and duplicating a block | `src/features/editor/editor-insert.commands.ts` | 8 |
| Writing a page as Markdown and saving it | `src/features/markdown-export/` | 8 |
| A page's cover and width | `src/blocks/page/page-cover.commands.ts`, `src/features/editor/editor-cover.view.ts` | 10 |
| Duplicating a page with everything inside it | `src/blocks/page/page-duplicate.commands.ts` | 10 |
| Formatting toolbar and text color picker over selected text | `src/features/format-toolbar/` | 8 |
| What a block type declares | `src/blocks/block-definition.ts` | 3 |
| The shape shared by blocks that hold text | `src/blocks/text-block.ts` | 3 |
| Pointer drag sessions and drop targets | `src/ui/drag/` | 2 |
| Live-region announcements | `src/ui/announcer/` | 2 |
| Icons | `src/ui/icon/` | 1 |
| Saving text as a file the browser downloads | `src/ui/download/` | 8 |
| A web address field with an optional file choice | `src/ui/url-field/` | 8 |
| Interface text (its parts by area in `src/ui/copy/`) | `src/ui/copy.ts` | 1 |
| What the top bar says about the open page: last edit, favorite star, word count | `src/features/page-info/` | 12 |
| Home: greeting, recently visited pages, upcoming dates | `src/features/home/` | 12 |
| The @ and [[ menu: pages and dates to mention; backlinks of a page | `src/features/mention-menu/` | 13 |
| Emoji data, search and the picker | `src/ui/emoji/` | 13 |
| The :name emoji menu while typing | `src/features/emoji-menu/` | 13 |

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
