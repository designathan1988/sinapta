---
description: "Tasks for the automatic interface audit"
---

# Tasks: Automatic interface audit

**Input**: Design documents from `specs/001-auto-ui-audit/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli.md, quickstart.md

**Tests**: Required by the spec (SC-003, SC-004): each rule gets its broken and correct instances in the self-test fixture before its code, and the self-test must fail until the rule exists.

**Organization**: Tasks are grouped by user story so each can be built and proved on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: The user story it serves (US1–US5)
- Paths are from the repository root; limits from CLAUDE.md apply to every file (≤ 250 lines, functions ≤ 40 lines, ≤ 3 parameters, named exports).

## Phase 1: Setup

**Purpose**: The command and the place for the fixture.

- [X] T001 Add `"audit:ui:self-test": "node scripts/ui-audit/self-test.ts"` to `package.json` scripts, beside `audit:ui`
- [X] T002 Make the page-side injection in `scripts/ui-audit/audit-session.ts` take its modules from one exported list (`PAGE_MODULES`) and export `runPageChecks(page): Promise<Problem[]>` so the sweep and the self-test can run the rules without a session

---

## Phase 2: Foundational

**Purpose**: Discovery, signatures and the self-test harness every story needs.

**⚠️ No story work before this phase is done.**

- [X] T003 [P] Create `scripts/ui-audit/page-signature.ts` (page-side, self-contained): `styleSignature(element)` returning the control's, its descendants' and their `::before`/`::after` background color and image, color, border colors, box-shadow, outline, opacity, text-decoration, transform, filter and visibility as one string; `shownBoxes()` returning the rectangle of every shown element in normal flow keyed by a stable path
- [X] T004 [P] Create `scripts/ui-audit/page-discover.ts` (page-side): `listControls()` returning every shown control per research R1 with `index`, `kind` (tag, role, first two classes, icon/text/both, `aria-haspopup`, per R2), `label`, `opens` (`aria-haspopup`, `aria-expanded`, `role="tab"`, `popovertarget`), `isRisky` (name matches /delete|trash|remove|clear|reset|import|export|download|print|upload|sign out|discard/i or `input[type=file]`, per R5), `isFocusable`, `box`; `rowContainers()` returning row-like containers (`[role="treeitem"]`, `[role="row"]`, `tr`, `[data-block-id]`, `[data-row-id]`); `controlAt(index)` marking the listed control with `data-audit-target` so the runner can find it
- [X] T005 Register `page-signature.ts` and `page-discover.ts` in `PAGE_MODULES` in `scripts/ui-audit/audit-session.ts`
- [X] T006 [P] Create `scripts/ui-audit/fixtures/defects.html`: a self-contained page (inline styles and script, no network) with a header of correct controls, each marked `data-expect="none"`
- [X] T007 Create `scripts/ui-audit/self-test.ts`: launch Chrome (`channel: "chrome"`, headless, 1440×900), open the fixture by file URL, run the sweep on it as one place, then compare: every `[data-expect="<rule>"]` element must appear in a finding of that rule, every `[data-expect="none"]` in none; print misses and false findings; exit 1 on any, 0 otherwise

**Checkpoint**: `npm run audit:ui:self-test` runs and passes on a fixture with only correct controls.

---

## Phase 3: User Story 1 - Every control is pointed at, focused and judged (P1) 🎯 MVP

**Goal**: One control per kind pointed at and focused in each place; dead hovers, hovers that move the layout and invisible focus are reported.

**Independent Test**: The self-test reports the fixture's broken hover, shifting hover and invisible focus, and none of their correct counterparts.

- [X] T008 [US1] Add to `scripts/ui-audit/fixtures/defects.html`: a button whose hover changes nothing (`data-expect="no-hover-response"`), a button whose hover grows its padding and pushes its neighbor (`data-expect="hover-shifts-layout"`), a focusable button with `outline: none` and no other focus style (`data-expect="focus-not-visible"`), a row whose controls appear only on hover with a correct hover (`data-expect="none"`); run the self-test and confirm the three are missed
- [X] T009 [US1] Create `scripts/ui-audit/sweep-controls.ts`: `pointAndFocus(session, place)` that lists controls, points at every row container first to reveal hidden controls, then for one control per kind not yet exercised in this theme: reads its signature and the boxes, moves the mouse to its center with `page.mouse.move`, settles, reads again, and records `no-hover-response` (signature unchanged and nothing newly shown), `hover-shifts-layout` (a normal-flow element outside it moved ≥ 0.5 px, with the distance), runs the page-side rules in the pointed state; then presses Shift, focuses it, records `focus-not-visible` when its outline, box-shadow, border and background are unchanged; moves the mouse to a neutral point after each
- [X] T010 [US1] Run `npm run audit:ui:self-test` until the three US1 rules are found and no correct control is reported

**Checkpoint**: US1 proved on the fixture.

---

## Phase 4: User Story 2 - Everything that opens is opened, judged and closed (P1)

**Goal**: Every control that declares it opens something is pressed once per kind; its surface is judged at rest, closed with Escape (then an outside click), and the page checked back to its state before.

**Independent Test**: The self-test reports the fixture's off-screen menu, detached menu, popover that ignores Escape and stuck pressed state.

- [X] T011 [US2] Add to `scripts/ui-audit/fixtures/defects.html`: a menu button whose popover opens past the window's bottom (`data-expect="overlay-offscreen"`), one whose popover opens 200 px away (`data-expect="overlay-detached"`), one whose popover ignores Escape and outside clicks (`data-expect="not-closing"`), one that stays `aria-expanded="true"` after its popover closes (`data-expect="stuck-state"`), one correct menu with a row that opens a submenu (`data-expect="none"`); confirm they are missed
- [X] T012 [US2] Create `scripts/ui-audit/sweep-surfaces.ts`: `openEach(session, place)` that, for one opening control per kind (never `isRisky`), records the open surfaces, presses it, settles, judges the newly open `[popover]:popover-open`, `dialog[open]` and `.peek` with the page-side rules (state "with <surface> open"), points at its rows and presses rows that open a submenu (depth ≤ 2), then closes it with Escape, else a click at the main area's top-left corner, and records `not-closing` when it stays open and `stuck-state` when the control is still expanded or its signature differs from its pointed-at one; reloads the place when a surface can not be closed
- [X] T013 [US2] Run the self-test until the US2 rules are found and the correct menu and submenu are not reported

**Checkpoint**: US1 and US2 proved.

---

## Phase 5: User Story 3 - Everything drawn is drawn right, in every state (P1)

**Goal**: New drawing rules run in every state the sweep reaches.

**Independent Test**: The self-test reports the fixture's blank icon, broken image, misaligned row, overflowing text, pressable `div` and zero-size control.

- [X] T014 [US3] Add to `scripts/ui-audit/fixtures/defects.html`: an `svg` icon with no drawable child (`blank-icon`), an `img` with a missing source (`broken-image`), a flex row with `align-items: center` whose second item has a 3 px top margin (`row-misaligned`), a fixed-width box whose unbroken text runs past it (`text-overflow`), a `div` with `cursor: pointer` and a click handler but no role or tabindex (`pressable-not-control`), a button of zero width with a label (`zero-size-control`), and a correct counterpart of each; confirm they are missed
- [X] T015 [US3] Create `scripts/ui-audit/page-checks-drawing.ts` (page-side, self-contained, per research R7): `blankIconProblems()`, `brokenImageProblems()`, `rowAlignmentProblems()` (flex rows with `align-items: center`, middles differing by > 1.5 px), `textOverflowProblems()` (text runs past a non-scrolling block container), `pressableProblems()`, `zeroSizeProblems()`; register the module in `PAGE_MODULES` and the rules in the page-side run list in `scripts/ui-audit/audit-session.ts`
- [X] T016 [US3] Run the self-test until every US3 rule is found and no correct counterpart is reported

**Checkpoint**: All P1 stories proved on the fixture.

---

## Phase 6: User Story 4 - A report the owner can act on in minutes (P2)

**Goal**: Grouped, ranked findings with crops, coverage, and comparison with the previous run.

**Independent Test**: Two runs with one defect fixed in between: the second report lists it under Fixed and the rest as still there; repeated defects appear once with a count.

- [X] T017 [US4] Create `scripts/ui-audit/report.ts`: `groupFindings(findings)` keyed by rule + kind + detail with numbers replaced, keeping `count` and the first instance; `rankOf(rule)` (1: behavior, console errors, invisible content, not-closing, stuck-state; 2: layout rules; 3: polish such as row-misaligned and clipped); `compareWith(previous, groups)` setting `status` to `new` or `still there` and returning the fixed groups; `writeReport(folder, groups, coverage)` writing `report.md` (heading with counts, coverage line, ranked table `| Rank | Status | Rule | Element | Place | State | Detail | Count | Picture |`, Fixed list) and `findings.json`, per `contracts/cli.md`
- [X] T018 [US4] In `scripts/ui-audit/audit-session.ts`, record for each finding its place, state, element kind and a cropped picture (`page.screenshot({ clip })` of the element's box with 24 px around, clamped to the window) taken at the moment it is found, once per group key
- [X] T019 [US4] Wire `scripts/ui-audit/run.ts` and `scripts/ui-audit/self-test.ts` to `report.ts`; read the previous `.ui-audit/findings.json` before clearing the folder

**Checkpoint**: Reports are grouped, pictured and compared.

---

## Phase 7: User Story 5 - Both themes and two widths, in about a minute (P2)

**Goal**: The sweep walks every place of the app, in light and dark at desktop width and light at narrow width, within 90 seconds with the scripted scenarios.

**Independent Test**: A timed full run names both themes and both widths in its coverage line and ends within 90 s.

- [X] T020 [US5] Create `scripts/ui-audit/sweep-places.ts`: `listPlaces(page)` reading the sidebar tree's rows and Home, `enterPlace(page, place)` clicking the row (or Home) and waiting for the page, and `databaseViews(page)` listing the open database's tabs as sub-places; `sweepPlace(session, place, depth)` running the page-side rules at rest, then `pointAndFocus` and `openEach` (full) or only `openEach` (narrow)
- [X] T021 [US5] Rework `scripts/ui-audit/run.ts`: for light and dark at 1440×900 run the scripted scenarios then the full sweep; for light at 1024×768 run the narrow sweep; honor `UI_AUDIT_ONLY` (sweep, scenarios, light, dark, desktop, narrow); count places, controls, kinds, surfaces and states for the coverage line; stop exploring and report `budget` when 85 s have passed
- [X] T022 [US5] Time a full run against the app at :5190 and tune (skip settle when no animation runs, avoid auto-waits) until it ends within 90 s

---

## Phase 8: Polish & cross-cutting

- [X] T023 Run the full audit and fix every real finding in the app (`src/`), each fix checked by a rerun; correct any false finding in its rule with the reason in a comment, and add the case to the fixture as `data-expect="none"`
- [X] T024 [P] Update `CLAUDE.md` (Commands: `npm run audit:ui:self-test`; Visual checks: the sweep explores by itself, the self-test guards the rules) and `docs/ownership.md` if the row's wording changes
- [X] T025 Validate with `specs/001-auto-ui-audit/quickstart.md` (self-test, full sweep, reintroduced defects, comparison), then `npm run verify` and commit per CLAUDE.md

---

## Dependencies & Execution Order

- Setup (T001–T002) → Foundational (T003–T007) → stories.
- US1 (T008–T010), US2 (T011–T013) and US3 (T014–T016) depend only on Foundational; they touch different files except the fixture, so their fixture additions are done in order.
- US4 (T017–T019) depends on findings existing (any of US1–US3).
- US5 (T020–T022) depends on US1 and US2 (the sweep it schedules).
- Polish depends on all stories.

## Parallel Opportunities

- T003, T004 and T006 touch different files and can be written together.
- Within US3, `page-checks-drawing.ts` (T015) can be written while US2's `sweep-surfaces.ts` (T012) is being written.
- T024 (docs) can be done during T023.

## Implementation Strategy

1. MVP: Setup, Foundational, US1: the sweep points at and focuses every kind on the fixture and catches dead or shifting hovers and invisible focus.
2. Add US2 and US3 (all P1): surfaces and drawing rules, each proved by the self-test.
3. Add US4 (report) and US5 (places, themes, widths, budget), then run on the app and fix what it finds.
