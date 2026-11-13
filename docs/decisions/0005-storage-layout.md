# ADR-0005: Storage layout

**Status:** Accepted
**Date:** 2026-11-10 (approved by the owner at the plan review)
**Deciders:** Project owner

## Context

Autosave must write only what a transaction changed, and reload must
restore the exact last state (specification 4). Research:
`docs/research/idb.md`, `docs/research/web-dark-mode-toggle.md`.

## Decision

IndexedDB through `idb` 8.0.4, one record per key. The default stands and
is not open to change in version 1.

- Database `pagecraft`, version 1. Object stores: `blocks` and `views`
  keyed by `id`, and `meta` with the keys `schemaVersion`, `rootIds`,
  `settings` and `ui`.
- One `readwrite` transaction across the three stores per save, so a save
  is all or nothing.
- `idb` is imported only by `src/persistence/indexed-db-adapter.ts`, behind
  the `StorageAdapter` contract. Tests use the in-memory adapter from
  `storage-adapter.ts`; no fake IndexedDB package is installed.
- The IndexedDB version number and `schemaVersion` are separate. The first
  changes only when object stores change; the second with every record
  format change.
- A stored `schemaVersion` newer than the app is a typed load error; the
  data is left untouched.

One conflict with the web guidance was decided at the plan review. The
dark mode toggle guide applies the stored theme in a blocking inline script
from `localStorage`, to avoid a flash of the wrong theme. The specification
forbids inline scripts and storage outside `src/persistence/`. Decision:
follow the specification. The document paints only the page background
until the workspace has loaded, so a user with a manual override may see
the system-themed background for a few milliseconds on reload, and never
sees content in the wrong theme.

## Options considered

| Option | Changed-record saves | Complexity |
| --- | --- | --- |
| A. IndexedDB, one record per key | Yes | Low |
| B. One JSON blob in IndexedDB | No, rewrites everything | Lowest |
| C. `localStorage` | No, and size-limited | Lowest |

## Consequences

- Easier: saves stay small at 5,000 rows.
- Harder: load reads and parses every record.
- Revisit: a later sync feature would add an operations store here.

## Action items

1. [x] Milestone 1: repository, adapter, in-memory adapter, migration
   runner with `0001` as the baseline.
