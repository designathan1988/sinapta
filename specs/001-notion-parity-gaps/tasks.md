---

description: "Tasks for Notion parity, remaining audit gaps"
---

# Tasks: Notion parity, remaining audit gaps

**Input**: Design documents from `specs/001-notion-parity-gaps/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/commands.md, quickstart.md

**Tests**: requested. Every task names the test that proves it (file and
behavior). Interface tasks also name the photo to take (`npm run capture
-- pagecraft <steps.json>`) and the Notion audit photo to compare with
(`.captures/notion/...`). A task is done only when its test passes, its
photo matches, and `npx tsc --noEmit -p .` is clean.

**Organization**: by user story, after Setup and Foundations, ending with
Polish. Paths are relative to the repository root.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an
  unfinished task)
- **[Story]**: US1 filters/grouping, US2 editor, US3 view presentation,
  US4 conditional color

---

## Phase 1: Setup

- [X] T001 Add owner rows to docs/ownership.md for `src/features/database/row-color.selectors.ts`, `src/features/database/color-rules.commands.ts`, `src/features/database/view-settings/color-panel.ts`, `src/features/database/view-tab-menu.view.ts`, `src/features/database/list-options.commands.ts`, `src/features/database/feed-options.commands.ts`, `src/features/database/filter-operators.ts`, `src/ui/tiles/`, `src/features/page-outline/` and the reveal helper in `src/ui/focus/` — goal: every new file in plan.md has exactly one owner row; check: `src/app/architecture.test.ts` still passes.
- [X] T002 [P] Add every new word from research.md R14 to the copy files `src/ui/copy/database-menu-text.ts`, `src/ui/copy/editor-text.ts` and `src/ui/copy/settings-text.ts` (keep each under 249 lines; split by topic if needed) — goal: no interface string is written in a view; check: `src/ui/copy.test.ts` passes.
- [X] T003 [P] Add tokens for the outline dashes (`size.outline.dashShort`, `size.outline.dashLong`, `size.outline.gap`, `size.outline.edge`) and for a conditional-color row wash in `tokens/semantic.tokens.json`, then `npm run tokens` — goal: `src/styles/tokens.generated.css` defines `--size-outline-*`; check: `scripts/build-tokens.test.ts` and `scripts/token-contrast.test.ts` pass.

---

## Phase 2: Foundations (blocks every story)

- [X] T004 Add optional fields to `src/model/view.schema.ts`: on `filterSchema` `dateEnd: "start" | "end"` (optional); on `groupBySchema` `textBy: "exact" | "alphabetical"` and `numberBy: {kind:"unique"} | {kind:"interval", size:number>0}` (optional); on `viewSchema` `card: {layout:"compact"|"list", fitMedia:boolean}`, `list: {editTitle:boolean}`, `feed: {wrapProperties:boolean}`, `countCap: boolean`, `colorRules: ColorRule[]` (all optional); `calendarOptionsSchema.wrapTitles` and `timelineOptionsSchema.separateDates`, `endDatePropertyId` (optional); export defaults (`DEFAULT_CARD_OPTIONS = {layout:"list", fitMedia:false}`) from `src/model/index.ts` — test `src/model/view.test.ts`: a view stored before this change still parses and a view with every new field parses; check `SCHEMA_VERSION` unchanged (28).
- [X] T005 [P] Add optional `viewTabStyle: "text-icon" | "text" | "icon"` to `settingsSchema` in `src/model/workspace.schema.ts` and the command `settings.setViewTabStyle` in `src/state/settings.commands.ts` (not recorded in undo history, like `setTheme`) — test `src/state/settings.test.ts`: the command sets the style and undo leaves it.
- [X] T006 Add `filterOperatorsFor?: (property) => readonly FilterOperator[]` to `PropertyType` in `src/features/database/property-definition.ts` and an accessor `operatorsOf(property)` in a new `src/features/database/filter-operators.ts`; switch `filter-match.ts`, `filter-label.ts`, `filter-fields.ts`, `filter-row.view.ts`, `filter-rule.view.ts` to it — test `src/features/database/filter-operators.test.ts`: a type without the function returns `filterOperators`, one with it returns its result; all existing filter tests pass.
- [X] T007 [P] Move `renderTiles` and its CSS from `src/features/database/view-settings/layout-panel.view.ts` / `view-settings.css` into `src/ui/tiles/tiles.view.ts`, `tiles.css`, `index.ts` as `renderTiles({label, tiles:[{value,icon,label}], current, onPick})`; layout panel uses it — test `src/ui/tiles/tiles-view.test.ts`: clicking a tile calls `onPick` with its value; the chosen tile has `aria-pressed="true"`; photo: Layout panel unchanged vs `.captures/pagecraft/p5-table-layout/04-icons-off.png`.
- [X] T008 [P] Move the private `revealBlock` from `src/app/router.ts:69-84` into `src/ui/focus/reveal.ts` (scroll into view, flash) exported through `src/ui/focus/index.ts`; router and table of contents use it — test `src/ui/focus/reveal.test.ts`: reveal scrolls the block and sets `data-flash`; `src/app/router.test.ts` passes.

**Checkpoint**: foundations compiled, their tests pass; stories can start.

---

## Phase 3: User Story 1 — Filter and group a database as in Notion (P1) 🎯 MVP

**Goal**: relative date filters, range ends, Notion's simple popover,
rollup quantifiers, text and number grouping.

**Independent test**: on Tasks with dated, numbered and texted rows, each
filter and grouping keeps or groups the same rows Notion does for the same
set-up (SC-002).

- [X] T009 [P] [US1] Add operator `relative` ("Is relative to today") to `src/features/database/properties/date/date-filters.ts`, operand `"past|next|this:day|week|month|year"` resolved against `context.today` with `shiftDay`/`overlaps`, and make it the date type's `defaultFilter` with operand `this:week`; read `value.end ?? value.start` when the filter's `dateEnd` is `"end"` — test `src/features/database/properties/date/date-filters.test.ts`: this week keeps a row dated today and drops one dated 8 days ago; past week keeps yesterday; next month across a year's end; `dateEnd:"end"` tests a range's end; an unknown operand lets every row through; "this week" follows the week start setting (Sunday or Monday); an empty date passes only "Is empty".
- [X] T010 [US1] Draw the relative operand as two selects (Past/Next/This, Day/Week/Month/Year) and, for range values, a Start date / End date select in `src/features/database/filter-operand.view.ts` — test `src/features/database/filter-operand-view.test.ts`: choosing Next and Month dispatches `view.setFilterRule` with value `next:month`; photo `p6-date-filter` compared with `.captures/notion/c1-filters/50-b04-filter.png` (head, selects, highlighted week, note "The filter will update with today's date").
- [X] T011 [US1] Reshape `src/features/database/filter-rule.view.ts` into Notion's simple popover: head "<Property> <condition> ⌄" and a "…" button opening a menu (Delete filter, Add to advanced filter), the operand below — test `src/features/database/filter-rule-view.test.ts`: "Delete filter" dispatches the removal; "Add to advanced filter" opens the advanced overlay with the rule kept; photo `p7-simple-filter` compared with `.captures/notion/a7-deeper/20-b09-p0.png`.
- [X] T012 [US1] Add a rollup cells selector in `src/features/database/properties/rollup/rollup.selectors.ts` (per related row, the target value via `cellOf`) and `filterOperatorsFor` in `rollup.definition.ts` returning `any:<id>`, `none:<id>`, `every:<id>` for each operator of the target type (Any, None, Every first) — test `src/features/database/properties/rollup/rollup-filters.test.ts`: every:"is" Done keeps a row whose related tasks are all Done and drops one with a To-do; none:contains; a rollup with no relation set offers no operators.
- [X] T013 [US1] Draw the rollup quantifier as the first select in `src/features/database/filter-rule.view.ts` and `filter-row.view.ts` — test in `filter-rule-view.test.ts`: changing Any to Every keeps the condition and dispatches the new id; photo `p8-rollup-filter` compared with the rollup reads in `.captures/notion/c1-filters/` (Qualquer / Nenhuma / A cada).
- [X] T014 [P] [US1] Widen `Grouping.keysOf`'s third argument to the whole `GroupBy` in `src/features/database/grouping-definition.ts` and `row-groups.selectors.ts`; add `TEXT_GROUPING` (alphabetical: first letter folded to base, upper case; digits, emoji, others "#"; empty "No <property>") in `src/features/database/properties/text/text-grouping.ts` and `NUMBER_GROUPING` (interval `floor(value/size)`, label "a to b", numeric sort; `size` default 10) in `properties/number/number-grouping.ts`, wired for text, URL, email, phone and number — test `src/features/database/row-groups.test.ts`: "Ana", "álvaro", "Bia", "3D" group as A, A, B, #; 5, 12, 19, -3 with size 10 group as -10 to 0, 0 to 10, 10 to 20, 10 to 20 in ascending order; an empty cell falls in "No <property>".
- [X] T015 [US1] Add "Text by" (Exact, Alphabetical) and "Number by" (Unique, Interval) rows and the interval size field to `src/features/database/view-settings/group-panel.ts` and `choice-panels.ts`, through `view.setGroupOptions` — test `src/features/database/view-settings/group-panel-view.test.ts`: choosing Alphabetical dispatches `textBy:"alphabetical"`; photo `p9-group-by` compared with `.captures/notion/c3-sort-group/` (Texto por / Número por rows).

**Checkpoint**: US1 complete and photographed; its tests pass.

---

## Phase 4: User Story 2 — Edit text with Notion's toolbar, slash menu and outline (P1)

**Goal**: selection panel, slash line placeholder, floating outline.

**Independent test**: on a page with headings, select a word, type "/",
point at the right edge; each matches the audit photos.

- [X] T016 [P] [US2] Add `clearTextFormat` (command `text.clearFormat`) to `src/features/editor/editor.commands.ts` with the range math in `src/model/rich-text.ts` (remove marks, link, color, highlight), and export it, `makeInlineEquation` and `TURN_INTO_OVERLAY` from `src/features/editor/index.ts` — test `src/model/rich-text.test.ts` and `src/features/editor/editor.test.ts`: clearing "bold link red" over its whole range leaves plain text; a partial range splits runs.
- [X] T017 [US2] Redraw `src/features/format-toolbar/format-toolbar.view.ts` and `format-toolbar.css` as Notion's panel: row 1 the block type name and a chevron opening `TURN_INTO_OVERLAY`; row 2 Color, Bold, Italic, Underline, Clear formatting; row 3 Link, Strikethrough, Code, Equation, More; row 4 Comment; keep `selectFormatRange` showing it while the turn-into menu is open (`format-toolbar.selectors.ts`); each button shows its name and shortcut on hover; the panel moves inside the window near an edge — test `src/features/format-toolbar/format-toolbar-view.test.ts`: each button dispatches its command; Turn into opens the overlay with the selection range; tab order follows the rows; a selection at the window's right edge keeps the panel inside; photo `p10-selection-panel` compared with `.captures/notion/d5-block-menu/15-t-select.png`.
- [X] T018 [P] [US2] Set `data-slash` and `data-slash-empty` on the block wrapper in `src/features/editor/editor-blocks.view.ts` while the slash menu anchors it, and style it in `src/features/editor/editor.css` (wash `--color-bg-hover`, `--radius-sm`, "Type to search" after the "/" via `::after` with content from a `data-placeholder` attribute) — test `src/features/editor/editor-blocks-view.test.ts`: with a slash overlay on the block the attributes are set, without it they are not; photo `p11-slash-line` compared with `.captures/notion/d2-slash/02-slash.png`.
- [X] T019 [US2] Create `src/features/page-outline/` (`page-outline.selectors.ts` using `selectTableOfContents`, `page-outline.view.ts`, `page-outline.css`, `index.ts`): dashes at the page's right edge, one per heading, longer for higher levels, shown from three headings; pointing opens the list (popover through `src/ui/overlay/`); choosing reveals the heading with `src/ui/focus/reveal.ts`, opening a closed toggle that holds it first; mount it in `src/app/shell.view.ts` inside `app__page` — tests `src/features/page-outline/page-outline.test.ts` (two headings → none; three → three dashes, levels mapped) and `page-outline-view.test.ts` (choosing an entry reveals that block); photo `p12-outline` compared with `.captures/notion/d3-blocks/32-page-mid.png`.

**Checkpoint**: US2 complete and photographed.

---

## Phase 5: User Story 3 — Present views the way Notion offers (P2)

**Goal**: tab show-as and tab menu, card/calendar/timeline/list/feed
options, number tiles, status checkbox, 99+.

**Independent test**: toggle each option; it shows at once, survives
reload, matches the audit photo (SC-003).

- [X] T020 [P] [US3] Read `settings.viewTabStyle` in `src/features/database/view-tabs.view.ts` (`renderTab`, narrow switch) and make `tabWidth` depend on it — test `src/features/database/view-tabs-view.test.ts`: text style hides icons, icon style hides names and fits more tabs.
- [X] T021 [US3] Create `src/features/database/view-tab-menu.view.ts`: clicking the active tab opens Rename, Show as › (Text and icon, Text only, Icon only, note "Only for you"), Edit view, Copy link to view, Open as full page, Duplicate view, Delete view, reusing `view-settings/root-panel.view.ts` actions; register the overlay in `src/features/database/database-menus.view.ts` — test `src/features/database/view-tab-menu-view.test.ts`: clicking the active tab opens the menu, Text only dispatches `settings.setViewTabStyle`; photo `p13-tab-menu` compared with `.captures/notion/b4-view-options/` (tab menu and Exibir como).
- [X] T022 [P] [US3] Card layout and fit media: rows in `cardItems` of `src/features/database/view-settings/layout-panel.view.ts`, `card` in `src/features/database/card.commands.ts`, `data-layout`/`data-fit` in `src/features/database/layouts/row-card/row-card.view.ts`, callers in `layouts/board/board-column.view.ts` and `layouts/gallery/gallery.view.ts`, rules in `row-card.css` (list stacks values; fit uses `object-fit: contain`) — test `src/features/database/layouts/row-card/row-card-view.test.ts`: list sets `data-layout="list"`; photo `p14-card-layout` compared with `.captures/notion/b3-view-types/07-b01-panel-end.png`.
- [X] T023 [P] [US3] Calendar "Wrap page titles": switch in `calendarItems` (`layout-panel.view.ts`), `data-wrap` on `.calendar` in `src/features/database/layouts/calendar/calendar.view.ts`, wrapping rule in `calendar.css` — test `src/features/database/layouts/calendar/calendar-view.test.ts`: the switch dispatches `wrapTitles:true` and the root gets `data-wrap`; photo `p15-calendar-wrap` compared with `.captures/notion/b3-view-types/46-b08-created.png`.
- [X] T024 [P] [US3] Timeline "Separate start and end dates": switch and an end-date row in `timelineItems`, `datedRows` reading the end from `endDatePropertyId` in `src/features/database/layouts/timeline/timeline.selectors.ts`, drag writing both properties in `timeline.view.ts` — test `src/features/database/layouts/timeline/timeline.test.ts`: with two date properties a row spans start to end; photo `p16-timeline-dates` compared with `.captures/notion/b3-view-types/22-b05-created.png`.
- [X] T025 [P] [US3] List "Directly edit page name": switch, `list` options command `view.setListOptions` in a new `src/features/database/list-options.commands.ts`, and in `src/features/database/layouts/list/list.view.ts` the title as an editable span outside the row button (rename on blur or Enter, Escape cancels), a separate open control — test `src/features/database/layouts/list/list-view.test.ts`: with the option on, typing a new name and Enter dispatches the rename; photo `p17-list-edit` compared with `.captures/notion/b3-view-types/14-b02-created.png`.
- [X] T026 [P] [US3] Feed values row and "Wrap properties": `view.setFeedOptions` in `src/features/database/feed-options.commands.ts`, values in `src/features/database/layouts/feed/feed.view.ts`, `data-wrap` rule in `feed.css` — test `src/features/database/layouts/feed/feed-view.test.ts`: a post lists its visible properties and the flag sets `data-wrap`; photo `p18-feed` compared with `.captures/notion/b3-view-types/30-b06-created.png`.
- [X] T027 [P] [US3] Number "Show as" tiles: `renderDisplay` in `src/features/database/properties/number/number-config.view.ts` uses `src/ui/tiles/` with 42 Number, Bar, Ring and Notion's note "Changes apply to all views showing this property." — test `src/features/database/properties/number/number-config-view.test.ts`: clicking Ring dispatches `display:"ring"`; photo `p19-number-tiles` compared with `.captures/notion/a5-edit-property/03-b00-edit.png`.
- [X] T028 [P] [US3] Status as checkbox: `showAs` in `src/features/database/properties/status/status.schema.ts`, `renderCell` and `renderConfigEditor` in `status.definition.ts`, "Show as ›" in the column menu (`src/features/database/column-menu-items.ts`), command `row.setStatusChecked` in `src/features/database/row.commands.ts`, toggle branch in `table-cell.view.ts` and `table-keys.view.ts` — test `src/features/database/properties/status/status.test.ts`: a Done value draws a ticked box; ticking sets the first Complete option, unticking the first To-do option; with no Complete option the box cannot be ticked; photo `p20-status-checkbox` compared with `.captures/notion/a6-submenus/110-b17-item.png`.
- [X] T029 [P] [US3] "Show large counts as 99+": `countCap` command `view.setCountCap` (in `src/features/database/calculation.commands.ts`), the switch heading the Count submenu in `column-menu-items.ts` with the note "This improves performance for large databases.", the formatter in `calculations.selectors.ts` for count kinds only — test `src/features/database/calculations.test.ts`: 150 rows count "99+" with the cap and "150" without; percent unchanged; photo `p21-count-cap` compared with `.captures/notion/a7-deeper/` (count submenu).

**Checkpoint**: US3 complete and photographed.

---

## Phase 6: User Story 4 — Color pages by rules (P3)

**Goal**: per-view color rules applied in every row-drawing layout.

**Independent test**: "Due is before today → red" turns matching rows red
at once, survives reload, applies to that view only.

- [X] T030 [P] [US4] Commands `view.addColorRule`, `view.setColorRule`, `view.deleteColorRule` in `src/features/database/color-rules.commands.ts` (rule `{id, filter: FilterGroup, color, target: "background" | "text"}`, target default background; color one of default, gray, brown, orange, yellow, green, blue, purple, pink, red; new rule red with an empty filter); deleting a property removes rules left with no condition — test `src/features/database/color-rules.test.ts`: add, set, delete and undo.
- [X] T031 [P] [US4] `selectRowColor(model, row, today)` in `src/features/database/row-color.selectors.ts` using `matchesGroup` from `filter-match.ts`; first matching rule wins — test `src/features/database/row-color.test.ts`: two matching rules → the first's color; no match → undefined; an empty filter matches nothing.
- [X] T032 [US4] Apply `data-color` on `.database__row` (`src/features/database/table.view.ts`), `.row-card` (`layouts/row-card/row-card.view.ts`), `.list__row` (`layouts/list/list.view.ts`) and `.calendar__entry` (`layouts/calendar/calendar.view.ts`), with one CSS rule mapping `[data-color]` to `--color-chip-<color>-bg` in `src/features/database/database.css` — test `src/features/database/table-view.test.ts`: a matching row carries `data-color="red"`.
- [X] T033 [US4] Panel "Conditional color" in `src/features/database/view-settings/color-panel.ts` (note, rules each with its filter built from the filter-rule views and a color picker, "New color setting"), reached from the view settings row in `view-settings/root-panel.view.ts` — test `src/features/database/view-settings/color-panel-view.test.ts`: New color setting dispatches `view.addColorRule`; photo `p22-conditional-color` compared with `.captures/notion/b2-view-settings/35-b05-row.png`, then a photo of red rows.

**Checkpoint**: US4 complete and photographed.

---

## Phase 7: Polish & cross-cutting

- [X] T034 Mark each closed gap **done** in the "Gaps found by the audit" list of `docs/notion-study.md`, with the Pagecraft photo name beside it — check: every item 5–18 is marked or has a stated reason.
- [X] T035 [P] Update `docs/ownership.md` rows added in T001 with their final files, and `README.md` if a command or behavior a reader needs changed — check: `src/app/architecture.test.ts` passes.
- [X] T036 Run `npm run verify` once — goal: exit 0 in under 30 s, tests alone under 10 s (`docs` budget); fix any failure at its cause.
- [X] T037 Retake every photo p6–p22 with `npm run capture`, each control in its states (at rest, pointed at, pressed, open, focused) as constitution principle IV requires, plus one photo after a reload showing the option kept (SC-003); open each beside its Notion photo — goal: no difference in controls, words, order or states; record any remaining difference as a new gap in `docs/notion-study.md`.
- [X] T038 Keyboard pass over every new control (filter selects, tab menu, layout switches, tiles, color panel, selection panel, outline list): reach, operate and leave each with the keyboard alone, focus ring visible (FR-018, SC-004) — check: one view test per control asserts the keyboard path (Enter/Space activate, arrows move, Escape closes and returns focus).
- [X] T039 Build the same sample database (10 rows: dates across this and next week, numbers -5…35, names A–Z with an accented and a digit start, a rollup over a relation) in Notion's test workspace and in Pagecraft, apply every US1 filter and grouping in both, and record the rows kept and the groups formed side by side in `docs/notion-study.md` (SC-002) — goal: identical results.
- [X] T040 Commit per story with Conventional Commits (scope = folder) and push the branch — goal: `git status` clean except `prompt.md` and `.claude/launch.json`.

---

## Dependencies & execution order

- Setup (T001–T003) → Foundations (T004–T008) → stories.
- US1 (T009–T015) depends on T004 (filter and group fields) and T006
  (operator accessor).
- US2 (T016–T019) depends on T002, T003 and T008; independent of US1.
- US3 (T020–T029) depends on T004, T005 and T007; independent of US1/US2.
- US4 (T030–T033) depends on T004 and on filter-match only; T032 touches
  layout files edited by T022, T023, T025 — run after them.
- Polish after the stories chosen for delivery.

Within a story: model/command → selector → view → photo (each control in its states).

## Parallel examples

- Foundations: T005, T007, T008 together after T004.
- US1: T009 and T014 together; then T010, T011, T012; then T013, T015.
- US2: T016 and T018 together; then T017; T019 alone.
- US3: T022–T029 together (different folders), after T020/T021.
- US4: T030 and T031 together; then T032, T033.

## Implementation strategy

1. **MVP**: Setup + Foundations + US1 (filters and grouping), photographed
   and tested — the gaps that change which rows the owner sees.
2. Add US2 (editor), the most visible daily difference.
3. Add US3 (presentation options), item by item, each committed alone.
4. Add US4 (conditional color).
5. Polish once at the end: study, ownership, verify, final photos, push.

---

## Phase 8: Gaps found while photographing (converge)

- [X] T041 [US1] Date filter "Is between" (two days, both included, testing the start or the chosen end) in `src/features/database/properties/date/date-filters.ts`, its two-day operand in `src/features/database/filter-between.view.ts` — test `date-filters.test.ts` and `filter-operand-view.test.ts`; photo `p24-between`.
- [X] T042 [US1] A rollup works out from the relation and property its settings show: one effective config (first relation, title, show original) read by `rollup.selectors.ts` and `rollup-config.view.ts` — test `rollup-filters.test.ts`: a new rollup with no stored config offers Any/None/Every.
- [X] T043 [US1] Group by the title column, as Notion's "Group by › Name", in `view-settings/group-panel.ts`, `group.commands.ts` and `row-groups.selectors.ts` — test `row-groups-by.test.ts`.
- [X] T044 [US1] Text groups list the empty group last, as Notion's "No Name" (numbers and options keep it first), through `Grouping.emptyLast` — test `row-groups-by.test.ts`.
- [X] T045 Full suite under 10 s (constitution V): measure alone, remove the cause of any slow file — check: `npx vitest run` reports under 10 s.
- [X] T046 [US3] The view tab menu's rows Notion has and Pagecraft left out: Source › the database (a linked view picks another), Hide/Show data source titles (and the layout panel's "Show data source title"), Open as full page with its ↗ — in `src/features/database/view-tab-source.ts`, `source-title.commands.ts`, `view.schema.ts` (`isSourceTitleHidden`) — tests `view-tab-menu-view.test.ts`, `view-tab-source-view.test.ts`; photos `p25-tab-source/08-menu` against Notion `n40-tab-source/04-source`.
- [X] T047 [US3] "Add view to sidebar": a sidebar section under the database's name listing the view's first pages, with Open, Add a page and "…" (Rename, Open in, Show 5/10/15/20, Show page icon, Source, View, Move up/down, Remove section) — `src/model/workspace.schema.ts` (`sidebarViews`), `src/state/sidebar-views.commands.ts`, `src/features/sidebar/sidebar-views.view.ts`, `sidebar-view-menu.view.ts`, `src/features/database/view-rows.selectors.ts` — tests `sidebar-views.test.ts`, `sidebar-views-view.test.ts`; photos `p25-section` against Notion `n40-sidebar`, `n40-section-fix`.
- [X] T048 Undo removes a field the change added (an optional view or settings field set for the first time stayed after undo) in `src/model/apply-operation.ts` — test `apply-operation.test.ts`.

## Phase 9: Convergence

- [X] T049 Add Template to the sidebar section's menu (Empty or one of the database's templates; with none chosen, the view's default shows) and start "+" pages from it, in `src/features/sidebar/sidebar-view-template.ts`, `sidebar-views.view.ts`, `sidebar-views.selectors.ts` and `templateId` in `src/model/workspace.schema.ts` per FR-024 (missing) — test `sidebar-views-view.test.ts`; photo `p26-section-reload/14-template` against Notion `n40-section-fix/02-more`.
- [X] T050 Photograph the tab menu and sidebar section settings after a reload (section, Show 10, hidden data source title kept) per SC-003 (partial) — `p26-section-reload/19-after`, `21-menu-after`.
- [X] T051 Amend `spec.md` to Notion's measured grouping (digits own group, "Other", range 0–1000 step 100, "Out of range"), add FR-020 to FR-024 for audit items 19–24, and record each Notion row left out with its reason per SC-002 and the analyze findings I1, I2, C1, C2 (contradicts).
- [X] T052 Add photo scenarios for FR-020 to FR-024 to `quickstart.md`, the later touch-points to `plan.md`, and task links to every gap in `docs/notion-study.md` per FR-019 (partial).

## Phase 10: Convergence (Customize sidebar)

- [X] T053 Study Notion's "Customize sidebar" read-only (edit mode, row menus, Add shortcut, Add section, Done) and record it in `docs/notion-study.md` — photos `n41-customize`, `n42-customize`, `n42-customize2`; Notion left as found.
- [X] T054 Store the arrangement: `sidebarShortcuts`, `sidebarSections`, `favoritesLimit` in `src/model/workspace.schema.ts`, commands in `src/state/sidebar-layout.commands.ts`, order and defaults in `src/features/sidebar/sidebar-layout.selectors.ts` per FR-025 (missing) — tests `src/state/sidebar-layout.test.ts`, `src/features/sidebar/sidebar-layout.test.ts`.
- [X] T055 Draw the mode and the arranged sidebar: `sidebar-customize.view.ts`, `sidebar-customize-menus.view.ts`, `sidebar-customize-choices.ts`, `sidebar-section-look.ts`, `sidebar-shortcuts.view.ts`, `sidebar-customize.css`, `sidebar.view.ts` per FR-025 (missing) — test `sidebar-customize-view.test.ts`; photos `p27-customize`, `p27-customize-add` against Notion `n42-customize2`.
- [X] T056 Check the arrangement after a reload (New database removed, Private above Favorites kept) per SC-003 — `p27-customize/20-after`.

## Phase 11: Convergence (selection panel reactions)

- [X] T057 Re-photograph Notion's selection panel (Comment, Add reaction, Suggest edits, AI skills), open Add reaction's emoji picker and the suggest-edit mode without keeping either — photos `n43-reaction/03-select`, `n43-reaction2/04-reaction-tip`, `n43-suggest/04-suggest`; a reload shows "Suggesting" off.
- [X] T058 Reactions on comments: `reactions` in `pageCommentSchema` (`src/blocks/page/page.schema.ts`), `startDiscussion` with a `reaction`, `comment.toggleReaction` in `src/features/comments/reaction.commands.ts` per FR-026 (missing) — test `reaction.test.ts`.
- [X] T059 "Add reaction" in the selection panel (`format-toolbar-rows.view.ts`), the emoji picker overlay (`reaction-picker.view.ts`), chips and the hover button on comments (`reactions.view.ts`, `reactions.css`), and a feed card's page reactions (`page-reactions.view.ts`, `layouts/feed/feed.view.ts`) per FR-026 (missing) — tests `reactions-view.test.ts`, `format-toolbar-view.test.ts`; photos `p28-reaction`, `p28-feed-reaction`.
- [X] T060 Record item 21 in `docs/notion-study.md`: reactions built; suggest edits and AI skills out per spec.md Assumptions, with the photos of T057.

## Phase 12: Convergence (database templates, found by the real-user journey)

- [X] T061 Study Notion's template flow and record item 25 in `docs/notion-study.md` — photos `n48-template-probe`, `n48-template-measure`, `n48-repeat-probe`; every probe's template deleted (`n48-template-check`).
- [X] T062 Template in the center peek: `template.add` and `template.edit` open `ui.peek` in center mode (`src/features/database/template.commands.ts`), the peek drops its mode switch and steps for a template (`src/features/row-peek/peek.view.ts`), `template.delete` closes it per FR-027 (partial) — tests `template.test.ts`, `peek-view.test.ts`; photo `u12-template` against `n48-template-measure/03-banner`.
- [X] T063 The strip (`template-banner.view.ts`, `template-banner.css`, new color tokens): words, database link, help mark, Repeat… button per FR-027 (partial) — test `template-banner-view.test.ts`; photo `u12-template`.
- [X] T064 "Delete this template?" with a confirm overlay in `src/ui/confirm/` (also used by the comment delete) and the no-template line in `templates-menu.view.ts` per FR-027 (missing) — tests `templates-menu-view.test.ts`, `confirm-view.test.ts`; photo `u12-template-delete` against `n48-template-cleanup/04-delete`.
- [X] T065 Repeat cadence: the eight periods, every N, weekdays, start, ending, in `page.schema.ts` and `template-repeat.commands.ts` per FR-028 (missing) — test `template-repeat.test.ts`.
- [X] T066 "Edit cadence" panel from the strip's Repeat… and the template's "…" (`template-cadence.view.ts`) per FR-028 (missing) — test `template-cadence-view.test.ts`; photo `u12-cadence` against `n48-repeat-probe/05-week-panel`.

## Phase 13: Convergence (files and button properties, found by the journey)

- [X] T067 Files popover with Upload and Link tabs (`properties/files/files-editor.view.ts`, `files-editor.css`, `cell-files.view.ts`), a button cell pressed at once (`table-keys.view.ts`, `button-property.definition.ts`) and without the cell bar (`cell-actions.view.ts`) per FR-029 (contradicts) — tests `files-editor-view.test.ts`, `cell-actions-view.test.ts`; photo `u13-props` against `n50-files-probe`.
- [X] T068 Button actions model: an ordered list of actions (edit property, add page to, edit pages in, show confirmation, open page or URL, define variables) in `button-property.schema.ts`, run by `row.pressButton` per FR-030 (missing) — test `button-property.test.ts`.
- [X] T069 The button's column menu as Notion's (`column-menu` items for a button) per FR-030 (contradicts) — test `column-menu-view.test.ts`.
- [X] T070 "Edit automation" dialog: When, Do, New action list, each action's settings, Save (`button-automation.view.ts`) per FR-030 (missing) — test `button-automation-view.test.ts`; photo `u14-button` against `n51-button/05-settings`, `07-actions`.
- [X] T071 Show confirmation before the actions, and Open page or URL after them, when the button is pressed per FR-030 (missing) — test `button-press-view.test.ts`.

## Phase 14: Convergence (suggesting, sidebar tabs, calendar — asked by the owner)

- [X] T072 Study Notion's Suggesting and record item 28 in `docs/notion-study.md` — photos `n52-suggest`, `n52-card`; the probe's text rejected, `n52-cleanup`.
- [X] T073 Suggestion marks in the model: a span's `suggestion` ("insert" or "delete") with its discussion, and a discussion's `suggestion` (`src/model/rich-text.schema.ts`, `src/blocks/page/page.schema.ts`) per FR-031 (missing) — test `rich-text-suggestions.test.ts`.
- [X] T074 `ui.isSuggesting` and `text.replace` keeping typed and deleted text as suggestions; `suggestion.accept` and `suggestion.reject` (`src/features/comments/suggestion.commands.ts`) per FR-031 (missing) — tests `suggestion.test.ts`.
- [X] T075 The interface: "Suggest edits" in the selection panel, "Suggesting ×" in the top bar, the marks drawn, and the card's "Add/Delete: “…”" with Accept and Reject per FR-031 (missing) — tests `suggestion-view.test.ts`; photo `u18-suggest` against `n52-suggest/08-typed-shot`.
- [X] T076 Sidebar tabs (Home, Calendar) and a section's tab in settings (`sidebarTabs`) per FR-032 (missing) — test `sidebar-tabs.test.ts`.
- [X] T077 "Move to tab" in a section's menu and in Customize sidebar per FR-032 (missing) — test `sidebar-tabs-view.test.ts`; photo `u19-tabs`.
- [X] T078 Record items 29 and 30 as done with their photos in `docs/notion-study.md` per FR-032, FR-033.
- [X] T079 "Manage in calendar" in a date view's tab menu and toolbar, kept in settings (`calendarViewIds`) per FR-033 (missing) — test `calendar-tab.test.ts`.
- [X] T080 The sidebar's Calendar tab listing the dated pages of those views under "Upcoming" per FR-033 (missing) — test `calendar-tab-view.test.ts`; photo `u19-tabs`.

## Phase 15: Convergence (differences left after the photos of Phases 13–14)

- [X] T081 A forward Delete in Suggesting strikes on and leaves the caret past the struck text, one suggestion (`editor-input.view.ts` `isForward`, `suggestion.commands.ts`) per FR-031 (partial) — tests `suggestion.test.ts`, `editor-input.test.ts`; photo `u18-suggest/11-bs-s` ("Delete: el").
- [X] T082 A suggestion's card shows who suggested it and when, as Notion's card (`suggestedAt`, `suggestion.view.ts`) per FR-031 (partial) — test `suggestion-view.test.ts`; photo `u18-suggest/14-suggestion-card` against `n52-card`.
- [X] T083 A files cell reads "+ Add file or image" while its popover is open, without the cell bar over it (`table-cell.view.ts`, `files.css`) per FR-029 (partial) — tests `cell-actions-view.test.ts`; photo `u13-props/18-files-popover` against `n50-files-probe/03-files-popover`.
- [X] T084 "Edit automation" titled as Notion's: quiet title over a line (`ui/dialog` variant "form") per FR-030 (partial) — photo `u14-button/11-automation` against `n51-button/05-settings`.
- [X] T085 A lone chart column keeps a bar's width, and a form's date question is an English text field read as the date picker reads typed days (`chart.css`, `form.view.ts`, `form-answers.ts`) — tests `form-answers.test.ts`, `form-view.test.ts`; photos `u20-chart/15-solo-chart`, `u20-chart/19-solo-form`.


## Phase 16: Convergence

- [X] T086 Add "Manage in calendar" to the calendar and timeline toolbars beside the month, as Notion's "Manage in Notion Calendar" (`layouts/calendar/calendar-header.view.ts`, `layouts/timeline/timeline.view.ts`) per FR-033 (partial) — test `calendar-tab-view.test.ts`; photo `u21-manage` against the study's calendar and timeline photos.
- [X] T087 Describe the session's data (repeat cadence fields, button actions, suggestion spans and discussions, `sidebarTab`, `sectionTabs`, `calendarViewIds`, `overlay.draft`) in `data-model.md` and their validation scenarios in `quickstart.md` per plan: data-model (partial).
- [X] T088 Show a suggestion card's Accept and Reject while it is pointed at or has the focus, as Notion's (`comments.css`) per FR-031 (partial) — photo `u18-suggest`.


## Phase 17: Convergence (evidence under the names the tasks give)

- [X] T089 Take the photos earlier tasks name, under those names: `p7-simple-filter`, `p8-rollup-filter`, `p14-card-layout`, `p15-calendar-wrap`, `p16-timeline-dates`, `p17-list-edit`, `p18-feed`, `p19-number-tiles`, `p20-status-checkbox`, `p21-count-cap`, `p25-tab-source/08-menu`, `u12-template-delete` per SC-001 (partial).
- [X] T090 Keep each view's test next to the view it tests, under the names T022, T032, T068 and T071 give: card layout in `src/features/database/layouts/row-card/row-card-view.test.ts` (moved from `layout-items-view.test.ts`), the table's row color in `src/features/database/table-view.test.ts` (moved from `row-color-view.test.ts`), the button's question in `src/features/database/button-press-view.test.ts` (moved from `button-automation-view.test.ts`), the action list in `src/features/database/properties/button/button-property.test.ts` per FR-010, FR-011, FR-030 (partial).
- [X] T091 Rows matching a rule carry its color in the table — test `table-view.test.ts`; photo `p22-conditional-color/07-red-rows` per FR-016 (partial).
- [X] T092 A new rollup offers Any/None/Every before a relation is chosen — test `rollup-filters.test.ts`; photo `p8-rollup-default/14-quantifier` per FR-021 (partial).
- [X] T093 The Group by list as Notion's: None flush with the icons' edge, the title column with its "Aa", then the others by name; the title's "Aa" in the filter, sort and sub-group lists too (`propertyIcon` in `src/features/database/table-model.selectors.ts`, `view-settings/group-panel.ts`, `ui/menu/menu.css`) per FR-022 (contradicts) — tests `table-model.test.ts`, `group-panel-view.test.ts`; photos `p9-group-title`, `p9-title-icon/03-group-menu` against `n39-groups/03-group-by`.
- [X] T094 "Edit cadence" gives the focus back to its Repeat button when it closes (Save, Cancel recurrence, Escape, Discard), so Escape then closes the template's window (`src/features/database/template-cadence.view.ts`) per SC-004 (contradicts) — test `template-cadence-view.test.ts`; photos `sc3-reload-session/08-e2`.
- [X] T095 A menu's name field (a view's, a property's) passes the arrows on to the rows below it and closes the menu on Tab, so the focus never leaves for the page behind; a number field keeps its arrows (`src/ui/menu/menu-keys.ts`) per FR-018, SC-004 (contradicts) — test `src/ui/menu/menu-lead-keys.test.ts`; photos `sc4-keyboard/10-down5`, `15-list`, `18-esc2`.
- [X] T096 Name the Notion photo each requirement was compared with where its tasks named only the Pagecraft one: FR-016 `b2-view-settings/35-b05-row.png`; FR-020 `c1-filters/50-b04-filter.png` (Está entre); FR-021 `c1-filters` (Qualquer / Nenhuma / A cada); FR-026 `n43-reaction`, `n43-reaction2`; FR-032 `n53-tabs/01-calendar-tab`, `n46-tabs/01-hover-tabs`; FR-033 `n40-tab-source/04-source` (Gerenciar no Notion Calendar) per SC-001 (partial).

## Phase 18: Convergence (differences found by looking at every photo again)

- [X] T097 The toolbar's search field shows the focus ring of every other control while it has the keys (`src/features/database/database.css`) per FR-018 (contradicts) — photo `kb-search/05-shot`.
- [X] T098 Every new control is reached by the keys inside its menu: a panel's tiles, fields and buttons are stops of the arrows in their place; the right arrow enters a submenu already open; a description field passes the arrows on at its ends; a panel without rows focuses its first button; a choice gives the focus back to what opened the menu, a submenu open or not (`src/ui/menu/menu-keys.ts`, `src/ui/menu/menu.view.ts`, `src/ui/tiles/tiles.view.ts`, `src/ui/button/button.view.ts`, `view-settings/color-panel.ts`) per FR-018, SC-004 (contradicts) — tests `menu-lead-keys.test.ts`, `menu-submenu.test.ts`, `tiles-view.test.ts`, `color-panel-view.test.ts`; photos `kb-layout/12-on-compact`, `kb-color/18-shot`, `kb-number/12-pick`, `kb-add-freeze/15-after`, `kb-tab-menu/09-shot`.
- [X] T099 "Add reaction" opens Notion's emoji picker: its eight groups in its order (read from Notion's own picker), "Filter…" with its magnifier, the skin tone hand kept for the owner, every emoji twelve to a row in 32 px cells and the categories at its foot, 408 by 356 px; the button is Notion's smiling face with a plus (`src/ui/emoji/emoji-data.ts`, `src/ui/emoji/emoji-reaction.view.ts`, `src/ui/emoji/emoji-tone.ts`, `src/state/settings.commands.ts`) per FR-026 (contradicts) — tests `emoji-search.test.ts`, `emoji-tone.test.ts`, `emoji-picker.test.ts`; photos `p28-reaction/03-picker`, `p28-reaction/02-select` against `n43-reaction2/04-reaction-tip`, `n54-emoji-measure`.
- [X] T100 The sidebar's tabs drawn filled, as Notion's, and its section named "Upcoming events" (Notion's "Próximos eventos") (`src/features/sidebar/sidebar-tabs.view.ts`) per FR-032 (partial) — photo `u19-tabs/04-calendar-tab` against `n53-tabs/01-calendar-tab`.
- [X] T101 "Is between" takes its days in text fields written as the app writes dates and read as typed, its pill reads "Nov 10, 2026 → Nov 14, 2026", and "Start date" stands grey where a name stands (`src/features/database/filter-between.view.ts`, `properties/date/date-filters.ts`, `filter-rule.css`) per FR-020 (contradicts) — tests `filter-operand-view.test.ts`, `date-filters.test.ts`; photo `p24-between/10-kept` against `c1-filters/51-b04-conditions`.
- [X] T102 Conditional color's picture is Notion's sample table (Name, Office, Units sold; Keesha… John) with its rows tinted (`view-settings/color-panel.ts`) per FR-015 (partial) — test `color-panel-view.test.ts`; photo `p22-conditional-color/02-panel` against `b2-view-settings/35-b05-row.png`.

## Phase 19: Convergence (every control by the keys, Notion's words, the color rule)

- [X] T103 Conditional color rules in Notion's form: New color setting asks first for the property ("Search for a property…", the title first, the others by name); a rule shows its condition with Delete, its value, "Page background" with ten swatches and, in a table, "Apply to" › Entire row or This property; "Add another" follows the rules; a new rule is green and colors nothing until its value is chosen; a rule applied to its property colors that cell (`view-settings/color-rule.view.ts`, `view-settings/color-panel.ts`, `color-rules.commands.ts`, `row-color.selectors.ts`, `table-cell.view.ts`) per FR-015, FR-016 (contradicts) — tests `color-panel-view.test.ts`, `color-rules.test.ts`, `row-color.test.ts`, `table-view.test.ts`; photos `p22-color-rule/09-done-row`, `p22-color-rule/19-table`, `before-p22-color-rule` against `n56-color-rule/05-rule-editor`, `n56-bg/07-bg-menu`, `n56-apply`.
- [X] T104 No Home row under the sidebar's Home tab, as Notion's (`src/features/sidebar/sidebar.view.ts`) per FR-032 (contradicts) — test `sidebar-view.test.ts`; photo `p22-color-rule/06-rule` against `n53-tabs/05-home-tab`.
- [X] T105 Notion's English words checked against the strings in Notion's own code: "Entire row" and "Search for a property…" corrected (`src/ui/copy/database-options-text.ts`, `src/ui/copy/database-text.ts`) per FR-017 (contradicts) — test `color-panel-view.test.ts`; photo `n55-words2` against `n55-words4`.
- [X] T106 A filter rule opened from the property list puts the keys in its value (`src/features/database/filter-rule.view.ts`) per FR-018 (contradicts) — test `filter-rule-view.test.ts`; photo `kb-filter/07-pick`.
- [X] T107 A files cell's popover takes the keys on its chosen tab, and an image that does not load shows its name (`properties/files/files-editor.view.ts`, `properties/files/files-cell.view.ts`) per FR-018, FR-029 (contradicts) — tests `files-editor-view.test.ts`, `files.test.ts`; photo `kb-files/13-shot`.
- [X] T108 A block's discussions opened from its count put the keys in the reply field, Escape giving them back to the count (`src/features/comments/comment-popovers.view.ts`) per FR-018, FR-031 (contradicts) — test `comments-view.test.ts`; photo `kb-suggest/15-accepted`.
- [X] T109 Manage in calendar turns the sidebar to the Calendar tab, where the listed pages show (`src/features/database/view-calendar-item.ts`) per FR-033 (partial) — test `calendar-tab-view.test.ts`; photo `kb-manage/08-shot`.
- [X] T110 One keyboard pass per new control, read back and photographed: `kb-search`, `kb-tab-menu`, `kb-layout`, `kb-color`, `kb-number`, `kb-column`, `kb-add-freeze`, `kb-filter`, `kb-selection`, `kb-outline`, `kb-sidebar-tabs`, `kb-manage`, `kb-cadence`, `kb-files`, `kb-button`, `kb-suggest` per SC-004 (partial).
- [X] T111 Photos from before the fixes of T097–T103, taken from the code at commit 93b792e: `before-p28-reaction`, `before-p24-between`, `before-u19-tabs`, `before-p22-conditional-color`, `before-p22-color-rule` per SC-001 (partial).

## Phase 20: Convergence (Notion's English from its own i18n)

- [X] T112 Every word of the new controls checked by message id against Notion's own i18n (the `defaultMessage` of each `{id, defaultMessage}` in Notion's code; pt-BR catalog `window.LOCALE_SETUP.messages`), and the 20 that differed corrected: Display as, Only applies to you, the conditional color note, Card background on a board or a gallery, Select... in an empty rule value, the relative units in lower case, Starting, Timezone, 12–3AM, 2 Weeks, 3 Months, 6 Months, Duplicate every..., Manage in Calendar, Select skin tone, Animals & nature, Food & drink, Travel & places, You’re suggesting, Turn off suggesting (`src/ui/copy/*.ts`, `src/ui/emoji/emoji-data.ts`, `view-tab-menu.view.ts`, `view-settings/color-rule.view.ts`, `filter-operand.view.ts`) per FR-017 (contradicts) — tests `src/ui/copy/notion-words.test.ts`, `color-panel-view.test.ts`, `view-tab-menu-view.test.ts`, `view-tab-source-view.test.ts`, `emoji-picker.test.ts`, `emoji-search.test.ts`; photos `p22-color-rule/06-rule`, `p22-color-board/07-rule`, `kb-tab-menu/07-dn`, `u21-manage/02-manage-btn`, `u12-cadence/05-presets` against `n57-catalog`, `n57-ctx`, `n56-color-rule/05-rule-editor`, `n57-cadence/03-repeat-failed` (Notion drawn in English).
- [X] T113 Edit cadence's lists open at the panel's edge, their top at the row's, and the list of times stays 250 px tall and scrolls (Notion's `maxHeight: 250`), so Save and the time zone stay in view (`src/features/database/template-cadence.css`, `src/ui/select/select.view.ts`, `src/ui/menu/menu.view.ts`, `src/ui/menu/menu.css`, token `size.menu.short`) per FR-028 (contradicts) — test `src/ui/select/select.test.ts`; photos `u12-cadence/10-at-list`, `u12-cadence/12-ending` against `n49-cadence/06-shot-at`.

## Phase 21: Convergence (Notion's whole English catalog)

- [X] T114 Read Notion's English i18n entire: every code file its loader lists (2352, fetched as text, never run) and each `{id, defaultMessage}` in them, 51 228 messages with their pt-BR text (`n58-full`, `n58-braces`, `n58-ctx`; study item 40) per FR-017 (partial).
- [X] T115 The words the loaded menus never held, corrected by id: Duplicate every… (with "…", banner and template menu), Button is clicked with Button in bold, Filter will update with the current date, Date Options, Comparator, Operator, View options, Link to view copied to clipboard, Add a file or image, Paste in https://…, No upcoming events, Open menu, Open shortcut menu, More actions, Every (the interval's name), Number of runs, Delete (an action), Move to Trash, Plain Text, Search for an option..., Reading List, You’re editing a template in (`src/ui/copy/*.ts`, `button-automation.view.ts`) per FR-017 (contradicts) — tests `src/ui/copy/notion-words.test.ts`, `button-automation-view.test.ts`, `filter-operand-view.test.ts`, `filter-rule-view.test.ts`, `cell-actions-view.test.ts`, `template-banner-view.test.ts`; photos `u14-button/11-automation`, `p6-date-filter/07-month`, `kb-files/13-shot`, `u19-tabs/04-calendar-tab`.
- [X] T116 The next occurrence in Notion's words: Today, Tomorrow, "Next Mon" within the week, then the date; "{date} at {time}", or "{date} between 12–3 AM" around midnight (`template-cadence-rows.view.ts`, `template-cadence.view.ts`, `src/ui/copy/cadence-text.ts`) per FR-028 (contradicts) — test `template-cadence-view.test.ts`; photo `u12-cadence/10-at-list` against `n49-cadence/06-shot-at` ("próximo(a) seg. entre 0h e 3h").
- [X] T117 A saved cadence reads "Duplicate every week" on the template strip, as Notion's "Duplicar a cada semana", and the template menu's row shows its preset ("Week", "2 Weeks", "Weekday", Off) as Notion's "Semana" (`template-cadence.ts` `presetName`, `template-actions.view.ts`, `template-repeat.view.ts`) per FR-028 (contradicts) — tests `template-cadence.test.ts`, `notion-words.test.ts`; photos `u12-template/09-save` against `n58-banner/05-save`, `n58-banner/10-dots`.

## Phase 22: Convergence (test time, the view menu's icons, the template window)

- [X] T118 The suite runs in a VM context per worker with a fresh window per file (`pool: "vmThreads"` in `vite.config.ts`, as Vitest's guide gives for suites whose DOM environments dominate): 7.0–7.8 s under the same load that held "threads" at 10.2–11.0 s; `npm run verify` 21.0 s per SC-005 (contradicts) — measured seven times, "vmForks" 8.0–8.2 s, 66 % workers 7.3 s against 8.2 s at 100 %.
- [X] T119 The view menu's icons as Notion's: a pencil over a line for Rename, a brush for Display as, Source's path, and a dated sheet for Manage in Calendar (`src/ui/icon/emoji-icons.ts`, `view-tab-menu.view.ts`, `view-tab-source.ts`, `view-calendar-item.ts`) per FR-009, FR-033 (contradicts) — tests `view-tab-menu-view.test.ts`, `calendar-tab-view.test.ts`; photo `kb-tab-menu/07-dn` against `n40-tab-source/03-tab-menu`.
- [X] T120 A template's window has only Expand at its top left and no comment button, as Notion's (`src/features/row-peek/peek.view.ts`, `peek-actions.view.ts`) per FR-027 (contradicts) — test `peek-view.test.ts`; photo `u12-template/09-save` against `n58-banner/06-saved`.

## Phase 23: Convergence (each requirement read against its code)

A read-only audit of every FR against its code and tests (20 met, 13 partial) found:

- [X] T121 The selection toolbar's buttons named as Notion's tooltips: Italicize, Strike-through, Mark as code, Add link, Clear format, Mark as equation, and the color picker's Background color (`src/ui/copy/editor-text.ts`; Notion ids `richTextMenu.*`, `selectionLinkButton.addLink.tooltip`, `highlightSelectionButton.backgroundSection.label`) per FR-006, FR-017 (contradicts) — tests `notion-words.test.ts`, `format-toolbar-view.test.ts`.
- [X] T122 Property types and filter conditions read from the copy, no longer written in the property definitions (`src/ui/copy/property-text.ts`, the 15 `*.definition.ts`, `date-filters.ts`, `text-filters.ts`, `property-definition.ts`; Notion ids `database.propertyTypeName.*`, `collectionFilterMenuHelpers.operator.*`) per FR-017 (contradicts) — test `notion-words.test.ts`.
- [X] T123 Timeline bars and feed posts take the color of the first rule their row matches, as the other layouts (`layouts/timeline/timeline.view.ts`, `layouts/feed/feed.view.ts`, `row-color.css`) per FR-016 (partial) — tests `timeline-view.test.ts`, `feed-view.test.ts`; photos `p29-color-layouts/12-timeline`, `p29-color-layouts/24-feed`.
- [X] T124 The spec quotes Notion's own words where it had quoted Portuguese screens (FR-006, FR-009, FR-015 background only, as Notion's rule color menu offers, FR-027, FR-028, FR-030, FR-033, User Story 2), and its Assumptions say where the words come from (`spec.md`, `data-model.md`, `quickstart.md`) per FR-017 (contradicts).
- [X] T125 Tests for clauses that had none: a status column's Show as › Checkbox (`column-menu-view.test.ts`), the "Suggesting ×" pill turning Suggesting off and Suggesting off on a fresh start (`page-info-view.test.ts`) per FR-013, FR-031 (partial).
- [X] T126 The traceability's pointers corrected: FR-004 `rollup-filters.ts`, FR-013 `status-checkbox.test.ts`, FR-032 `src/state/sidebar-tabs.test.ts`, T119 FR-009 per SC-001 (partial).

Left as they are, with their reason: the photos and Notion's catalog live in `.captures/`, which `.gitignore` keeps out of the repository by the project's rule, so FR-018, FR-019 and SC-001, SC-003, SC-004 are evidenced on disk and in `docs/notion-study.md`, not in git; Notion filters a checkbox with "Is" and a Checked or Unchecked value where Pagecraft keeps "Is checked" and "Is not checked" (stored filters use those ids; changing them is a data migration, recorded in the study as open).

## Phase 24: Convergence (SC-002 against Notion, the checkbox filter, the date picker)

- [X] T127 A checkbox filters with Is and Is not and its values Unchecked, Checked listed under the head, 4 px in, as Notion's; the old Is checked and Is not checked stay readable as retired conditions (`properties/checkbox/checkbox.definition.ts`, `filter-operand.view.ts`, `filter-rule.view.ts`, `filter-rule.css`) per FR-003, FR-017 (contradicts) — tests `checkbox.test.ts`, `filter-operand-view.test.ts`, `filter-rule-view.test.ts`; photo `p30-checkbox-filter/07-popover` against `n59-measure` (commit 023916c).
- [X] T128 A rollup's Every keeps no row without related values, as Notion kept rows for "> 8" (`properties/rollup/rollup-filters.ts`) per FR-004 (contradicts) — tests `rollup-filters.test.ts` ("every:is done"), `rollup-notion.test.ts` against `n68-rollup-filters`.
- [X] T129 SC-002 compared with Notion for every US1 filter and grouping: relative dates, range start and end, rollup Any/None/Every, Alphabetical, Interval, Exact and Unique groups (`notion-sample.test.ts`, `notion-ranges.test.ts`, `rollup-notion.test.ts`; 18 cases) per SC-002 (partial) — Notion runs `n60-groups2`, `n63-ranges`, `n68-rollup-filters`.
- [X] T130 The rule popover sized as Notion's: 220 px, an 18 px head with the condition in lower case, the value 8 px under it; a date's 260 × 368 with Notion's month, weekdays, days and note at Notion's offsets (`filter-rule.css`, `filter-rule-head.view.ts`, `filter-condition.view.ts`, tokens `size.menu.rule`, `ruleHead`, `dateRule`, `weekdayRow`, `noteLine`) per FR-001, FR-003 (contradicts) — tests `filter-rule-view.test.ts`; photo `p6-date-filter/03-rule` against `n69-date-cleanup/03-rule-shot`.
- [X] T131 The relative filter's month only shown, as Notion's: no Today, the range one band with today's red circle over it, its end dimmed, the days after it grey; chevrons for the months; the open pill rgb(40, 72, 107) (`src/ui/date-picker/`, `filter-relative.view.ts`, `view-pills.css`, tokens `color.status.today`, `color.accent.range`, `color.accent.pill`) per FR-001 (contradicts) — tests `date-picker.test.ts`; photos `p6-date-filter/03-rule`, `07-month` against `n70-next-week/03-this-shot`, `06-next-shot`.
- [X] T132 The date cell's picker as Notion's: 248 px, the day field 224 × 28 at (12, 12), 28 px days every 32 px, a line under the weeks, rows every 29 px (`date-picker.css`, tokens `size.menu.date`, `space.stack.hair`) per FR-020 (contradicts) — photos `p31-date-cell/01-cell`, `p32-search-date/02-date` against `n71-date-cell/02-cell-shot`.
- [X] T133 Date formats as Notion's: Full date ("November 10, 2026", the default; the old "medium" read as it, as Notion reads its old "MMM DD, YYYY"), Short date ("Nov 10", no year), Month/Day/Year, Day/Month/Year, Year/Month/Day and Relative (Today, Tomorrow, Yesterday; Next or Last and the weekday in the Monday-started week beside today's; the weekday in today's; else the full date), the chosen one beside the Date format row (`properties/date/date.schema.ts`, `date-value.ts`, `relative-day.ts`, `date-menu.ts`, `src/ui/copy/date-format-text.ts`; Notion ids `dateHelpers.dateFormat.*`, `dateFormatHelpers.text.*`) per FR-017 (contradicts) — tests `date.test.ts`, `cell-date-view.test.ts`, `notion-words.test.ts`; photos `p31-date-cell/02-format`, `05-close2`, `10-close4` against `n72-date-formats`, `n73-relative-dates` and the rule read in `n74-relative-code`.
- [X] T134 The time format Hidden before 12 hour and 24 hour, as Notion's (`dateHelpers.hiddenTimeFormat`; a date's time left out of its cell) (`date.schema.ts`, `date-value.ts`, `date-format-text.ts`) per FR-017 (missing) — tests `date.test.ts`, `notion-words.test.ts`; photo `p31-date-cell/02-format` against study "Formato de hora: Oculto, 12 horas, 24 horas".
- [X] T135 Notion's light mode measured without changing the account (the capture's context emulates the colour scheme) and its band, today and pills set as the day tokens (`tokens/base.tokens.json` `accentRange`, `today`, `accentPill`, `accentPillOpen`) per FR-001 (partial) — tests `scripts/token-contrast.test.ts`; photos `p6-date-filter-light/03-rule`, `10-closed` against `n76-light/03-open-shot`, `05-rest-shot`.
- [X] T136 The filter pill as Notion's: no line around it, one blue at rest and on hover, a deeper one open (`view-pills.css`, token `color.accent.pillOpen`) per FR-003 (contradicts) — photos `p6-date-filter-dark/10-closed`, `p6-date-filter-light/10-closed` against `n76-dark/05-rest-shot`, `n76-light/05-rest-shot`.

Left as it is, with its reason: Notion's date menu ends with "Learn more about reminders", a link to Notion's help centre; Pagecraft is local and has no help pages to open.
