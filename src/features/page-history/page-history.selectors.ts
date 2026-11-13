// What a version changed, as Notion's version history marks it: blocks
// new in that version, and in a block's text the words written then,
// against the version before it.
import { isTextBlock, textOf } from "../../blocks/index.ts";
import { diffText, type Block, type BlockId } from "../../model/index.ts";
import type { PageVersion } from "../../state/index.ts";

export type BlockChange =
  | { readonly kind: "new" }
  | { readonly kind: "text"; readonly start: number; readonly end: number };

function textChange(before: Block, after: Block): BlockChange | undefined {
  if (!isTextBlock(before) || !isTextBlock(after)) return undefined;
  const edit = diffText(textOf(before), textOf(after));
  if (edit === undefined || edit.text === "") return undefined;
  return {
    kind: "text",
    start: edit.start,
    end: edit.start + edit.text.length,
  };
}

// The changes of the version at `index` (newest first) against the one
// taken before it; the oldest version marks nothing.
export function selectVersionChanges(
  versions: readonly PageVersion[],
  index: number,
): ReadonlyMap<BlockId, BlockChange> {
  const chosen = versions[index];
  const older = versions[index + 1];
  const changes = new Map<BlockId, BlockChange>();
  if (chosen === undefined || older === undefined) return changes;
  const before = new Map(older.blocks.map((block) => [block.id, block]));
  for (const block of chosen.blocks.slice(1)) {
    const old = before.get(block.id);
    const change =
      old === undefined ? { kind: "new" as const } : textChange(old, block);
    if (change !== undefined) changes.set(block.id, change);
  }
  return changes;
}
