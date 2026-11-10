# Valibot

## Version checked

`valibot@1.5.0` (2026-11-10), no dependencies. Types from `dist/index.d.mts`; a
15-option block schema was type-checked (`strict`, `noUncheckedIndexedAccess`)
and run in Node 22.

## API we will use

```ts
import * as v from "valibot";

const BlockId = v.pipe(v.string(), v.uuid(), v.brand("BlockId"));
type BlockId = v.InferOutput<typeof BlockId>;          // string & v.Brand<"BlockId">
const Mark = v.picklist(["bold", "italic", "code"]);   // "bold" | "italic" | "code"
const TextSpan = v.object({
  text: v.string(), marks: v.optional(v.array(Mark)), href: v.optional(v.string()),
});
const base = { id: BlockId, parentId: v.nullable(BlockId), childIds: v.array(BlockId),
  createdAt: v.pipe(v.string(), v.isoTimestamp()), updatedAt: v.pipe(v.string(), v.isoTimestamp()) };
const block = <T extends string, P extends v.GenericSchema>(type: T, props: P) =>
  v.object({ ...base, type: v.literal(type), props });

const Block = v.variant("type", [
  block("to-do", v.object({ text: v.array(TextSpan), isChecked: v.boolean() })),
  block("heading", v.object({ text: v.array(TextSpan), level: v.picklist([1, 2, 3]) })),
  // ... one entry per block type, exported by each block folder
]);
type Block = v.InferOutput<typeof Block>;
type PropsOf<T extends Block["type"]> = Extract<Block, { type: T }>["props"];

const Blocks = v.record(BlockId, Block);               // Record<BlockId, Block>
const result = v.safeParse(Block, json);               // never throws
if (result.success) result.output; else result.issues; // [Issue, ...Issue[]]
```

- `v.variant(key, options, message?)`: options are object schemas (or nested
  variants) holding the discriminator; only the matching option is validated.
- `v.safeParse(schema, input, config?)` returns
  `{ typed, success, output, issues }`; `config.abortEarly` stops at first issue.
- Issue shape: `{ kind: "schema" | "validation" | "transformation", type, input,
  expected, received, message, requirement?, path?, issues? }`. `v.getDotPath(issue)`
  gives `"props.text.0.text"`; `v.flatten(issues)` gives `{ root?, nested? }`.
  Map these to our own typed error `{ recordId, path, code: issue.type, message }`
  inside `src/model/` so no Valibot type leaks out.

Verified by running: `switch (b.type)` narrows `b.props` for all 15 options;
unknown discriminator reports one issue at path `type` listing the expected
literals; wrong nested values report exact paths; `"2026-11-10T12:00:00Z"` passes
`isoTimestamp`; `tsc` stays fast.

## Pitfalls

- `v.brand` output is `string & v.Brand<"BlockId">` (symbol-keyed). It is **not
  assignable** to the spec's hand-written `string & { readonly __brand: "BlockId" }`
  (verified with `@ts-expect-error`). Derive `BlockId`, `Block`, `View` from the
  schemas with `InferOutput` instead of declaring them twice; `src/model/id.ts`
  mints ids with `v.parse(BlockId, crypto.randomUUID())`.
- `v.object` silently strips unknown keys; `v.strictObject` rejects them,
  `v.looseObject` keeps them. Pick per boundary (strip on import is lossy but safe).
- `v.record(BlockId, ...)` validates keys too; an invalid key fails the whole record.
  For "skip the bad record, report it" (spec 4, Persistence) parse record by
  record, not the whole map.
- `v.optional(x)` infers `key?: T | undefined`; fine unless
  `exactOptionalPropertyTypes` is turned on.
- `variant` options must be built from literal discriminators; assembling the list
  dynamically from the block registry loses inference unless the array is a
  `const` tuple. Keep one static tuple in `src/model/`.
- A cross-field rule (parent/child consistency) is not a schema concern; check it
  in a separate pure function after parsing.
- Import as `import * as v`; tree-shaking keeps the bundle to the used functions.

## Decision it supports

Schema library ADR: default stands. Inference for a 15-way discriminated
union of block props is adequate; the switch-to-Zod condition is not met. The
spec's manual brand types need to be replaced by schema-inferred ones.

## Sources

- https://valibot.dev/api/variant/
- https://valibot.dev/guides/issues/
- `node_modules/valibot/dist/index.d.mts`
