# Contract: audit commands

## `npm run audit:ui`

Sweeps the served app and runs the scripted scenarios.

| Input | Default | Meaning |
| --- | --- | --- |
| `UI_AUDIT_URL` | `http://localhost:5190/` | The served app; a fresh browser profile is used, so the app seeds a new workspace |
| `UI_AUDIT_ONLY` | (all) | Comma list to narrow a run while fixing: `sweep`, `scenarios`, `light`, `dark`, `desktop`, `narrow` |

| Exit code | Meaning |
| --- | --- |
| 0 | Nothing found |
| 1 | Findings in the report |
| 2 | No app answers at the URL, or Chrome could not start |

Output, in `.ui-audit/` (replaced each run except `findings.json`, which is read first):

- `report.md`: a heading with the count of findings and fixed ones; a coverage line (places, controls, kinds, surfaces, states judged, seconds); then one table row per finding group, ranked: `| Rank | Status | Rule | Element | Place | State | Detail | Count | Picture |`; then the list of fixed findings.
- `findings.json`: an array of finding groups, as in [data-model.md](../data-model.md#finding), the input of the next run's comparison.
- `<theme>-<width>-<NNN>-<rule>.png`: a crop of the first instance of each group, 24 px of context around the element.

The report is printed to the terminal as well.

## `npm run audit:ui:self-test`

Runs the sweep on `scripts/ui-audit/fixtures/defects.html` in Chrome, without the app.

Every element marked `data-expect="<rule>"` must be reported under that rule; every element marked `data-expect="none"` must not be reported. The command prints each miss and each false finding and exits 1 on any, 0 otherwise.
