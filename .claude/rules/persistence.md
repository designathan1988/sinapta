---
paths:
  - "src/persistence/**/*.ts"
---

# Persistence rules

- `persistence` imports `state` and `model` only.
- `workspace-repository.ts` is the only module that reads or writes
  storage. `indexed-db-adapter.ts` is the only file that imports `idb`.
- The repository subscribes to the store and saves only the records the
  transaction changed, debounced by `SAVE_DEBOUNCE_MS` (300).
- The repository never dispatches from inside a store notification. Save
  status changes are dispatched after the write settles.
- Loading runs every record through its schema in `src/model/`. A record
  that fails is reported in the save status and skipped, never repaired.
- Storage, export and import share one shape, the workspace file in
  specification section 4.
- The exported file is a public contract. Key names and value formats
  change only with a `schemaVersion` bump and one new migration file,
  `migrations/000N-<what-changed>.ts`, a pure function from version n to
  n + 1. Never edit a migration that has shipped.
- A changed meaning needs a new key. Never repurpose an existing key.
- Import runs the same migrations as load, then the same schemas.
- A file with a `schemaVersion` newer than the app is rejected with a typed
  error, not partially read.
- Boundary functions return typed errors; they do not throw.
