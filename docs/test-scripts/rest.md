# Test script: the remaining parts, by size

Parts `features/comments`, `features/settings`, `features/share`,
`features/page-outline`, `features/page-history`, `features/page-updates`,
`features/home`, `features/inbox`, `features/templates`, `features/trash`,
`features/page-info`, `features/mention-menu`, `features/backlinks`,
`features/breadcrumbs`, `features/move-to`, `features/shortcut-help`,
`features/teamspaces`, `features/integrations` and `features/ai`,
2026-11-14, by the `feature-test-scripts` skill.

- Inventory (`npm run inventory`, then `-- page-info`, `teamspaces`,
  `move-to`, `breadcrumbs`, `backlinks`, `shortcut-help`,
  `markdown-export`): comments 21 controls, settings 19, share 13,
  teamspaces 11, integrations 11, ai 8, page-updates 7, page-info 5,
  move-to 3, breadcrumbs 3, page-outline 3, templates 3, home 2,
  backlinks 2, inbox 1, trash 1; announcements "Link copied.", "Moved to
  the page.", the Markdown export's three.
- Files read: `share.view.ts`, `share-tab.view.ts`,
  `ui/overlay/overlay-dismiss.ts`, `ui/caret/caret.ts`,
  `ui/tooltip/tooltip.ts`, `ui/dialog/dialog.view.ts`, `dialog.css`,
  `settings-notifications.view.ts`, `settings.css`,
  `page-outline.css`, `app/shell.view.ts`, `app/shell.css`,
  `inbox.view.ts`, `trash.view.ts`, `trash.css`,
  `persistence/snapshot-store.ts`, `page-history.selectors.ts`,
  `move-to-popover.view.ts`, `teamspace-row.view.ts`,
  `teamspace-settings.view.ts`, `connections-settings.view.ts`.
- States found in the views: the outline needs three headings
  (`OUTLINE_THRESHOLD`); "Mark all as read" shows only while something is
  unread; an open teamspace shows no member count; versions are copies
  of a page as it was before a run of edits, at most every 10 minutes;
  the AI needs a local model (Ollama).
- Plans: `.captures/plans/ts-rest-01` … `-06` (human hand, seed 91),
  written by `gen-rest.mjs` (`STAMP` 6601). Notion: `n138-rest.json`
  (read only: nothing marked, shared or changed; the Updates panel it
  opened was closed again, `n138-rest/06`).

| Id | Case | Gestures (steps) | Must see | Result | Photos |
| --- | --- | --- | --- | --- | --- |
| R1 | A comment on the page | hover title, Add comment, type, Enter | the discussion under the title | **pass** | 01/02–04 |
| R2 | A comment on selected words | select, Ctrl+Shift+M, type, Enter | a "1" marker on the words | **pass** | 01/06–09 |
| R3 | Reload | reload | both comments kept | **pass** | 01/11 |
| R4 | Settings from the workspace menu | click, click | the dialog on Preferences | **pass** | 02/02 |
| R5 | Its sections by pointer | click ×4 | Notifications, General, Plans, Import and export | **pass** | 02/03, 09–11 |
| R6 | A switch pointed at | hover | pointer cursor; its row names it (no hint, as Notion) | **pass** | 02/04 |
| R7 | A switch clicked | click | off; the inbox badge 3 → 2 | **pass** | 02/05 |
| R8 | Tab to the next switch | Tab | a ring around the switch | **finding** (interface): a square ring around a round switch. Fixed: the ring follows the pill | 02/06 |
| R9 | Space on a switch | Shift+Tab, Space | back on | **pass** | 02/07, 08 |
| R10 | Interface text | look | Pagecraft's own words | **finding** (interface): Plans, Push, Desktop and Connections hints named Notion. Fixed | 02/10 |
| R11 | Settings' close button | look, focus | a × at the corner (Notion's, n138/13) | **finding** (interface, keyboard): the button was hidden yet took the first focus. Fixed: shown at the corner | 02/02, 06 |
| R12 | Escape | key | closed, focus on the workspace button | **pass** (Notion leaves it on the body, n138/17) | 02/12 |
| R13 | Settings' search | look | "Search settings" first, focused (Notion) | **finding** (Notion difference, open): Pagecraft has none | n138/13 |
| R14 | Share pointed at, opened | hover, click | "Share and publish", the email field focused | **pass** | 03/05, 06 |
| R15 | Escape in Share's email field | key | closed, focus on Share (Notion, n138/02) | **finding** (broken action): nothing happened. Fixed: the menu closes on Escape, and the editor's caret no longer takes the focus back from Share | 03/07 |
| R16 | Outline of a page with three headings | hover the dashes | the list of headings | **pass** | 03/08 |
| R17 | An outline entry | click | the caret on that heading | **pass** | 03/09 |
| R18 | Version history | "…", Version history, Escape | the whole window; closed, focus on the text | **pass** | 03/11, 12 |
| R19 | Its versions of a page made a minute ago | look | (to confirm on Notion) | **finding** (open): the one version is the empty page before the edits ("Untitled") | 03/11 |
| R20 | Updates & analytics | "…", Updates & analytics | the panel docked at the right | **finding** (interface): the outline's dashes sat over the panel's lines. Fixed: they stay at the page's edge | 03/14 |
| R21 | After choosing it by pointer | look | no hint over "…" (Notion, n138/04) | **finding** (interface): "Page actions" showed while the pointer was away. Fixed: focus given back by code shows no hint | 03/14 |
| R22 | Escape there | key | the panel stays (Notion too, n138/05) | **pass** | 03/15 |
| R23 | Home | click | greeting, Recently visited, Favorites, Upcoming | **pass** | 04/01 |
| R24 | A card pointed at | hover | lifted card, pointer | **pass** | 04/02 |
| R25 | Inbox | click the bell | a panel beside the sidebar, unread dots | **pass** (Notion's about 389 wide, ours 416) | 04/03 |
| R26 | Mark all as read | click | dots gone, focus kept in the panel | **finding** (keyboard): the focus fell to the page's body. Fixed: it moves to Close inbox | 04/04 |
| R27 | Escape | key | closed, focus on the bell (Notion, n138/08) | **pass** after R26 (it was on the body) | 04/05 |
| R28 | Read state in another browser | a new run | still read (Notion keeps it with the account) | **finding** (data, open): read marks live in this browser's storage; each new browser shows them unread | 04/03 |
| R29 | Templates | apps, Templates, pick To-do list | categories, the preview, Use this template | **pass** | 04/07, 08 |
| R30 | Escape | key | closed, focus on the apps button | **pass** | 04/09 |
| R31 | Trash | apps, Trash | search focused, rows with restore and delete | **pass** | 04/11 |
| R32 | A long trash | look | the list scrolls, the note at the foot (Notion, n138/10) | **finding** (interface): the whole panel scrolled and the note was out of view. Fixed | 04/11 |
| R33 | Trash search with no match | type | "No pages in the trash match." | **pass** | 04/12 |
| R34 | Trash filters | look | Last edited by, In, Teamspaces (Notion) | **finding** (Notion difference, open): only "In" | n138/10 |
| R35 | A page mentioned | type "@Getting", Enter | the mention in the text | **pass** | 05/04, 05 |
| R36 | Favorite | hover, click, click | hint; in Favorites; out again | **pass** | 05/06–08 |
| R37 | Copy link | click | "Link copied." said | **pass** | 05/09 |
| R38 | "Edited just now" pointed at | hover | "Version history" hint | **pass** | 05/10 |
| R39 | The page's place in the top bar | click | Move to, its search focused | **pass** | 05/11 |
| R40 | Escape there | key | closed, focus back on the place | **finding** (keyboard): the focus went into the text. Fixed | 05/12 |
| R41 | Move to from "…", typed | click, type, Escape | the places that match; closed | **pass** | 05/14–16 |
| R42 | Following the mention | click | Getting started, "4 backlinks" | **pass** | 05/17 |
| R43 | Help and keyboard shortcuts | click, Escape | the shortcuts; focus back on Help | **pass** | 05/18, 19 |
| R44 | Teamspaces in Settings | click | the table of teamspaces | **finding** (open, to confirm on Notion): Members is empty for open teamspaces | 06/03 |
| R45 | New teamspace | click, type, Enter | created, in the sidebar | **pass** | 06/04–06 |
| R46 | New integration | type, Enter | its secret shown once, with Copy | **pass** | 06/08, 09 |
| R47 | New chat, a question | click, type, Enter | an answer, or what to do | **pass** for the message ("start Ollama…"); the answer **not run**: no local model | 06/11–13 |
| R48 | Escape in the chat | key | closed | **pass** | 06/14 |
| R49 | Markdown export | — | — | **not run**: it saves a file; the capture has no download step | — |
| R50 | Markdown import | — | — | **not run**: needs a file chosen in a dialog | — |
| R51 | Presence of others | — | — | **not run**: needs a second person signed in | — |
| R52 | Onboarding | — | — | **not run**: first run only, on a new account | — |
| R53 | Meeting notes | — | — | **not run**: needs a microphone | — |
| R54 | These surfaces in the dark theme | — | — | **not run**: left for a theme pass | — |
| R55 | These actions offline | — | — | **not run**: offline covered in the earlier parts | — |

Photos are in `.captures/pagecraft/ts-rest-NN/` and
`.captures/notion/n138-rest/`.

## Fixed after the run (commit "fix(rest): …")

- R8: `settings.css`, the switch button is round, so is its ring.
- R10: `settings-text.ts`, `integration-text.ts`: no "Notion" in what
  the person reads.
- R11: `ui/dialog`: Settings shows its close button at the corner, as
  the card does.
- R15: `share.view.ts` closes on Escape; `ui/caret/caret.ts` leaves the
  focus on an overlay's control outside the blocks.
- R20: `page-outline.css`: beside a docked panel, the dashes move with
  the page's edge.
- R21: `ui/tooltip/tooltip.ts`: no hint for focus given back by code
  away from the pointer.
- R26: `inbox.view.ts`: Mark all as read hands the focus to Close inbox.
- R32: `trash.css`: the list scrolls; search and note stay.
- R40: `move-to-popover.view.ts`: Escape gives the focus back to what
  opened it.

## Summary

55 cases: 34 pass, 14 findings (9 fixed, 5 open), 7 not run.

Open: R13 (no settings search), R19 (versions of a new page), R28 (read
marks per browser), R34 (trash filters), R44 (members of open
teamspaces).
