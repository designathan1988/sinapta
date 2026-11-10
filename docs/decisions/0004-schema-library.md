# ADR-0004: Schema library

**Status:** Accepted
**Date:** 2026-11-10 (approved by the owner at the plan review)
**Deciders:** Project owner

## Context

JSON is parsed once, at storage load and file import, into typed values or
a typed error (specification 2.5). Research: `docs/research/valibot.md`.

## Decision

Valibot 1.5.0, imported only in `src/model/*.schema.ts`. The default
stands.

- Block props are one `v.variant("type", [...])`. Inference and narrowing
  were verified over 15 block shapes, so the switch condition is not met.
- Schemas are the single definition of each record shape. Domain types are
  inferred with `v.InferOutput`, never written a second time by hand.
- Ids are branded in the schema with `v.brand("BlockId")`. The specification
  shows `string & { readonly __brand: "BlockId" }`; the inferred Valibot
  brand is a different, equivalent type. The inferred type is used and the
  specification snippet was updated.
- `safeParse` only. Issues are mapped to one typed error,
  `{ kind: "invalid-record", recordId, path, expected, received }`.
- Strict on the fields the app uses; unknown keys on a record are dropped,
  not rejected, so a file written by a newer minor format still loads.
- Two specification rules pull against each other: Valibot is "used only in
  `src/model/`", and a new block type must touch "exactly one new folder and
  one registry line". A block type's props need a schema, so one rule has
  to give. Approved resolution: each block type's props schema
  lives in that block's folder as `<type>.schema.ts` (and each property
  type's value schema in its folder), collected by the registry.
  `src/model/` owns the envelope schema and takes the props schemas as a
  parameter, because `model` imports nothing from the project. Lint allows
  the `valibot` import only in `src/model/` and in `*.schema.ts` files.
  The alternative keeps every schema in `src/model/` and makes a new block
  type a two-folder change.

## Options considered

| Option | Bundle | Discriminated unions | Brands |
| --- | --- | --- | --- |
| A. Valibot 1.5 | Small, tree-shaken | `variant`, verified | `brand` |
| B. Zod | Larger | Good | `brand` |
| C. Hand-written parsers | None | Manual | Manual |

## Consequences

- Easier: adding a block type adds its schema in its own folder.
- Harder: the envelope schema is assembled at startup instead of being a
  static constant.
- Revisit: only if inference time in the type checker becomes a budget
  problem.

## Action items

1. [ ] Update the id type snippet in specification section 4 on approval.
