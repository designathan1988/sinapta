# Pagecraft

Local-first, single-user, Notion-style workspace app. TypeScript, HTML, CSS.
No UI framework. Full specification: docs/specification.md.

## Commands
- npm run dev            dev server with hot reload (keep running in background)
- npm run check:watch    type check in watch mode (keep running in background)
- npm run test:watch     tests in watch mode (keep running in background)
- npm run verify         type check + lint + full tests; run before every commit
- npm run tokens         rebuild src/styles/tokens.generated.css

## Architecture rules
- All state lives in the one store: src/state/store.ts. Views keep no state.
- All changes go through dispatch(command) in src/state/dispatch.ts.
- Derived values come from selectors and are never stored.
- Every concern has one owner, listed in docs/ownership.md. Find the owner
  before adding code. No owner: add a row there first.
- Import direction: app -> features -> blocks -> ui -> state -> model.
  persistence imports state and model only. model imports nothing.
- Import other folders through their index.ts only.
- JSON is parsed only by schemas (src/model/ and *.schema.ts files), at
  storage load and file import.

## Where new code goes
- New block type: one folder in src/blocks/ + one line in block-registry.ts.
- New feature: one folder in src/features/ + one line in src/app/bootstrap.ts.
- New property type: one folder in src/features/database/properties/ + one
  line in property-registry.ts.
- New shortcut: src/ui/shortcuts/shortcut-registry.ts.
- New interface text: src/ui/copy.ts.
- New visual value: a token in tokens/, then npm run tokens.

## Limits
- Max 250 lines per file, 40 lines per function, 3 parameters per function.
- No files or folders named utils, helpers, common, shared, misc or lib.
- Named exports only.
- CSS uses semantic token custom properties only. No raw colors, sizes,
  durations or font names.
- English only: code, comments, names, commits, docs, interface text.

## Naming
- Files: kebab-case + role suffix (.view, .commands, .selectors,
  .definition, .schema, .test). Full table: docs/specification.md section 6.
- Commands: domain.action (block.move). Selectors: selectX. Views: renderX.

## Workflow
- Research current docs before using any library or web API. Use the
  modern-web-guidance skill before writing HTML or CSS for a component.
- One small vertical slice at a time; show the running result after each.
- Never run a command that hides output or blocks for more than 10 seconds;
  run it in the background and continue.
- Coding comes first. Do not keep running tests or processes while
  coding. At most one check of a few seconds (npx tsc --noEmit) to see
  that it compiles and nothing broke. Run npm run verify once, at the end,
  before committing. Nothing may take long.
- Every implementation gets a photo, whatever it is: after each change,
  capture it in the running app (npm run capture, seconds) and look at
  the image before moving on. That is the quick check; the test suite
  waits for the end.
- Budgets: full tests under 10 s, npm run verify under 30 s.
- Commit after each task with Conventional Commits; scope = folder name.
- If a rule blocks the task, stop and ask. Do not work around it.

## Visual checks
- Every photo, of Pagecraft and of Notion, comes from scripts/capture.ts
  and nothing else. It starts what is needed (the review server, or the
  signed-in Notion window), photographs headless at 1440x900 and 2x
  (2880x1800 PNG) and prints each file:
    npm run capture -- pagecraft [steps.json]
    npm run capture -- notion <notion url | steps.json>
  Steps (click, type, press, hover, expect, clip, read) are described in
  scripts/capture.schema.ts. Give every action an "expect" so a missed
  action fails with a <step>-failed.png instead of a wrong photo.
- Open every PNG with Read and look at it before going on: check that
  the photo shows what the step meant (the menu open, the state reached).
- Never use as a photo the built-in browser pane, the Claude in Chrome
  extension (screenshot or zoom), or any window that is not 1440x900.
- The Notion window (plain Chrome, port 9333, profile
  .captures/profiles/notion) stays open; never close it. If the script
  says Notion asks for a sign-in, ask the owner to sign in there.
- Install what a check needs (npm devDependencies) instead of working
  around it.
- Check every control in each of its states: at rest, pointed at,
  pressed, open, focused, in Notion and in Pagecraft; record the numbers
  in docs/notion-study.md, the one file for Notion findings.
- Capture each changed surface whole, then each region and every open
  menu state, and inspect them before calling UI work done.
- Every check takes seconds. Stop the review server and any other
  process you started as soon as you are done with it.
- Subagents only read and search; they never run code, servers or
  browsers, and no server or browser runs beside them (it froze the
  machine on 2026-11-12). One process at a time.
- No automated interface detectors (abandoned 2026-11-12): use the app
  as a person would, photograph it, and match Notion's numbers.

## Memory
- Do not use Claude Code's memory folder in the user's home. Everything
  learned about this project is written in this repository (this file,
  docs/notion-study.md, docs/tasks.md, docs/decisions/) and read back
  from disk.
- Auto memory is switched off in .claude/settings.json
  (autoMemoryEnabled and autoDreamEnabled false). Keep it off.

## Read on demand
- Data flow and layers: docs/architecture.md
- Decisions and their reasons: docs/decisions/
