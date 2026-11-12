# Quickstart: validating the automatic interface audit

## Prerequisites

- Google Chrome installed; Node 24; `npm install` done (playwright-core 1.64.1 is a dev dependency).
- For the full audit only: the app served at `http://localhost:5190` (`npm run dev -- --port 5190`, in the background).

## 1. The audit catches every kind of defect, and nothing else

```bash
npm run audit:ui:self-test
```

Expected: every broken instance in `scripts/ui-audit/fixtures/defects.html` listed as found, no correct instance reported, exit code 0, in under 10 seconds. Breaking one rule's code (for example removing the hover comparison) makes this fail with that rule's broken instance listed as missed.

## 2. A full sweep of the app

Run in the background (it takes about a minute):

```bash
npm run audit:ui
```

Expected:

- `.ui-audit/report.md` starts with the count of findings and a coverage line naming about 14 places per theme, the number of control kinds pointed at and focused, and the surfaces opened, for light and dark at desktop width and light at the narrow width.
- The run ends in 90 seconds or less.
- Each finding row names the rule, the element in plain words, the place, the state and the measurement, with its picture.

## 3. Reintroduced defects are reported

For each defect the owner reported earlier, reintroduce it and run the audit; it must appear in the report:

| Reintroduce | Expected rule |
| --- | --- |
| Remove the handle offsets in `src/features/editor/editor-handles.css` | `handle-misaligned` |
| Delete the `:hover` background of `.sidebar__row` | `no-hover-response` |
| Remove the peek's least page width in `src/app/shell.css` | `page-overflow` or `wrapped-toolbar` at narrow width |
| Set a menu's background to its text color | `invisible-text` |

Restore each change after checking.

## 4. Comparison with the previous run

Fix one finding and run again: the new report lists it under "Fixed" and the others as "still there".
