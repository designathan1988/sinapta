# zustand (vanilla)

## Version checked

`zustand@5.1.0` (2026-11-10). Types from `zustand/vanilla.d.ts`, behaviour from
`zustand/esm/vanilla.mjs` (23 lines) and a snippet run in Node 22. The vanilla
entry imports nothing; React and immer are optional peers we do not install.

## API we will use

```ts
import { createStore, type StoreApi } from "zustand/vanilla";

interface StoreApi<T> {
  getState: () => T;
  getInitialState: () => T;
  setState: {
    (partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: false): void;
    (state: T | ((state: T) => T), replace: true): void;
  };
  subscribe: (listener: (state: T, prevState: T) => void) => () => void;
}

export const store = createStore<AppState>()(() => initialAppState);
```

- `createStore<T>()(initializer)` (curried form for explicit `T`) or
  `createStore(initializer)`. The initializer receives `(setState, getState, api)`;
  we ignore them and return plain data, no actions inside the store.
- `setState(partial)` shallow-merges top-level keys (`Object.assign({}, state, partial)`).
  `setState(next, true)` replaces. In v5 `replace: true` requires a complete `T`
  at the type level (verified: a partial with `true` is a type error).
- Listeners are called synchronously, once per `setState`, with `(state, prevState)`
  (verified). No call if `Object.is(next, state)`.

Atomic transaction in `dispatch.ts`:

```ts
const prev = store.getState();
const next = applyTransaction(prev, operations); // pure; throws or returns error => no write
store.setState(next, true);                      // one write, one notification
```

Subscribers diff slices themselves: `if (state.workspace !== prev.workspace) save(...)`.

## Pitfalls

- No batching and no transactions built in: atomicity comes only from computing the
  whole next state first and calling `setState` exactly once per command.
- No re-entrancy guard. A listener that calls `setState` runs nested notifications
  and later listeners of the outer call see a stale `prevState`. Spec rule
  "Subscribers never dispatch during notification" must be enforced in
  `dispatch.ts` (an `isNotifying` flag that throws).
- A throwing listener aborts the `listeners.forEach` loop: later subscribers are
  skipped and the error surfaces from `setState` after the state has already
  changed. Wrap the two subscribers (render, repository) or catch in dispatch.
- Shallow merge only covers top-level keys; never rely on it for nested slices.
  Using `replace: true` everywhere avoids ambiguity.
- State must be treated as immutable; equality is `Object.is` on the root only.
- Listener order is insertion order (a `Set`); subscribe render before repository
  if order matters.
- `getInitialState()` returns the initializer's result, not the loaded workspace.
  Hydration is a normal command (`workspace.load`), not a new store.
- `subscribeWithSelector` (`zustand/middleware`) adds
  `subscribe(selector, listener, { equalityFn, fireImmediately })`. Not needed: the
  spec has two root subscribers and both already get `prevState`. Skipping it also
  keeps the store type a plain `StoreApi<AppState>`.
- "Writes only in dispatch.ts" is a convention, not enforced by the library: export
  a read-only facade (`getState`, `subscribe`) from `store.ts` and keep `setState`
  reachable only by `dispatch.ts` (plus a lint `no-restricted-properties` rule).

## Decision it supports

Store ADR (0002): default stands. One `createStore` instance, state-only, with
`setState(next, true)` per command expresses atomic transactions cleanly; the
switch condition is not met. (The whole library surface we use is about 20 lines,
so the fallback of an own store stays trivial if ever needed.)

## Sources

- https://zustand.docs.pmnd.rs/reference/apis/create-store
- https://zustand.docs.pmnd.rs/reference/migrations/migrating-to-v5
- `node_modules/zustand/vanilla.d.ts`, `node_modules/zustand/esm/vanilla.mjs`
