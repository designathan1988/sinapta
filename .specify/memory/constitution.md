# Pagecraft Constitution

## Core Principles

### I. One store, one dispatch

All application state lives in the one store, `src/state/store.ts`. Every
change goes through `dispatch(command)` (`src/state/dispatch.ts`) as a named
`domain.action` command. Values derived from state come from selectors and
are never stored. Views keep no state of their own and read state only
through selectors.

Rationale: one place to read and one way to change makes every behavior
testable as command in, state out, and undo exact.

### II. One owner per concern

Every concern has exactly one owner listed in `docs/ownership.md`; new code
finds its owner first, or adds a row there before it is written. Imports run
one way: app → features → blocks → ui → state → model; persistence imports
state and model only; model imports nothing. Other folders are imported
through their `index.ts` only.

Rationale: a single owner and a single direction keep the code navigable
and stop features from reaching into each other.

### III. Schemas at the boundaries

JSON is parsed only by schemas (`src/model/` and `*.schema.ts`), at storage
load and file import. Inside the app, data is already typed and is not
re-checked. Stored shapes change only with a schema version and a migration,
or by optional fields whose absence means the old behavior.

Rationale: data is trusted after one check at the edge, and saved
workspaces keep loading.

### IV. Notion parity by photo (NON-NEGOTIABLE)

Pagecraft matches Notion's layout, behavior and words as recorded in
`docs/notion-study.md`, the one file for Notion findings. Every interface
change is photographed with `npm run capture` (headless, 1440 × 900 at 2x)
and the photo is opened and compared with the audit photo of Notion before
the change is called done. Screenshots of the built-in browser pane or the
Chrome extension never count as photos. Each control is checked in its
states: at rest, pointed at, pressed, open, focused.

Rationale: looking at the real result at native pixels is the only check
that catches visual and behavioral drift.

### V. Tests in budget, run at the end

Tests sit next to the code they test, assert on commands and state (no
markup snapshots), and use no sleeps, polling or real timers. The full suite
runs in under 10 seconds and `npm run verify` (types, lint, tests) in under
30 seconds. While coding, only seconds-long checks run (`npx tsc --noEmit`,
a single test file); `npm run verify` runs once, at the end, before
committing. Every bug fix starts with a failing test in the layer where the
bug lives.

Rationale: fast, honest tests keep the loop short; running the whole suite
repeatedly while coding wastes the owner's time.

### VI. Small, plain, accessible code

Files stay under 250 lines, functions under 40 lines and 3 parameters;
named exports only; no `utils`, `helpers`, `common`, `shared`, `misc` or
`lib` names. CSS uses semantic token custom properties only, inside the
declared layers, with state in `data-*` or ARIA attributes. Every string the
user sees comes from `src/ui/copy.ts`, in English. Every interactive element
is reachable by keyboard with a visible focus ring, and every drag has a
keyboard equivalent. Pasted HTML is never inserted; `innerHTML` and
`unsafeHTML` are never used.

Rationale: small units are readable and reviewable; tokens and copy keep
the look and the words consistent; accessibility is part of parity.

## Product constraints

- Local-first and single-user: no server, no accounts, no sharing; data
  lives in the browser (IndexedDB) and in files the owner imports or
  exports.
- TypeScript, HTML and CSS with no UI framework; views render with
  lit-html; state uses the project's store.
- Notion features that need a server, other people, AI or a paid plan are
  out of scope and recorded as such in the study.
- Libraries and web APIs are researched in their current documentation
  before use.

## Development workflow

- One small vertical slice at a time, each with its running result shown.
- New block, feature, property type, shortcut, copy or visual value goes
  where CLAUDE.md's "Where new code goes" says.
- Commits follow Conventional Commits with the folder as scope, one per
  task, after `npm run verify` passes.
- Processes started for a check are stopped as soon as the check is done;
  only one browser or server runs at a time, never beside subagents.
- Everything learned about the project is written in the repository
  (CLAUDE.md, docs/notion-study.md, docs/tasks.md, docs/decisions/), never
  in a tool's private memory.

## Governance

This constitution states the project's non-negotiable principles; CLAUDE.md
is the operating guide that applies them day to day, and wins on details it
states. Amendments are proposed with their reason and recorded as a
decision in `docs/decisions/`, then reflected here and in CLAUDE.md in the
same change. Versioning follows semantic versioning: MAJOR for removing or
redefining a principle, MINOR for adding a principle or materially expanding
guidance, PATCH for wording. Every plan's Constitution Check and every
review confirms compliance; a deviation is allowed only when written down
with its justification in the plan's Complexity Tracking.

**Version**: 1.0.0 | **Ratified**: 2026-11-13 | **Last Amended**: 2026-11-13
