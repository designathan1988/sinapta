# Test script: toggle block

- Part: `blocks/toggle`. Date: 2026-11-14.
- Inventory (`npm run inventory -- toggle`): 1 control (`button.toggle__button`,
  "Hide content" / "Show content", click), 1 menu entry ("Toggle"), 3
  commands (`toggle.setOpen`, `toggle.setAllOpen`, `record.update`), no own
  keys, no own server paths, no announcements.
- In scope from "Used by" and "Also mentioned in": `features/editor`
  (`editor-block-keys.view.ts`: Ctrl+Enter, Ctrl+Alt+T, Ctrl+Shift+7;
  `block-shortcut.ts`: `> `; `editor-blocks.view.ts`: children shown when
  open), `features/slash-menu` (catalog entry), `blocks/heading` (toggle
  headings, counted by Ctrl+Alt+T), `features/page-outline`,
  `features/markdown-export`. Out of scope: database, sidebar, settings and
  breadcrumb matches (other things called "toggle").
- States from the views: open / closed (a new toggle starts open); empty /
  with children; read-only page; nested toggle; toggle heading.
- Changes travel by the sync (`POST /api/workspaces/…/operations`), so
  reload and offline cases apply.
- Plans: `.captures/plans/ts-blocks-toggle-01.json` (16 steps, seed 41),
  `ts-blocks-toggle-02.json` (20 steps, seed 42, frames on the drag).
  Photos: `.captures/pagecraft/ts-blocks-toggle-01/`, `…-02/`; all 42 opened.

| Id | Case | Gestures (steps) | Must see | Result | Photos |
| --- | --- | --- | --- | --- | --- |
| T01 | Create by Markdown | type `> Alpha` in an empty line | becomes an open toggle, caret kept | **pass**: open toggle, `aria-expanded=true` | 01/02, 02.1-typed |
| T02 | Create by slash, pointer | `/tog`, point, click | menu, entry, toggle | not run (next plan) | |
| T03 | Create by slash, keyboard | `/tog`, arrows, Enter | same | not run | |
| T04 | Slash then Escape | `/tog`, Escape | menu closes, text kept | not run | |
| T05 | Turn into by key | Ctrl+Shift+7 on a paragraph | toggle, text kept | not run | |
| T06 | Turn into from block menu | handle → Turn into → Toggle | toggle | not run | |
| T07 | Arrow at rest | point away | chevron, no wash | **pass** | 01/05 |
| T08 | Arrow pointed at | hover 900 ms | wash, cursor pointer, tooltip | **finding**: wash and `pointer` cursor shown, but no tooltip (`#tooltip` closed) on this icon-only button; compare with Notion. Owner `src/blocks/toggle/toggle.view.ts` | 01/06 |
| T09 | Arrow pressed | `down` | pressed state | pass (wash stays; no separate pressed look; compare with Notion) | 01/07 |
| T10 | Click closes | `up` | children hidden, chevron right | **pass**: `false` 9 ms after release | 01/08 |
| T11 | Click opens | click while closed | children back | **pass** (offline step) | 01/14 |
| T12 | Focus by keyboard | click arrow, Shift+Tab, Tab | visible ring | **pass**: `:focus-visible`, 2 px blue outline | 02/12–14 |
| T13 | Enter / Space on focused arrow | Enter, Space | opens / closes, focus stays | **pass** | 02/15–16 |
| T14 | Ctrl+Enter in its text | click text, Ctrl+Enter | opens | **pass** | 01/10 |
| T15 | Ctrl+Alt+T | press | all toggles close (one toggle on the page) | **pass** for one toggle; nested toggles and toggle headings not run | 01/11 |
| T16 | Ctrl+Alt+T with several, mixed | | all open, then all close | not run | |
| T17 | Ctrl+Alt+T in a subpage | | parent's toggles untouched | not run | |
| T18 | Ctrl+Enter on a paragraph | | nothing happens to toggles | not run | |
| T19 | Enter at the end of an open toggle | type `\nInside one` | new line inside the toggle (Notion) | **finding, fixed in code, re-run pending**: the new line went beside the toggle at page level (`toggle:Alpha / paragraph:Inside one`). Fixed on 2026-11-14 in `src/features/editor/editor-structure.commands.ts` (`splitBlock`, `newLinePlace`: the new line becomes the toggle's first child), with a unit test; not yet photographed again | 01/03 |
| T20 | Enter on a closed toggle | | sibling after, children intact | not run | |
| T21 | Enter on an empty toggle | | per Notion | not run | |
| T22 | Backspace at the start | | becomes text, children kept | not run | |
| T23 | Tab / Shift+Tab | Tab under the toggle, Shift+Tab | nests inside, then out | **pass** | 01/04, 02/02–04 |
| T24 | Empty open toggle | type `\n> ` | Notion shows an "Empty toggle" hint | **finding**: only the "Toggle" placeholder, no hint for the empty inside; to confirm with Notion | 02/18–19 |
| T25 | Placeholder | empty title | "Toggle" | **pass** | 02/19 |
| T26 | Text: 1 char, 200 chars, `café 🎉`, slips | | wraps beside the arrow | not run | |
| T27 | Paste many lines inside | | lines become children | not run | |
| T28 | Drag the toggle after a block | `down` handle, `moveTo` below | after line under the target, toggle and child dimmed | **pass** for the indicator; drop itself not run (Escape case) | 02/08–09 |
| T29 | Drop a block inside the open toggle | `drag` to the toggle, aim middle, frames | inside wash, block becomes child, announced | **pass**: blue wash, source faded, "Block moved." | 02/06.1–4, 06 |
| T29b | Undo the drop | Ctrl+Z | block back outside | **pass** | 02/07 |
| T29c | Cursor while carrying | | grabbing (Notion) | **finding to compare**: the text I-beam over text (no pointer capture), the arrow elsewhere | 02/06.3, 09 |
| T30 | Drop inside a closed toggle | | child, hidden or opened | not run | |
| T31 | Escape mid-drag | `down`, `moveTo`, Escape, `up` | nothing moves, indicator gone | **pass**: order unchanged, focus ring on the handle | 02/10–11 |
| T32 | Drag to an off-screen target | | autoscroll | not run | |
| T33 | Keyboard move | Ctrl+Shift+ArrowDown | moves with children, announced | not run | |
| T34 | Undo / redo open-close | Ctrl+Z, Ctrl+Shift+Z | state back and forth | **pass** | 01/12–13 |
| T35 | Undo Ctrl+Alt+T with several | | all back at once | not run | |
| T36 | Reload keeps the state | `reload` | still closed | **pass** | 01/09 |
| T37 | Offline, then online and reload | `offline`, click, `offline:false`, `reload` | told offline; nothing lost | **pass**: "Offline" in the top bar; the open state is kept after reload; the failed `POST …/operations` is expected while offline | 01/14–15 |
| T38 | Read-only page | lock the page, click the arrow | arrow works, text not editable | not run | |
| T39 | Page outline, Markdown export | | hidden children listed, exported | not run | |
| T40 | Dark theme | plan with `"theme": "dark"` | contrast of arrow and wash | not run | |
| T41 | Notion, same steps | Notion plan | numbers in `docs/notion-study.md` | not run: needed to confirm T08, T19, T24, T29c | |

Totals: 43 cases (T01–T41, T29b, T29c) — 18 pass, 4 findings (T08, T24,
T29c to confirm with Notion; T19 fixed in code, re-run pending), 21 not
run. No console errors, page
errors or server errors in either run.
