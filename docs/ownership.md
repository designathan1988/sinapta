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
| Inside the open overlay: its panel, the lists and submenus open in it (outermost first), its search, its chosen values | `src/state/ui-overlay.commands.ts` | 16 |
| Settings commands (theme) | `src/state/settings.commands.ts` | 1 |
| Save status, export and import request commands | `src/state/persistence.commands.ts` | 1 |
| The persistence slice's shape and initial value | `src/state/persistence-state.ts` | 22 |
| The account's state: who is signed in, the sign-in step, the question asked | `src/state/account-state.ts` | 23 |
| Sign-in and account commands | `src/state/account.commands.ts` | 23 |
| Applying the others' operations and the server's workspace; the workspace list and switch requests | `src/state/sync.commands.ts` | 24 |
| The workspaces on the server, the one joined, what was asked | `src/state/sync-state.ts` | 25 |
| Cross-feature selectors over `AppState` | `src/state/app-state.selectors.ts` | 1 |
| Loading a whole workspace into the store | `src/state/workspace.commands.ts` | 1 |
| The saved part of the `ui` slice | `src/state/ui.schema.ts` | 1 |
| Test store and dispatcher | `src/state/state-builder.ts` | 1 |
| Domain types and JSON schemas | `src/model/` | 1 |
| Operation types and inverses | `src/model/operation.ts` | 1 |
| Stamping who made and who last changed a block | `src/model/author-stamp.ts` (stamped by `src/state/authorship.ts`) | 28 |
| Operations as they travel between clients: whole records, parsed | `src/model/operation.schema.ts` | 24 |
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
| Asking the server who is signed in and the sign-in screen's questions | `src/persistence/account-client.ts` | 23 |
| Parsing the server's account answers | `src/persistence/account.schema.ts` | 23 |
| Joining the workspace on the server, uploading or downloading it, following the account | `src/persistence/sync-client.ts` | 24 |
| One joined workspace: sending transactions in order, receiving the others' | `src/persistence/sync-session.ts` | 24 |
| Putting this client's unconfirmed transactions after the others' | `src/persistence/sync-rebase.ts` | 24 |
| Settings' requests to the server: the account's and workspace's names, members, invitations | `src/persistence/people-client.ts` | 25 |
| Parsing the server's workspace answers and events | `src/persistence/sync.schema.ts` | 24 |
| What joining makes again: the logged operations, and the unconfirmed transactions kept in the outbox | `src/persistence/sync-outbox.ts` | 24 |
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
| Notion's workspace menu: members, the account's workspaces, New workspace, Log out | `src/features/sidebar/workspace-menu.ts` | 25 |
| Settings › My account, General and People | `src/features/settings/settings-people.view.ts` | 25 |
| Notion's Share menu: Share and Publish tabs, the top bar's Share | `src/features/share/` | 26 |
| The faces of the others on the open page, beside the block each writes in, and their caret in its text | `src/features/presence/` | 27 |
| The inbox's notices from others: mentions of the person, replies to them | `src/features/inbox/inbox-notices.selectors.ts` | 27 |
| Created by and Last edited by properties | `src/features/database/properties/created-by/` | 28 |
| The Place property: a name and coordinates | `src/features/database/properties/place/` | 29 |
| The Person property and its people picker | `src/features/database/properties/person/` | 28 |
| Page verification: the command | `src/blocks/page/page-verify.ts` | 28 |
| The verified badge in the top bar | `src/features/page-menu/verified-badge.view.ts` | 28 |
| The Verification property | `src/features/database/properties/verification/` | 28 |
| The Map view: OpenStreetMap tiles, a pin per row with a place, its camera (drag, zoom) and a row added by double-click | `src/features/database/layouts/map/` | 29 |
| Notion AI: Ask AI in the block menu and on Space, the answer with Insert below, Replace, Discard | `src/features/ai/` | 30 |
| Notion AI's state: the question and the answer | `src/state/ai.commands.ts` | 30 |
| Asking the server's AI | `src/persistence/ai-client.ts` | 30 |
| A page published to the web, shown alone and read only | `src/app/public-page.ts` | 26 |
| Notion's sign-in screen: the address, password, login code and profile steps, the other ways in | `src/features/sign-in/` | 23 |
| A page as one HTML file | `src/features/markdown-export/html-export.selectors.ts` | 20 |
| Repeating templates: the repeat, its days, and the check that adds their rows | `src/features/database/template-repeat.commands.ts`, `src/app/template-repeats.ts` | 20 |
| The widths a person drags: the sidebar's and the side peek's | `src/state/widths.ts`, `src/features/row-peek/peek-resizer.view.ts` | 20 |
| The window's width as state, and the narrow-window drawer | `src/state/viewport.commands.ts`, `src/app/viewport.ts` | 19 |
| The sidebar panel beside the page, its resizer, or the drawer over it | `src/app/shell-sidebar.view.ts`, `src/app/sidebar-width.ts` | 19 |
| Working offline: the service worker, what it keeps, and its build step | `src/app/service-worker.ts`, `src/app/offline-cache.ts`, `vite.config.ts` | 19 |
| A new version: its state, the watch that offers it, and the prompt | `src/state/update.commands.ts`, `src/app/offline.ts`, `src/app/update-prompt.view.ts` | 19 |
| Installing as an app: the manifest and icons | `public/` | 19 |
| Open page: title and icon | `src/features/editor/` | 2 |
| Page actions menu, in Notion's groups | `src/features/page-menu/` (`page-menu-entries.ts` for the open page) | 2 |
| Breadcrumbs | `src/features/breadcrumbs/` | 2 |
| The page's place in the top bar: Private, Shared or its teamspace, opening Move to | `src/features/breadcrumbs/page-place.selectors.ts`, `breadcrumbs.view.ts` | 26 |
| Trash panel beside the sidebar | `src/features/trash/` | 2 |
| Move to: Notion's popover with a search, under the control that opened it (the top bar's place, a page's "…", a block) | `src/features/move-to/` | 2 |
| Settings dialog | `src/features/settings/` | 1 |
| Property type definitions | `src/features/database/property-registry.ts` plus one folder per type | 5 |
| Changing a property's type and carrying its values over | `src/features/database/property-type.commands.ts`, `property-convert.ts`, `property-type.selectors.ts` | 16 |
| New columns beside a column: duplicate, insert left and right | `src/features/database/property-copy.commands.ts` | 16 |
| A group's header actions and menu: new row in the group, hide | `src/features/database/group-actions.ts`, `group-header.view.ts`, `group-menu.view.ts` | 16 |
| A group's menu rows (name, hide, delete, colors), for a table's group and a board's column | `src/features/database/group-menu-entries.ts` | 20 |
| A value cell's bar (comment, copy) and its comment popovers | `src/features/database/cell-actions.view.ts` | 20 |
| A value's discussion count on a row's page | `src/features/database/row-value-comments.view.ts` | 20 |
| A column's menu and its submenus (Edit property, Change type, Sort, Calculate) | `src/features/database/column-menu.view.ts`, `column-menu-items.ts`, `column-calculate-items.ts`, `column-place-items.ts`, `property-edit-menu.ts` | 16 |
| What a property type declares | `src/features/database/property-definition.ts` | 5 |
| The conditions text, URL, email and phone are filtered by | `src/features/database/text-filters.ts` | 21 |
| The filter conditions a property offers (its type's, or ones built from its settings, as a rollup's) | `src/features/database/filter-operators.ts` | 21 |
| A rollup's quantified condition ids (any, none, every) and the choices drawn from them | `src/features/database/filter-quantifier.ts`, `filter-condition.view.ts` | 21 |
| A filter rule's popover in Notion's simple form: its head, its "…" menu, and the operands of "Is relative to today" and "Is between" | `src/features/database/filter-rule.view.ts`, `filter-rule-head.view.ts`, `filter-relative.view.ts`, `filter-between.view.ts` | 21 |
| The settings a rollup works out from, those shown before any is chosen | `src/features/database/properties/rollup/rollup-effective.ts` | 21 |
| Duplicating a view | `src/features/database/view-duplicate.commands.ts` | 21 |
| Each layout's own rows in the layout panel, the card layout's tiles and a timeline's end date | `src/features/database/view-settings/layout-items.ts` | 21 |
| How a view groups text and numbers (Text by, Number by) | `src/features/database/view-settings/group-by-panels.ts`, `properties/text/text-grouping.ts`, `properties/number/number-grouping.ts` | 21 |
| A column's Calculate submenu and the counts' 99+ switch | `src/features/database/column-calculate-items.ts` | 21 |
| A status shown as a checkbox | `src/features/database/properties/status/status-checkbox.ts` | 21 |
| Each layout's options in the stored view | `src/model/view-options.schema.ts` | 21 |
| Conditional color: a view's color rules, the color a row takes from them and how it is drawn | `src/features/database/color-rules.commands.ts`, `row-color.selectors.ts`, `row-color.css`, `view-settings/color-panel.ts` | 21 |
| The menu of the active view tab and how tabs show (text and icon, text, icon) | `src/features/database/view-tab-menu.view.ts` | 21 |
| The tab menu's rows about the database a view reads: Source, Add view to sidebar, Hide data source titles | `src/features/database/view-tab-source.ts`, `source-title.commands.ts` | 21 |
| The rows of any view, shown or not, filtered and sorted as it says | `src/features/database/view-rows.selectors.ts` | 21 |
| Views kept in the sidebar: the stored list and its commands | `src/state/sidebar-views.commands.ts` | 21 |
| The sidebar's arrangement from "Customize sidebar": stored order, hidden items, favorites shown | `src/state/sidebar-layout.commands.ts`, `src/features/sidebar/sidebar-layout.selectors.ts` | 21 |
| Reactions: on comments, on selected text and on a page (feed cards), and their emoji picker | `src/features/comments/reaction.commands.ts`, `reaction-picker.view.ts`, `reactions.view.ts`, `page-reactions.view.ts` | 21 |
| "Customize sidebar": the edit mode, its menus and the shortcuts | `src/features/sidebar/sidebar-customize.view.ts`, `sidebar-customize-menus.view.ts`, `sidebar-customize-choices.ts`, `sidebar-section-look.ts`, `sidebar-shortcuts.view.ts` | 21 |
| Views kept in the sidebar: each section and its menu | `src/features/sidebar/sidebar-views.view.ts`, `sidebar-view-menu.view.ts`, `sidebar-views.selectors.ts`, `sidebar-view-choice.ts` | 21 |
| A list view's and a feed view's options | `src/features/database/list-options.commands.ts`, `feed-options.commands.ts` | 21 |
| The floating outline: a page's headings as dashes at its right edge | `src/features/page-outline/` | 21 |
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
| Where a view opens its rows (side peek, center peek, full page) | `src/features/database/row-open.commands.ts` | 16 |
| The row peek: its panel, bar, mode switch and stepping through rows | `src/features/row-peek/` | 16 |
| Row templates: adding, the default, duplicating, deleting, and new rows made from them | `src/features/database/template.commands.ts`, `row-template.ts` | 16 |
| The New button's template list, a template's actions and the strip over a template (Repeat…) | `src/features/database/templates-menu.view.ts`, `template-actions.view.ts`, `template-banner.view.ts`, `template-open.ts` | 16 |
| A repeating template's cadence: its days (`repeat-rule.ts`), its draft and "Edit cadence" | `src/features/database/repeat-rule.ts`, `template-repeat.commands.ts`, `template-cadence.ts`, `template-cadence.view.ts`, `template-cadence-rows.view.ts`, `template-repeat.view.ts` | 16 |
| A button's automation: running its actions on a press, asking first and opening a web address, and its "Edit automation" dialog | `src/features/database/button-press.commands.ts`, `button-press.view.ts`, `button-values.ts`, `button-targets.ts`, `button-automation.ts`, `button-automation.view.ts`, `button-automation-item.ts`, `button-action-cards.view.ts`, `button-action-choices.view.ts`, `button-open-choice.view.ts`, `button-variables.view.ts`, `button-values-editor.view.ts` | 16 |
| Suggesting: suggested edits kept in the text, their discussions, Accept and Reject, the top bar's "Suggesting ×" and the selection panel's "Suggest edits" | `src/model/rich-text-suggestions.ts`, `src/features/comments/suggestion.commands.ts`, `suggestion.view.ts`, `src/features/page-info/page-info-suggesting.view.ts`, `src/features/format-toolbar/format-toolbar-suggest.view.ts` | 17 |
| The sidebar's tabs (Home, Calendar), Move to tab, and the Calendar tab's upcoming pages from views managed in calendar | `src/state/sidebar-tabs.commands.ts`, `src/features/sidebar/sidebar-tabs.selectors.ts`, `sidebar-tabs.view.ts`, `sidebar-move-tab.ts`, `src/features/database/view-calendar-item.ts` | 16 |
| A question asked before a delete ("Delete this template?", "Delete this comment?") | `src/ui/confirm/` | 16 |
| A menu row's own actions behind its "…" | `src/ui/menu/menu-submenu.ts`, `menu-item.view.ts`, `menu-more.css` | 16 |
| Reading and writing CSV text (RFC 4180) | `src/model/csv.ts` | 16 |
| Writing ZIP archives (stored, CRC-32) | `src/model/zip.ts` | 17 |
| A page and its subpages as an archive of Markdown files | `src/features/markdown-export/page-archive.selectors.ts` | 17 |
| Importing Markdown files as pages | `src/features/markdown-import/` | 17 |
| Printing a page alone | `src/styles/print.css` | 17 |
| Guards: rules that refuse a command's changes before they apply | `src/state/guard.ts` | 16 |
| Locks: what a locked page, database or view keeps; locking a page | `src/blocks/page/page-lock.ts` | 16 |
| Locking a view | `src/features/database/view-lock.commands.ts` | 16 |
| Backlinks: the pages that link to a page, and showing them under its title | `src/features/backlinks/` | 17 |
| Seeds: block trees that become pages with new ids | `src/features/onboarding/seed.ts` | 17 |
| The template gallery and its built-in page templates | `src/features/templates/` | 17 |
| Comments: discussions on a page, a block, its text or a row's property value; replies, resolving, deleting after a question | `src/features/comments/` | 17 |
| Value discussions leaving with their property | `src/features/comments/value-discussion-tidy.ts` | 20 |
| Keeping page versions in storage | `src/persistence/snapshot-store.ts` | 17 |
| The inbox: due reminders, read state, the dialog and the sidebar's count | `src/features/inbox/` | 17 |
| The inbox's notices from people: mentions, replies, edits to one's pages, pages shared with a guest | `src/features/inbox/inbox-notices.selectors.ts`, `inbox-changes.selectors.ts` | 27 |
| Settings › Notifications: the kinds of notice the inbox shows, kept per person | `src/features/settings/settings-notifications.view.ts`, `src/features/inbox/inbox.commands.ts` (`toggleNotices`) | 27 |
| Reminder notifications while the app is open | `src/app/reminder-notices.ts` | 17 |
| A page's history: its content, restoring a version, the full-window view, what each version changed | `src/features/page-history/` | 17 |
| Marking commented text | `src/model/rich-text-comments.ts`, `src/ui/rich-text/rich-text-projection.ts` | 17 |
| A board's sub-groups: the setting, its options and its lanes | `src/features/database/sub-group.commands.ts`, `view-settings/sub-group-panel.ts`, `layouts/board/board-lanes.view.ts` | 16 |
| CSV import: column types, the new database; CSV export of a view | `src/features/database/csv-import.ts`, `csv-import.commands.ts`, `csv-export.selectors.ts`, `csv-file.view.ts` | 16 |
| Table markup, headers, cells and their events | `src/features/database/table*.view.ts` | 5 |
| Table menus and popovers | `src/features/database/*-menu.view.ts`, `view-*.view.ts`, `cell-options.view.ts` | 6 |
| The database block type | `src/blocks/database/` | 5 |
| Command palette and search | `src/features/command-palette/` | 7 |
| The search's filters (title only, in page, date), kept while it is closed | `src/state/search-filters.ts` (shape), `src/features/command-palette/search-*.ts` | 20 |
| The pages a first visit starts with | `src/features/onboarding/` | 10 |
| The keyboard shortcut reference | `src/features/shortcut-help/` | 10 |
| Finding pages by the text of their blocks | `src/features/command-palette/command-palette-text.selectors.ts` | 10 |
| Focusing and showing elements once they are in the page, revealing a block (scroll and flash), and the only deferral views use (`afterRender`) | `src/ui/focus/` | 5 |
| Pictured tiles: a choice drawn as a row of tiles with a picture and a name | `src/ui/tiles/` | 21 |
| Table row models (sort, filter, order through the table engine) | `src/features/database/table-model.selectors.ts` | 5 |
| Keyboard shortcuts | `src/ui/shortcuts/shortcut-registry.ts` | 1 |
| Keys that apply only while one part is active (slash menu, Alt+F10), and the one capture listener for them | `src/ui/shortcuts/scoped-keys.ts` | 11 |
| Overlay dismissal, anchoring and focus return; how deep a control sits among open submenus | `src/ui/overlay/` | 1 |
| Menu primitive: every menu and option list (panel, header, name, search, rows, sections, switch rows, submenus beside a row) | `src/ui/menu/` | 2 |
| Select: a control showing a choice that opens its option list, in place of every browser `<select>` | `src/ui/select/` | 16 |
| Chips: option labels on their color, and color swatches | `src/ui/chip/` | 16 |
| Date picker: Notion's calendar, its month and its End date, Include time and Clear rows | `src/ui/date-picker/` | 16 |
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
| The line the slash menu is open on, and the slash menu's overlay kind | `src/features/editor/editor-slash.selectors.ts` | 21 |
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

## Server (ADR-0013)

| Concern | Owner | Milestone |
| --- | --- | --- |
| Routing a request under /api, cross-site refusal, failures as answers | `server/api.ts` | 22 |
| Reading requests and writing responses (node:http) | `server/http-exchange.ts` | 22 |
| Every route by method and path; health | `server/routes.ts` | 22 |
| Opening the database, migrating it, transactions | `server/database.ts` | 22 |
| The database's schema steps | `server/migrations.ts` | 22 |
| Parsing database rows | `server/rows.schema.ts` | 22 |
| Mounting the API in Vite's dev and preview servers | `server/vite-plugin.ts` | 22 |
| The standalone server for the built app | `server/main.ts` | 22 |
| Password hashing, tokens and sign-in codes | `server/secrets.ts` | 23 |
| Sessions in a cookie | `server/sessions.ts` | 23 |
| The users table | `server/users.ts` | 23 |
| Sign-in, sign-up, codes, sign-out, the signed-in user | `server/account-routes.ts` | 23 |
| The account routes' request bodies | `server/account.schema.ts` | 23 |
| Matching a path to a route with ":" parts | `server/route-match.ts` | 24 |
| The clients listening to each workspace (Server-Sent Events) | `server/workspace-events.ts` | 24 |
| Workspaces, members, snapshots and the operation log | `server/workspaces.ts` | 24 |
| The workspace routes | `server/workspace-routes.ts` | 24 |
| The workspace routes' request bodies | `server/workspace.schema.ts` | 24 |
| A workspace's members, invitations and name | `server/members.ts` | 25 |
| Settings › General and People routes, the owner's alone | `server/member-routes.ts` | 25 |
| Each workspace as it stands now, built by the model; a page alone | `server/workspace-state.ts` | 26 |
| A page's sharing: invited people, general access, published | `server/sharing.ts` | 26 |
| What a member reads and may change: the others' private pages kept from them | `server/member-access.ts` | 26 |
| Teamspaces on the server: the list, joining, requests and approval, the creation limit | `server/teamspaces.ts`, `server/teamspace-routes.ts`, `src/persistence/teamspace-client.ts` | 26 |
| A teamspace's security overrides, refused by the sharing routes | `server/teamspace-security.ts` | 26 |
| A web bookmark's preview: the server reads the page, the client asks once and keeps it on the block | `server/link-preview.ts`, `src/persistence/link-preview-client.ts`, `src/state/link-preview.commands.ts` | 31 |
| Each person's view of a workspace on the server: downloads, writes, streams and catch-up reads for guests and members | `server/workspace-access.ts` | 26 |
| The Share menu's routes, the shared pages listed for the sidebar, and published pages read by anyone | `server/sharing-routes.ts` | 26 |
| The sidebar's Shared section: the top pages shared with people | `src/features/sidebar/sidebar.selectors.ts` (`selectTreeRows`), `sidebar.view.ts` | 26 |
| Teamspaces: the block at the workspace's top that holds pages, made by `teamspace.create` | `src/blocks/teamspace/` | 26 |
| Settings › Teamspaces and "Create a teamspace", each teamspace's access and members | `src/features/teamspaces/` | 26 |
| The sidebar's Teamspaces section | `src/features/sidebar/sidebar-teamspaces.selectors.ts`, `sidebar-teamspaces.view.ts`, `sidebar-sections.css` | 26 |
| Which changes each access allows (comments for "Can comment"), for the server and the client alike | `src/model/page-access.ts` | 26 |
| A guest's access to each page, the editable blocks, and the dispatcher's refusal of the rest | `src/state/page-access.selectors.ts` | 26 |
| What a guest reaches: the pages shared with them, read and written at their access | `server/guest-access.ts` | 26 |
| Who is where: each person's open page, kept a minute, sent to the workspace | `server/presence.ts` | 27 |
| Notion AI: a local Ollama model, or what plain text allows | `server/ai.ts` | 30 |
| The AI's answer streamed as it is written: the route, its frames, the client | `server/ai-stream.ts`, `src/persistence/ai-stream.schema.ts`, `src/persistence/ai-client.ts` | 30 |
| AI autofill: a property of every row filled from its page, sent as the server's transaction | `server/ai-fill.ts` | 30 |
| A server on an in-memory database for tests | `server/test-context.ts` | 24 |
| The root render: the sign-in page or the app | `src/app/root-render.ts` | 23 |

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
| Native-resolution captures of Pagecraft and Notion, each control pointed at | `scripts/capture.ts` | 20 |
| What Notion looks like and does, and how far Pagecraft matches it | `docs/notion-study.md` | 20 |
| Raw-value ban and class naming in CSS | `stylelint.config.js` | 1 |
| Content Security Policy | `vite.config.ts` (added to the built page) | 1 |
