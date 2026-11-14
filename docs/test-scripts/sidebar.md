# Test script: shell and sidebar

Part `features/sidebar` with the shell around it (`app/shell.view.ts`,
`app/shell-sidebar.view.ts`), 2026-11-14, by the `feature-test-scripts`
skill.

- Inventory (`npm run inventory -- sidebar`): 24 controls (top row, search,
  tabs, shortcuts, tree rows with chevron, "…" and "+", teamspaces, views,
  favorites, Customize sidebar and its rows, the foot's workspace, help and
  apps buttons), 15 menu and list entries, keys ContextMenu, Shift+F10,
  Space, Alt+arrows and the tree's arrows, Enter; Ctrl+\ (global); the
  resizer's arrows, Home, End; drags: pointer drag of pages, HTML5 drag of
  Customize rows; 30 commands (`page.create`, `page.move`,
  `ui.toggleSidebar`, `settings.setSidebarShortcuts` …); no server path of
  its own (every change goes through the sync); announcements "Page
  moved." / "The page cannot move further that way.".
- Files read: `sidebar.view.ts`, `sidebar-top.view.ts`,
  `sidebar-row.view.ts`, `sidebar-tree.view.ts`, `sidebar-footer.view.ts`,
  `sidebar-tabs.view.ts`, `sidebar-favorites.view.ts`,
  `sidebar-teamspaces.view.ts`, `sidebar-shortcuts.view.ts`,
  `sidebar-customize.view.ts`, `workspace-menu.ts`, `app/shell.view.ts`,
  `app/shell-sidebar.view.ts`, `ui/drag/pointer-drag.ts`,
  `ui/tooltip/tooltip.ts`. In scope: the shell's top bar show button, the
  resizer, the drawer, every sidebar control. Out of scope (their own
  parts): the page menu's entries, the palette, the inbox, Settings,
  Templates, Trash, Import, Share.
- States in the views: sidebar shown | hidden | narrow drawer; tab Home |
  Calendar; Customize mode on | off; a row with children (chevron) or not,
  expanded or not, current or not, renamed in place; Shared empty (Start
  collaborating) or not; Private empty ("No pages yet…"); Favorites
  present or not; teamspaces present or not; signed in or not (workspace
  menu entries); resizing.
- Plans: `.captures/plans/ts-sidebar-01` … `-11` (human hand, seed 41,
  cursor, trail and keys drawn), written by `gen-sidebar.mjs` (`STAMP=0137`
  gives the pages of this run); Notion: `n133-sidebar.json` (and
  `n133-restore.json`, which reopened Notion's sidebar after a step clicked
  its close button).
- Pages made on the review server: Side P0137 with Side C0137, Side X0137
  with Side Y0137 inside, Side Off0137, a long "Café 🎉 …" title.

| Id | Case | Gestures (steps) | Must see | Result | Photos |
| --- | --- | --- | --- | --- | --- |
| SB1 | Sidebar at rest | open | top row, search, tabs, shortcuts, sections, foot | **pass** | 01/00 |
| SB2 | Hide sidebar pointed at | hover 1 s | wash, tooltip | **pass**: "Hide sidebar", pointer | 01/01 |
| SB3 | Inbox pointed at | hover | tooltip with the count | **pass**: "Inbox, 3 unread" | 01/02 |
| SB4 | New page pointed at | hover | tooltip | **pass**: "New page" | 01/03 |
| SB5 | Search field pointed at | hover | wash, pointer | **pass** (no tooltip: it has words) | 01/04 |
| SB6 | Search pressed, released | down, up | the palette, its field focused | **pass** | 01/05, 01/06 |
| SB7 | Escape in the palette | Esc | closed, focus back on Search with a ring | **pass** | 01/07 |
| SB8 | Ctrl+K, Escape | keys | the same | **pass** | 01/08, 01/09 |
| SB9 | Inbox opened, Escape | click, Esc | panel, Close focused; focus back on the bell | **pass** | 01/10, 01/11 |
| SB10 | New page | click, type | Untitled opens, title focused, the row follows the title | **pass** | 01/12, 01/13 |
| SB11 | A row pointed at | hover | wash, "…" and "+" at its end | **finding** (Notion difference): Pagecraft shows "…" then "+"; Notion "+" then "…" (Adicione uma página @212, Remova, renomeie e mais… @234). `sidebar-row.view.ts` | 02/01; n133/01 |
| SB12 | "+" pointed at | hover 1 s | tooltip | **pass**: "Add a page inside" | 02/02 |
| SB13 | "…" pointed at | hover 1 s | tooltip | **pass**: "Page actions" | 02/03 |
| SB14 | "+" pressed | click, type | a page inside, the parent opened, title focused | **pass**: Side C0137 under Side P0137 ▾ | 02/04, 02/05 |
| SB15 | Chevron | hover, click, click | closes, opens | **pass**; the chevron takes the icon's place on hover, as Notion's | 02/06–08 |
| SB16 | Right click on a row | right click | the page menu at the pointer, its search focused | **pass** | 02/09 |
| SB17 | Escape after the right click | Esc | the menu closes, focus back on the row | **finding** (front end): focus goes to the row's "…" button; Notion gives it back to the row, with its ring. `page-menu` focus return | 02/10; n133/06 |
| SB18 | "…" pressed, Escape | click, Esc | menu; focus back on "…" | **pass** | 02/11, 02/12 |
| SB19 | A row pressed | click | the page opens, the row current | **pass** | 02/13 |
| SB20 | Tab out of the tree and back | Tab, Shift+Tab | one stop for the tree, a ring on the row | **pass**: Tab → Customize sidebar, Shift+Tab → the row, 2 px ring | 03/02, 03/03 |
| SB21 | → and ← on a parent | keys | opens, closes | **pass** | 03/04–06 |
| SB22 | → on an open parent | key | focus to its first child | **pass** | 03/07 |
| SB23 | ← on a child | key | focus to the parent (ARIA tree) | **finding** (keyboard): nothing happens. `sidebar-tree.view.ts` | 03/08 |
| SB24 | ↑ and ↓ | keys | focus moves row to row | **pass** | 03/09, 03/10 |
| SB25 | Enter on a row | key | the page opens, focus stays | **pass** | 03/11 |
| SB26 | Alt+↓, Alt+↑ where it cannot move | keys | told it cannot move | **pass**: "The page cannot move further that way." announced | 03/12, 03/13 |
| SB27 | Shift+F10, Escape | keys | menu, then focus back on the row | **finding**: as SB17, focus lands on "…" | 03/14, 03/15 |
| SB28 | Space on a row | key | the page opens | **not run**: after SB27 the focus was on "…", so Space reopened the menu | 03/16 |
| SB29 | A click on a section heading, then Tab | click, Tab | the next control after the heading | **finding** (keyboard): the click focuses the whole `nav` (tabindex −1), so Tab starts again at Hide sidebar. `shell-sidebar.view.ts` | first run 03/02, 03/03 |
| SB30 | Drag a page before another | down, move, up | lifted mark, a line before the target that follows the pointer, "Page moved." | **pass**: watched `lifted` at 108 ms, after → inside → before at 390 ms, steady at rest; announced | 04/05–07 |
| SB31 | Undo the move | Ctrl+Z | the old order | **pass** | 04/08 |
| SB32 | Drag inside a page | down, move, up | inside mark, then the page nested, the parent opened | **pass**: Side Y0137 under Side X0137 ▾ | 04/10, 04/11 |
| SB33 | Escape mid-drag | Esc, up | nothing moves | **pass**: marks gone at once, order unchanged | 04/13–15 |
| SB34 | Drop on itself | down, move, up | no change | **pass** | 04/17, 04/18 |
| SB35 | Reload after the moves | reload | the order kept | **pass** | 04/19 |
| SB36 | Drag to a row off screen | – | autoscroll | **not run**: the plan kept the target in view | – |
| SB37 | Resizer pointed at | hover | col-resize on and around the line | **finding** (UX): at x 270, one pixel right of the line, the cursor is the arrow (the grab area is clipped to the sidebar's side); Notion's separator gives col-resize there | 05/01; n133/09 |
| SB38 | Resize by drag | down, move, up | a blue line, the width follows, kept | **pass**: 270 → 359 px | 05/02–04 |
| SB39 | Resize by keys | ←, Home, End | narrower, min, max, a ring | **pass**: 343, 192, 480 px | 05/05–07 |
| SB40 | Reload after resizing | reload | the width kept | **pass**: 480 px | 05/08 |
| SB41 | Ctrl+\ with the focus in the sidebar | key | hidden; the focus somewhere sensible | **finding** (keyboard): focus falls to `body`. Notion keeps it on the row (its sidebar floats while pointed at). `shell-sidebar.view.ts` | 05/12; n133/07 |
| SB42 | Show sidebar pointed at, pressed | hover, click | tooltip; shown, focus on its Hide button | **finding**: tooltip "Show sidebar" yes, then focus falls to `body` | 05/13, 05/14 |
| SB43 | Hide sidebar pressed | click | hidden, focus on Show sidebar | **finding**: focus falls to `body` | 05/15 |
| SB44 | The resizer's hint and click | hover, click | Notion: "Fechar Clique ou Ctrl+\ / Redimensionar Arrastar"; a click closes | **finding** (Notion difference): no hint, a click does nothing. `shell-sidebar.view.ts` | 05/01; n133/09 |
| SB45 | Workspace menu | click, ↓, Esc | menu at the foot, first entry focused, ring on ↓, focus back | **pass** | 06/02–04 |
| SB46 | Help | hover, click, Esc | tooltip, Keyboard shortcuts, focus back | **pass** | 06/05–07 |
| SB47 | Templates, trash and more | hover, click, Enter, Esc | tooltip, menu, Templates, focus back | **pass** | 06/08–11 |
| SB48 | Trash from that menu, Escape | click, Esc | panel, then focus back on the button | **finding** (keyboard): focus falls to `body`. `features/trash` | 06/13, 06/14 |
| SB49 | Start collaborating pointed at | hover | wash, pointer | **pass** (its click belongs to Share) | 06/15 |
| SB50 | Customize sidebar | click | the mode, focus inside it | **finding** (keyboard): the button disappears and the focus falls to `body` | 07/02 |
| SB51 | A Customize row pointed at | hover | grip, menu and Remove; tooltip | **pass**: "Remove from sidebar" | 07/03, 07/04 |
| SB52 | A row's menu, Escape | click, Esc | Move up / Move down (the keyboard path), then focus back | **finding** (keyboard): the menu is right; Escape leaves the focus on `body`. `sidebar-customize.view.ts` | 07/05, 07/06 |
| SB53 | Drag a shortcut onto another, and back | drag ×2 | the order changes, then returns | **pass** | 07/07, 07/08 |
| SB54 | Add shortcut, Escape | click, Esc | search focused, Go to › Page, Settings; focus back | **finding**: as SB52 | 07/09, 07/10 |
| SB55 | Done | hover, click | the mode ends | **pass** | 07/12, 07/13 |
| SB56 | The Calendar tab pointed at | hover 1 s | tooltip | **finding** (interface): none (a native `title` only, no hint like every other icon button); Notion's tab icons show one. `sidebar-tabs.view.ts` | 08/01 |
| SB57 | Calendar tab | click | Upcoming events | **pass**: "No upcoming events" | 08/02 |
| SB58 | Home tab | click | Home opens | **pass** | 08/03 |
| SB59 | Add to favorites from the row's menu | click ×2 | a Favorites section with the page | **pass**, with a Notion difference (**finding**): a favorite is a plain row, no chevron, "+" or "…"; Notion's favorites are tree rows. `sidebar-favorites.view.ts` | 08/06, 08/07; n133/01 |
| SB60 | Remove from favorites | click ×2 | gone from Favorites | **pass** | 08/09 |
| SB61 | A new page offline, then online and reload | offline, click, type, online, reload | "Offline" said, the page kept | **pass**: "Offline" beside "Edited just now"; after reload Side Off0137 is there | 09/02–06 |
| SB62 | Dark theme | palette "Use dark theme" | legible, washes, tooltip, ring | **pass** (the account keeps "light", which wins over the system's, so the plan picks dark and light back) | 10/02–07 |
| SB63 | Light theme | – | legible | **pass** (every other run) | 01–09 |
| SB64 | A long title with accents and emoji | type 84 characters | kept whole, the row cut with an ellipsis | **pass**: scroll 513 px in 144 px, ellipsis | 11/02, 11/03 |
| SB65 | Narrow window: the drawer, its scrim, Escape | – | – | **not run**: captures are 1440 × 900 only | – |
| SB66 | Import, New workspace, Log out | – | – | **not run**: Import is the import part's; the other two change the review account | – |
| SB67 | A teamspace's "+" pointed at | hover | tooltip | **finding** (interface, from the code): `sidebar-teamspaces.view.ts` gives it no `title` or `interestfor`, unlike the tree's "+" | – |

Photos are in `.captures/pagecraft/ts-sidebar-NN/` and
`.captures/notion/n133-sidebar/` (`NN/step`).

## Notion's numbers (n133, 2026-11-14)

- Sidebar 270 px. A row pointed at: the chevron replaces the icon
  ("Abrir"), then "+" ("Adicione uma página") and "…" ("Remova, renomeie
  e mais..."), tooltips after about 1 s.
- Right click: the page's menu at the pointer (Página, Remover dos
  favoritos, Copiar link, Renomear, Mover para, Transformar em wiki, Abrir
  em nova guia, Abrir no modo lado a lado, Última edição); Escape gives the
  focus back to the row, which shows a 2 px ring.
- Ctrl+\ with the pointer over the sidebar: the sidebar floats over the
  page (☰ in the top bar) and the focus stays on the row.
- The edge: col-resize at x 270, a hint "Fechar Clique ou Ctrl+\ ·
  Redimensionar Arrastar"; the separator is named "Redimensione com as
  teclas de seta para a esquerda e para a direita".

## Summary

67 cases: 46 pass, 17 findings, 4 not run.

Findings, most serious first: the focus lost to `body` when the sidebar
hides or shows (SB41–43), after the trash closes (SB48) and in Customize
(SB50, 52, 54); Escape after the row's context menu lands on "…" (SB17,
27); ← on a child does nothing (SB23); a heading click restarts Tab (SB29);
the resizer's grab area, hint and click (SB37, 44); the tab's and the
teamspace "+"'s missing tooltips (SB56, 67); Notion's order "+" then "…"
(SB11) and tree rows in Favorites (SB59).
