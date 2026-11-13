# Implementation Plan: Notion parity, remaining audit gaps

**Branch**: `claude/charming-darwin-7tmtef` | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-notion-parity-gaps/spec.md`

## Summary

Close the 14 gaps the 2026-11-13 Notion audit left open, so Pagecraft's
database filters and grouping, view presentation, conditional color and
editor (selection panel, slash line, floating outline) match Notion's
layout, behavior and words. Every stored change is an optional field
(no migration); filtering keeps string operands; one accessor gives each
property its filter operators so rollups can quantify the target's; the
editor reuses its existing overlays. Each item ends with a photo compared
with Notion (`npm run capture`); `npm run verify` runs once at the end.

## Technical Context

**Language/Version**: TypeScript (strict), HTML, CSS; Node 24 for scripts

**Primary Dependencies**: lit-html (views), the project's store and
`dispatch` (zustand-based), Valibot (schemas), idb (IndexedDB);
playwright-core for photos

**Storage**: IndexedDB through `src/persistence/`; workspace schema
version 28 stays (optional fields only)

**Testing**: Vitest; model and state tests in Node, view tests in the DOM
environment per file; tests next to their files

**Target Platform**: evergreen desktop browsers (Chrome first), offline
capable

**Project Type**: single-page web application, local-first, single user

**Performance Goals**: every option shows its effect at once (one render);
grouping and color rules cost no more than one filter pass per row

**Constraints**: files < 250 lines, functions < 40 lines and 3 params,
semantic tokens only, copy in `src/ui/copy`, keyboard reachable, full
suite < 10 s, verify < 30 s

**Scale/Scope**: 14 gap items across database (filters, grouping,
calculations, layouts, color), editor (toolbar, slash, outline) and
settings; about 40 files touched, 6 new

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
| --- | --- | --- |
| I. One store, one dispatch | every change is a command (contracts/commands.md); derived values (row color, groups, outline) are selectors | PASS |
| II. One owner per concern | new owners added to `docs/ownership.md` first: `text-filters.ts` (done), `row-color.selectors.ts`, `color-rules.commands.ts`, `ui/tiles/`, `features/page-outline/`, shared reveal in `ui/focus/` | PASS |
| III. Schemas at the boundaries | only optional fields added to existing schemas; no new parsing inside the app | PASS |
| IV. Notion parity by photo | every task ends with `npm run capture` and a named Notion photo (quickstart.md) | PASS |
| V. Tests in budget, run at the end | unit tests per item next to the code; seconds-long checks while coding; verify once at the end | PASS |
| VI. Small, plain, accessible | new views split by part; panels keyboard-reachable; copy and tokens added before use | PASS |

Post-design re-check (after data-model.md and contracts): PASS — no
violation needs Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-notion-parity-gaps/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/commands.md
├── checklists/requirements.md
└── tasks.md            (speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── model/
│   ├── view.schema.ts            # filter dateEnd; groupBy textBy/numberBy; card, list, feed, countCap, colorRules; calendar/timeline fields
│   └── workspace.schema.ts       # settings.viewTabStyle
├── state/settings.commands.ts    # settings.setViewTabStyle
├── ui/
│   ├── tiles/                    # NEW: shared pictured tiles (from layout panel)
│   └── focus/                    # shared reveal-and-flash (from app/router.ts)
├── features/
│   ├── database/
│   │   ├── property-definition.ts       # filterOperatorsFor; operatorsOf accessor
│   │   ├── filter-match.ts, filter-label.ts, filter-fields.ts, filter-row.view.ts, filter-rule.view.ts
│   │   ├── properties/date/date-filters.ts    # relative operator, dateEnd
│   │   ├── properties/rollup/*                # quantified operators, cells selector
│   │   ├── properties/text|number/*           # groupings
│   │   ├── properties/status/*                # showAs checkbox
│   │   ├── properties/number/number-config.view.ts  # tiles
│   │   ├── grouping-definition.ts, row-groups.selectors.ts, view-settings/group-panel.ts
│   │   ├── calculations.selectors.ts, column-menu-items.ts   # 99+
│   │   ├── view-tabs.view.ts, view-tab-menu.view.ts (NEW)
│   │   ├── layouts/row-card, board, gallery, calendar, timeline, list, feed
│   │   ├── color-rules.commands.ts (NEW), row-color.selectors.ts (NEW), view-settings/color-panel.ts (NEW)
│   │   └── view-settings/layout-panel.view.ts
│   ├── format-toolbar/                  # panel form
│   ├── editor/                          # clearTextFormat, exports, slash data attributes
│   └── page-outline/                    # NEW feature
└── app/shell.view.ts                     # outline mount
```

**Structure Decision**: the existing single web application under
`src/`, extended in place; new code only where the ownership table points.

## Phases

1. **Foundations** — operator accessor, optional schema fields, copy and
   tokens, shared tiles and reveal helper.
2. **US1 Filters and grouping (P1)** — relative date + range end, simple
   popover, rollup quantifier, text and number grouping.
3. **US2 Editor (P1)** — selection panel, slash placeholder, outline.
4. **US3 View presentation (P2)** — tab show-as and tab menu, card,
   calendar, timeline, list, feed options, number tiles, status checkbox,
   99+.
5. **US4 Conditional color (P3)** — rules, matching, drawing, panel.
6. **Polish** — study updated (gaps marked done), ownership, verify once,
   final photos.

## Complexity Tracking

No constitution violations to justify.

## Later additions (converge, 2026-11-13)

Items 19–24 of the audit (FR-020 to FR-024) touched, beyond the files
above: `src/features/database/filter-between.view.ts`,
`properties/rollup/rollup-effective.ts`, `view-tab-source.ts`,
`source-title.commands.ts`, `view-rows.selectors.ts`; the settings'
`sidebarViews` in `src/model/workspace.schema.ts` with its commands in
`src/state/sidebar-views.commands.ts`; the sidebar's sections in
`src/features/sidebar/sidebar-views.view.ts`, `sidebar-view-menu.view.ts`,
`sidebar-view-template.ts`; and `src/model/apply-operation.ts`, whose
inverse now removes a field an update added (found by T046's undo test).
