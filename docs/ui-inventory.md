# Interface inventory

Every control a person can open, press or type into, by surface: what it
is today, what Notion has, and how it is tested. Every change to the
interface ends with this list run in the browser, every item opened and
photographed. An item is done when its row reads "Notion" in **Now** and
its test passed on the last run.

## How each item is tested

1. Open the review server (`npm run dev -- --port 5190`, launch config
   "review"), never the owner's workspace.
2. Set the viewport to 820 × 640, so a screenshot is one image pixel per
   CSS pixel. Reset it to the desktop size afterwards.
3. Open the control with the pointer, then again with the keyboard:
   arrows move, Enter chooses, Escape closes and gives focus back.
4. Photograph it open, with one option hovered, in light and in dark.
5. Compare with the same control in Notion, measured with computed
   styles, not by eye (reference below).
6. Choose a value and check that the view shows it at once and that undo
   brings the old value back.

## Notion reference (measured)

Measured in the owner's workspace, dark theme, read-only.

| Part | Measure |
| --- | --- |
| Menu panel | 290 px wide (250 for short lists), radius 10 px, background `#252525`, ring `0 0 0 1px #383836`, shadows `0 14px 28px -6px rgb(25 25 25 / .2)` and `0 2px 4px -1px rgb(25 25 25 / .12)` |
| Menu row | 28 px high, radius 6 px, 4 px inset from the panel edge; icon 20 px; label 14 px; hover `rgb(255 255 255 / .055)`, background change 20 ms |
| Row value | 14 px, muted `#7D7A75`, then a chevron; the row opens a panel |
| Section label | 12 px, weight 500, `#ADA9A3` |
| Panel header | back arrow, title 14 px weight 600, close button |
| Search field | 28 px, padding 3 × 6 px, radius 6 px, fill `rgb(252 252 252 / .03)`, focus ring `0 0 0 1px #2383E2` inside and out, text 14 px |
| Option | `role="option"`, 28 px, the chosen one ends with a 16 px check |
| Option with text | title, then a two-line description in 12 px muted text |
| Switch | track 30 × 18 px, radius full, padding 2 px, on `#2783DE`; knob 14 px white, moves 12 px; 200 ms ease-out |
| Layout tile | 83 × 57 px, radius 6 px, ring `inset 0 0 0 1px #383836`; chosen: ring 2 px `#2783DE`, label blue, 11 px |
| Opening | panels fade and slide in over a short time; submenus open beside their row |

## Controls

**Now** says what the control is today: "native" (a browser `<select>`
or checkbox), "custom" (our own, not yet measured against Notion) or
"Notion" (matches the reference).

### Database view

| Control | File | Now | Notion |
| --- | --- | --- | --- |
| View settings | `view-properties.view.ts`, `view-layout.view.ts` | custom form | menu with rows: name, Layout, Property visibility, Filter, Sort, Group, then the view's actions; each row opens a panel |
| Layout choice | `view-layout.view.ts` | native | tiles in the Layout panel, then the layout's options |
| Group by | `group-settings.view.ts` | native | searchable option list with property icons, check on the chosen one |
| Group sort, date step | `group-settings.view.ts` | native | rows with value and chevron, each opening an option list |
| Hide empty groups | `group-settings.view.ts` | native checkbox | switch row |
| Card preview, card size | `card-settings.view.ts` | native | rows with value and chevron in the Layout panel |
| Color columns | `card-settings.view.ts` | native checkbox | switch row |
| Calendar date property | `view-layout.view.ts` | native | row with value and chevron |
| Property visibility | `view-properties.view.ts` | native checkboxes | list with type icons and an eye toggle per property |
| Filter conjunction | `view-filters.view.ts` | native | small select: "And" or "Or" |
| Filter property, condition, value | `filter-row.view.ts` | native | select buttons opening option lists; options of a select property as chips |
| Calculation | `table-footer.view.ts` | native | "Calculate" with a chevron opening a menu of calculations |
| Set property on ticked rows | `table-bulk.view.ts` | native | a button per property in the bar |
| Linked view source | `linked-view.view.ts` | native | searchable list of databases |
| Row properties on a row page | `row-properties.view.ts` | native | property rows; values open their editors |
| Column menu | `column-menu.view.ts` | menu | menu with icons: sort, filter, hide, wrap, freeze, insert, duplicate, delete |
| Board column menu | `board-column-menu.view.ts` | menu | menu |
| Row tick box | `table-gutter.view.ts` | native checkbox | Notion checkbox |
| Group header | `group-header.view.ts` | custom | caret, chip, count; hover shows "+" and "…" |

### Property settings

| Control | File | Now | Notion |
| --- | --- | --- | --- |
| Number format | `number-config.view.ts` | native | row with value opening an option list |
| Date and time formats | `date-config.view.ts` | native | rows with values opening option lists |
| Relation database | `relation-config.view.ts` | native | searchable list of databases |
| Rollup relation, property, calculation | `rollup-config.view.ts` | native | rows with values opening option lists |
| Button property action | `button-property-config.view.ts` | native | option list |
| Option color | `option-list.view.ts` | native | color menu with swatches and a check |

### Blocks

| Control | File | Now | Notion |
| --- | --- | --- | --- |
| Code language | `code.view.ts` | native | searchable language list |
| Button block action | `button-config.view.ts` | native | option list |
| To-do box | `to-do.view.ts` | native checkbox | Notion checkbox |

### Menus already custom

Slash menu, block menu, color menu, page menu, simple table menu,
mention menu, emoji picker, icon and cover pickers, link editor,
equation editor, format toolbar, tone picker: each opened and compared
against the reference on every run.

## Owners

- `src/ui/menu/`: every menu and option list — panel, rows, sections,
  header, search, switch rows. No feature draws its own panel.
- `src/ui/select/`: the button that shows a current choice and opens an
  option list. It replaces every native `<select>`.
- `src/ui/checkbox/`: the tick box of to-dos, rows and settings.
- `src/ui/overlay/`: which overlay is open, its position and light
  dismiss. One overlay at a time, kept in `ui.overlay`.
