# ADR-0002: Store

**Status:** Accepted
**Date:** 2026-11-10 (approved by the owner at the plan review)
**Deciders:** Project owner

## Context

One store, one write path, atomic transactions with inverses for undo
(specification 2.1, 2.2). Research: `docs/research/zustand.md`.

## Decision

`createStore` from `zustand/vanilla`, version 5.1.0. Exactly one instance,
created in `src/state/store.ts`. The default stands.

- A transaction is one `setState(next, true)` call with the complete next
  `AppState`. Subscribers see `(state, previousState)` once per command.
- `store.ts` exports `getState` and `subscribe` to the project and exports
  `setState` only to `dispatch.ts`. Lint bans `setState` everywhere else.
- Zustand has no re-entrancy guard, so `dispatch.ts` owns one: a dispatch
  that starts while subscribers are being notified throws a programmer
  error. This enforces "subscribers never dispatch during notification".
- A throwing listener would skip later listeners, so the two subscribers
  (root render, repository) catch their own errors and report them through
  the save status or the console.
- No middleware. `subscribeWithSelector` is not needed: the repository
  computes changed ids from the transaction, not by diffing state.

## Options considered

| Option | Complexity | Atomic transactions | Cost |
| --- | --- | --- | --- |
| A. `zustand/vanilla` | Low | Yes, one `setState` | 1 small dependency |
| B. Own store, about 100 lines | Low | Yes | Code to own and test |
| C. Redux Toolkit | Medium | Yes | Larger API, reducers duplicate the command model |

## Trade-off analysis

The switch condition ("its API cannot express atomic transactions
cleanly") is not met. B would work equally well but adds code for no
gain. The store is a thin holder either way; the real logic is in
`dispatch.ts`, `history.ts` and `src/model/`, which do not depend on which
store is used.

## Consequences

- Easier: swapping the store later touches `store.ts` only.
- Harder: nothing notable.
- Revisit: only if a future zustand major changes `setState` semantics.

## Action items

1. [ ] Lint rule: `setState` may be imported only by `src/state/dispatch.ts`.
2. [ ] Test: a dispatch during notification throws.
