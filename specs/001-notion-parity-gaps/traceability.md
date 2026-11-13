# Traceability: Notion parity gaps

Every functional requirement of [spec.md](spec.md), with the tasks that
built it, the code they name, the tests that prove it, the Pagecraft
photo (`.captures/pagecraft/`) and the Notion photo (`.captures/notion/`)
it was compared with. Built on 2026-11-13 from `tasks.md` T001–T096 and
checked mechanically: every file named exists under `src/`, every photo
folder or file exists under `.captures/`, no task is open, and every
requirement outside the quality bar has a test, a Pagecraft photo and a
Notion photo. That check reported 0 problems.

| FR | Tasks | Code | Tests | Pagecraft photos | Notion photos |
|----|-------|------|-------|------------------|---------------|
| FR-001 | T009, T010 | `src/features/database/filter-operand.view.ts`, `src/features/database/properties/date/date-filters.ts` | `src/features/database/filter-operand-view.test.ts`, `src/features/database/properties/date/date-filters.test.ts` | `p6-date-filter` | `c1-filters/50-b04-filter.png` |
| FR-002 | T010 | `src/features/database/filter-operand.view.ts` | `src/features/database/filter-operand-view.test.ts` | `p6-date-filter` | `c1-filters/50-b04-filter.png` |
| FR-003 | T011 | `src/features/database/filter-rule.view.ts` | `src/features/database/filter-rule-view.test.ts` | `p7-simple-filter` | `a7-deeper/20-b09-p0.png` |
| FR-004 | T012, T013 | `filter-row.view.ts`, `rollup.definition.ts`, `src/features/database/filter-rule.view.ts`, `src/features/database/properties/rollup/rollup.selectors.ts` | `filter-rule-view.test.ts`, `src/features/database/properties/rollup/rollup-filters.test.ts` | `p8-rollup-filter` | `c1-filters` |
| FR-005 | T014, T015 | `choice-panels.ts`, `properties/number/number-grouping.ts`, `row-groups.selectors.ts`, `src/features/database/grouping-definition.ts`, `src/features/database/properties/text/text-grouping.ts`, `src/features/database/view-settings/group-panel.ts` | `src/features/database/row-groups.test.ts`, `src/features/database/view-settings/group-panel-view.test.ts` | `p9-group-by` | `c3-sort-group` |
| FR-006 | T016, T017 | `format-toolbar.css`, `format-toolbar.selectors.ts`, `src/features/editor/editor.commands.ts`, `src/features/editor/index.ts`, `src/features/format-toolbar/format-toolbar.view.ts`, `src/model/rich-text.ts` | `src/features/editor/editor.test.ts`, `src/features/format-toolbar/format-toolbar-view.test.ts`, `src/model/rich-text.test.ts` | `p10-selection-panel` | `d5-block-menu/15-t-select.png` |
| FR-007 | T018 | `src/features/editor/editor-blocks.view.ts`, `src/features/editor/editor.css` | `src/features/editor/editor-blocks-view.test.ts` | `p11-slash-line` | `d2-slash/02-slash.png` |
| FR-008 | T019 | `index.ts`, `page-outline.css`, `page-outline.selectors.ts`, `page-outline.view.ts`, `src/app/shell.view.ts`, `src/ui/focus/reveal.ts` | `page-outline-view.test.ts`, `src/features/page-outline/page-outline.test.ts` | `p12-outline` | `d3-blocks/32-page-mid.png` |
| FR-009 | T020, T021 | `src/features/database/database-menus.view.ts`, `src/features/database/view-tab-menu.view.ts`, `src/features/database/view-tabs.view.ts`, `view-settings/root-panel.view.ts` | `src/features/database/view-tab-menu-view.test.ts`, `src/features/database/view-tabs-view.test.ts` | `p13-tab-menu` | `b4-view-options` |
| FR-010 | T022, T090 | `layouts/board/board-column.view.ts`, `layouts/gallery/gallery.view.ts`, `row-card.css`, `src/features/database/card.commands.ts`, `src/features/database/layouts/row-card/row-card.view.ts`, `src/features/database/view-settings/layout-panel.view.ts` | `button-automation-view.test.ts`, `layout-items-view.test.ts`, `row-color-view.test.ts`, `src/features/database/button-press-view.test.ts`, `src/features/database/layouts/row-card/row-card-view.test.ts`, `src/features/database/properties/button/button-property.test.ts`, `src/features/database/table-view.test.ts` | `p14-card-layout` | `b3-view-types/07-b01-panel-end.png` |
| FR-011 | T022, T023, T024, T025, T026, T090 | `calendar.css`, `feed.css`, `layout-panel.view.ts`, `layouts/board/board-column.view.ts`, `layouts/gallery/gallery.view.ts`, `row-card.css`, `src/features/database/card.commands.ts`, `src/features/database/feed-options.commands.ts`, `src/features/database/layouts/calendar/calendar.view.ts`, `src/features/database/layouts/feed/feed.view.ts`, `src/features/database/layouts/list/list.view.ts`, `src/features/database/layouts/row-card/row-card.view.ts`, `src/features/database/layouts/timeline/timeline.selectors.ts`, `src/features/database/list-options.commands.ts`, `src/features/database/view-settings/layout-panel.view.ts`, `timeline.view.ts` | `button-automation-view.test.ts`, `layout-items-view.test.ts`, `row-color-view.test.ts`, `src/features/database/button-press-view.test.ts`, `src/features/database/layouts/calendar/calendar-view.test.ts`, `src/features/database/layouts/feed/feed-view.test.ts`, `src/features/database/layouts/list/list-view.test.ts`, `src/features/database/layouts/row-card/row-card-view.test.ts`, `src/features/database/layouts/timeline/timeline.test.ts`, `src/features/database/properties/button/button-property.test.ts`, `src/features/database/table-view.test.ts` | `p14-card-layout`, `p15-calendar-wrap`, `p16-timeline-dates`, `p17-list-edit`, `p18-feed` | `b3-view-types/07-b01-panel-end.png`, `b3-view-types/14-b02-created.png`, `b3-view-types/22-b05-created.png`, `b3-view-types/30-b06-created.png`, `b3-view-types/46-b08-created.png` |
| FR-012 | T027 | `src/features/database/properties/number/number-config.view.ts` | `src/features/database/properties/number/number-config-view.test.ts` | `p19-number-tiles` | `a5-edit-property/03-b00-edit.png` |
| FR-013 | T028 | `src/features/database/column-menu-items.ts`, `src/features/database/properties/status/status.schema.ts`, `src/features/database/row.commands.ts`, `status.definition.ts`, `table-cell.view.ts`, `table-keys.view.ts` | `src/features/database/properties/status/status.test.ts` | `p20-status-checkbox` | `a6-submenus/110-b17-item.png` |
| FR-014 | T029 | `calculations.selectors.ts`, `column-menu-items.ts`, `src/features/database/calculation.commands.ts` | `src/features/database/calculations.test.ts` | `p21-count-cap` | `a7-deeper` |
| FR-015 | T030, T033 | `src/features/database/color-rules.commands.ts`, `src/features/database/view-settings/color-panel.ts`, `view-settings/root-panel.view.ts` | `src/features/database/color-rules.test.ts`, `src/features/database/view-settings/color-panel-view.test.ts` | `p22-conditional-color` | `b2-view-settings/35-b05-row.png` |
| FR-016 | T031, T032, T091, T096 | `filter-match.ts`, `layouts/calendar/calendar.view.ts`, `layouts/list/list.view.ts`, `layouts/row-card/row-card.view.ts`, `src/features/database/database.css`, `src/features/database/row-color.selectors.ts`, `src/features/database/table.view.ts` | `src/features/database/row-color.test.ts`, `src/features/database/table-view.test.ts`, `table-view.test.ts` | `p22-conditional-color/07-red-rows` | `b2-view-settings/35-b05-row.png`, `c1-filters`, `c1-filters/50-b04-filter.png`, `n40-tab-source/04-source`, `n43-reaction`, `n43-reaction2`, `n46-tabs/01-hover-tabs`, `n53-tabs/01-calendar-tab` |
| FR-017 | T002 | `src/ui/copy/database-menu-text.ts`, `src/ui/copy/editor-text.ts`, `src/ui/copy/settings-text.ts` | `src/ui/copy.test.ts` | — | — |
| FR-018 | T038, T095 | `src/ui/menu/menu-keys.ts` | `src/ui/menu/menu-lead-keys.test.ts` | — | — |
| FR-019 | T037, T052 | — | — | — | — |
| FR-020 | T041, T051, T052, T096 | `src/features/database/filter-between.view.ts`, `src/features/database/properties/date/date-filters.ts` | `date-filters.test.ts`, `filter-operand-view.test.ts` | `p24-between` | `b2-view-settings/35-b05-row.png`, `c1-filters`, `c1-filters/50-b04-filter.png`, `n40-tab-source/04-source`, `n43-reaction`, `n43-reaction2`, `n46-tabs/01-hover-tabs`, `n53-tabs/01-calendar-tab` |
| FR-021 | T042, T092, T096 | `rollup-config.view.ts`, `rollup.selectors.ts` | `rollup-filters.test.ts` | `p8-rollup-default/14-quantifier` | `b2-view-settings/35-b05-row.png`, `c1-filters`, `c1-filters/50-b04-filter.png`, `n40-tab-source/04-source`, `n43-reaction`, `n43-reaction2`, `n46-tabs/01-hover-tabs`, `n53-tabs/01-calendar-tab` |
| FR-022 | T043, T044, T093 | `group.commands.ts`, `row-groups.selectors.ts`, `src/features/database/table-model.selectors.ts`, `ui/menu/menu.css`, `view-settings/group-panel.ts` | `group-panel-view.test.ts`, `row-groups-by.test.ts`, `table-model.test.ts` | `p9-group-title`, `p9-title-icon/03-group-menu` | `n39-groups/03-group-by` |
| FR-023 | T046 | `source-title.commands.ts`, `src/features/database/view-tab-source.ts`, `view.schema.ts` | `view-tab-menu-view.test.ts`, `view-tab-source-view.test.ts` | `p25-tab-source/08-menu` | `n40-tab-source/04-source` |
| FR-024 | T049, T051, T052 | `sidebar-views.selectors.ts`, `sidebar-views.view.ts`, `src/features/sidebar/sidebar-view-template.ts`, `src/model/workspace.schema.ts` | `sidebar-views-view.test.ts` | `p26-section-reload/14-template` | `n40-section-fix/02-more` |
| FR-025 | T054, T055 | `sidebar-customize-choices.ts`, `sidebar-customize-menus.view.ts`, `sidebar-customize.css`, `sidebar-customize.view.ts`, `sidebar-section-look.ts`, `sidebar-shortcuts.view.ts`, `sidebar.view.ts`, `src/features/sidebar/sidebar-layout.selectors.ts`, `src/model/workspace.schema.ts`, `src/state/sidebar-layout.commands.ts` | `sidebar-customize-view.test.ts`, `src/features/sidebar/sidebar-layout.test.ts`, `src/state/sidebar-layout.test.ts` | `p27-customize`, `p27-customize-add` | `n42-customize2` |
| FR-026 | T058, T059, T096 | `format-toolbar-rows.view.ts`, `layouts/feed/feed.view.ts`, `page-reactions.view.ts`, `reaction-picker.view.ts`, `reactions.css`, `reactions.view.ts`, `src/blocks/page/page.schema.ts`, `src/features/comments/reaction.commands.ts` | `format-toolbar-view.test.ts`, `reaction.test.ts`, `reactions-view.test.ts` | `p28-feed-reaction`, `p28-reaction` | `b2-view-settings/35-b05-row.png`, `c1-filters`, `c1-filters/50-b04-filter.png`, `n40-tab-source/04-source`, `n43-reaction`, `n43-reaction2`, `n46-tabs/01-hover-tabs`, `n53-tabs/01-calendar-tab` |
| FR-027 | T062, T063, T064 | `src/features/database/template.commands.ts`, `src/features/row-peek/peek.view.ts`, `template-banner.css`, `template-banner.view.ts`, `templates-menu.view.ts` | `confirm-view.test.ts`, `peek-view.test.ts`, `template-banner-view.test.ts`, `template.test.ts`, `templates-menu-view.test.ts` | `u12-template`, `u12-template-delete` | `n48-template-cleanup/04-delete`, `n48-template-measure/03-banner` |
| FR-028 | T065, T066 | `page.schema.ts`, `template-cadence.view.ts`, `template-repeat.commands.ts` | `template-cadence-view.test.ts`, `template-repeat.test.ts` | `u12-cadence` | `n48-repeat-probe/05-week-panel` |
| FR-029 | T067, T083 | `button-property.definition.ts`, `cell-actions.view.ts`, `cell-files.view.ts`, `files-editor.css`, `files.css`, `properties/files/files-editor.view.ts`, `table-cell.view.ts`, `table-keys.view.ts` | `cell-actions-view.test.ts`, `files-editor-view.test.ts` | `u13-props`, `u13-props/18-files-popover` | `n50-files-probe`, `n50-files-probe/03-files-popover` |
| FR-030 | T068, T069, T070, T071, T084, T090 | `button-automation.view.ts`, `button-property.schema.ts` | `button-automation-view.test.ts`, `button-press-view.test.ts`, `button-property.test.ts`, `column-menu-view.test.ts`, `layout-items-view.test.ts`, `row-color-view.test.ts`, `src/features/database/button-press-view.test.ts`, `src/features/database/layouts/row-card/row-card-view.test.ts`, `src/features/database/properties/button/button-property.test.ts`, `src/features/database/table-view.test.ts` | `u14-button`, `u14-button/11-automation` | `n51-button/05-settings` |
| FR-031 | T073, T074, T075, T081, T082, T088 | `comments.css`, `editor-input.view.ts`, `src/blocks/page/page.schema.ts`, `src/features/comments/suggestion.commands.ts`, `src/model/rich-text.schema.ts`, `suggestion.commands.ts`, `suggestion.view.ts` | `editor-input.test.ts`, `rich-text-suggestions.test.ts`, `suggestion-view.test.ts`, `suggestion.test.ts` | `u18-suggest`, `u18-suggest/11-bs-s`, `u18-suggest/14-suggestion-card` | `n52-card`, `n52-suggest/08-typed-shot` |
| FR-032 | T076, T077, T078, T096 | — | `sidebar-tabs-view.test.ts`, `sidebar-tabs.test.ts` | `u19-tabs` | `b2-view-settings/35-b05-row.png`, `c1-filters`, `c1-filters/50-b04-filter.png`, `n40-tab-source/04-source`, `n43-reaction`, `n43-reaction2`, `n46-tabs/01-hover-tabs`, `n53-tabs/01-calendar-tab` |
| FR-033 | T078, T079, T080, T086, T096 | `layouts/calendar/calendar-header.view.ts`, `layouts/timeline/timeline.view.ts` | `calendar-tab-view.test.ts`, `calendar-tab.test.ts` | `u19-tabs`, `u21-manage` | `b2-view-settings/35-b05-row.png`, `c1-filters`, `c1-filters/50-b04-filter.png`, `n40-tab-source/04-source`, `n43-reaction`, `n43-reaction2`, `n46-tabs/01-hover-tabs`, `n53-tabs/01-calendar-tab` |

FR-017 to FR-019 are the quality bar; they hold across the table (see
below) rather than in files of their own.

## Quality bar

- **FR-017 (Notion's English words)**: every string the new controls show
  comes from `src/ui/copy/`; each audit item in `docs/notion-study.md`
  records Notion's Portuguese reading beside the English word used
  (items 5–32).
- **FR-018 (keyboard)**: `sc4-keyboard` reaches View settings by Tab with
  a focus ring, opens it with Enter, walks its rows with the arrows,
  chooses Group › Name and closes with Escape, the focus back on View
  settings. The pass found two defects, both fixed with a test first:
  a menu's name field let Tab leave for the page behind (T095,
  `menu-lead-keys.test.ts`), and "Edit cadence" left the focus nowhere
  once saved, so Escape could not close the template (T094,
  `template-cadence-view.test.ts`).
- **FR-019 (photos)**: each row above names its Pagecraft and Notion
  photos, all taken by `scripts/capture.ts` at 1440×900 and 2× and
  opened before the task was ticked.

## Success criteria

- **SC-001** (14 gap items, each beside Notion): audit items 5–18 are
  FR-001 to FR-016; each has its Pagecraft and Notion photos in the
  table.
- **SC-002** (same rows as Notion): `src/features/database/notion-sample.test.ts`
  rebuilds the sample built in Notion's test workspace and checks the
  rows each relative date filter kept and the groups Notion formed:
  11 of 11 pass.
- **SC-003** (options take effect at once and survive a reload):
  `sc3-reload` sets compact cards on the board, Status shown as a
  checkbox, "Show large counts as 99+" and grouping by Name, reloads,
  and reads all four back (`26-after-board`, `28-table`, `32-count2`);
  `sc3-reload-session` sets a template's cadence to every week and the
  sidebar's Calendar tab, reloads, and reads both back (`12-after-tab`,
  `17-more`). Earlier: `p23-reload`, `p26-section-reload/19-after`,
  `p27-customize/20-after`.
- **SC-004** (keyboard alone): `sc4-keyboard`, T038's view tests, and the
  fixes T094 and T095 above.
- **SC-005** (verify under 30 s, tests under 10 s) and **SC-006** (no
  regression): `npm run verify` on 2026-11-13 passed type check, lint and
  formatting, then 325 test files and 2001 tests, every one passing, in
  9.87 s; 22.3 s in all.

## Assumptions, checked against the code

- English words with Portuguese recorded: `src/ui/copy/`, study items.
- Tab "Show as" kept with the owner's display settings:
  `workspace.settings.viewTabStyle` read by `view-tab-menu.view.ts`.
- Interval grouping 0–1000 by 100: `DEFAULT_INTERVAL = 100` and the
  0/1000 bounds in `view-settings/group-by-panels.ts`.
- "Other" for anything but A–Z and digits: `otherLetters` in
  `ui/copy/database-options-text.ts`.
- Outline from three headings: `OUTLINE_THRESHOLD = 3` in
  `features/page-outline/page-outline.selectors.ts`.
- Ten colors for conditional color: `colorRuleSchema` takes "default" or
  one of the nine tones of `toneSchema`.
- Out of scope and left out (AI, sharing, people, map, dashboard, Notion
  Calendar and its sidebar sections): no such entries exist in the
  menus built; Manage in calendar (FR-033), Move to tab (FR-032) and
  Suggesting (FR-031) are built as the spec now says.
