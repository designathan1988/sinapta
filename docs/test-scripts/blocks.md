# Test script: the other blocks

Parts `blocks/*` other than the text blocks (in [editor.md](editor.md))
and the toggle (in [blocks-toggle.md](blocks-toggle.md)), 2026-11-14, by
the `feature-test-scripts` skill.

- Inventory (`npm run inventory -- blocks/`): callout (icon button, emoji
  picker), code (language, Wrap, Caption, Copy, caption field), equation
  (display button, TeX editor, Done), divider, toggle heading (arrow),
  table of contents (links), breadcrumb (links), simple table (cells, add
  row and column, cell menu by right click and Shift+F10, Tab, Enter),
  image (address field, file choice, toolbar, width handles, caption, full
  screen), file, PDF, video, audio (address field, file choice, caption),
  web bookmark, embed (address field, height slider), button (press,
  settings: label, blocks, open page, add a row), synced block, page and
  link to page, AI Meeting Notes, column and column list (resize, drop
  beside). Their commands are the `*.commands.ts` of each folder; the menu
  entries are the slash menu's.
- Files read: each block's view and definition, `ui/url-field`,
  `features/slash-menu/slash-menu.view.ts` (what a new block does next),
  `features/editor/editor-keys.view.ts` (Tab), `ui/tooltip/tooltip.ts`.
  Out of scope: the database blocks (database part), columns by drag
  (the editor's drag, tested there), AI Meeting Notes (needs a
  microphone, run with the AI part).
- States: each block empty (its address field) or filled; a picker or
  menu open; a caption absent, added or written; a toggle heading open or
  closed; offline.
- Plans: `.captures/plans/ts-blocks-01` … `-07` (human hand, seed 61, 70
  wpm), written by `gen-blocks.mjs` (`STAMP=3301`). Notion:
  `n135-blocks.json` made a callout on Notion's test page (its caret
  inside, "Pressione / para inserir blocos"); the plan's next step failed,
  and the callout was removed with its block menu (`n135-restore7`, page
  as before, photo 05-away). The other blocks are compared with the
  2026-11-13 audit in `docs/notion-study.md` (Blocks and the editor), not
  made again on the owner's page.

| Id | Case | Gestures (steps) | Must see | Result | Photos |
| --- | --- | --- | --- | --- | --- |
| K1 | `/callout` Enter | type, Enter | a callout, 💡, caret in it | **pass** (Notion the same) | 01/04–06; n135/03 |
| K2 | The callout's icon pointed at | hover 1 s | "Change the icon" | **finding** (interface): no hint. Fixed | 01/07 |
| K3 | The icon pressed, Escape | click, Esc | the emoji picker with Remove; caret back | **pass** | 01/08, 01/09 |
| K4 | `/code` Enter, typing two lines | type | a code block, monospace | **pass** | 01/13, 01/14 |
| K5 | Tab in code | key | an indent at the caret (Notion) | **finding** (UX): the whole block was nested instead. Fixed: two spaces at the caret | 01/15 |
| K6 | Wrap | click | pressed, lines wrap | **pass**: `aria-pressed=true` | 01/17 |
| K7 | Language, Escape | click, Esc | the list with search; caret back | **pass** | 01/18, 01/19 |
| K8 | Caption | click, type | the caption field focused, the words in it | **finding** (broken action): the field appeared but the focus stayed in the code, so "The caption" was typed into the code. Fixed: a new caption takes the focus | 01/20, 01/21 |
| K9 | Reload | reload | all kept | **pass** | 01/22 |
| K10 | `/block equation` | type, Enter | the TeX editor, its field focused | **pass** | 02/05 |
| K11 | TeX, Done; click it again, Escape | type, click, Esc | E = mc², the editor again, closed | **pass** | 02/06–09 |
| K12 | `---` on an empty line | type | a divider at the third dash (Notion) | **finding** (Notion difference): three dashes stayed text until a space. Fixed | 02/11 |
| K13 | `/toggle heading 1`, Enter, text | type | the title, then Enter writes inside it | **finding**: the line went beside it (as T19 of the toggle script). Fixed (`splitBlock`), the toggle's T19 too | 02/13–16 |
| K14 | The arrow pointed at | hover 1 s | "Hide content" | **finding** (interface): no hint (open arrows were silenced like open menus). Fixed (`data-disclosure`) | 02/17 |
| K15 | The arrow pressed twice | click ×2 | closed, open | **pass** | 02/18, 02/19 |
| K16 | `/table of contents`, a link | click | the heading listed; the caret on it | **pass** | 02/22, 02/23 |
| K17 | `/breadcrumb` | Enter | the page's path | **pass** | 02/26 |
| K18 | `/table` Enter | Enter | a 3 × 3 table, the first cell focused (Notion) | **finding** (UX): the caret stayed on a new line under the table, so what was typed went there. Fixed | 03/05 |
| K19 | Typing, Tab, Enter in cells | type, keys | next cell, the cell below | **pass**: "Name", "Qty", "Apples café" | 03/06–10 |
| K20 | Add a row, add a column | hover, click | hints; 4 rows, 4 columns | **finding** (interface): no hint on "+". Fixed; the adds **pass** | 03/11–13 |
| K21 | Right click and Shift+F10 on a cell, Escape | keys | the cell menu; the focus back on the cell | **finding** (keyboard): the focus fell to `body`. Fixed | 03/14–17 |
| K22 | Reload | reload | the cells kept | **pass** | 03/18 |
| K23 | `/image`, Choose a file | upload | the image | **pass** | 04/05, 04/06 |
| K24 | The toolbar pointed at | hover | Align left, center, right, View full screen; hints | **pass** | 04/07, 04/08 |
| K25 | Width by its handle | drag | narrower, kept after reload | **pass**: 290 px | 04/09, 04/14 |
| K26 | Caption, full screen, Escape | type, click, Esc | caption; the image alone; focus back | **pass** | 04/11–13 |
| K27 | `/button` | Enter | its settings open (Notion) | **finding** (Notion difference): nothing opened. Fixed: Label focused | 05/06 |
| K28 | A button with no action pressed | click | nothing, or a hint | **pass** (nothing happens, as Notion's empty button) | 05/09 |
| K29 | `/synced block`, typing | type | the text inside the synced frame | **pass** | 05/12, 05/13 |
| K30 | `/page` | Enter | a sub-page opened, title focused; Back shows its row | **pass** | 05/16–19 |
| K31 | `/file`, Choose a file | upload | name, size, Download | **pass** | 06/06 |
| K32 | A web bookmark from "not a link" | type, Enter | Pagecraft's own message | **finding** (interface): the browser's bubble "Insira um URL." in the browser's language. Fixed: "Enter an address that starts with http or https." | 06/10 |
| K33 | An embed of https://example.com | type, Enter | the page shown in the frame | **pass** | 06/14 |
| K34 | `/video` offline, then online | offline, type | the block made, its field focused; kept | **pass** | 06/17–19 |
| K35 | Dark theme | palette | callout, code, table legible | **pass** | 07/04, 07/06 |
| K36 | Audio, PDF by file; embed height | – | – | **not run**: alike to K31 and K33 (same field and blocks' code), left for the media part |
| K37 | AI Meeting Notes | – | – | **not run**: needs the microphone plan (AI part) |
| K38 | Columns resized | – | – | **not run**: columns are made by dragging beside (editor's drag) |

Photos are in `.captures/pagecraft/ts-blocks-NN/` and
`.captures/notion/n135-*/`.

## Fixed after the run (commit "fix(blocks): …")

- K5: Tab in code writes two spaces; Shift+Tab does nothing there.
- K8: a new code caption takes the focus.
- K12: `---` makes a divider at the third dash.
- K13: Enter in an open toggle's or toggle heading's title writes inside
  it, first (also the toggle script's T19).
- K14, K2, K20: hints on the toggle arrows, the callout's icon and the
  table's "+".
- K18: a new table puts the caret in its first cell.
- K21: Escape in the cell menu returns to the cell.
- K27: a new button opens its settings.
- K32: address fields check the address themselves (`novalidate`) and
  say so in their own words, announced.

## Summary

38 cases: 24 pass, 11 findings (11 fixed), 3 not run.
