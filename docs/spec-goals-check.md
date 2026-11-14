# Specification goals: itemized check

Checked on 2026-11-14, at commit `test(app): back, forward, copy link
and print` and after it. Every goal of the specification and of the
plans that widened it is listed once, with its status and the evidence
for it.

- **Test**: a test file that exercises the goal; `npm run verify` runs
  them all (2,264 tests, all passing, the suite in 8.6 s).
- **Photo**: a capture plan in `.captures/plans/` whose photos were taken
  with `npm run capture` from the running app and looked at; `pNN` are
  Pagecraft, `nNN` Notion.
- **Finding**: an item of `docs/notion-study.md`, where Notion's own
  behaviour was recorded.

Status: **Done** (built and evidenced), **Done, narrowed** (built; the
part that cannot be built or shown here is named), **n/a** (Notion today
does not have it; the finding says so).

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
| A 900 px width mode | n/a | Notion's Appearance offers Full width only (finding 52, `n99-home-customize`) |
| Cover across the main area, Reposition, icon over the cover's foot | Done | `editor-cover.test.ts`; photo `p80-discussions` |
| Add icon, Add cover, Add comment on hover | Done | `editor-title-view.test.ts` |
| Page style Default, Serif, Mono; Small text | Done | `page-style.test.ts`, `page-menu-view.test.ts`; photo `p81-layout` |
| Top bar: breadcrumbs, Edited, comments, favorite, "…" | Done | `page-info-view.test.ts`, `src/features/comments/discussions-panel-view.test.ts`; photo `p80-discussions`; finding 51 |
| Sidebar: workspace, new page, Search, Home, Settings, Trash | Done | `sidebar-view.test.ts`; Notion's sidebar "design A" keeps the workspace, Settings and Trash at the foot (notion-study "Page, sharing and sidebar") |
| Favorites and Private sections, a page glyph | Done | `sidebar-view.test.ts`; photos `p25-section`, `p27-customize` |
| Right-click menus on blocks, sidebar rows, table rows, board and gallery cards | Done | `editor-context-menu.test.ts`, `sidebar-view.test.ts`, `table-context-menu.test.ts`, `layouts/row-card/row-card-view.test.ts`; photo `p85-card-menu` |
| An empty page's start list | Done | `src/features/editor/editor-start.test.ts`; photos `n101-empty-page`, `p86-start`; finding 54 |
| Placeholder in a focused empty block | Done | `editor-block-menu.test.ts` |
| Home: recent pages, upcoming dates | Done | `src/features/home/home.test.ts` |
| Home: favorites | n/a | Notion's Home is a sidebar tab today (finding 53, item 37) |

## S2 §4.2: editing

| Goal | Status | Evidence |
| --- | --- | --- |
| Block prefixes and inline Markdown while typing | Done | `editor-convert.test.ts`, `src/model/inline-markdown.test.ts` |
| Esc, Ctrl+A, Ctrl+D, Ctrl+Shift+Arrow, Ctrl+Enter, Ctrl+Alt+T, Ctrl+Shift+H, Ctrl+Shift+0–9 | Done | `editor-block-keys.test.ts`, `editor-selection-keys.test.ts`, `editor-move.test.ts` |
| Block color and background; /red, /red background, /default | Done | `editor-color.test.ts`, `slash-menu.test.ts` |
| Heading 4, toggle headings, subpages as blocks, /page | Done | `src/blocks/heading/heading.test.ts`, `editor-subpages.test.ts` |
| @ pages, dates, people, reminders; [[ links | Done | `src/features/mention-menu/mention-menu.test.ts` (people after @), `src/app/reminder-notices.test.ts` |
| "+" for a new subpage or a link to a page | Done | `src/features/editor/editor-plus.test.ts`, `mention-menu.test.ts`; photos `n97-plus`, `p78-plus`; finding 50 |
| :emoji and the emoji picker | Done | `src/features/emoji-menu/emoji-menu.test.ts`, `src/ui/emoji/emoji-picker.test.ts` |
| Copy blocks with their structure; paste web HTML as blocks | Done | `editor-selection-keys.test.ts`, `src/ui/rich-text/pasted-html-blocks.test.ts` |
| A URL pasted over text links it; alone it offers Mention, URL, bookmark, embed | Done | `editor-paste-view.test.ts`, `editor-paste-as.test.ts`; photos `n95-paste-plus`, `p79-paste-as`; finding 49 |
| Alt+drag duplicates, drag onto a sidebar page, Move to, Turn into page, Copy link to block | Done | `editor-block-drag.test.ts`, `editor-move-page.test.ts`, `editor-block-menu.test.ts`; photos `p66-move-popover`, `p72-move-block` |
| Code: language, highlighting, wrap, copy, caption | Done | `src/blocks/code/code*.test.ts` |
| Callout icon and color; image width, alignment, full screen | Done | `callout.test.ts`, `src/blocks/image/image*.test.ts` |
| Nested numbered list styles | Done | `numbered-list.test.ts` |
| Word and character count of the page | Done | `src/features/page-info/page-info.test.ts` |
| Word count of a block selection | n/a | Notion shows none (finding 53, `n99-home-customize`) |

## S2 §4.3–4.5: databases

See the section added below from the database audit.

## S2 §4.6: workspace

| Goal | Status | Evidence |
| --- | --- | --- |
| Search on Ctrl+K and Ctrl+P, recent pages, filters | Done | `shortcut-registry.test.ts`, `command-palette.test.ts`, `search-filters.test.ts` |
| Template gallery | Done | `src/features/templates/template*.test.ts` |
| Save a page as a template | n/a | Notion has no page "Save as template" (plan Task 17.2); database row templates: `src/features/database/template*.test.ts` |
| Page history with preview, restore and who wrote each version | Done | `src/features/page-history/page-history*.test.ts` |
| Comments on a page and on text, resolve; Ctrl+Shift+M | Done | `comment.test.ts`, `comments-view.test.ts`, `shortcut-registry.test.ts` |
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
| Accounts, scrypt, session cookie, same-origin check, sign-in screens | Done | `server/account-routes.test.ts`, `server/api-origin.test.ts` (a foreign page's change refused), `sign-in-view.test.ts`; photos `p35-sign-in`, `p36-log-out` |
| Sync: snapshot, operation log, live events, rebase, outbox | Done | `server/workspace-routes.test.ts`, `src/persistence/sync-rebase.test.ts`; photo `s02-sync` |
| Several workspaces: create, switch, rename, icon, delete, leave | Done | `server/workspace-delete.test.ts`, `server/member-routes.test.ts`, `src/features/settings/settings-general-view.test.ts`; photos `p37-workspaces`, `p83-workspace-general`, `p84-delete-workspace` |
| Members, invitations, roles | Done | `member-routes.test.ts`, `settings-view.test.ts`; photo `p38-people` |
| Sharing, permissions, guests, publishing | Done | `server/sharing-routes.test.ts`, `server/member-access.test.ts`, `src/state/page-access.test.ts`, `src/model/page-access.test.ts`; photos `p52-shared`, `p53-view-guest`, `p62-member-private` |
| Teamspaces: open, closed, private, requests, archive, security, limit | Done | `server/teamspace-routes.test.ts`, `teamspace-filters.test.ts`; photos `p55`, `p63`, `p68`–`p70`; findings 47, 48 |
| Real-time collaboration: presence, faces and carets | Done | `server/presence.test.ts`, `presence-view.test.ts`; photos `p54-collaborate`, `p56-block-presence`, `p64-caret` |
| Notifications to others: mentions, edits, shares; Settings › Notifications | Done | `inbox-notices.test.ts` (mentions, replies, edits, shares, kinds turned off); photos `p57-edit-notice`, `p61-notifications` |
| Notifications to this device's desktop | Done, narrowed | `inbox-notifier.test.ts`; photo `p75-desktop-notices`. Push to other devices needs a push service outside this machine; not built |
| Person, Created by, Last edited by, Verification, Place | Done | `row-groups-person.test.ts`, `src/model/author-stamp.test.ts`, `src/blocks/page/page-verify.test.ts`, `properties/place/place.test.ts`; photos `p46`, `p47`, `p59` |
| Map view | Done | `layouts/map/map.test.ts`; photos `p44-map`, `p58-map-move` |
| AI: Ask AI, Space prompt, streaming, autofill, chat | Done | `server/ai.test.ts`, `ai-stream.test.ts`, `ai-fill.test.ts`, `src/persistence/ai-client.test.ts`; photos `p43-ai`, `p49`–`p51`, `p60-ai-stream`, `p86-start` |
| Integrations and the public API | Done | `server/public-api.test.ts`; photo `p74-integrations` |
| Link previews from a server | Done | `server/link-preview.test.ts`, `src/state/link-preview.test.ts`; photo `p73-bookmark` |
| AI Meeting Notes with transcription from the microphone | Done | `transcriber.test.ts`, `recorder-listener.test.ts`, `src/persistence/meeting-client.test.ts`, `server/transcription.test.ts`; photo `p87-meeting-mic`: Chrome's microphone played a spoken WAV (made with Windows' speech synthesizer), the app recorded it in 6-second pieces, the server's local Whisper model (`Xenova/whisper-base.en`, Transformers.js) wrote the words, and the AI summed them up. The small model mishears some words of a synthetic voice ("lunch" for "launch") |

## Quality targets

| Target | Status | Evidence |
| --- | --- | --- |
| Typing under 16 ms on 1,000 blocks | Done | `src/features/editor/editor-typing-speed.test.ts`: a keystroke's command and the page drawn again |
| A 5,000-row table responsive | Done | `table-model-speed.test.ts` (sort, filter, group, formulas, rollups under 100 ms), `table-render-speed.test.ts` (drawn window, a change redrawn under 50 ms) |
| Full tests under 10 s; verify under 30 s | Done | the suite: 8.75 s for 2,264 tests; `npm run verify` (types, lint, styles, format, tests): 25 s |
| WCAG 2.2 AA contrast | Done | `scripts/token-contrast.test.ts` |
| Every action by keyboard; focus visible | Done | `scoped-keys.test.ts`, `table-keys.test.ts`, `slash-menu-keys.test.ts`, `mention-menu-keys.test.ts`; `:focus-visible` in every control's CSS; photo `sc4-keyboard` |
| Reload restores the open page and the sidebar | Done | `workspace-repository.test.ts`; photos `s05-reload`, `sc3-reload` |
| 250 lines per file, 40 per function, no lint warnings, tokens only in CSS | Done | `eslint.config.js`, `stylelint.config.js`, `architecture.test.ts`; `npm run verify` passes |
| `setState` only in `dispatch.ts`; storage only in `persistence` | Done | ESLint rules in `eslint.config.js` |

## Differences kept on purpose

- Embeds frame the hosts the content security policy names (31 hosts,
  `src/blocks/embed/`); Notion embeds any address.
- A link mention shows the address without its scheme; Notion shows the
  page's own title.
- The "Paste as" menu is 282 px wide, as Pagecraft's other menus; Notion's
  is 200 px. The Discussions panel's empty state is 254 px high; Notion's
  316 px.
- "Get started with" sits under the page's first line; Notion's at the
  window's foot.
- Notion's bell in the Discussions panel and "New page in…" in the "+"
  menu are not built; page notices are set in Settings › Notifications.
