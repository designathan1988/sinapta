// Rules that keep the workspace tidy after any change, whichever command
// made it: a block type may register one, such as columns, which remove a
// column left empty. Their operations join the command's transaction, so
// one undo takes back both.
import {
  applyOperations,
  type ApplyResult,
  type BlockId,
  type Operation,
  type Workspace,
} from "../model/index.ts";

// Reads the workspace after a command, the blocks the command changed,
// and the workspace before it, for blocks the command removed.
export type Tidier = (
  workspace: Workspace,
  changed: ReadonlySet<BlockId>,
  before: Workspace,
) => Operation[];

export type TidyResult =
  | (Extract<ApplyResult, { ok: true }> & {
      // The command's operations, then the tidiers'.
      readonly applied: readonly Operation[];
    })
  | Extract<ApplyResult, { ok: false }>;

// Applies the operations, then whatever the tidiers make of the result.
export function applyTidily(
  workspace: Workspace,
  operations: readonly Operation[],
  tidiers: readonly Tidier[],
): TidyResult {
  const first = applyOperations(workspace, operations);
  if (!first.ok) return first;
  const tidying = tidiers.flatMap((tidy) =>
    tidy(first.workspace, first.changed.blockIds, workspace),
  );
  if (tidying.length === 0) return { ...first, applied: operations };
  const second = applyOperations(first.workspace, tidying);
  if (!second.ok) return second;
  const { changed } = first;
  return {
    ok: true,
    workspace: second.workspace,
    inverse: [...second.inverse, ...first.inverse],
    changed: {
      blockIds: new Set([...changed.blockIds, ...second.changed.blockIds]),
      viewIds: new Set([...changed.viewIds, ...second.changed.viewIds]),
      hasMetaChange: changed.hasMetaChange || second.changed.hasMetaChange,
    },
    applied: [...operations, ...tidying],
  };
}
