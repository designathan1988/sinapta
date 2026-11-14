// What a version changed, as Notion's version history marks it: blocks
// new in that version, and in a block's text the words written then,
// against the version before it.
import { isTextBlock, textOf } from "../../blocks/index.ts";
import { diffText, type Block, type BlockId } from "../../model/index.ts";
import {
  selectPlanLimits,
  type AppState,
  type PageVersion,
} from "../../state/index.ts";

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

// Who wrote a version, as Notion's history names it: the one who last
// changed a block of it (ADR-0013); nothing for versions before servers.
export function selectVersionAuthor(version: PageVersion): string | undefined {
  const edited = version.blocks
    .filter((block) => block.editedBy !== undefined)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return edited[0]?.editedBy?.name;
}

const DAY_MS = 86_400_000;

// The versions the workspace's plan shows, as Notion's: on Free the last
// 7 days, on Plus 30, on Business 90, on Enterprise all; and how many
// older ones it keeps out of view.
export function selectShownVersions(
  state: AppState,
  versions: readonly PageVersion[],
  now: number,
): { readonly shown: readonly PageVersion[]; readonly hidden: number } {
  const days = selectPlanLimits(state)?.historyDays ?? null;
  if (days === null) return { shown: versions, hidden: 0 };
  const since = now - days * DAY_MS;
  const shown = versions.filter(
    (version) => Date.parse(version.takenAt) >= since,
  );
  return { shown, hidden: versions.length - shown.length };
}
