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

Status: **Done** (built and evidenced), for every row.

Checked against the sources, goal by goal (2026-11-14, last):

- Every row of `docs/specification.md` §1 "In scope" and "Quality
  targets" has its row under S1 and Quality targets.
- Each of the 77 rows of the parity design's §4 tables was matched to a
  row here by a script; the 14 it could not match by their words were
  matched by hand (the icon over the cover, the sidebar's items, the empty
  page's start list, block prefixes, inline Markdown, Esc and Ctrl+A, the
  block keys, mentions, emoji, embeds, column calculations, templates,
  the navigation keys, reminders), each to the row that covers it.
- Every task of `docs/superpowers/plans/2026-11-14-full-notion.md` (22.1
  to 31.4) has its row under "Version 3", and ADR-0014's decisions 6 to 8
  (app connections, plans, passkeys) have theirs.
- A script checks that every test file and photo this table names exists:
  none is missing.
- Walks through the running app, signed in to the review server, each a
  plan of steps with an expected result (`.captures/plans/`), as a person
  would use it, every photo looked at:
  - `w1-layout` (§4.1): sidebar sections, cover and icon, the top bar,
    Appearance and layout (Serif, Small text), the block, sidebar and
    database row menus, a new page's start, Home.
  - `w2-editing` (§4.2): typing, Markdown shortcuts, inline Markdown,
    the slash menu, mentions, selection and the block keys.
  - `w3-blocks` (§4.3): columns from a right click, a table, a block
    equation, a breadcrumb, a video and an embed, a synced block, a
    button, a database and a linked view.
  - `w4-properties` (§4.4): every property type set in a new database,
    unique IDs starting at 1.
  - `w5-views` (§4.5): table, board, list, gallery, calendar, timeline,
    chart and map views, filters and sorts.
  - `w6-workspace` (§4.6): Ctrl+K search, backlinks, version history,
    Ctrl+Shift+M's comment box, Lock and unlock, Ctrl+N, Ctrl+[ and
    Ctrl+], Ctrl+Shift+L to dark and back, the inbox, the trash's search,
    Settings › Import and export.
  - `w7-history`: an edit keeps a version on the server and the history
    shows it, written by the signed-in person.
  - `w8-keys` (§4.2): Ctrl+Shift+4 to a to-do and Ctrl+Enter to check
    it, Ctrl+Shift+0 and 7, Ctrl+Alt+T both ways, nested numbering
    1. a. i., a word double-clicked and colored red, Ctrl+Shift+H giving
    another word the same color, a code block's Language, Wrap, Caption
    and Copy, a callout, an image's link and file choice, Ctrl+C on a
    selected block (plain text and HTML) and Ctrl+V, Alt+drag dropping a
    copy.
  - `w9-data` (§4.4, §4.5): number, select and date properties, a
    currency format, a Sum in it, an option renamed and recolored, a date
    range with start and end times, a formula, a relation searched and
    picked, a rollup, a filter moved to the advanced filter with a group,
    group by with a group collapsed and opened, rows selected and let go
    with Escape, Export as CSV, Lock view, and a CSV imported through the
    file picker.
  - `w10-billing`: Plans refuses Plus without a card and leads to
    Billing; a test card saved there upgrades the workspace and leaves a
    paid invoice; back to Free, and the card removed.
  - `w11-board` (§4.4, §4.5): a select and a percent number, Count all,
    the exported CSV's text, a board by Stage, Alt+→ moving a card, card
    size Large, Lock database (no new view, rows still added).
  - `w12-blocks` (§4.2): nested bullets •, ◦, ▪; a JavaScript code block
    in Notion's token colors, wrapped; a callout's icon chosen by search
    and Enter, and its Blue background; an image uploaded through the
    file picker at its own size.
  - `w13-filter` (§4.5): Add advanced filter, Add filter rule's list, a
    group, Delete filter.
  - `w14-updates`: the page menu's Updates & analytics docks the panel;
    Updates lists the run of edits (the title and two lines) and, apart,
    a suggestion typed in Suggesting ("Add: “ zz”", Reply); Analytics
    the view kept on the server with who opened it, and the editors; the
    period chip chooses Last 7 days; Show your view history set to Don't
    allow takes the viewer off the list, Allow puts them back; » closes it.
  - `w15-view-settings` (§4.5): the view settings' Copy link to view and
    Data source settings: Source's panel, Edit properties, Lock database
    on and off, AI autofill's panel with the Text column's kinds.
  - `w16-automations` (§4.5): Automations on Free show Notion's card and
    Upgrade now; on Plus (a test card), New automation, Page added → Set
    Status to Done, a new row takes Done; Turn into says Tasks is a Tasks
    database; then the automation, the row, Plus and the card undone.
  - `w18-slack` (§4.5): a new automation's Do lists Send Slack
    notification beside Edit property, Add page to and Send webhook.
  - `w19-notify` (§4.5): Send notification to lists the workspace's
    people; Grace switched on, the editor shows 1.
  - `w17-linked-events` (§4.5): Linked events without a calendar shows
    Notion's Connect your calendar card.
  Bugs these walks found are fixed with a test each: a database title's
  Enter adding a hidden line and unique IDs starting at 2, a child listed
  twice after a synced block, text typed after inline Markdown keeping
  its mark, clicking below a page, a new equation's editor, the trash's
  Escape, page versions kept only in one browser, a turned block's caret
  going to its start, copied blocks without HTML, Alt+drag down the
  gutter making columns, a menu cut by the window's edge (a last column's,
  and a sidebar row's at the bottom), a sum without its column's
  currency, a formula lost on Escape, the relation picker without search,
  the advanced filter wrapping its rule in a group, a locked view not
  shown, Escape not letting go of selected rows, and the server unable to
  read a snapshot an older app kept.

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
| Page column 708 px in a 900 px frame, as Notion's; Full width | Done | measured at 1440 × 900: Notion's text runs 708 px (`n106-column`), Pagecraft's 708 px centred in the same main area (`p95-column`), `--size-content-max`; Full width: `page-style.test.ts` |
| The 900 px page frame (S2 §4.1: "708 px wide, 900 px or full") | Done | Notion's default page is the 708 px column in a 900 px frame, with no separate mode (finding 52); the row above measures both |
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
| Block prefixes and inline Markdown while typing | Done | `editor-convert.test.ts`, `src/model/inline-markdown.test.ts`; walk `w2-editing` (prefixes, inline Markdown, text after it plain) |
| Esc, Ctrl+A, Ctrl+D, Ctrl+Shift+Arrow, Ctrl+Enter, Ctrl+Alt+T, Ctrl+Shift+H, Ctrl+Shift+0–9 | Done | `editor-block-keys.test.ts`, `editor-selection-keys.test.ts`, `editor-move.test.ts`; walk `w8-keys` (Ctrl+Shift+4, 0 and 7, Ctrl+Enter, Ctrl+Alt+T closing and opening, Ctrl+Shift+H) |
| Block color and background; /red, /red background, /default | Done | `editor-color.test.ts`, `slash-menu.test.ts`; walk `w12-blocks` (a callout's Blue background from its menu); `w8-keys` (red text) |
| Heading 4, toggle headings, subpages as blocks, /page | Done | `src/blocks/heading/heading.test.ts`, `editor-subpages.test.ts` |
| @ pages, dates, people, reminders; [[ links | Done | `src/features/mention-menu/mention-menu.test.ts` (people after @), `src/app/reminder-notices.test.ts`; a date near today reads @Today, @Tomorrow, @Yesterday and every mention is followed by a space, as Notion's: `src/ui/rich-text/date-mention.test.ts`, `rich-text-projection.test.ts`, `editor-mention.test.ts`; photos `n104-date-mention`, `p94-date-mention` (finding 57) |
| "+" for a new subpage, a new page in a chosen place, or a link to a page | Done | `src/features/editor/editor-plus.test.ts`, `mention-menu.test.ts`; photos `n97-plus`, `p78-plus`, `p91-page-in`; finding 50 |
| :emoji and the emoji picker | Done | `src/features/emoji-menu/emoji-menu.test.ts`, `src/ui/emoji/emoji-picker.test.ts`; walk `w12-blocks` ("rocket" searched, Enter chooses it) |
| Copy blocks with their structure; paste web HTML as blocks | Done | `editor-selection-keys.test.ts`, `src/ui/rich-text/pasted-html-blocks.test.ts`; walk `w8-keys` (Ctrl+C gives plain text and HTML, Ctrl+V rebuilds the callout) |
| A URL pasted over text links it; alone it offers Mention, URL, bookmark, embed | Done | `editor-paste-view.test.ts`, `editor-paste-as.test.ts`; photos `n95-paste-plus`, `p79-paste-as`; finding 49 |
| Alt+drag duplicates, drag onto a sidebar page, Move to, Turn into page, Copy link to block | Done | `editor-block-drag.test.ts`, `editor-move-page.test.ts`, `editor-block-menu.test.ts`; photos `p66-move-popover`, `p72-move-block`; walk `w8-keys` (Alt+drag drops a copy, the original stays) |
| Code: language, highlighting, wrap, copy, caption | Done | `src/blocks/code/code*.test.ts`; walks `w8-keys`, `w12-blocks` (JavaScript chosen, Notion's token colors read from its stylesheet, Wrap keeps spaces) |
| Callout icon and color; image width, alignment, full screen | Done | `callout.test.ts`, `src/blocks/image/image*.test.ts`; dragging the width handle: `image-view.test.ts`; dragged with the mouse in the running app, 100 to 41 percent: photo `p99-image-drag`; walk `w12-blocks` (icon 🚀, Blue background, an image uploaded through the file picker at its own size) |
| Nested numbered list styles | Done | `numbered-list.test.ts`; walks `w8-keys` (1. a. i.), `w12-blocks` (bullets •, ◦, ▪) |
| Word and character count of the page | Done | `src/features/page-info/page-info.test.ts` |
| Word and character count of the page or the block selection | Done | the page: the page menu's foot, `page-info.test.ts`; the blocks selected: their menu, headed "2 blocks", ends with their words and characters and acts on all of them: `editor-block-menu.test.ts`; photo `p96-selection-count` (Notion's own page menu clears the selection, `n107-blocks-words`) |

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
| Options: rename, recolor, reorder, delete; descriptions | Done | `db/option.test.ts`, `db/property-edit-view.test.ts`; walk `w9-data` (High renamed Urgent, recolored red) |
| Number formats, bar and ring | Done | `db/properties/number/number.test.ts`, `number-config-view.test.ts`; photos `p19-properties`, `p19-number-tiles`; walks `w9-data` (Currency, $1,200.00), `w11-board` (Percent, 25%) |
| Date end, time, formats, relative dates | Done | `db/properties/date/date.test.ts`, `date-filters.test.ts`, `db/cell-date-view.test.ts`; walk `w9-data` (typed start, End date, Include time, the end's own time) |
| Files and media | Done | `db/properties/files/files.test.ts`, `files-editor-view.test.ts` |
| Unique ID with prefix | Done | `db/properties/unique-id/unique-id.test.ts` |
| Relation, one way or two way | Done | `db/properties/relation/relation.test.ts` ("a one-way relation"); walk `w9-data` (related to Tasks, searched and picked) |
| Rollup with every function | Done | `db/properties/rollup/rollup.test.ts`, `rollup-filters.test.ts`, `rollup-notion.test.ts`; walk `w9-data` (a rollup of the relation's names) |
| Formula, with Notion 2.0's functions | Done | `db/properties/formula/formula.test.ts`, `formula-notion2.test.ts`; photo `p77-formula2`; walk `w9-data` (prop("Budget") * 2 gives 2400 and 600) |
| Button property: set values, open a page | Done | `db/button-press.test.ts`, `db/button-automation-view.test.ts` |

## S2 §4.5: database views and behavior

| Goal | Status | Evidence |
| --- | --- | --- |
| Filter groups with and / or, typed operators | Done | `db/filter-edit.test.ts`, `db/table-model.test.ts`, `db/filter-operators.test.ts`; photo `p24-between`; walks `w9-data`, `w13-filter` (Add to advanced filter, Add advanced filter, Add filter rule's list, a group, Delete filter; the first control 76 px in, as Notion's) |
| Group by in table, list and gallery; collapse; hide empty; board sub-groups | Done | `db/grouped-layouts-view.test.ts`, `db/row-groups.test.ts`, `db/layouts/board/board-lanes.test.ts`; walk `w9-data` (grouped by Priority, Urgent collapsed and opened) |
| Column calculations | Done | `db/calculations.test.ts` (sum, average, median, min, max, range, dates, percents, per group); walks `w9-data` (Sum in the column's currency), `w11-board` (Count all) |
| Row selection, bulk edit, drag order, wrap, freeze, fill down | Done | `db/row-bulk.test.ts`, `db/table-rows-view.test.ts`; walk `w9-data` (a row ticked, the bulk bar, Escape lets go) |
| Board: order, columns, card size and preview, by status, multi-select, checkbox or date | Done | `db/layouts/board/board-card.test.ts`, `board-view.test.ts`, `board.test.ts`; photo `p34-board`; walk `w11-board` (columns by Stage, Alt+→ moves a card, card size Large) |
| Gallery card size and preview; calendar week view and options | Done | `db/layouts/row-card/row-card*.test.ts`, `db/layouts/calendar/calendar*.test.ts` |
| Timeline, chart (column, bar, line, donut), form, feed | Done | `db/layouts/timeline/*.test.ts`, `db/layouts/chart/chart-view.test.ts`, `db/layouts/form/form-view.test.ts`, `db/layouts/feed/feed-view.test.ts` |
| Open rows to the side, centered or full page; previous and next | Done | `src/features/row-peek/peek.test.ts`, `db/row-open.test.ts` |
| Row templates and a default | Done | `db/template.test.ts`, `db/templates-menu-view.test.ts` |
| CSV import and export | Done | `db/csv-import.test.ts`, `db/csv-export.test.ts`; walks `w9-data` (a CSV imported through the file picker), `w11-board` (the exported CSV's text read) |
| Lock a database or a view | Done | `db/view-lock.test.ts`, `blk/page/page-lock.test.ts`; walks `w9-data` (Lock view: a lock on the tab, no new property), `w11-board` (Lock database: no new view, rows still added) |

## S2 §4.6: workspace

| Goal | Status | Evidence |
| --- | --- | --- |
| Search on Ctrl+K and Ctrl+P, recent pages, filters | Done | `shortcut-registry.test.ts`, `command-palette.test.ts`, `search-filters.test.ts` |
| Template gallery | Done | `src/features/templates/template*.test.ts` |
| Save a page as a template | Done | Page menu "More › Save as template", the gallery's "Your templates": `src/features/templates/own-template.test.ts`; photo `p92-save-template` (finding 56); database row templates: `src/features/database/template*.test.ts` |
| Page history with preview, restore and who wrote each version | Done | `src/features/page-history/page-history*.test.ts`; kept on the server for every member (ADR-0014, decision 10): `server/page-versions.test.ts`, `src/persistence/server-snapshots.test.ts`; walk `w7-history` |
| Database automations: Page added or a property edited; Edit property, Add page to, Send webhook, Send Slack notification, Send notification to; plan-gated as Notion's | Done | `src/features/database/automation.test.ts`, `view-settings/automations-panel-view.test.ts`, `server/automation-webhook.test.ts`, `src/persistence/automation-webhook-client.test.ts`; walk `w16-automations` |
| Manage data sources: add or link a source, a view showing it, unlink | Done | `src/features/database/data-source.test.ts`, `src/features/sidebar/sidebar.test.ts`, `src/model/operation-wire.test.ts`; hand walk `h3-data-sources` (twice: the count holds after a reload) |
| Linked events: connect a calendar, file a coming meeting's notes as a page | Done | `view-settings/linked-events-panel-view.test.ts`; walk `w17-linked-events` |
| Turn into Tasks, Meetings or Skills database | Done | `src/features/database/task-database.test.ts`; walk `w16-automations` |
| Updates & analytics: a page's runs of edits, its views by day, viewers and editors | Done | `src/features/page-updates/page-updates*.test.ts`, `src/state/page-updates.test.ts`, `src/persistence/page-views.test.ts`, `server/page-views.test.ts`; walk `w14-updates` |
| Comments on a page and on text, resolve; Ctrl+Shift+M | Done | `comment.test.ts`, `comments-view.test.ts`, `shortcut-registry.test.ts` |
| Page notification settings: the Discussions bell and Get notified | Done | `src/features/inbox/comment-notices.test.ts`, `page-menu-view.test.ts`; photos `n102-bell`, `p89-bell` |
| Backlinks; Lock page | Done | `backlinks.test.ts`, `page-lock.test.ts` |
| Customize page: backlinks, page discussions, inline comments, outline | Done | `page-style.test.ts` ("page.setLayout"), `page-outline.test.ts`; photo `p81-layout`; finding 52 |
| Import Markdown, ZIP, CSV and HTML | Done | `markdown-import.test.ts`, `markdown-archive.test.ts`, `csv-import.test.ts`, `src/features/markdown-import/html-page.test.ts`; photo `p82-html-import` |
| Export Markdown and HTML, with subpages as a ZIP | Done | `markdown-export.test.ts`, `page-archive.test.ts` ("HTML archive") |
| Print or save as PDF | Done | `src/features/page-menu/page-print.test.ts`; `src/styles/print.css` |
| Ctrl+N, Ctrl+[, Ctrl+], Ctrl+L, Ctrl+Shift+U, Ctrl+Shift+L | Done | `shortcut-registry.test.ts`, `shortcut-actions.test.ts`, `shortcut-history.test.ts`, `theme.test.ts` |
| Reminders and the inbox | Done | `reminder-notices.test.ts`, `src/features/inbox/inbox*.test.ts` |
| Trash search, emptied after 30 days | Done | `trash.test.ts`, `trash-view.test.ts` (Escape closes it even with words typed), `page-trash.test.ts`; walk `w6-workspace` |
| Two tabs do not overwrite each other | Done | `tab-lock.test.ts`, `workspace-repository-tabs.test.ts` |
| Ask the browser to keep the data | Done | `src/persistence/workspace-repository-persist.test.ts` |
| Layouts under 768 px; installable, offline | Done | `src/state/viewport.test.ts`, `src/app/shell-view.test.ts`, `offline.test.ts`, `offline-cache.test.ts`; photos `s04-offline`, `s06-offline-bar` |

## Version 3: what the first version left out

| Goal | Status | Evidence |
| --- | --- | --- |
| Local server, SQLite, migrations, health route | Done | `server/api-origin.test.ts` (health), `src/app/architecture.test.ts` (server and app kept apart); photo `s01-health`; the Vite plugin mounts it in the review server every capture runs against, as in `p97-plans` and `p98-apps`, which reached its routes |
| Accounts, scrypt, session cookie, same-origin check, sign-in screens, passkeys, Settings › My account | Done | `server/account-routes.test.ts`, `server/api-origin.test.ts` (a foreign page's change refused), `sign-in-view.test.ts`; photos `p35-sign-in`, `p36-log-out`; My account's name and email: `src/features/settings/settings-account-view.test.ts`, `server/account-routes.test.ts`; passkeys (WebAuthn, checked with `node:crypto`: the challenge used once, this site's origin and host, the P-256 signature): `server/passkey.test.ts`, `sign-in-view.test.ts`, `settings-account-view.test.ts`; photo `p100-passkey` (a passkey added with Chrome's authenticator, Log out, then "Passkey" signs back in); My account lists passkeys with Remove (`settings-account-view.test.ts`, photo `p101-passkey-off`); signing in through Google, ChatGPT, Apple, Microsoft or SSO by OpenID Connect, its ID token checked (signature, issuer, audience, expiry, nonce, verified email): `server/oidc.test.ts`, `sign-in-view.test.ts`; photo `p102-oidc` (Log out, "Google", the test provider's page, back signed in) |
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
| Notion's app connections (Gmail, Google Calendar, Slack, Outlook, iCloud, Asana, GitHub, Jira, Figma, Google Drive) | Done | each connects the way the app lets anyone in (ADR-0014, decision 6): Slack's channel webhook receives the mention notices, a calendar's iCal address puts its events under Home's Upcoming, Gmail adds "Email page", and the others' links are offered as a preview when pasted: `server/app-connections.test.ts`, `server/ical.test.ts`, `src/model/app-connection.test.ts`, `third-party-view.test.ts`, `home-view.test.ts`, `page-menu-email.test.ts`, `editor-paste-preview.test.ts`; photos `n108-connections`, `p98-apps` (a public holiday calendar's events on Home), `p98b-apps-off` |
| Plans and Upgrade | Done | Notion's Free, Plus, Business and Enterprise, each with Notion's limits: files up to 5 MB on Free (50 MB, this server's largest, above), page history of 7, 30, 90 days or all; the workspace menu's Upgrade opens them, and the workspace's owners choose; a paid plan is charged to the workspace's card for each member (Plus $12, Business $24 a month): `server/member-routes.test.ts`, `settings-plans-view.test.ts`, `page-history-plan.test.ts`, `asset-store.test.ts`; photo `p97-plans` |
| Billing: a card, charges and invoices | Done | Settings › Billing keeps the card through the server's payment processor (checked by Luhn, expiry and CVC; only brand, last four, expiry and the processor's token kept), an upgrade without a card says so and goes through once one is saved, a declined card or charge leaves the plan as it was, and each charge is an invoice (ADR-0014, decision 12): `server/billing.test.ts`, `src/model/billing.test.ts`, `src/persistence/billing-client.test.ts`, `settings-billing-view.test.ts`; walk `w10-billing`. With a Stripe key the card is saved on Stripe Checkout's page and each upgrade is a Stripe PaymentIntent: `server/stripe.test.ts`, `src/app/billing-return.test.ts`; real money moves once the owner registers a Stripe account's key, none being registered on this machine |
| Link previews from a server | Done | `server/link-preview.test.ts`, `src/state/link-preview.test.ts`; photo `p73-bookmark`; no host on this machine or its network is fetched: `server/link-preview.test.ts`; the card: `src/blocks/bookmark/bookmark-view.test.ts` |
| AI Meeting Notes with transcription from the microphone | Done | `transcriber.test.ts`, `recorder-listener.test.ts`, `src/persistence/meeting-client.test.ts`, `server/transcription.test.ts`; photo `p87-meeting-mic`: Chrome's microphone played a spoken WAV (made with Windows' speech synthesizer), the app recorded it in 6-second pieces, the server's local Whisper model (`Xenova/whisper-base.en`, Transformers.js) wrote the words, and the AI summed them up. The small model mishears some words of a synthetic voice ("lunch" for "launch"); typed notes and a refused microphone: `meeting-notes.test.ts`, `transcriber.test.ts` |

## Quality targets

| Target | Status | Evidence |
| --- | --- | --- |
| Typing under 16 ms on 1,000 blocks | Done | `src/features/editor/editor-typing-speed.test.ts`: a keystroke's command and the page drawn again |
| A 5,000-row table responsive | Done | `table-model-speed.test.ts` (sort, filter, group, formulas, rollups under 100 ms), `table-render-speed.test.ts` (drawn window, a change redrawn under 50 ms) |
| Full tests under 10 s; verify under 30 s | Done | the suite: 7.4 to 7.6 s for 2,456 tests (each speed check stops at its first run under budget); `npm run verify` (types, lint, styles, format, tests): about 25 s |
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
