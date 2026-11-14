# Specification goals: itemized check

Checked on 2026-11-14, last after the commit `test(app): keyboard reach
of the main screen`. Every goal of the specification and of the
plans that widened it is listed once, with its status and the evidence
for it.

- **Test**: a test file that exercises the goal; `npm run verify` runs
  them all (2,361 tests, all passing, the suite in about 8 s).
- **Photo**: a capture plan in `.captures/plans/` whose photos were taken
  with `npm run capture` from the running app and looked at; `pNN` are
  Pagecraft, `nNN` Notion.
- **Finding**: an item of `docs/notion-study.md`, where Notion's own
  behaviour was recorded.

Status: **Done** (built and evidenced); **Done, as §1 asks** (a third
party's service that a local server cannot run, such as Slack or payment:
§1 asks for its menu to be drawn as Notion's and to say so, and it is);
**Not in Notion** (a goal of an earlier plan that Notion today does not
have; matching Notion means leaving it out, and the finding shows it).

A script checks this table: every test file and photo it names exists
(124 rows, none missing, 2026-11-14). Every task of
`docs/superpowers/plans/2026-11-14-full-notion.md` (22.1 to 31.4) was
matched to a row of "Version 3" below.

Sources: S1 is `docs/specification.md` §1 "In scope"; S2 is
`docs/superpowers/specs/2026-11-11-notion-parity-design.md` §4; V3 is the
version 3 scope of ADR-0013 and the plan
`docs/superpowers/plans/2026-11-14-full-notion.md`.

## S1: the first version's scope

| Goal | Status | Evidence |
| --- | --- | --- |
| Sidebar tree of nested pages | Done | `src/features/sidebar/sidebar-view.test.ts` |
| Create, rename, favorite, trash, restore a page | Done | `src/blocks/page/page.test.ts`, `page-tree.test.ts`, `page-trash.test.ts`, `src/features/page-menu/page-rename-view.test.ts`, `src/features/trash/trash.test.ts` |
| Move a page by drag | Done | `src/blocks/page/page-tree.test.ts` (move, drop target) |
| Page title, emoji icon, cover (preset or image), full width | Done | `src/features/editor/editor-title-view.test.ts`, `editor-icon.test.ts`, `editor-cover.test.ts`, `src/blocks/page/page-style.test.ts` |
| Duplicate a page with everything inside | Done | `src/blocks/page/page-duplicate.test.ts` |
| Export a page as Markdown | Done | `src/features/markdown-export/markdown-export.test.ts` |
| Paragraph, headings, lists, to-do, toggle, quote, callout, divider, code, page link, image, bookmark, table of contents | Done | `src/blocks/*/…test.ts` (heading, numbered-list, toggle, callout, code, image, bookmark, table-of-contents), `src/features/editor/editor-convert.test.ts`, `src/features/slash-menu/slash-menu.test.ts` |
| Type, split and merge, indent with Tab, drag to reorder | Done | `src/features/editor/editor-input.test.ts`, `editor-structure.test.ts`, `editor-block-drag.test.ts` |
| Slash menu, "+" beside a block, duplicate block | Done | `src/features/slash-menu/slash-menu*.test.ts`, `src/features/editor/editor-insert.test.ts` |
| Paste Markdown as blocks | Done | `src/ui/rich-text/pasted-markdown.test.ts`, `src/features/editor/editor-paste-blocks.test.ts` |
| Bold, italic, underline, strike, code, link, color, shortcuts, toolbar over a selection | Done | `src/features/editor/editor.test.ts`, `src/features/format-toolbar/format-toolbar*.test.ts`, `src/model/rich-text.test.ts`; photo `p10-selection-panel` |
| Database page, each row a page | Done | `src/features/database/database.test.ts`, `row-open.test.ts` |
| The eleven first property types | Done | `src/features/database/property-registry.test.ts`, `property-types.test.ts` |
| Table, board, gallery, list, calendar | Done | `table-view.test.ts`, `layouts/board/board.test.ts`, `grouped-layouts-view.test.ts`, `layouts/list/list-view.test.ts`, `layouts/calendar/calendar.test.ts` |
| Sort, filter, search in view, resize, reorder, hide columns, edit cells, add rows and properties, several views | Done | `view.test.ts`, `filter-edit.test.ts`, `view-search.test.ts`, `table-model.test.ts`, `table-keys.test.ts`, `row-insert.test.ts`, `view-tabs-view.test.ts` (all in `src/features/database/`) |
| Command palette, search of titles and text, Ctrl+K | Done | `src/features/command-palette/command-palette.test.ts`, `src/ui/shortcuts/shortcut-registry.test.ts` ("Ctrl+K opens search") |
| Breadcrumbs, back and forward | Done | `src/features/breadcrumbs/page-place.test.ts`, `src/app/shortcut-history.test.ts` |
| Keyboard shortcut reference | Done | `src/features/shortcut-help/shortcut-help.test.ts` |
| Undo and redo of every change | Done | `src/state/history.test.ts` |
| Light and dark themes, following the system, manual override | Done | `src/app/theme.test.ts` |
| Autosave, export and import of the workspace as JSON | Done | `src/persistence/workspace-repository.test.ts`, `workspace-file.test.ts` |
| First visit: tour page and sample database | Done | `src/features/onboarding/onboarding.test.ts` |

## S2 §4.1: layout and chrome

| Goal | Status | Evidence |
| --- | --- | --- |
| Page column about 708 px, Full width | Done | `--size-content-max` 44rem in `editor.css`; `page-style.test.ts` |
| A 900 px width mode | Not in Notion | Notion's Appearance offers Full width only (finding 52, `n99-home-customize`) |
| Cover across the main area, Reposition, icon over the cover's foot | Done | `editor-cover.test.ts`; photo `p80-discussions` |
| Add icon, Add cover, Add comment on hover | Done | `editor-title-view.test.ts` |
| Page style Default, Serif, Mono; Small text | Done | `page-style.test.ts`, `page-menu-view.test.ts`; photo `p81-layout` |
| Top bar: breadcrumbs, Edited, comments, favorite, "…" | Done | `page-info-view.test.ts`, `src/features/comments/discussions-panel-view.test.ts`; photo `p80-discussions`; finding 51 |
| Sidebar: workspace, new page, Search, Home, Settings, Trash | Done | `sidebar-view.test.ts`; Notion's sidebar "design A" keeps the workspace, Settings and Trash at the foot (notion-study "Page, sharing and sidebar") |
| Favorites and Private sections, a page glyph | Done | `sidebar-view.test.ts`; photos `p25-section`, `p27-customize` |
| Right-click menus on blocks, sidebar rows, table rows, board and gallery cards | Done | `editor-context-menu.test.ts`, `sidebar-view.test.ts`, `table-context-menu.test.ts`, `layouts/row-card/row-card-view.test.ts`; photo `p85-card-menu` |
| An empty page's start list | Done | `src/features/editor/editor-start.test.ts`; photos `n101-empty-page`, `p86-start`; finding 54 |
| Placeholder in a focused empty block | Done | `editor-block-menu.test.ts`; `src/blocks/paragraph/paragraph-view.test.ts` |
| Home: recent pages, upcoming dates | Done | `src/features/home/home.test.ts` |
| Home: favorites | Done | Home lists the favorite pages as cards: `src/features/home/home-view.test.ts` ("Home's favorites"); Notion's Home is a sidebar tab today (finding 53, item 37) |

## S2 §4.2: editing

| Goal | Status | Evidence |
| --- | --- | --- |
| Block prefixes and inline Markdown while typing | Done | `editor-convert.test.ts`, `src/model/inline-markdown.test.ts` |
| Esc, Ctrl+A, Ctrl+D, Ctrl+Shift+Arrow, Ctrl+Enter, Ctrl+Alt+T, Ctrl+Shift+H, Ctrl+Shift+0–9 | Done | `editor-block-keys.test.ts`, `editor-selection-keys.test.ts`, `editor-move.test.ts` |
| Block color and background; /red, /red background, /default | Done | `editor-color.test.ts`, `slash-menu.test.ts` |
| Heading 4, toggle headings, subpages as blocks, /page | Done | `src/blocks/heading/heading.test.ts`, `editor-subpages.test.ts` |
| @ pages, dates, people, reminders; [[ links | Done | `src/features/mention-menu/mention-menu.test.ts` (people after @), `src/app/reminder-notices.test.ts`; a date near today reads @Today, @Tomorrow, @Yesterday and every mention is followed by a space, as Notion's: `src/ui/rich-text/date-mention.test.ts`, `rich-text-projection.test.ts`, `editor-mention.test.ts`; photos `n104-date-mention`, `p94-date-mention` (finding 57) |
| "+" for a new subpage, a new page in a chosen place, or a link to a page | Done | `src/features/editor/editor-plus.test.ts`, `mention-menu.test.ts`; photos `n97-plus`, `p78-plus`, `p91-page-in`; finding 50 |
| :emoji and the emoji picker | Done | `src/features/emoji-menu/emoji-menu.test.ts`, `src/ui/emoji/emoji-picker.test.ts` |
| Copy blocks with their structure; paste web HTML as blocks | Done | `editor-selection-keys.test.ts`, `src/ui/rich-text/pasted-html-blocks.test.ts` |
| A URL pasted over text links it; alone it offers Mention, URL, bookmark, embed | Done | `editor-paste-view.test.ts`, `editor-paste-as.test.ts`; photos `n95-paste-plus`, `p79-paste-as`; finding 49 |
| Alt+drag duplicates, drag onto a sidebar page, Move to, Turn into page, Copy link to block | Done | `editor-block-drag.test.ts`, `editor-move-page.test.ts`, `editor-block-menu.test.ts`; photos `p66-move-popover`, `p72-move-block` |
| Code: language, highlighting, wrap, copy, caption | Done | `src/blocks/code/code*.test.ts` |
| Callout icon and color; image width, alignment, full screen | Done | `callout.test.ts`, `src/blocks/image/image*.test.ts`; dragging the width handle: `image-view.test.ts` |
| Nested numbered list styles | Done | `numbered-list.test.ts` |
| Word and character count of the page | Done | `src/features/page-info/page-info.test.ts` |
| Word count of a block selection | Not in Notion | Notion shows none: blocks selected (finding 53, `n99-home-customize`) or text highlighted (finding 55, `n103-selection-words`) leave the page menu's foot on the page's total, as Pagecraft's |

## S2 §4.3: blocks

Paths: `blk/` is `src/blocks/`, `db/` is `src/features/database/`.

| Goal | Status | Evidence |
| --- | --- | --- |
| Simple table with header row and column | Done | `blk/simple-table/simple-table.test.ts`, `simple-table-view.test.ts` |
| Columns, 2 to 5, resizable | Done | `blk/column-list/column-list.test.ts`, `column-cap.test.ts`, `blk/column/column-view.test.ts` |
| Equation block and inline TeX | Done | `blk/equation/equation.test.ts`, `src/features/editor/editor-equation.test.ts`, `src/ui/rich-text/equation.test.ts`, `src/model/tex/tex-parse.test.ts` |
| Breadcrumb block | Done | `blk/breadcrumb/breadcrumb.test.ts` |
| File, PDF, video, audio | Done | `blk/media-blocks.test.ts` |
| Embed of any https page; known hosts' players | Done | `blk/embed/embed.test.ts` ("frames any other https page as it is"), `src/features/editor/editor-paste-as.test.ts`; photo `p79-paste-as` |
| Synced block | Done | `blk/synced-block/synced-block.test.ts` |
| Button block: insert blocks, add a database row | Done | `blk/button/button.test.ts`, `button-view.test.ts` |
| Inline database and linked view | Done | `db/inline-database.test.ts`, `db/database-inline-view.test.ts`, `db/linked-view.test.ts`, `db/linked-view-view.test.ts` |

## S2 §4.4: database properties

| Goal | Status | Evidence |
| --- | --- | --- |
| Status with To-do, In progress, Complete | Done | `db/properties/status/status.test.ts`, `status-checkbox.test.ts`, `db/row-groups-status.test.ts` |
| Options: rename, recolor, reorder, delete; descriptions | Done | `db/option.test.ts`, `db/property-edit-view.test.ts` |
| Number formats, bar and ring | Done | `db/properties/number/number.test.ts`, `number-config-view.test.ts`; photos `p19-properties`, `p19-number-tiles` |
| Date end, time, formats, relative dates | Done | `db/properties/date/date.test.ts`, `date-filters.test.ts`, `db/cell-date-view.test.ts` |
| Files and media | Done | `db/properties/files/files.test.ts`, `files-editor-view.test.ts` |
| Unique ID with prefix | Done | `db/properties/unique-id/unique-id.test.ts` |
| Relation, one way or two way | Done | `db/properties/relation/relation.test.ts` ("a one-way relation") |
| Rollup with every function | Done | `db/properties/rollup/rollup.test.ts`, `rollup-filters.test.ts`, `rollup-notion.test.ts` |
| Formula, with Notion 2.0's functions | Done | `db/properties/formula/formula.test.ts`, `formula-notion2.test.ts`; photo `p77-formula2` |
| Button property: set values, open a page | Done | `db/button-press.test.ts`, `db/button-automation-view.test.ts` |

## S2 §4.5: database views and behavior

| Goal | Status | Evidence |
| --- | --- | --- |
| Filter groups with and / or, typed operators | Done | `db/filter-edit.test.ts`, `db/table-model.test.ts`, `db/filter-operators.test.ts`; photo `p24-between` |
| Group by in table, list and gallery; collapse; hide empty; board sub-groups | Done | `db/grouped-layouts-view.test.ts`, `db/row-groups.test.ts`, `db/layouts/board/board-lanes.test.ts` |
| Column calculations | Done | `db/calculations.test.ts` (sum, average, median, min, max, range, dates, percents, per group) |
| Row selection, bulk edit, drag order, wrap, freeze, fill down | Done | `db/row-bulk.test.ts`, `db/table-rows-view.test.ts` |
| Board: order, columns, card size and preview, by status, multi-select, checkbox or date | Done | `db/layouts/board/board-card.test.ts`, `board-view.test.ts`, `board.test.ts`; photo `p34-board` |
| Gallery card size and preview; calendar week view and options | Done | `db/layouts/row-card/row-card*.test.ts`, `db/layouts/calendar/calendar*.test.ts` |
| Timeline, chart (column, bar, line, donut), form, feed | Done | `db/layouts/timeline/*.test.ts`, `db/layouts/chart/chart-view.test.ts`, `db/layouts/form/form-view.test.ts`, `db/layouts/feed/feed-view.test.ts` |
| Open rows to the side, centered or full page; previous and next | Done | `src/features/row-peek/peek.test.ts`, `db/row-open.test.ts` |
| Row templates and a default | Done | `db/template.test.ts`, `db/templates-menu-view.test.ts` |
| CSV import and export | Done | `db/csv-import.test.ts`, `db/csv-export.test.ts` |
| Lock a database or a view | Done | `db/view-lock.test.ts`, `blk/page/page-lock.test.ts` |

## S2 §4.6: workspace

| Goal | Status | Evidence |
| --- | --- | --- |
| Search on Ctrl+K and Ctrl+P, recent pages, filters | Done | `shortcut-registry.test.ts`, `command-palette.test.ts`, `search-filters.test.ts` |
| Template gallery | Done | `src/features/templates/template*.test.ts` |
| Save a page as a template | Done | Page menu "More › Save as template", the gallery's "Your templates": `src/features/templates/own-template.test.ts`; photo `p92-save-template` (finding 56); database row templates: `src/features/database/template*.test.ts` |
| Page history with preview, restore and who wrote each version | Done | `src/features/page-history/page-history*.test.ts` |
| Comments on a page and on text, resolve; Ctrl+Shift+M | Done | `comment.test.ts`, `comments-view.test.ts`, `shortcut-registry.test.ts` |
| Page notification settings: the Discussions bell and Get notified | Done | `src/features/inbox/comment-notices.test.ts`, `page-menu-view.test.ts`; photos `n102-bell`, `p89-bell` |
| Backlinks; Lock page | Done | `backlinks.test.ts`, `page-lock.test.ts` |
| Customize page: backlinks, page discussions, inline comments, outline | Done | `page-style.test.ts` ("page.setLayout"), `page-outline.test.ts`; photo `p81-layout`; finding 52 |
| Import Markdown, ZIP, CSV and HTML | Done | `markdown-import.test.ts`, `markdown-archive.test.ts`, `csv-import.test.ts`, `src/features/markdown-import/html-page.test.ts`; photo `p82-html-import` |
| Export Markdown and HTML, with subpages as a ZIP | Done | `markdown-export.test.ts`, `page-archive.test.ts` ("HTML archive") |
| Print or save as PDF | Done | `src/features/page-menu/page-print.test.ts`; `src/styles/print.css` |
| Ctrl+N, Ctrl+[, Ctrl+], Ctrl+L, Ctrl+Shift+U, Ctrl+Shift+L | Done | `shortcut-registry.test.ts`, `shortcut-actions.test.ts`, `shortcut-history.test.ts`, `theme.test.ts` |
| Reminders and the inbox | Done | `reminder-notices.test.ts`, `src/features/inbox/inbox*.test.ts` |
| Trash search, emptied after 30 days | Done | `trash.test.ts`, `trash-view.test.ts`, `page-trash.test.ts` |
| Two tabs do not overwrite each other | Done | `tab-lock.test.ts`, `workspace-repository-tabs.test.ts` |
| Ask the browser to keep the data | Done | `src/persistence/workspace-repository-persist.test.ts` |
| Layouts under 768 px; installable, offline | Done | `src/state/viewport.test.ts`, `src/app/shell-view.test.ts`, `offline.test.ts`, `offline-cache.test.ts`; photos `s04-offline`, `s06-offline-bar` |

## Version 3: what the first version left out

| Goal | Status | Evidence |
| --- | --- | --- |
| Local server, SQLite, migrations, health route | Done | `server/api-origin.test.ts` (health), `src/app/architecture.test.ts` (server and app kept apart); photo `s01-health` |
| Accounts, scrypt, session cookie, same-origin check, sign-in screens, Settings › My account | Done | `server/account-routes.test.ts`, `server/api-origin.test.ts` (a foreign page's change refused), `sign-in-view.test.ts`; photos `p35-sign-in`, `p36-log-out`; My account's name and email: `src/features/settings/settings-account-view.test.ts`, `server/account-routes.test.ts` |
| Sync: snapshot, operation log, live events, rebase, outbox | Done | `server/workspace-routes.test.ts`, `src/persistence/sync-rebase.test.ts`; photo `s02-sync`; the outbox retried after the server cannot be reached, with Syncing… and Offline: `src/persistence/sync-session.test.ts`, `src/app/shell-view.test.ts` |
| Several workspaces: create, switch, rename, icon, delete, leave | Done | `server/workspace-delete.test.ts`, `server/member-routes.test.ts`, `src/features/settings/settings-general-view.test.ts`; photos `p37-workspaces`, `p83-workspace-general`, `p84-delete-workspace`; the list and the last one opened: `server/workspace-routes.test.ts`; Log out: `account-client.test.ts`, profile name: `server/account-routes.test.ts` |
| Members, invitations, roles | Done | `member-routes.test.ts`, `settings-view.test.ts`; photo `p38-people` |
| Sharing, permissions, guests, publishing | Done | `server/sharing-routes.test.ts`, `server/member-access.test.ts`, `src/state/page-access.test.ts`, `src/model/page-access.test.ts`; photos `p52-shared`, `p53-view-guest`, `p62-member-private`; General access and who may change it, and Start collaborating: `server/sharing-routes.test.ts`, `src/features/sidebar/start-collaborating.test.ts` |
| Teamspaces: open, closed, private, requests, archive, security, limit | Done | `server/teamspace-routes.test.ts`, `teamspace-filters.test.ts`; photos `p55`, `p63`, `p68`–`p70`; findings 47, 48; archive and restore: `src/blocks/teamspace/teamspace.test.ts` |
| Real-time collaboration: presence, faces and carets | Done | `server/presence.test.ts`, `presence-view.test.ts`; photos `p54-collaborate`, `p56-block-presence`, `p64-caret` |
| Notifications to others: mentions, edits, shares; Settings › Notifications | Done | `inbox-notices.test.ts` (mentions, replies, edits, shares, kinds turned off); photos `p57-edit-notice`, `p61-notifications` |
| Notifications to this device and to the person's other devices | Done | `inbox-notifier.test.ts`; `server/push.test.ts` (a mention pushed once, a share pushed, a browser that turns push off forgotten), `src/persistence/push-client.test.ts`, `src/app/service-worker-push.test.ts`; photos `p75-desktop-notices`, `p88-push`: the built app on the real server, Settings › Notifications › Push notices, a subscription with the browser's push service (FCM), a page shared, and the service worker's notification "A page was shared with you" read back |
| Person, Created by, Last edited by, Verification, Place | Done | `row-groups-person.test.ts`, `src/model/author-stamp.test.ts`, `src/blocks/page/page-verify.test.ts`, `properties/place/place.test.ts`; photos `p46`, `p47`, `p59`; their filters: `properties/person/person.test.ts`, `created-by/created-by.test.ts`, `verification/verification.test.ts`; the top bar's badge: `verified-badge-view.test.ts` |
| Map view | Done | `layouts/map/map.test.ts`; photos `p44-map`, `p58-map-move`; the first frame from the pins: `map.test.ts` |
| AI: Ask AI, Space prompt, streaming, autofill, chat | Done | `server/ai.test.ts`, `ai-stream.test.ts`, `ai-fill.test.ts`, `src/persistence/ai-client.test.ts`; photos `p43-ai`, `p49`–`p51`, `p60-ai-stream`, `p86-start`; Insert below, Replace, Discard and the chat: `src/features/ai/ai.test.ts`; Space on an empty line: `editor-input.test.ts`; the Ollama branch: `server/ai.test.ts` |
| Integrations and the public API | Done | `server/public-api.test.ts`; photo `p74-integrations` |
| Notion's app connections (Slack, Google Drive, GitHub, Jira, Figma, Asana) | Done, as §1 asks | Settings › Connections › "Connect apps", each "Connect" disabled with "Needs Notion's servers": they run on Notion's servers, which a local server cannot reach; `src/features/integrations/third-party-view.test.ts`; photo `p93-plans-apps` |
| Plans and Upgrade | Done, as §1 asks | Workspace menu "Upgrade" opens Settings › Plans: "Free, on your own server"; Upgrade is disabled, as payment is Notion's own service; `src/features/settings/settings-plans-view.test.ts`; photo `p93-plans-apps` |
| Link previews from a server | Done | `server/link-preview.test.ts`, `src/state/link-preview.test.ts`; photo `p73-bookmark`; no host on this machine or its network is fetched: `server/link-preview.test.ts`; the card: `src/blocks/bookmark/bookmark-view.test.ts` |
| AI Meeting Notes with transcription from the microphone | Done | `transcriber.test.ts`, `recorder-listener.test.ts`, `src/persistence/meeting-client.test.ts`, `server/transcription.test.ts`; photo `p87-meeting-mic`: Chrome's microphone played a spoken WAV (made with Windows' speech synthesizer), the app recorded it in 6-second pieces, the server's local Whisper model (`Xenova/whisper-base.en`, Transformers.js) wrote the words, and the AI summed them up. The small model mishears some words of a synthetic voice ("lunch" for "launch"); typed notes and a refused microphone: `meeting-notes.test.ts`, `transcriber.test.ts` |

## Quality targets

| Target | Status | Evidence |
| --- | --- | --- |
| Typing under 16 ms on 1,000 blocks | Done | `src/features/editor/editor-typing-speed.test.ts`: a keystroke's command and the page drawn again |
| A 5,000-row table responsive | Done | `table-model-speed.test.ts` (sort, filter, group, formulas, rollups under 100 ms), `table-render-speed.test.ts` (drawn window, a change redrawn under 50 ms) |
| Full tests under 10 s; verify under 30 s | Done | the suite: about 9 s for 2,359 tests; `npm run verify` (types, lint, styles, format, tests): about 25 s |
| WCAG 2.2 AA contrast | Done | `scripts/token-contrast.test.ts` |
| Every action by keyboard; focus visible | Done | `scoped-keys.test.ts`, `table-keys.test.ts`, `slash-menu-keys.test.ts`, `mention-menu-keys.test.ts`; `:focus-visible` in every control's CSS; photo `sc4-keyboard`; every control of the main screen takes the focus and rings are left out only on text fields and script-focused panels, listed: `src/app/focus-rings.test.ts`; Ctrl+/ opens the block menu: `editor-keys-controls.test.ts` |
| Reload restores the open page and the sidebar | Done | `workspace-repository.test.ts`; photos `s05-reload`, `sc3-reload` |
| 250 lines per file, 40 per function, no lint warnings, tokens only in CSS | Done | `eslint.config.js`, `stylelint.config.js`, `architecture.test.ts`; `npm run verify` passes |
| `setState` only in `dispatch.ts`; storage only in `persistence` | Done | ESLint rules in `eslint.config.js` |

## Measured against Notion

Every difference found while checking is closed; what is left are
measurements that come close rather than match to the pixel:

- "Paste as" is 200 px wide, as Notion's, and 141 px high to Notion's
  123 px: its rows are Pagecraft's menu rows, Notion's rows here are
  28 px.
- The empty Discussions panel is 316 px high, as Notion's.
- A link mention shows the page's title as the server reads it from the
  page (`og:title`, else `<title>`); github.com/notion, for one, is an
  account named "Trove", which is what its mention shows.
