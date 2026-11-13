# Quickstart: validating Notion parity

## Prerequisites

- `npm install` done; Chrome installed at its default path.
- The Notion window for photos open on port 9333 and signed in (it is
  reopened by `npm run capture -- notion …` when closed).
- The audit record `docs/notion-study.md` and its photos in
  `.captures/notion/` (for comparison).

## Per item, while coding (seconds)

1. `npx tsc --noEmit -p .` — compiles.
2. `npx vitest run <the item's test file>` — its tests pass.
3. `npm run capture -- pagecraft <steps.json>` — photographs the item at
   1440 × 900, 2x (the script starts and stops the review server).
4. Open each PNG and compare with the Notion photo named in the task;
   same controls, words, order and states.

## Scenarios to photograph

| Item | Steps (Pagecraft) | Compare with |
| --- | --- | --- |
| Relative date filter | Tasks › Due › Filter; open condition and period selects | `c1-filters/50-b04-filter.png`, `c2-filters-more` |
| Simple filter popover | a filter chip on the bar | `a7-deeper/20-b09-p0.png` |
| Rollup filter | add a relation and rollup, filter the rollup | `c1-filters` (rollup reads) |
| Text and number grouping | view settings › Group › Text / Number › by | `c3-sort-group` |
| 99+ counts | column › Calculate › Count | `a7-deeper` (count submenu) |
| Status as checkbox | Status column › Show as › Checkbox | `a6-submenus/110-b17-item.png` |
| Number tiles | Number › Edit property | `a5-edit-property/03-b00-edit.png` |
| Tab show-as | click the active tab › Show as | `b4-view-options` (tab menu) |
| Card layout, fit media | Board / Gallery › Layout | `b3-view-types/07-b01-panel-end.png` |
| Calendar wrap, timeline separate dates, list edit, feed wrap | each view › Layout | `b3-view-types` |
| Conditional color | view settings › Conditional color › New color setting | `b2-view-settings/35-b05-row.png` |
| Selection panel | select a word in a paragraph | `d5-block-menu/15-t-select.png` |
| Slash placeholder | type "/" on an empty line | `d2-slash/02-slash.png` |
| Floating outline | a page with three headings; point at the right edge | `d3-blocks/32-page-mid.png` |
| Is between (FR-020) | Tasks › Due › Filter › condition › is between | `c1-filters` (date conditions) |
| Rollup default (FR-021) | add a rollup, open its filter before choosing a relation | `p8-rollup-default` notes |
| Group by title, empty last (FR-022) | view settings › Group › Name › Text by | `n39-groups` |
| Tab menu rows (FR-023) | a database inside a page, two views; click the active tab | `n40-tab-source/04-source.png` |
| Sidebar section (FR-024) | tab menu › Add view to sidebar; point at the section; its "…" | `n40-sidebar/04-add-sidebar.png`, `n40-section-fix/02-more.png` |
| Customize sidebar (FR-025) | sidebar foot › Customize sidebar; point at a row; its menu; Add shortcut; Add section; Done | `n42-customize2/03-shortcut-menu.png`, `08-add-shortcut.png`, `10-add-section.png` |
| Reactions (FR-026) | select text › Add reaction › an emoji; open the block's comments; a feed card's smiley | `n43-reaction/03-select.png`, `n43-reaction2/04-reaction-tip.png` |
| Template in the center peek (FR-027) | Tasks › New ⌄ › New template; the strip; a template's "…" › Delete | `u12-template/05-template-peek.png`, `15-confirm.png` against `n48-template-measure/03-banner.png`, `n48-template-cleanup/04-delete.png` |
| Repeat cadence (FR-028) | the strip's Repeat… › Week; a weekday; At; Ending; Save; reopen; Escape after a change | `u12-cadence/14-panel-edited.png`, `20-discard-ask.png` against `n48-repeat-probe/05-week-panel.png`, `n49-cadence` |
| Files popover, button press (FR-029) | a files cell › Enter; Link tab; a link; a button cell press | `u13-props/18-files-popover.png` against `n50-files-probe/03-files-popover.png`, `05-embed-shot.png` |
| Button automation (FR-030) | a button column's menu › Edit automation › New action › Edit property…, Show confirmation; Save; press a row's button | `u14-button/11-automation.png`, `24-automation-filled.png`, `27-confirm-press.png` against `n51-button/05-settings.png`, `07-actions.png` |
| Suggesting (FR-031) | select text › Suggest edits; type; Delete forward; the block's comments › Accept | `u18-suggest/12-suggesting.png`, `14-suggestion-card.png` against `n52-suggest/08-typed-shot.png`, `n52-card` |
| Sidebar tabs, Move to tab (FR-032) | the Calendar tab; Customize sidebar › Favorites' menu › Move to tab › Calendar | `u19-tabs/04-calendar-tab.png`, `09-move-to-tab.png`, `13-calendar-with-favorites.png` against `n53-tabs/02-calendar-shot.png` |
| Manage in calendar (FR-033) | the tab menu's last row; a calendar's or timeline's toolbar; then the Calendar tab | `u19-tabs/03-cal-tab.png`, `u21-manage` |

## Once, at the end

`npm run verify` — types, lint, all tests; passes in under 30 s, the
tests alone under 10 s. Then commit (Conventional Commits, folder scope).
