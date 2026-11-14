# Pagecraft's interactive surfaces

Where a person can act, the selector to reach it, and the numbers that decide
whether a gesture registers. Read from the code on 2026-11-14; when a
selector fails, search the view file named here, then update this table.

## Gestures and their thresholds

| Number | Value | Where |
| --- | --- | --- |
| Drag starts after the pointer moves | 4 px, no delay | `src/ui/drag/pointer-drag.ts` (`DRAG_THRESHOLD`) |
| Drop before / after a block | top / bottom 30 % of the target | same |
| Drop inside (nest) | the middle 40 % | same |
| Side drop (makes columns, editor blocks only) | within 10 % of the left or right edge | same |
| Tooltip appears after pointing | 500 ms (`--duration-hint-delay`) | `src/ui/tooltip/` |
| Tooltip hides after leaving | 120 ms (`--duration-fast`) | same |
| Hover wash | 20 ms (`--duration-hover`) | tokens |
| Flash after a jump | 1200 ms (`--duration-flash`) | `.editor__block[data-flash]` |

Drags use pointer events and `document.elementFromPoint`, so the hand's real
coordinates decide the drop. Only the left button starts a drag; Alt held at
release drops a copy; Escape cancels; the click that follows a drag is
swallowed. The one HTML5 drag is the sidebar's Customize list
(`li.sidebar__edit-row[draggable=true]`, grip `.sidebar__grip`); Playwright's
mouse drives it too.

## Drags

| What | Press on | Drop on | During the drag |
| --- | --- | --- | --- |
| Editor block | `.editor__block[data-block-id] >> nth=N >> .editor__handle[data-handle]` (shown on hover) | `.editor__block[data-block-id]`, or a sidebar row `[data-page-drop]` | source `[data-dragging]` at half opacity; target `[data-drop=before\|after\|inside\|left\|right]` as a 2 px accent line or a wash |
| Sidebar page | `.sidebar__row[data-page-id]` (not its buttons) | another row | same attributes; "Page moved." announced |
| Table row | `.database__row-handle` (shown on row hover) | `.database__row[data-row-id]` | same |
| Table column | `th.database__header[data-property-id]` (not `.database__resizer`) | another header, inline axis | inset left/right line |
| Board card | `.row-card[data-row-id]` | a card, `.board__column[data-group-key]`, `.board__lane[data-lane-key]` | same |
| Calendar entry | `.calendar__entry` | `.calendar__day[data-day]` | same |
| Sort rule | `.view-settings__grip` | `.view-settings__sort` | same |

Resizers (pointer capture, no threshold, value previewed live, written on
release): sidebar `.app__resizer[role=separator]` (col-resize), table column
`.database__resizer`, image `.image__handle[data-side=start|end]`
(ew-resize), column gutter `.column__gutter` (col-resize), embed
`.embed__handle` (ns-resize), peek `.peek__resizer`, cover
`.editor__cover-slider` (reposition mode), timeline `.timeline__bar`, map
`.map__canvas` (grab).

## Pointing, clicking, menus

- Hover reveals: block handles (only the innermost hovered block's), sidebar
  row `+` and `…`, table row gutter, board menu, calendar add, code block
  tools, image toolbar, simple-table add bars.
- Right-click opens a menu at the pointer on blocks, sidebar rows, table
  rows, cards, simple tables; the menu's search field takes focus.
- Double-click selects a word (browser); a table cell edits on double-click.
  Triple-click selects the paragraph (browser).
- Dragging inside one block selects text; dragging into another block
  selects whole blocks (`.editor__block[data-selected]`). Shift-click on
  another block extends the block selection.
- Submenus open on pointer-over (mouse only, no delay); a submenu opened
  under the pointer does not take focus.
- A press outside an open overlay (`[data-overlay]`) closes it.

## Keyboard

- Global (Mod = Control here): Mod+N new page, Mod+K or Mod+P palette, Mod+Z
  undo, Mod+Shift+Z or Mod+Y redo, Mod+\ sidebar, Mod+[ and Mod+] back and
  forward, Mod+Shift+L theme, Mod+Shift+/ shortcut help, Mod+, settings.
- In a block: Tab and Shift+Tab indent and outdent (not focus moves), Mod+D
  duplicate, Mod+Shift+ArrowUp/Down move, Mod+/ block menu, Escape selects the
  block, Mod+Shift+0..9 turn into, Enter splits, Backspace at the start
  merges.
- Markdown at a paragraph start, then Space: `#`..`####`, `-` `*` `+`,
  `1.`, `[]`, `"`, `>`, three backticks, `---`.
- Menus: `/` slash, `@` mention, `:` emoji, `[[` page link; ArrowUp/Down,
  Enter, Escape; generic menus also Home/End and ArrowRight/Left for
  submenus.
- Keyboard equivalents of drags: Space/Enter on a handle picks it up,
  arrows move, Space/Enter drop, Escape cancel; Alt+arrows move a sidebar
  page or a board card.

## Feedback channels

- Live region: `[data-announcer][role=status]` (block moved or copied, page
  moved, column moved, blocks selected, lock refused).
- Save status: `.app__save-status[role=status]` in the top bar.
- Focus ring: `:focus-visible { outline: var(--size-focus-width) solid
  var(--color-border-focus) }` in `src/styles/base.css`; the intentional
  ringless exceptions are listed in `src/app/focus-rings.test.ts`
  (contenteditable text is one).
- Washes: `--color-bg-hover`, `--color-bg-active`, `--color-bg-selected`;
  `[aria-expanded=true]` counts as pressed/open.
- There is no toast system and no visual undo notice.

## Regions

`.app` · sidebar `nav.app__sidebar .sidebar__tree[role=tree]`, rows
`.sidebar__row[role=treeitem][data-page-id]` · top bar `.app__top-bar` ·
main `main#main.app__main` (scrolls the page) · title
`textarea.editor__title` · blocks `.editor__block[data-block-id][data-type]`,
text `[data-text][contenteditable]` · slash menu `.slash-menu`, items
`.slash-menu__item[role=option][aria-selected]` · generic menu
`.menu[popover][data-overlay]`, rows `[data-index]` · format toolbar
`.format-toolbar[role=toolbar]` · database `section.database`, table
`.database__table` · board `.board`.
