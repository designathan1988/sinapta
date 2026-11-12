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
- Budgets: full tests under 10 s, npm run verify under 30 s.
- Commit after each task with Conventional Commits; scope = folder name.
- If a rule blocks the task, stop and ask. Do not work around it.

## Visual checks
- Judge the interface only from desktop captures at native pixels, never
  from the built-in browser pane (it is about 800 px wide and shrinks
  every frame).
- Tool: superpowers-chrome use_browser. First hide_browser (headless; never
  pop a window in the owner's face), then set_viewport
  {width: 1440, height: 900} (deviceScaleFactor 2 for close-ups), then
  navigate to the review server, http://localhost:5190.
- Each action writes NNN-action.png (1440x900) to the session folder it
  prints; open it with Read. Crop one element with screenshot
  {path, selector}.
- Capture each changed surface whole, then each region and every open
  menu state, and inspect them before calling UI work done.

## Read on demand
- Data flow and layers: docs/architecture.md
- Decisions and their reasons: docs/decisions/
