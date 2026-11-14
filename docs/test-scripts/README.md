# Test scripts

One script per part of the app, written and run with the
`feature-test-scripts` skill: the cases come from `npm run inventory` (the
code as it is when the script is written), are run with the human hand of
`npm run capture`, and every photo is looked at.

## Status

| Part | Script | Date | Cases | Pass | Findings | Not run |
| --- | --- | --- | --- | --- | --- | --- |
| sign-in | [sign-in.md](sign-in.md) | 2026-11-14 | 34 | 21 | 12 (10 fixed) | 1 |
| sidebar and shell | [sidebar.md](sidebar.md) | 2026-11-14 | 67 | 46 | 17 (14 fixed) | 4 |
| editor and text blocks | [editor.md](editor.md) | 2026-11-14 | 53 | 40 | 11 (9 fixed) | 2 |
| other blocks | [blocks.md](blocks.md) | 2026-11-14 | 38 | 24 | 11 (11 fixed) | 3 |
| blocks/toggle | [blocks-toggle.md](blocks-toggle.md) | 2026-11-14 | 43 | 18 | 4 (1 fixed) | 21 |
