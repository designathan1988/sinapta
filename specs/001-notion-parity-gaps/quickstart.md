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

## Once, at the end

`npm run verify` — types, lint, all tests; passes in under 30 s, the
tests alone under 10 s. Then commit (Conventional Commits, folder scope).
