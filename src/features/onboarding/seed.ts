// Seeds: trees of blocks, written as a person would, that become pages
// with new ids: the first visit's pages and the built-in templates.
import type {
  Block,
  BlockId,
  BlockProps,
  RichText,
} from "../../model/index.ts";

export interface SeedBlock {
  readonly type: string;
  readonly props: BlockProps;
  readonly children?: readonly SeedBlock[];
}

export const rich = (text: string): RichText => (text === "" ? [] : [{ text }]);

// A text block of a type, with its text and any other props.
export const seedText = (
  type: string,
  text: string,
  extra: BlockProps = {},
): SeedBlock => ({
  type,
  props: { text: rich(text), ...extra },
});

export function countSeedBlocks(seed: SeedBlock): number {
  const children = seed.children ?? [];
  return children.reduce((sum, child) => sum + countSeedBlocks(child), 1);
}

export interface Placing {
  readonly ids: readonly BlockId[];
  readonly now: string;
  next: number;
}

// The records of a seed tree, each before its children, with ids taken in
// order.
export function placeSeed(
  seed: SeedBlock,
  parentId: BlockId | null,
  placing: Placing,
): Block[] {
  const id = placing.ids[placing.next];
  placing.next += 1;
  if (id === undefined) return [];
  const children = (seed.children ?? []).map((child) =>
    placeSeed(child, id, placing),
  );
  const record: Block = {
    id,
    type: seed.type,
    parentId,
    childIds: children.flatMap((list) => list[0]?.id ?? []),
    props: seed.props,
    createdAt: placing.now,
    updatedAt: placing.now,
  };
  return [record, ...children.flat()];
}
