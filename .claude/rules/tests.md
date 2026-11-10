---
paths:
  - "src/**/*.test.ts"
---

# Test rules

- Tests sit next to the file they test: `sidebar.commands.ts` and
  `sidebar.test.ts` in the same folder. No `__tests__` folders.
- `describe` names the unit; `it` states the behavior in present tense:
  `it("moves a block to a new parent")`.
- `model` and `state` tests are pure: command in, state out. They run in
  the default Node environment and import no DOM.
- View tests opt into the DOM environment per file and cover only
  event-to-command translation: fire an event, assert the dispatched
  command.
- No sleeps, no polling, no real timers. Use fake timers for debounce.
- No snapshot tests of markup. Assert on commands and state.
- Budgets: one test file under 1 second, the full suite under 10 seconds.
  A slower test is a defect.
- Build state with the test builders in the folder under test, never by
  hand-writing large object literals.
- Every bug fix starts with a failing test in the layer where the bug
  lives.
