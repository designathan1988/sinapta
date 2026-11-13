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

