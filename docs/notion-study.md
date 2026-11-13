# Notion study

The one source of truth for what Notion looks like and does, and how far
Pagecraft matches it. Every study of Notion lands here: measures, the
behavior seen, what Pagecraft does today, and what is left. No other file
holds Notion findings; `docs/design-system.md` holds only the tokens that
carry them.

## How Notion is studied

- Notion runs in the built-in browser pane (a test account the owner set
  up; interacting with it is allowed). The pane renders only while the
  Claude window and the pane are visible.
- Read Notion with JavaScript in the page: `getBoundingClientRect()`,
  `getComputedStyle()`, the element's inline `style` (Notion sets most
  values inline) and `aria-label`. Its colors are custom properties such
  as `--c-bacEle`, `--c-texPri`, `--c-shaOutMd`.
- Hover states: the pane's pointer coordinates are in a scaled frame
  (800 px wide for a 1338 px viewport). Hover is reached reliably by
  dispatching `pointerover`, `mouseover`, `pointermove` and `mousemove`
  on the element from JavaScript; React's handlers answer them.
- Clicks: dispatch `pointerdown`, `mousedown`, `pointerup`, `mouseup`,
  `click` on the element. Typing: focus the field, then the pane's type
  and key actions.
- Undo every change made in Notion during a study.

## Interaction states (measured with a real pointer, 2026-11-13)

Static measures missed a black square behind the page icon on hover, so
every control is now checked in its states: rest, pointed at, pressed,
open, focused, by a real pointer, in Notion and in Pagecraft.

| Control | Notion when pointed at |
| --- | --- |
| Most buttons, rows, chips, menu rows, toolbar tools, table header, "New page", calculations, block "+" and grip | a wash `--ca-bacIntTra`: `#ffffff0e` by night, `#211b170d` by day; pressed or open doubles it |
| Sidebar's top icon buttons (hide, inbox, new page) | a stronger wash `--ca-borPriTra`: `#ffffeb1a` by night, `#1c13011c` by day |
| Page icon, database icon | nothing; only the pointer cursor |
| "Edited 5h ago" in the top bar | nothing |
| Table cells | nothing (the value bar appears instead) |
| "New" | its blue fill turns `rgb(61 144 225)` |
| To-do box | a light wash (`--ca-bacSecTra` × 1.5); box 16 px, radius 1.5 px, border `#e6e5e3` by night, `#383836` by day; ticked `#2783de` |
| Row tick box | radius 3 px, border `#fffceb4e` by night, `#1b150030` by day |
| Raised bars (cell actions, peek) | `--c-shaOutMd`: by night `0 0 0 1px #383836, 0 4px 12px -2px #19191914`; by day `0 8px 12px #19191907, 0 2px 6px #19191907, 0 0 0 1px #2a1c0012` |

Notion's washes are translucent, so they read the same on the page, the
sidebar, a cover or a menu. Pagecraft's were opaque, which drew a dark
box wherever the surface under them differed: fixed at the token
(`color.bg.hover`, `color.bg.active`, `color.bg.hoverStrong`).

## How Pagecraft is checked against it

1. Open the review server (`npm run dev -- --port 5190`, launch config
   "review"), never the owner's workspace.
2. Capture it headless at 1440 × 900 at 2x: Chrome driven by the
   project's `playwright-core`, a real mouse pointing at each control,
   each region photographed at native pixels and looked at.
3. Open the control with the pointer, then again with the keyboard:
   arrows move, Enter chooses, Escape closes and gives focus back.
4. Compare with the same control in Notion by the numbers below.
5. Choose a value and check that the view shows it at once and that undo
   brings the old value back.

## Notion reference (measured)

Measured in the owner's workspace, dark theme, read-only.

| Part | Measure |
| --- | --- |
| Menu panel | 290 px wide (250 for short lists), radius 10 px, background `#252525`, ring `0 0 0 1px #383836`, shadows `0 14px 28px -6px rgb(25 25 25 / .2)` and `0 2px 4px -1px rgb(25 25 25 / .12)` |
| Menu row | 28 px high, radius 6 px, 4 px inset from the panel edge; icon 20 px; label 14 px; hover `rgb(255 255 255 / .055)`, background change 20 ms |
| Row value | 14 px, muted `#7D7A75`, then a chevron; the row opens a panel |
| Section label | 12 px, weight 500, `#ADA9A3` |
| Panel header | back arrow, title 14 px weight 600, close button |
| Search field | 28 px, padding 3 × 6 px, radius 6 px, fill `rgb(252 252 252 / .03)`, focus ring `0 0 0 1px #2383E2` inside and out, text 14 px |
| Option | `role="option"`, 28 px, the chosen one ends with a 16 px check |
| Option with text | title, then a two-line description in 12 px muted text |
| Switch | track 30 × 18 px, radius full, padding 2 px, on `#2783DE`; knob 14 px white, moves 12 px; 200 ms ease-out |
| Layout tile | 83 × 57 px, radius 6 px, ring `inset 0 0 0 1px #383836`; chosen: ring 2 px `#2783DE`, label blue, 11 px |
| Opening | panels fade and slide in over a short time; submenus open beside their row |
| Search dialog | 1006 × 676 px at 1280 × 760, 68 px from the top, radius 20 px, ring and two shadows; field 16 px; filter chips 24 px pills; rows 36 px, radius 12 px, icon, title, "— path"; the active page previewed on the right |
| Side peek | docked at the window's right, 640 px of 1280; full height; ring `0 0 0 1px #383836` and `0 4px 12px -2px`; bar of 24 px buttons: Close, Open as full page, then the peek mode switch, then Previous and Next (dimmed at the ends), the page's actions at the end; title 32 px bold; text inset 76 px |
| Table Open button | on hover of the title cell: the open mode's icon and OPEN in 12 px capitals on a raised pill; the peeked row is ringed in blue |

## Blocks (measured, light theme, full-width page 1440 px)

Text color `rgb(44 44 43)`; font stack `ui-sans-serif, -apple-system,
BlinkMacSystemFont, "Segoe UI Variable Display", "Segoe UI", Helvetica,
… Arial, sans-serif`.

| Block | Box | Text |
| --- | --- | --- |
| Page title | 48 px high | 40 px, weight 700, line 48 px |
| Heading 1 | 55 px high | 30 px, weight 600, line 39 px |
| Heading 2 | 47 px high | 24 px, weight 600, line 31.2 px |
| Paragraph | 40 px high (24 px line plus block padding) | 16 px, weight 400, line 24 px, text 6 px in from the column |
| Quote | 40 px, padding 8 px | 16 px, line 24 px, text 25 px in (bar and gap) |
| Callout | padding 8 px | text 21 px in |
| Divider | 13 px high | |
| Image | padding 8 px | |

## Database (measured, dark theme)

### Inline database header

One 40 px row: the database's icon in a 22 px box, the title in 24 px
weight 600 (line 31.2 px), then a 24 × 24 "+" (add a view) right after the
title. A single view shows no tabs. At the row's end the tools, 28 × 28,
radius 6, no gap: Filter, Sort, Automations, AI autofill, Search, then
Settings; 6 px later the blue "New" (49 × 28, corners 6 0 0 6) and its
24 × 28 arrow (more ways to add). Pagecraft has every tool but
Automations and AI autofill, which need a server.

### Rows

- Row 37 px (36 px and a 1 px border); cell text 14 px, line 1.5,
  padding 7.5 px × 8 px; numbers right-aligned.
- The gutter sits in the page margin, cells start under the title:
  "+" (24 px, adds a row below; Alt adds above), the grip (18 px), then
  the tick box in a 36 × 36 label; it fades in over 200 ms.
- The title cell shows the Open pill on hover of any cell of the row
  ("Abrir no modo lado a lado" in side peek mode).

### Cell quick actions (hover on a value cell)

- Every non-title value cell shows, on hover, a bar at its start: inside
  an absolutely placed strip (`top: 6px`, `inset-inline: 0`,
  `margin: 0 4px`, `justify-content: start`, `pointer-events: none`), a
  sticky pill (`inset-inline-end: 4px`), background `--c-bacEle`
  (`rgb(32 32 32)`), padding 2 px, 24 px high, radius 6 px, shadow
  `0 0 0 1px rgb(56 56 54), 0 4px 12px -2px rgb(25 25 25 / .08)`.
  The bar covers the value; it stays left even for right-aligned numbers.
- In it, two 24 × 20 buttons (radius 4 px, 16 px icons in the secondary
  icon color): "Comment on property value" (speech bubble) and "Copy to
  clipboard".
- "Comment" opens the comment composer as a popover centered under the
  cell: 470 px wide, radius 10, the menu panel's ring and shadows;
  padding 9 px 8 px 8 px 12 px; avatar 24 px; the field "Add a
  comment…" 14 px on a 20 px line, focused at once; on its right
  Attach file, Mention, Send (24 × 24 each). Enter posts.
- Once a value has a discussion, its bar's first button becomes "Open
  discussion": the bubble and the count (12 px, weight 600, tertiary
  text), padding 0 6 px; the bar shows while the cell is hovered.
- On the row's page the property row with a discussion carries, just
  past its end in the right margin (absolute, `top: 6px`), a 24 px
  button: the bubble and the count, named "1 comment". It opens the
  discussions popover (480 px, radius 10): each comment shows the
  author, the time, then the value it is about as a quoted line in 13 px
  secondary text (`rgb(173 169 163)`) — the property name, ":", then the
  value as it read when the discussion began — indented 32 px under the
  name, then the comment. Hovering a comment shows Add reaction, Resolve,
  More actions (Mark as unread, Edit, Copy link, Mute replies, Delete).
  Delete asks "Delete this comment?" with Delete and Cancel.
- Value discussions are not listed under the page's own discussions;
  they live by their property.
- Pagecraft (2026-11-13): the bar, its two buttons, the composer and the
  discussions popovers (470 and 480 px), the count by the property on
  the row's page, the value quoted under the first comment, and the
  delete question are built to these numbers
  (`cell-actions.view.ts`, `row-value-comments.view.ts`,
  `features/comments/`). Reactions, Mark as unread, Edit, Copy link and
  Mute replies are not built (one person, no notifications).

## Search (measured, dark theme, 2026-11-13)

- Opened from the sidebar's "Search or ask" field (8 px radius, a 1 px
  border) or Ctrl+K: a 1006 × 700 px dialog, radius 20 px.
- Under the field a row of filter chips, each 24 px, radius 32 px,
  padding 0 8 px, gap 6 px, 14 px secondary text (`rgb(173 169 163)`),
  no fill: "Title only", "Created by", "In page", then "Filter" (dimmer,
  `rgb(125 122 117)`, padding 0 9 0 5 px, radius 12 px).
- Each chip leads with a 16 px icon (Aa, a person, a page) and ends with
  a small chevron down; no border, no shadow.
- A chip with a value turns blue (`rgb(39 131 222)`) on a translucent
  blue fill and reads "In page: Budget, Salary". The filters stay set
  when the search is closed and opened again.
- With a filter set the list reads "Search results", with a sort choice
  "Best matches ⌄" at its right.
- "In page" opens a 250 px popover (min 180, at most 40 % of the window
  high): a field holding the chosen pages as 18 px tokens (icon, name,
  a remove ×) with a blue focus ring, placeholder "Search pages"; under
  it the other pages as 28 px options (a row page shows its path in
  12 px tertiary text, "Budget / Income"). Choosing keeps it open; it
  is a multiple choice.
- "Filter" lists "Date"; choosing it adds a "Date" chip and opens its
  248 px popover: a header with the field it reads ("Last edited", a
  list of "Created" and "Last edited") and "Clear"; 28 px rows Today,
  Last 7 days, Last 30 days; a month calendar to pick a day or a range;
  "Remove" at the foot, which takes the chip away.
- With no query the results group recent pages by when they were opened:
  "Today", "Yesterday", then older; with a query or a filter, "Best
  matches". The foot reads "Ctrl+Enter Open in new tab".
- Pagecraft has one person, so "Created by" has nothing to choose; it is
  left out.
- Pagecraft (2026-11-13): Title only, In page (tokens, search, Backspace)
  and Filter › Date (field, Clear, presets, month, Remove) are built and
  kept while the search is closed (`features/command-palette/search-*`).
  Not built: grouping recents by Today and Yesterday (visit times are not
  kept) and the "Best matches" sort choice.

## Page menu (measured, dark theme, 2026-11-13)

- The "…" at the top bar's end ("Actions") opens a 256 px menu with a
  search field ("Search actions…") and 28 px options, in groups: Copy
  link (Ctrl+Alt+L on the web), Copy page contents, Duplicate (Ctrl+D),
  Move to (Ctrl+Shift+P); Version history, Updates and analytics;
  Appearance and layout ›, Use with AI ›, Suggest edits, Get notified ›
  (its value, "Comments"); Lock page (a switch), Move to trash; More ›.
  The foot: "Last edited", the person, "yesterday at 19:08", then the
  word count.
- Appearance and layout opens a 300 px submenu beside it: "Font style"
  with three 92 × 61 tiles (Ag, Default, Serif, Mono), then the section
  "Appearance" with switches Small text, Full width, Table of contents,
  Page discussions, and "Inline comments ›".
- More › holds Translate, Import, Export, Turn into wiki, Connections
  (None), Open in the Windows app.
- Backlinks are no longer a row of this menu.
- Pagecraft (2026-11-13): the groups above in that order, without the
  rows that need a server, AI or other people; Appearance and layout
  holds the font tiles, Small text, Full width and Backlinks; More holds
  Export › (Markdown, HTML, print). Copy link keeps Ctrl+L, and Duplicate
  and Move to show no keys, since only working keys are shown. The
  submenus never opened before: the menu was drawn without its context.

## Trash (measured, dark theme, 2026-11-13)

- Reached from the sidebar foot's "Library, Trash, more…" menu (240 px:
  Library, AI notes, Skills, My tasks, Marketplace, Trash).
- A floating panel 414 × 453 px over the sidebar's edge near its foot,
  radius 10, the menu panel's color, ring and shadows; its height stays
  the same with no results.
- A search field ("Search pages in Trash", 20 px text line), then 24 px
  chips: Last edited by, In, Teamspaces; "No results" in the middle;
  at the foot "After a page has been in Trash for 30 days, it will be
  deleted automatically" and a Help button.
- Pagecraft (2026-11-13): a panel beside the sidebar's foot, 416 × 453,
  the search, the "In" choice, the rows with Restore and Delete, "No
  results" centered and the note at the foot. "Last edited by" and
  "Teamspaces" need other people.

## Version history (measured, dark theme, 2026-11-13)

- Page menu › Version history fills the window: the versions down the
  left in a 320 px column (`#191919`, a 1 px `#2c2c2b` border on its
  right), "Group by" a span of time, each version with its time and
  author; "Current version"; "Start restore".
- The chosen version shows beside it as the page, read only; the words
  that version wrote are in `rgb(35 131 226)` on
  `rgb(35 131 226 / .14)`.
- Pagecraft (2026-11-13): the versions in a 320 px column on the left
  with Restore, the version beside them with the words it wrote (and the
  blocks it added) marked in Notion's colors against the version before.
  "Group by" and authors are not built (one person).

## Feature catalog (audit of 2026-11-13)

Every entry Notion offers, in its words, and whether Pagecraft has it:
**yes**, **part** (what is missing said), **no**, or **n/a** (needs a
server, AI or other people). Photos of Notion are kept in
`.captures/notion/` (the pane's frames, 800 px wide).

### Slash menu (`/` on an empty line), 15 sections

Photo `001-slash-menu.jpg`. A 309 px panel, 320 px of list before it
scrolls, "Close menu  esc" at its foot; typing filters it.

| Section | Entries | Pagecraft |
| --- | --- | --- |
| Suggestions | AI notes; HTML (new) | n/a; **no** (HTML block) |
| Basic blocks | Text; Heading 1–4 (`#`…`####`); Bulleted list (`-`); Numbered list (`1.`); To-do list (`[]`); Toggle list (`>`); Page; Callout; Quote (`"`); Table; Divider (`---`); Link to page | **yes** |
| Media | Image; Video; Audio; Code (```` ``` ````); File; Web bookmark | **yes** |
| Database | Table view; Board view; Gallery view; List view; Feed view; Dashboard view (new); Calendar view; Timeline view; Map view (new); Vertical bar chart; Horizontal bar chart; Line chart; Donut chart; Number chart; Form; Database – inline; Database – full page; Linked view of data source | **part**: only "inline database" and "linked view" are listed; no entry per view, no number chart, no dashboard, no map, no full-page database entry |
| Advanced blocks | Table of contents; Block equation; Button; Breadcrumb; Tabs (new); Synced block; Toggle heading 1–3 (`# >`…); 2, 3, 4, 5 columns; Code – Mermaid; AI block | **part**: no Tabs, no Mermaid, columns as one entry; AI n/a |
| Inline | Mention a person; Mention a page or data source; Date or reminder; Emoji; Inline equation | **yes** (a person: n/a) |
| Integrations | Embed; HTML; Google Drive, Tweet, GitHub Gist, Google Maps, Figma, … (about 50 named services) | **part**: one Embed for any address; no named services |
| Import | CSV; Text and Markdown; Confluence; Google Docs; Dropbox Paper; Evernote; Workflowy; Word; Monday; Quip; ZIP | **part**: CSV, Markdown, ZIP from the sidebar, not from `/` |
| Turn into | Heading 1–4; Page in; Bulleted, numbered, to-do, toggle lists; Code; Quote; Toggle heading 1–4 | **no** in `/` (the block menu has Turn into) |
| Actions | Link to block (Alt+Shift+L); Duplicate (Ctrl+D); Move to (Ctrl+Shift+P); Delete (Del); Ask AI | **no** in `/` (the block menu has them); no "Link to block" |
| A short break | Brew | n/a |
| Text color | Default and 9 colors | **yes** |
| Background color | Default and 9 colors | **yes** |

## Controls

**Now** says what the control is today: "native" (a browser `<select>`
or checkbox), "custom" (our own, not yet measured against Notion) or
"Notion" (matches the reference).

### Database view

| Control | File | Now | Notion |
| --- | --- | --- | --- |
| View settings | `view-settings/` | Notion | menu with rows: name, Layout, Property visibility, Filter, Sort, Group, then the view's actions; each row opens a panel |
| Sorts | `view-settings/sort-panel.view.ts` | Notion | with none, New sort: a searchable list of properties; with some, a row per sort (grip, property, direction, remove), Add sort, Delete sort |
| Layout choice | `view-settings/layout-panel.view.ts` | Notion | tiles in the Layout panel, then the layout's options |
| Group by | `view-settings/group-panel.ts` | Notion | searchable option list with property icons, check on the chosen one |
| Group sort, date step | `view-settings/choice-panels.ts` | Notion | rows with value and chevron, each opening an option list |
| Hide empty groups | `view-settings/group-panel.ts` | Notion | switch row |
| Card preview, card size | `view-settings/layout-panel.view.ts` | Notion | rows with value and chevron in the Layout panel |
| Color columns | `view-settings/layout-panel.view.ts` | Notion | switch row |
| Calendar date property | `view-settings/choice-panels.ts` | Notion | row with value and chevron |
| Property visibility | `view-settings/choice-panels.ts` | Notion | list with type icons and an eye toggle per property |
| Filter, none yet | `filter-start.view.ts` | Notion | "Filter by…": a searchable list of properties; choosing one adds its condition |
| Filter conjunction | `view-filters.view.ts` | Notion | small select: "And" or "Or" |
| Filter property, condition, value | `filter-row.view.ts` | Notion | select buttons opening option lists; options of a select property as chips |
| Calculation | `table-footer.view.ts` | Notion | "Calculate" with a chevron opening the grouped menu of calculations |
| Set property on ticked rows | `table-bulk.view.ts` | Notion | a button per property in the bar |
| Linked view source | `linked-view.view.ts` | Notion | searchable list of databases |
| Row properties on a row page | `row-properties.view.ts`, `row-value.view.ts` | Notion | 34 px rows: the type's icon and name in a 160 px column, then the value drawn as its cell; options, tags and dates open their editors |
| Column menu | `column-menu.view.ts` | Notion | name with its type's icon in a box; Edit property ›, Change type ›, Filter, Sort ›, Group, Calculate ›, Freeze, Hide, Wrap, Insert left and right, Duplicate, Delete; submenus open on hover beside the row |
| Change type | `property-edit-menu.ts` | Notion | list of types with icons, the current one checked; values carry over |
| Calculate | `column-menu-items.ts` | Notion | None, then Count ›, Percent ›, More options › |
| Board column menu | `board-column-menu.view.ts`, `group-menu-entries.ts` | Notion (and Move left and right, the keyboard's way to drag) | the group menu: the option's name, Hide, Delete, its colors |
| Row tick box | `table-gutter.view.ts` | Notion | Notion checkbox |
| Group header | `group-header.view.ts`, `group-menu.view.ts` | Notion | caret, chip, count; hover shows "…" (the group's menu: name, Hide, Delete, Colors for an option's group) and "+" (a new row in the group) |

| Row peek | `features/row-peek/` | Notion (no Share: one person, no sharing) | side or center peek with Close, Open as full page, mode switch, Previous and Next, then Comment, Copy link, the favorite star and page actions; the side peek's edge drags it wider (kept), arrows by keyboard; the peek is in the address, so a link opens it and Back closes it; Escape closes, K and J step |
| Open pages in | `view-settings/choice-panels.ts` | Notion | row in the Layout panel opening Side peek, Center peek, Full page |
| New and its templates | `database.view.ts`, `templates-menu.view.ts` | Notion (a repeat has no time of day) | split blue button; the arrow lists "Templates for …", each template with "…" (Set as default › For all views / For this view, Repeat › Off, Daily, Weekly, Monthly, Yearly, Edit, Duplicate, Delete), Empty page, New template; Default marks the one the view's new rows start from |
| Template note | `template-banner.view.ts` | Notion | a strip over a template's page: "You're editing a template in …" |
| Import | `features/sidebar/sidebar.view.ts`, `csv-file.view.ts`, `features/markdown-import/` | Notion (CSV and Markdown files; no ZIP or other apps) | Import in the sidebar's foot takes several files: a CSV becomes a database named as the file, its columns typed; a Markdown file a page named by its first heading or the file, its blocks nested as written |
| Export and print | `features/markdown-export/`, `features/page-menu/` | Notion | Export as Markdown saves the page, or with subpages a ZIP of Markdown files in folders as they nest; Export as HTML saves the page as one HTML file; "Print or save as PDF" prints the page alone |
| Export as CSV | `view-settings/root-panel.view.ts` | Notion (the view only, no Markdown pages) | the view's columns and rows as a UTF-8 CSV file |
| Lock page, Lock database | `features/page-menu/page-menu.view.ts` | Notion | a switch in the page's menu; a locked page shows "Locked" in the top bar, which unlocks it; typing does nothing and says why |
| Lock view | `view-settings/root-panel.view.ts` | Notion | a switch in the view settings; filters, sorts and layout stay as they are |
| Backlinks | `features/backlinks/`, `features/page-menu/page-menu-style.view.ts` | Notion (kept: Notion no longer lists Backlinks in its page menu; ours sits in Appearance and layout) | "↗ N backlinks" under the title opening the linking pages |
| Comments | `features/comments/`, `format-toolbar.view.ts`, `editor-block-menu.view.ts` | Notion (one author, "You"; no mentions in comments) | "Add comment" over the title and the page's discussions under it; "Comment" in the text toolbar, the block menu and Ctrl+Shift+M; commented text washed and underlined in yellow; a speech bubble and count by the block opening its discussions with the quote, each comment's initial, name, time and text, Reply, Resolve, Delete; "Resolved comments" in the page's actions, with their count, lists them to read or Reopen; a value cell's bar comments on the value, counted by its property on the row's page; Delete asks "Delete this comment?" |
| Inbox and reminders | `features/inbox/`, `features/mention-menu/`, `app/reminder-notices.ts` | Notion (reminders only; no mentions or comment notices from others, one person) | "@remind" offers Remind me today, tomorrow, next week, a ⏰ date mention; Inbox under Home with a red count; the due reminders with a bell, page and day, a blue dot until read, Mark all as read; a browser notice from 9:00 on the day while the app is open |
| Version history | `features/page-history/`, `features/page-menu/page-menu-entries.ts` | Notion (no "Group by", no authors) | page menu › Version history fills the window: the versions in a 320 px column on the left, Restore, the version beside them with what it wrote marked in blue |
| Template gallery | `features/templates/` | Notion (built-in page templates, grouped by kind) | Templates in the sidebar's foot opens a wide dialog: the templates by kind down the side, the chosen one previewed, "Use this template" |
| Trash | `features/trash/` | Notion (no Last edited by or Teamspaces filters: one person) | a 414 × 453 panel by the sidebar's foot: a search, an "In" filter, rows with icon, title and place, Restore and Delete, "No results", the 30-day note at its foot |
| Search (Ctrl+K, Ctrl+P) | `features/command-palette/` | Notion (no Created by: one person; no Ask AI; no grouping of recents by day) | wide dialog 1006 × 676 px, radius 20; the field, chips Title only, In page, Filter › Date; Recent pages or Best matches with each page's place and the text around a match; the active page's preview beside the list |
| Sub-group | `view-settings/sub-group-panel.ts`, `layouts/board/board-lanes.view.ts` | Notion | Sub-group row in a board's Group panel; once chosen, Sub-group by, Sort, Hide empty groups, Remove sub-grouping; lanes with a toggle, chip and count |
| Date cell and date value | `ui/date-picker/`, `date-menu.ts`, `cell-date.view.ts` | Notion (no time zone: days have none) | the chosen days in fields that take a typed day ("Dec 3", "12/3/2026", "tomorrow"), the month with Today and arrows, six weeks of days; End date, Date format › (date and time formats), Include time, Remind › (none, on the day, 1 or 2 days or a week before; due reminders reach the inbox), Clear |

### Property settings

| Control | File | Now | Notion |
| --- | --- | --- | --- |
| Number format | `number-config.view.ts` | Notion | row with value opening an option list beside it |
| Date and time formats | `date-config.view.ts` | Notion | rows with values opening option lists beside them |
| Relation database | `relation-config.view.ts` | Notion | searchable list of databases |
| Rollup relation, property, calculation | `rollup-config.view.ts` | Notion | rows with values opening option lists beside them |
| Button property action | `button-property-config.view.ts` | Notion | rows with values opening option lists; opening the row a switch row |
| Options and their colors | `option-list.view.ts`, `option-menu-parts.ts` | Notion | each option a row with a grip and its chip, opening its submenu: name, Delete, colors as swatches with a check |

### Blocks

| Control | File | Now | Notion |
| --- | --- | --- | --- |
| Code language | `code.view.ts` | Notion | searchable language list |
| Button block action | `button-config.view.ts` | Notion | option list |
| To-do box | `to-do.view.ts` | Notion | Notion checkbox |

### Menus already custom

Slash menu, block menu, color menu, page menu, simple table menu,
mention menu, emoji picker, icon and cover pickers, link editor,
equation editor, format toolbar, tone picker: each opened and compared
against the reference on every run.

## Owners

- `src/ui/menu/`: every menu and option list — panel, rows, sections,
  header, search, switch rows. No feature draws its own panel.
- `src/ui/select/`: the button that shows a current choice and opens an
  option list. It replaces every native `<select>`.
- `src/ui/checkbox/`: the tick box of to-dos, rows and settings.
- `src/ui/overlay/`: which overlay is open, its position and light
  dismiss. One overlay at a time, kept in `ui.overlay`.

## Last run

2026-11-11, review server, 820 × 640, dark theme.

- Column menu: opened every submenu by click and by hover (Edit
  property, its date and time format lists, Change type, Sort,
  Calculate); duplicated a column, inserted one left, renamed it,
  changed it to Select, added two options and opened one's submenu.
- Blocks: added a code block through the slash menu, opened its
  language list, searched "py" and chose Python with Enter.
- View settings: Sort (New sort, sort list, direction list), Filter by.
- Group header: "…" and "+" on hover, the group menu.
- Filter popover: with no filter it was 151 px wide and wrapped "Add
  filter group"; it now opens Notion's "Filter by…" list, and the editor
  is at least a menu wide. Conditions' lists open under their control.
- Found and fixed: a choice in a nested list sent focus to the menu's
  name (a shared ref callback ran again); a tall submenu covered its
  menu (now centered on its row and moved to fit, as Notion's).

- Opened and photographed: the view settings and every panel (Layout,
  Group, Sort, Property visibility); the filter popover with its
  property, condition, value and join lists; the footer's calculation
  list; a date property's settings and its format list; the column
  menu.
- Found and fixed: a condition without its value filtered out every row;
  a property's settings opened in the window's corner; options showed
  their value beside their label; menus kept fading in whenever their
  anchor moved.
- While the browser pane is hidden the page runs as a background page:
  transitions and animations stay at their start, so a screenshot shows
  a half-faded menu or an unticked box. Show the pane, or, for the
  capture only, finish the running animations first
  (`element.getAnimations({ subtree: true })`, then `finish()`).

## Open

- Light theme measurements of the menu reference.
- A board in Notion to measure its columns and cards with a real pointer
  (the test workspace has none).
