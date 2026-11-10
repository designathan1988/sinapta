# idb

## Version checked

`idb@8.0.4` (2026-11-10), no dependencies. Types from `build/entry.d.ts`. Snippet
below type-checked and run in Node 22 against `fake-indexeddb@6.2.8`.

## API we will use

```ts
import { openDB, type DBSchema, type IDBPDatabase } from "idb";

interface PagecraftDB extends DBSchema {
  blocks: { key: string; value: StoredBlock };
  views: { key: string; value: StoredView };
  meta: { key: string; value: unknown };   // schemaVersion, rootIds, settings, ui
}

const db = await openDB<PagecraftDB>("pagecraft", 1, {
  upgrade(db, oldVersion, newVersion, transaction, event) {
    if (oldVersion < 1) {
      db.createObjectStore("blocks", { keyPath: "id" });
      db.createObjectStore("views", { keyPath: "id" });
      db.createObjectStore("meta");          // out-of-line keys: put(value, key)
    }
  },
  blocked(currentVersion, blockedVersion, event) {},  // an older tab holds the DB
  blocking(currentVersion, blockedVersion, event) { db.close(); }, // we are the old tab
  terminated() {},                                    // abnormal close by the browser
});

// one store transaction = one atomic IndexedDB transaction across stores
const tx = db.transaction(["blocks", "views", "meta"], "readwrite", { durability: "relaxed" });
await Promise.all([
  ...changed.map((b) => tx.objectStore("blocks").put(b)),
  ...deletedIds.map((id) => tx.objectStore("blocks").delete(id)),
  tx.objectStore("meta").put(rootIds, "rootIds"),
  tx.done,
]);
const blocks = await db.getAll("blocks");   // shortcuts: get, getAll, getAllKeys, put, delete, clear, count
```

- `db.transaction(storeNames, mode?, options?: IDBTransactionOptions)`; `options`
  is passed to the platform (`durability: "default" | "relaxed" | "strict"`).
- `tx.done` resolves on commit, rejects on abort/error. `tx.store` exists only for
  single-store transactions; otherwise `tx.objectStore(name)`.
- Store names, keys and values are checked against `DBSchema` (wrong name is a type error).

## Pitfalls

- A transaction auto-commits when no request is pending at the end of a task: never
  `await` anything that is not an IndexedDB request (no `fetch`, no timers, no
  schema parsing) between opening `tx` and `tx.done`. Prepare all data first.
- On abort every pending request promise rejects, not only `tx.done`. An un-awaited
  `put()` becomes an unhandled rejection (seen in the test run). Always collect
  request promises with `tx.done` in one `Promise.all`.
- `db.put(store, value)` shortcuts each open their own transaction; a workspace
  transaction that touches several records must use one explicit `tx`.
- IndexedDB version (the `openDB` number, object-store layout) is separate from the
  workspace `schemaVersion` in `meta` (record format, handled by migrations).
- `durability: "relaxed"` is faster, but a write can be lost
  on power failure. `"strict"` costs latency on each debounced save. Chosen value
  belongs in the ADR; `fake-indexeddb` ignores the option.
- Values are structured-cloned: store plain JSON records only.
- Without a `blocking` handler that closes the connection, a future version upgrade
  in another tab hangs in `blocked`. Show the state in the save status.
- `getAll` on 5,000+ blocks returns one array; acceptable for load, do not use on save.
- Safari may evict storage; `navigator.storage.persist()` is outside idb.

## Testing in Node

Node has no IndexedDB. `fake-indexeddb@6.2.8` (dev only, zero dependencies,
~700 kB, `import "fake-indexeddb/auto"`) works with idb as shown. Recommended
shape with no extra dependency: `workspace-repository.ts` depends on a small
`StorageAdapter` interface (`loadAll()`, `commit({ put, delete, meta })`), with
`indexeddb-adapter.ts` (the only file importing `idb`) and an in-memory adapter
(two `Map`s) used by repository tests (debounce with fake timers, changed-record
selection, load validation). The thin IndexedDB adapter is then verified in the
running app, or by one optional `fake-indexeddb` test if a dev dependency is approved.

## Decision it supports

Storage layout ADR: default stands (IndexedDB, one record per key, stores
`blocks`, `views`, `meta`, one multi-store transaction per store commit).

## Sources

- https://github.com/jakearchibald/idb#readme
- `node_modules/idb/build/entry.d.ts`, `node_modules/fake-indexeddb/package.json`
