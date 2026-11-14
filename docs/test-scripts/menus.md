# Test script: menus

Parts `features/slash-menu`, the block menu (`features/editor/
editor-block-menu.view.ts`), `features/page-menu`, `features/mention-menu`,
`features/emoji-menu`, `features/command-palette`, `features/format-toolbar`
and `features/move-to`, with the shared `ui/menu`, 2026-11-14, by the
`feature-test-scripts` skill.

- Inventory: slash menu (rows, Close menu; keys ↑ ↓ Enter Escape, the
  scoped keys of `app/scoped-keys.ts`); mention menu (pages, people,
  dates); emoji menu; command palette (field, list, chips Title only, In
  page, Filter, date picker; ↑ ↓ Enter Escape Backspace); page menu
  (search, items, Full width, fonts, rename field); formatting toolbar
  (marks, Turn into row, Color picker, reaction, Suggest; Escape); Move to
  (search, options, announcement "Moved to the page.").
- Files read: `slash-menu.view.ts`, `slash-menu.selectors.ts`,
  `editor-block-menu.view.ts`, `editor-block-actions.view.ts`,
  `editor-color-menu.view.ts`, `ui/menu/menu.view.ts`, `menu-entry.ts`,
  `menu-submenu.ts`, `menu-keys.ts`, `editor-selection.view.ts`.
  Out of scope: the database's menus (database part), the comment menus
  (comments part).
- Plans: `.captures/plans/ts-menus-01` … `-06` (human hand, seed 71),
  written by `gen-menus.mjs` (`STAMP=4401`). Notion: `n136-menus.json`
  (the page menu's search and the palette, nothing changed on Notion).

| Id | Case | Gestures (steps) | Must see | Result | Photos |
| --- | --- | --- | --- | --- | --- |
| M1 | `/` on an empty line | type | the menu under the line, Page highlighted, "/Type to search" | **pass** | 01/04 |
| M2 | ↓ ↓ ↑ | keys | the highlight moves, each row announced | **pass** | 01/05–07 |
| M3 | Typing a filter | `head` | the headings, best first | **pass** | 01/08 |
| M4 | Nothing found | `zzz` | Notion's "No results", Escape closes | **finding** (UX): the menu vanished while the line kept its "/" wash and "Type to search", Escape then selected the block. Fixed: "No results" row, Escape closes | 01/09, 01/10 |
| M5 | Ctrl+A with the block selected | key | every block of the page | **finding** (broken action): the browser selected the whole window (sidebar included). Fixed | 01/11 |
| M6 | `/h2` | type, Enter | Heading 2 (Notion finds h1–h4) | **finding** (Notion difference): only "Link to page: Editor H2201" was found, Enter made a link. Fixed: names are found by their initials and joined words (`h2`, `todo`, `bl`) | 01/13, 01/14 |
| M7 | A row pointed at, clicked | hover, click | one row highlighted, the one pointed at; chosen | **finding** (interface): two rows washed (the pointed one and the keyboard's). Fixed: the pointer moves the highlight. The click **passes** | 01/17, 01/18 |
| M8 | Close menu | hover, click | closed, caret kept | **pass** | 01/20, 01/21 |
| M9 | Block menu by the handle | click | the menu before the grip, search focused | **pass** | 02/05 |
| M10 | Search `dup`, Enter | type, Enter | Duplicate found and done | **pass** | 02/06, 02/07 |
| M11 | Ctrl+/ | key | the same menu | **pass** | 02/08 |
| M12 | Turn into, Color | hover, click | Notion: submenus beside, on hover | **finding** (Notion difference, open): nothing on hover; a click opens each in place. And Turn into opened at the window's right edge, far from the block (**finding**, fixed: in the block menu's place) | 02/09, 02/10, 02/13 |
| M13 | A color chosen | click | the block's background | **pass**: blue-background | 02/14 |
| M14 | Delete from the menu, undo | click, Ctrl+Z | gone, back | **pass** | 02/16, 02/17 |
| M15 | Escape in the block menu | key | closed, caret back | **pass** | 02/19 |
| M16 | Page menu ("…") pointed at, opened | hover, click | "Page actions" hint; the menu, search focused | **pass** | 03/05, 03/06 |
| M17 | Search `full`, Enter | type, Enter | Notion finds "Largura completa" under Aparência | **finding** (Notion difference): "No matches" (submenu actions were not searched). Fixed: Full width found and switched on | 03/07, 03/08; n136/02 |
| M18 | Copy link | click | "Link copied." | **pass** | 03/11 |
| M19 | Ctrl+Shift+P, search, Escape | keys | Move to with Suggested, filtered; closed | **pass** | 03/12–14 |
| M20 | `@`, filter, Enter | type | people, pages, dates; a page mention | **pass** | 04/04–06 |
| M21 | `@today` | type, Enter | a date mention | **pass**: "@Today" | 04/07, 04/08 |
| M22 | `:smi`, ↓, Enter; `:hea`, Escape | type, keys | the emoji list, its names announced; 😄 inserted; closed | **pass** | 04/09–13 |
| M23 | Reload | reload | mentions and emoji kept | **pass** | 04/14 |
| M24 | Ctrl+K, type, ↓ ↑, Enter | keys | best matches, the page opened | **pass** | 05/01–05 |
| M25 | Nothing found in the palette | type | Notion: "Nenhum resultado" and "Pesquisar nas páginas excluídas" | **finding** (Notion difference, open): "Nothing matches." with no offer to look in the trash | 05/07; n136/05 |
| M26 | A chip, Escape | click, Esc | the filter, then the palette still open | **pass with a note**: Escape on a chip closes the whole palette (Notion's too, n136/06) | 05/11, 05/12 |
| M27 | The formatting toolbar | select a word | the toolbar, hints, Bold, Color picker with focus, Escape back to the text | **pass** | 06/05–10 |
| M28 | Escape with the toolbar open | key | the block selected | **pass** (Notion's too) | 06/11 |

Photos are in `.captures/pagecraft/ts-menus-NN/` and
`.captures/notion/n136-menus/`.

## Fixed after the run (commit "fix(menus): …")

- M4: the slash menu says "No results" and Escape closes it.
- M5: Ctrl+A on selected blocks selects every block of the page.
- M6: slash search by initials and joined words, ranked first.
- M7: the pointer moves the slash menu's highlight.
- M12: Turn into and Color open in the block menu's place.
- M17: a menu's search finds the actions inside its submenus.

## Summary

28 cases: 21 pass, 7 findings (5 fixed, 2 open), 0 not run.

Open: M12 (Notion's Turn into and Color open beside on hover), M25 (no
"search in the trash" when nothing is found).
