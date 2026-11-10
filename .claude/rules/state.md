---
paths:
  - "src/state/**/*.ts"
---

# State rules

- `store.ts` creates the one store. `dispatch.ts` is the only file that
  calls `setState`. No other write path exists.
- A command is a plain serializable object with `type: "domain.action"`.
  No functions, class instances, DOM nodes or `undefined` values inside.
- A command handler is `(state, command) => Operation[]`: pure, no ids, no
  timestamps, no DOM. The dispatcher creates ids and the timestamp and puts
  them on the command before the handler runs.
- Handlers for a feature live in that feature's `*.commands.ts` and are
  registered once in `src/app/bootstrap.ts` through `command-registry.ts`.
  `state` never imports a feature.
- One command produces one transaction, applied with one `setState` call. A
  transaction that fails validation changes nothing and returns a typed
  error.
- Workspace transactions push their inverse on the undo stack and clear the
  redo stack. Commands that touch only `ui` or `settings` are not recorded.
- Undo restores the `ui` selection that was current before the transaction.
- Subscribers never dispatch during notification.
- Selectors are named `selectX`, take state (plus arguments) and return
  derived values. A derived value is never written to the store.
- No DOM, no storage, no timers in this folder.
