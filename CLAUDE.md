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
- Every photo, of Pagecraft and of Notion alike, comes from one command
  and nothing else: npm run capture -- <steps.json> [outDir]
  (scripts/capture.ts). It photographs in headless Chrome, never a
  visible window, at 1440x900 (a laptop screen) and 2x, so each PNG is
  2880x1800. Open every PNG with Read and look at it.
- Never use as a photo: the built-in browser pane (shrinks to 800 px),
  the Claude in Chrome extension's screenshot (shrinks the window) or
  its zoom (1x at most, laid out at the owner's window width), or any
  window that is not 1440x900. They are for nothing in visual checks.
- steps.json: { "url": "...", "profile": "notion"?, "theme": "dark"?,
  "steps": [ { "name": "kebab-name", "eval"?, "click"?, "type"?,
  "press"?, "hover"?, "clip"?, "pad"?, "wait"?, "read"? } ] }. Selectors
  are Playwright's (CSS, or text=Label). click, type and press act;
  hover points with the real mouse; clip photographs a region around an
  element instead of the window; read prints a value (getComputedStyle,
  sizes) to measure. Steps run in order in one page.
- Pagecraft: no url and no profile; it opens the review server,
  http://localhost:5190. Photos go to .captures/.
- Notion: "profile": "notion" and a Notion url. The photo is taken in a
  fresh 1440x900 2x context that carries the sign-in of a plain Chrome
  window kept open on port 9333 (profile .captures/profiles/notion, the
  test account signed in). Photos go to .captures/notion/.
  If that window is closed, reopen it, never close it yourself:
  npm run capture:login -- notion https://www.notion.so/login
  (scripts/capture-login.ts starts plain Chrome, not an automated one,
  because Google refuses to sign in inside automated browsers). If it
  shows the login page, ask the owner to sign in there.
- Install what a check needs (npm devDependencies, Claude Code plugins
  such as superpowers-chrome) instead of working around it.
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
