# Research: Notion parity, remaining audit gaps

Sources: the audit record `docs/notion-study.md` (Notion's behavior and
words, photos in `.captures/notion/`) and a read-only survey of the code.
Paths are relative to `src/` unless stated.

## R1. Relative date filter and the end of a range (FR-001, FR-002)

- **Today**: `features/database/properties/date/date-filters.ts:79-86` has
  is, before, after, within (six fixed periods), is empty, is not empty;
  comparisons read `date.start` only (line 30). `filter-match.ts:50` passes
  only string operands to `test`.
- **Decision**: add an operator `relative` ("Is relative to today") whose
  operand is a string `"<direction>:<unit>"` (`past|next|this` ×
  `day|week|month|year`), resolved against `context.today` with the
  existing `shiftDay` and `overlaps`. Keep the operand a string so
  `filter-match.ts` and every popover keep working. Make it the date
  type's `defaultFilter` with operand `this:week`. Add an optional
  `dateEnd: "start" | "end"` field to `filterSchema`; the date operators
  read `value.end ?? value.start` when it is `"end"`.
- **Rationale**: no change to the operand type or to `FilterOperator.test`,
  no migration (optional field); Notion's words map one to one.
- **Alternatives**: a structured operand `{direction, unit}` (needs
  `filter-match.ts:50` and the `test` signature widened, and every operand
  editor touched); separate operators per period (12 operators, a long
  list unlike Notion's two selects).

## R2. Rollup quantifier (FR-004)

- **Today**: `properties/rollup/rollup.definition.ts:34-42` has contains,
  is empty, is not empty on the rollup's written text; `applyRollup`
  (`rollup-math.ts:155-163`) reduces related values to one result, so the
  per-row values are gone.
- **Decision**: (a) add an optional `filterOperatorsFor(property)` to
  `PropertyType` and one accessor `operatorsOf(property)` used by
  `filter-match.ts`, `filter-row.view.ts`, `filter-rule.view.ts`,
  `filter-label.ts`, `filter-fields.ts`; (b) a rollup selector returning
  the related cells (`cellOf`, `rollup.selectors.ts:57`) for filtering;
  (c) rollup operators `any:<id>`, `none:<id>`, `every:<id>` built from
  the target property type's operators, `some`, `!some`, `every` over the
  cells. The quantifier shows as the first select (Any, None, Every).
- **Rationale**: matches Notion's "Qualquer / Nenhuma / A cada" followed by
  the target's conditions; one accessor keeps the UI and matching in step.
- **Alternatives**: filtering on the written text only (today's; cannot
  express "every related task is done").

## R3. Grouping text and numbers (FR-005)

- **Today**: `grouping-definition.ts:19-35` `Grouping.keysOf(value,
  property, step)` with `step = GroupBy["dateBy"]`; text and number fall
  back to formatted text (`row-groups.selectors.ts:45-53`).
- **Decision**: add optional `textBy: "exact" | "alphabetical"` and
  `numberBy: { kind: "unique" } | { kind: "interval"; size: number }` to
  `groupBySchema` (optional, no migration; absent = exact / unique).
  Widen the third `keysOf` argument to the whole `GroupBy`. Add
  `TEXT_GROUPING` (first letter folded to its base, digits and others
  under "#") and `NUMBER_GROUPING` (interval key `[n·size, (n+1)·size)`,
  numeric `sortValue`, labeled "0 to 10"). Add a "Text by" / "Number by"
  row to `view-settings/group-panel.ts` like the date row, and the
  interval size field.
- **Rationale**: one place for grouping; follows the date pattern.
- **Alternatives**: a single `by: string` replacing `dateBy` (needs a
  migration of every stored view).

## R4. "Show large counts as 99+" (FR-014)

- **Today**: counts in `calculations.selectors.ts:11-19,57-76`, drawn by
  `table-footer.view.ts:43` and group footers.
- **Decision**: optional `countCap: boolean` on the view; a formatter
  around count kinds (`isCount`, lines 105-109) writes "99+" above 99. The
  switch heads the Count submenu with Notion's note, as in the audit.
- **Alternatives**: per calculation (needs a migration of `calculations`).

## R5. Simple filter popover (FR-003)

- **Today**: a simple popover exists (`filter-rule.view.ts:101-139`:
  property, operator select, trash "Remove filter", operand); the
  advanced one is `view-filters.view.ts:195-227`.
- **Decision**: reshape `filter-rule.view.ts` to Notion's head "<Property>
  <condition> ⌄" with a "…" button opening Delete filter and Add to
  advanced filter, the operand below; copy "Delete filter", "Add to
  advanced filter".
- **Rationale**: the structure is there; only its head and menu differ.

## R6. View tab show-as (FR-009)

- **Today**: `features/database/view-tabs.view.ts:101-113` always draws icon
  and name; `tabWidth` (31-33) assumes both. No tab menu.
- **Decision**: optional `viewTabStyle: "text-icon" | "text" | "icon"` in
  `settingsSchema` (`model/workspace.schema.ts`), a `settings.setViewTabStyle`
  command beside `setTheme`, read by `renderTab` and `tabWidth`. Add the
  view tab menu Notion opens on clicking the active tab (Rename, Show as ›,
  Edit view, Copy link to view, Open as full page, Duplicate view, Delete
  view), reusing root-panel actions.
- **Rationale**: Notion marks it "Valid only for you": a display setting,
  not part of the view; settings are outside undo history.

## R7. Card, calendar, timeline, list, feed options (FR-010, FR-011)

- **Decision**: optional per-layout objects, each with defaults, like
  `table` (`model/view.schema.ts:88-100,163`):
  - `card: { layout: "compact" | "list"; fitMedia: boolean }` — board and
    gallery; `row-card.view.ts` sets `data-layout`, `data-fit`;
    `row-card.css` stacks values for list and uses `object-fit: contain`
    for fit.
  - `calendar.wrapTitles?: boolean` — `data-wrap` on `.calendar`.
  - `timeline.endDatePropertyId?` with `separateDates?` — `datedRows` reads
    the end from the second property; dragging writes both.
  - `list: { editTitle: boolean }` — the title leaves the row button and
    becomes editable like the table's `renderTitle`.
  - `feed: { wrapProperties: boolean }` — the feed gains a values row (it
    has none today), wrapped or cut by the flag.
- **Rationale**: optional fields need no migration and keep each layout's
  options together.

## R8. Status shown as a checkbox (FR-013)

- **Decision**: optional `showAs: "select" | "checkbox"` in
  `statusConfigSchema`; status gets its own `renderCell` (checkbox span
  checked when `statusGroupOf` is "complete") and a `renderConfigEditor`;
  toggling sets the first option of Complete or To-do through a branch in
  `table-cell.view.ts:148` and `table-keys.view.ts:54`. Column menu adds
  "Show as ›" (Checkbox, Select) as Notion's.

## R9. Number "Show as" tiles (FR-012)

- **Decision**: move `renderTiles` (`view-settings/layout-panel.view.ts:24-45`)
  and its CSS into a generic `ui/tiles/` (one owner, used by both), and use
  it in `number-config.view.ts` for 42 Number / Bar / Ring with Notion's
  note.

## R10. Conditional color (FR-015, FR-016)

- **Decision**: optional `colorRules: { filter: FilterGroup; color:
  NotionColor; target: "background" }[]` on the view; a selector
  `selectRowColor(model, row, today)` (`row-color.selectors.ts`) returns
  the first match using `matchesGroup` (`filter-match.ts:61-74`); views set
  `data-color` on `.database__row`, `.row-card`, `.list__row`,
  `.calendar__entry`; one CSS rule maps `[data-color]` to the chip tokens
  `--color-chip-<color>-bg`. A view-settings panel "Conditional color"
  lists rules (New color setting), each built from the filter-rule views.
- **Rationale**: reuses filtering and the ten colors already tokenized.

## R11. Selection toolbar in panel form (FR-006)

- **Today**: `features/format-toolbar/format-toolbar.view.ts:153-156` B, I,
  U, S, code, Link, Color, Comment in one strip, placed by
  `placeToolbar` (44-58).
- **Decision**: redraw as Notion's panel: a "turn into" row (block type
  name and chevron, opening `TURN_INTO_OVERLAY` from
  `editor-block-actions.view.ts:25`), a row Color, Bold, Italic,
  Underline, Clear formatting, a row Link, Strikethrough, Code, Equation,
  More, and a Comment row. Add a `clearTextFormat` command
  (`editor.commands.ts`, math in `model/rich-text.ts`), export
  `makeInlineEquation`, `TURN_INTO_OVERLAY` and the new command from
  `features/editor/index.ts`; `selectFormatRange` keeps the panel while
  the turn-into menu is open.

## R12. Slash line placeholder (FR-007)

- **Decision**: while `ui.overlay.kind === "slash-menu"` anchors a block,
  `editor-blocks.view.ts:88-96` sets `data-slash` (and `data-slash-empty`
  when the text is just "/"); `editor.css` washes the line with
  `--color-bg-hover`, `--radius-sm`, and shows "Type to search" after the
  "/" with `::after`. Copy `slashMenu.placeholder`.

## R13. Floating outline (FR-008)

- **Decision**: a new feature `features/page-outline/` (view, selectors,
  CSS, tests) using `selectTableOfContents` from
  `blocks/table-of-contents/index.ts`, rendered by `app/shell.view.ts`
  inside `app__page`; dashes sized by level (new tokens
  `size.outline.*`); pointing opens the heading list (popover), choosing
  scrolls with the shared reveal helper moved to `ui/focus/` from
  `app/router.ts:69-84`. Threshold: three headings.

## R14. Words

All new words in English from the audit's English pass: "Is relative to
today", "Past", "Next", "This", "Day", "Week", "Month", "Year", "Start
date", "End date", "Any", "None", "Every", "Text by", "Exact",
"Alphabetical", "Number by", "Unique", "Interval", "Show large counts as
99+", "Delete filter", "Add to advanced filter", "Show as", "Text and
icon", "Text only", "Icon only", "Card layout", "Compact", "List", "Fit
media", "Wrap page titles", "Separate start and end dates", "Directly edit
page name", "Wrap properties", "Checkbox", "Select", "Conditional color",
"New color setting", "Type to search", "Turn into", "Clear formatting",
"Equation".
