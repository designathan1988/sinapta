# Notion's block data model

## Findings

- Every block has a UUID v4 id, a type, a properties structure, an ordered
  `content` array of child ids ("downward pointers", the render order) and a
  `parent` id.
- The type controls rendering only. Changing a block's type leaves its
  properties and content in place, which is why "convert block" is cheap.
- User actions become operations; each creates or updates one record.
  Related operations are grouped into a transaction that is committed or
  rejected as a group.
- Notion walks `parent` pointers upward for permissions and `content`
  pointers downward for rendering. The two mirror each other.

## Pitfalls

- Two pointers for one relation is connascence of values: `parentId` and the
  parent's `childIds` must change together. Pagecraft keeps both (breadcrumbs
  and trash checks walk upward, rendering walks downward), so one module,
  `src/model/workspace-invariants.ts`, checks the agreement on every
  transaction and a transaction that breaks it changes nothing.
- Converting a block type must define what happens to props the new type
  does not have. Pagecraft keeps `text` across text block types and drops
  the rest through the block definition's `convertProps`.

## Decision it supports

The record shape in specification section 4 stands as written. `childIds`
is the only source of order; `parentId` is kept for upward walks and is
validated against `childIds` inside the transaction.

## Sources

- https://www.notion.com/blog/data-model-behind-notion
