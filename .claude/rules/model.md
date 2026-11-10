---
paths:
  - "src/model/**/*.ts"
---

# Model rules

- `model` imports nothing from the project and never touches the DOM,
  storage, the clock or `crypto`. The one exception is `id.ts`, which wraps
  `crypto.randomUUID()` and is called only by the dispatcher.
- Every function is pure: same input, same output, no mutation of
  arguments. Return new records; never edit a record in place.
- Schemas (`*.schema.ts`, Valibot) are the only place workspace JSON is
  checked. They return a typed value or a typed error; they never throw and
  never repair data.
- Type casts are allowed only inside `*.schema.ts` and `id.ts`, to create
  branded ids from parsed strings.
- Ids are branded: `BlockId`, `ViewId`, `PropertyId`. Never accept a plain
  `string` where an id is meant.
- Operations are exactly `record.create`, `record.update`, `record.delete`,
  `list.insert`, `list.remove`. Each has an inverse computed from the state
  before it is applied. Do not add an operation type without an ADR.
- `apply-operation.ts` is the only module that produces new workspace data
  from operations.
- A parent's `childIds` and the child's `parentId` change in the same
  transaction. `workspace-invariants.ts` rejects anything else.
- Text lengths and offsets count grapheme clusters through `grapheme.ts`.
  Never use `string.length` or index a string for user text.
- Discriminated unions are switched exhaustively with a `never` check.
