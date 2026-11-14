# Test script: database and its views

Parts `features/database` (table, cells, keys, header and column menu,
toolbar, view tabs, view settings, filters, sorts, search),
`features/database/layouts` (board, gallery, calendar and the others) and
`features/database/properties`, 2026-11-14, by the `feature-test-scripts`
skill.

- Inventory (`npm run inventory -- database`): 157 + 40 + 98 + 27 files;
  menus Add property (14 types), column menu (Edit property, Change type,
  AI autofill, Filter, Sort, Group, Calculate, Freeze, Hide, Wrap, Insert,
  Duplicate, Move, Delete), New view (10 layouts), View settings (Layout,
  Property visibility, Filter, Sort, Group, Conditional color, Copy link,
  Data source, Source…); keys Backspace, Delete, Enter, Escape, F2, Space,
  arrows, Alt and Shift with them; pointer drags of rows, columns and board
  cards; announcements "Column moved.", "Moved to …", row counts.
- Files read: `database.view.ts`, `table.view.ts`, `table-keys.view.ts`,
  `table-cell.view.ts`, `table-cell-ref.ts`, `table-footer.view.ts`,
  `view-tabs.view.ts`, `column-menu.view.ts`, `ui/menu/menu-name.view.ts`,
  `ui/menu/menu-keys.ts`, `view-settings/view-settings.view.ts`,
  `property-definition.ts`, `layouts/board/board-column.view.ts`.
  Not run here (left for the remaining parts by size): timeline, chart,
  feed, map and form layouts in depth, formulas, relations and rollups,
  automations, CSV import and export.
- Plans: `.captures/plans/ts-database-01` … `-06` (human hand, seed 81),
  written by `gen-database.mjs` (`STAMP`/`BASE` 5502 and 5503). Notion:
  `n137-database.json` aimed at Notion's Add property but its selector
  missed and "Num" was typed into Notion's first line; removed by
  `n137-restore.json` (page as before, photo 06-away).

| Id | Case | Gestures (steps) | Must see | Result | Photos |
| --- | --- | --- | --- | --- | --- |
| D1 | New database from the sidebar | click | a table page, its title focused, "No rows yet" said | **pass** | 01/01 |
| D2 | Enter in the title | key | to the table | **finding** (keyboard, open): the focus stays in the title | 01/03 |
| D3 | New page row | click, type, Enter | a row, its name being written; "1 row" said | **pass** | 01/04–06 |
| D4 | A name cell clicked | click | editing it | **pass** (the text selected) | 01/07 |
| D5 | Toolbar icons pointed at | hover | hints (Filter…) | **pass** | 01/12 |
| D6 | Reload | reload | rows kept | **pass** | 01/14 |
| D7 | Arrows, Enter, Escape, F2 on cells | keys | the active cell moves, edits, keeps the text on Escape | **pass** | 02/02–11 |
| D8 | Ctrl+C on a cell, Ctrl+V on another | keys | the value copied over (Notion) | **finding** (broken action): nothing happened. Fixed: cells copy their value as text and paste it as the property's type | 02/12–14 |
| D9 | Delete on a name cell | key | the name cleared (Notion) | **finding**: nothing. Fixed: the name is cleared, undo brings it back | 02/16, 02/17 |
| D10 | Shift+↑ on cells | key | a range of cells | **finding** (Notion difference, open): only the active cell moves; no range of cells | 02/15 |
| D11 | Add property pointed at, opened | hover, click | hint; 14 types | **pass** | 03/02, 03/03 |
| D12 | Typing a type's name in Add property | type | the list filtered | **finding** (open, to confirm on Notion): no filter; Enter took the first type (Text) | 03/04, 03/05 |
| D13 | After a type is chosen | Enter | the new column's menu with its name and Edit property open (Notion's) | **pass**; Escape closes the submenu, a second the menu | probe/03–05 |
| D14 | The column menu | look | name field and the actions | **pass** | 03/06 |
| D15 | Filter: a property, a value, Escape | click, type | the rows filtered, "Name: App" chip; kept after reload | **pass** | 04/02–06, 04/14 |
| D16 | Sort | click | its popover named "Sort" for assistive tools | **finding** (accessibility): it was named "View settings". Fixed: each panel is named by its title ("New sort") | 04/07 |
| D17 | Search | click, type | rows found | **pass** | 04/09–11 |
| D18 | View settings | click, Esc | the panel; focus back | **pass** | 04/12, 04/13 |
| D19 | A board on a database with no status or select | New view › Board | groups | **finding** (open, to confirm on Notion): only a sentence asking for a property | 05 first run/03 |
| D20 | Board after adding Status | New view › Board | No Status, Not started, In progress, Done with counts | **pass** | 05/07 |
| D21 | A card dragged to another group | drag | moved, "Moved to Not started" said | **pass** | 05/09 |
| D22 | A card opened, Escape | click, Esc | the side peek; focus back on the card | **pass** | 05/10, 05/11 |
| D23 | Gallery and Calendar views | New view | tabs added, kept after reload | **pass** | 05/13–16 |
| D24 | Dark theme | palette | legible table | **pass** | 06/04 |
| D25 | A row added while offline, in a filtered view | offline, New page | the new row stays shown (Notion keeps it until refresh) | **finding** (UX, open): it vanished at once, "No rows match this view." | 06/08–10 |
| D26 | Back online, reload | online, reload | saved | **pass** (not shown because of the filter) | 06/11, 06/12 |

Photos are in `.captures/pagecraft/ts-database-NN/`.

## Fixed after the run (commit "fix(database): …")

- D8: Ctrl+C and Ctrl+V on cells (`table-clipboard.view.ts`).
- D9: Delete on a name cell clears it.
- D16: view settings popovers are named by their panel.

## Summary

26 cases: 18 pass, 8 findings (3 fixed, 5 open), 0 not run; the layouts
in depth, formulas, relations, automations and CSV are left for the
remaining parts.

Open: D2 (Enter in a database's title), D10 (a range of cells), D12 (Add
property type-ahead), D19 (a board with no grouping property), D25 (a row
added in a filtered view vanishes).
