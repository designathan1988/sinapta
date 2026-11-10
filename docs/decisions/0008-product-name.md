# ADR-0008: Product name

**Status:** Accepted
**Date:** 2026-11-10 (approved by the owner at the plan review)
**Deciders:** Project owner

## Context

The specification names the product Pagecraft. The repository is named
`sinapta`.

## Decision

Pagecraft. The default stands unless the owner picks another name at the
plan review.

The name appears in exactly three owned places, so a rename is a three-line
change: `PRODUCT_NAME` in `src/ui/copy.ts` (window title, export file
name), `name` in `package.json`, and the IndexedDB database name constant
in `src/persistence/indexed-db-adapter.ts`. The database name is storage
identity: changing it after release would hide existing data, so it is
fixed at first release even if the display name changes later.

## Consequences

- Revisit: only at the owner's request.
