# Test script: editor and text blocks

Part `features/editor` with the text blocks (`blocks/paragraph`,
`heading`, `bulleted-list`, `numbered-list`, `to-do`, `quote`),
2026-11-14, by the `feature-test-scripts` skill.

- Inventory (`npm run inventory -- editor`): 21 controls (the handle and
  "+", the blocks' container, the cover's presets, picker and slider, the
  icon popover, the link form, the start pills, the trash banner's
  actions, the title), 23 menu entries, 21 keys (arrows, Backspace,
  Delete, Enter, Escape, Space, Tab, with Ctrl, Shift, Alt: Ctrl+/, C, D,
  E, K, S, X), html5 and pointer drag, 64 commands, 6 announcements.
- Files read: `editor-keys.view.ts`, `editor-block-keys.view.ts`,
  `editor-input.view.ts`, `editor-typing.view.ts`, `block-shortcut.ts`,
  `editor-selection.view.ts`, `editor-structure.commands.ts`,
  `editor.view.ts`, `editor-icon.view.ts`, `editor-link.view.ts`,
  `editor-trashed.view.ts`, `features/ai/ai-prompt.view.ts`,
  `model/rich-text.ts`, `model/link-href.ts`, `app/bootstrap.ts` (the
  global keys). In scope: typing, Enter, Backspace, Markdown, marks,
  links, block keys, the handle and "+", block drag, copy and paste, the
  title's icon and cover, the trash banner, the empty page's start.
  Out of scope (their own parts): the slash, block, mention and emoji
  menus' entries, the other blocks, the format toolbar's own controls,
  comments.
- States in the views: empty page (start pills), an empty line
  (placeholder, Space for AI), a text, a selection in a text, selected
  blocks, a block being dragged, an open overlay (link, icon, cover, AI),
  a page in the trash, a page with or without an icon and a cover.
- Plans: `.captures/plans/ts-editor-01` … `-13` (human hand, seed 51,
  70 wpm, cursor, trail and keys drawn), written by `gen-editor.mjs`
  (`STAMP=2201`); Notion: `n134-editor.json` (its additions were then
  removed by `n134-restore2.json`; the page is as it was, photo
  n134-restore2/04).

| Id | Case | Gestures (steps) | Must see | Result | Photos |
| --- | --- | --- | --- | --- | --- |
| E1 | New page, its title | click, type | title focused, the name follows | **pass** | 01/01, 01/02 |
| E2 | Enter in the title | Enter | the first line, its placeholder | **pass**: "Press 'space' for AI or '/' for commands" | 01/03 |
| E3 | Typing accents and emoji | type `Hello café 🎉` | each key at once | **pass**: 13 steps watched, one character each | 01/04 |
| E4 | Enter, a second line | Enter, type | a new paragraph, caret in it | **pass** | 01/05, 01/06 |
| E5 | ↑ and End | keys | caret to the line above, its end | **pass** | 01/07, 01/08 |
| E6 | Shift+Enter | key, type | a line break inside the block | **pass** | 01/09, 01/10 |
| E7 | Backspace at a line's start | key | joined with the line above | **pass** | 01/13 |
| E8 | Undo, redo | Ctrl+Z, Ctrl+Y | before, after | **pass** | 01/14, 01/15 |
| E9 | Ctrl+Backspace | key | the word before deleted | **pass** | 01/16 |
| E10 | Reload | reload | the text kept | **pass** | 01/17 |
| E11 | `#` … `####` and a space | type | Heading 1 to 4, with their placeholders | **pass** | 02/04–11 |
| E12 | `- `, `1. `, `[] `, `" `, `> ` | type | bullet, number, to-do, quote, toggle | **pass** | 02/12–25 |
| E13 | Enter, then Backspace in an empty item | keys | out of the list | **pass** | 02/14, 02/17, 02/20 |
| E14 | Tab, Shift+Tab in a list | keys | nested (◦), back | **pass** | 03/05, 03/07 |
| E15 | Numbers and letters | type | 1., 2., a. | **pass** | 03/12 |
| E16 | Enter in an empty nested item | Enter | Notion: out one level, still a list item ("3."); a second Enter ends the list | **finding** (Notion difference): it became an indented paragraph. Fixed (`editor-structure.commands.ts`) | 03/13 before and after; n134/05, n134/06 |
| E17 | To-do checked by click | click | ticked, struck through | **pass** | 03/16 |
| E18 | Ctrl+Enter on a to-do | key | unticked | **pass** | 03/18 |
| E19 | Backspace at a to-do's start | key | a paragraph | **pass** | 03/20 |
| E20 | Bold, italic, underline, code, strike by keys | Ctrl+B, I, U, E, Shift+S | each mark on the selected word, the toolbar's buttons lit | **pass** | 04/06–10 |
| E21 | Ctrl+K on selected words | key | the link field | **finding** (broken action): the command palette opened instead, and the rest typed into it. The editor took the key, the global shortcut did too. Fixed (`ui/shortcuts/shortcut-registry.ts`) | 04/11 before and after |
| E22 | `example.com` in the link field | type, Enter | the link made | **finding** (UX, Notion difference): refused, "Enter an address that starts with http, https or mailto." Notion takes it. Fixed (`model/link-href.ts` `typedHref`) | 04/12 before and after |
| E23 | Typing at a link's end | type | plain words after the link | **finding** (Notion difference): the words joined the link. Fixed (`model/rich-text.ts`) | 04/14 |
| E24 | Typing at a code mark's end | type | as Notion: still code | **pass** (Notion keeps the code mark too) | 04/14; n134/11 |
| E25 | `**b**`, `*i*`, `` `c` ``, `~s~` | type | bold, italic, code, strike; kept after reload | **pass** | 04/16–20 |
| E26 | Escape, Shift+↑ | keys | the block, then two selected; told | **pass**: "Blocks selected. …" announced | 05/05, 05/06 |
| E27 | Alt+↑ on selected blocks | key | moved; told | **finding** (accessibility): moved, nothing announced. Fixed: "Block moved." | 05/07 |
| E28 | Delete, undo | keys | removed, back | **pass** | 05/08, 05/09 |
| E29 | Ctrl+D | key | the block duplicated | **pass** | 05/11 |
| E30 | Ctrl+Shift+↓ | key | moved; told | **finding**: as E27, fixed; a second move is said again (the live region now changes) | 05/12 |
| E31 | Ctrl+Shift+1, Ctrl+Shift+0 | keys | Heading 1, text | **pass** | 05/13, 05/14 |
| E32 | Ctrl+/, Escape | keys | the block menu, its search focused; caret back | **pass** | 05/15, 05/16 |
| E33 | Ctrl+A twice, Escape | keys | the line's text, every block, none | **pass** | 05/17–19 |
| E34 | The handle and "+" pointed at | hover 1 s | grab cursor, "Block actions"; "Add a block below" | **pass** | 06/06, 06/07 |
| E35 | The handle pressed, Escape | click, Esc | the block menu; closed | **pass**; caret goes back to the last text, not the block (Notion keeps the block selected): **finding** (Notion difference, open) | 06/08, 06/09 |
| E36 | "+" pressed | click | a line below with "/" and the menu | **pass** | 06/10 |
| E37 | Drag a block before the first | down, move, up | lifted, a line before, moved, told, grabbing hand | **pass** after a fix: the cursor was the I-beam over text while carrying (**finding**, fixed in `ui/drag/drag.css`) | 06/12–14 |
| E38 | Undo the drag; Escape mid-drag | keys | back; nothing moves | **pass** | 06/15, 06/18, 06/19 |
| E39 | Copy two blocks, paste on an empty line | Ctrl+C, Ctrl+V | the two blocks, the empty line replaced | **pass** | 07/06–11 |
| E40 | Copy a word, paste | keys | the word pasted | **pass**, kept after reload | 07/16, 07/17 |
| E41 | Typing with slips | typos 0.05 | the sentence right in the end | **pass**: 3 slips fixed | 08/04 |
| E42 | Typing offline, back online, reload | offline, type | "Offline" said, nothing lost | **pass** | 09/05–07 |
| E43 | Dark theme | palette | legible headings, lists, marks | **pass** | 10/08 |
| E44 | `[] ` and `" ` typed in a list item | type | Notion: a to-do, a quote | **finding** (Notion difference): typed as text. Fixed (`editor-typing.view.ts`) | 10/05 before and after; n134/08 |
| E45 | Empty page: pills, More ways to start | hover, click, Esc | wash; the menu; focus back with a ring | **pass** | 11/02–04 |
| E46 | Space on an empty line, Escape | type, Esc | the AI field; the caret back on the line | **finding** (keyboard): the focus fell to `body`. Fixed (`features/ai/ai-prompt.view.ts`) | 11/07, 11/08 |
| E47 | The AI field's place | look | Notion asks inline at the line | **finding** (Notion difference, open): the field opens at the window's foot; on Notion's test page Space opened nothing (no AI on its plan), so only the code says how Notion shows it | 11/07; n134/13 |
| E48 | Add icon, Escape | click, Esc | the emoji picker, search focused; caret back | **pass** | 12/05, 12/06 |
| E49 | Add cover, Change cover, Remove | clicks | a cover; Colors / Use image / Remove; gone | **pass** | 12/07–12 |
| E50 | Reposition the cover | drag | – | **not run**: the default cover is a colour, which has no Reposition | – |
| E51 | Move to Trash from the page menu | click ×2 | the red banner, read only | **pass**; the announcement read the buttons' names too (**finding**, fixed: only the words) | 13/06 |
| E52 | Restore page | click | the banner gone, the text there | **pass** | 13/08 |
| E53 | IME composition | – | – | **not run**: the capture has no input method | – |

Photos are in `.captures/pagecraft/ts-editor-NN/` and
`.captures/notion/n134-editor/` (`NN/step`).

## Notion's behaviour (n134, 2026-11-14)

- Enter in an empty nested numbered item: out one level, still numbered
  (announced "Convertido para Lista numerada"); a second Enter: "Convertido
  para Texto".
- `[] ` typed in an empty bulleted item: "Convertido para Lista de
  tarefas"; `- ` in a text line: "Convertido para Lista com marcadores".
- Text typed right after an inline code mark stays code.

## Fixed after the run (commit "fix(editor): …")

- E21: global shortcuts leave a key the focused part already took
  (`defaultPrevented`), so Ctrl+K on selected words opens the link field.
- E22: the link field takes `example.com` and `ann@example.com`
  (`typedHref`).
- E23: words typed at a link's end are not part of the link.
- E27, E30: keyboard moves say "Block moved."; the same words twice are
  said twice.
- E37: the grabbing hand while anything is carried.
- E16: Enter in an empty nested item steps out and keeps its kind.
- E44: block Markdown works at the start of list items, to-dos, toggles,
  quotes and headings.
- E46: Escape in the AI field puts the caret back on its line.
- E51: the trash banner announces only its sentence.

## Summary

53 cases: 40 pass, 11 findings (9 fixed, 2 open), 2 not run.

Open: E35 (after the block menu closes, Notion keeps the block selected),
E47 (the AI field at the window's foot instead of at the line).
