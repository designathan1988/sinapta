# Implementation Plan: Automatic interface audit

**Branch**: `claude/charming-darwin-7tmtef` | **Date**: 2026-11-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-auto-ui-audit/spec.md`

## Summary

Turn `npm run audit:ui` from a scripted walk into a sweep that explores the app by itself. In each place a person can reach (every sidebar page, Home, every database view), an in-page script lists every control and groups identical ones into kinds. The runner points at, focuses and (when it declares it opens something) presses one control per kind, compares style signatures and element boxes before and after, opens, judges and closes every surface, and runs the page-side drawing rules in every state it reaches. Light and dark at 1440×900 get the full sweep, 1024×768 the drawing rules and surfaces. Findings are grouped across repeated elements, ranked, pictured as crops, and compared with the previous run. A self-test page holds one broken and one correct instance of every rule, proving the audit's recall and precision in seconds. The existing scripted scenarios keep running for behaviors that need intent.

## Technical Context

**Language/Version**: TypeScript run directly by Node 24 (type stripping), as `scripts/build-tokens.ts` and the current audit are.

**Primary Dependencies**: playwright-core 1.64.1 (already installed, drives the installed Google Chrome through `channel: "chrome"`); nothing new.

**Storage**: Files only: `.ui-audit/report.md`, `.ui-audit/findings.json`, cropped PNGs; the previous `findings.json` is read for comparison.

**Testing**: A self-test (`npm run audit:ui:self-test`) runs the sweep on a fixture page of broken and correct instances in Chrome; the audit's own TypeScript passes `npm run verify` (types, lint, file and function limits).

**Target Platform**: Windows and any desktop with Google Chrome and Node 24.

**Project Type**: Command-line review tool beside a single-page web app.

**Performance Goals**: Full audit (sweep at two themes and two widths plus the scripted scenarios) in 90 s or less; self-test in under 10 s.

**Constraints**: CLAUDE.md limits: files ≤ 250 lines, functions ≤ 40 lines, ≤ 3 parameters, named exports, English, no banned file names (utils, helpers, common, shared, misc, lib); no new dependencies; never touch the owner's data; never open pickers, downloads or print dialogs.

**Scale/Scope**: About 14 places, 150 control kinds and 40 surfaces in the seeded workspace; grows with the app without audit changes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is the unfilled template; the project's binding rules are in `CLAUDE.md` and `.claude/rules/`. Gates taken from them:

| Gate | Status |
| --- | --- |
| Every concern has one owner (`docs/ownership.md`) | Pass: "Interface audit" row owns `scripts/ui-audit/` |
| File ≤ 250 lines, function ≤ 40 lines, ≤ 3 parameters | Pass by design: one concern per file (see structure) |
| No new dependencies; research docs before using a library | Pass: playwright-core already present; its APIs used are the ones already in use plus `page.mouse`, `page.screenshot({ clip })` |
| Named exports only; no banned file names | Pass |
| English everywhere | Pass |
| Commands never block > 10 s in the foreground | Pass: the audit runs in the background, as today |
| Tests first | Pass: the self-test fixture's broken instances are written before each rule and must fail the self-test until the rule exists |

Re-check after design: unchanged, all pass.

## Project Structure

### Documentation (this feature)

```text
specs/001-auto-ui-audit/
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1–R10
├── data-model.md        # Phase 1: Place, Control, Kind, Surface, State, Finding
├── quickstart.md        # Phase 1: how to run and validate
├── contracts/
│   └── cli.md           # Phase 1: commands, environment, exit codes, report format
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
scripts/ui-audit/
├── run.ts                   # entry: themes × widths, scenarios + sweep, report
├── audit-session.ts         # existing: page, findings, check(), expect(), settle
├── page-checks.ts           # existing page-side rules (overflow, overlays, clipped, overlap, contrast)
├── page-checks-blocks.ts    # existing page-side rules (handles, wrapped toolbars)
├── page-checks-drawing.ts   # new page-side rules: blank icon, broken image, row misaligned,
│                            #   text overflow, pressable-not-control, zero-size control
├── page-discover.ts         # new page-side: list controls, kinds, row-like containers
├── page-signature.ts        # new page-side: style signature and element boxes
├── sweep-places.ts          # new: enumerate and enter places (sidebar pages, Home, views)
├── sweep-controls.ts        # new: point and focus one control per kind, compare
├── sweep-surfaces.ts        # new: open, judge, close surfaces; submenus to depth 2
├── report.ts                # new: group, rank, crop, compare with previous run, write
├── self-test.ts             # new: run the sweep on fixtures/defects.html, assert recall and precision
├── fixtures/defects.html    # new: one broken and one correct instance of every rule
├── scenarios-*.ts           # existing scripted scenarios (kept)
```

**Structure Decision**: The audit stays in `scripts/ui-audit/`, its single owner. Page-side files (prefix `page-`) hold only self-contained functions injected by source into the page, as today; runner-side files (prefix `sweep-`, `report`, `run`, `self-test`) drive Chrome. No `src/` code changes except fixes for what the audit finds.

## Complexity Tracking

No gate violations.
