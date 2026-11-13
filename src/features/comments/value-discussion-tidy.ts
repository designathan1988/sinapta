// A property taken out of a database takes the discussions about its
// values with it: each row of that database loses them, in the same
// transaction as the change to the database.
import type { DatabaseBlock } from "../../blocks/database/index.ts";
import { DATABASE_TYPE, isPageLike } from "../../blocks/page/index.ts";
import {
  isBlockOfType,
  type BlockId,
  type Operation,
  type Workspace,
} from "../../model/index.ts";
import type { Tidier } from "../../state/index.ts";

function databaseIn(
  workspace: Workspace,
  id: BlockId,
): DatabaseBlock | undefined {
  const block = workspace.blocks[id];
  if (block === undefined) return undefined;
  return isBlockOfType<DatabaseBlock>(block, DATABASE_TYPE) ? block : undefined;
}

// The ids of the properties a database lost in the change.
function removedProperties(
  workspace: Workspace,
  before: Workspace,
  id: BlockId,
): ReadonlySet<string> {
  const now = databaseIn(workspace, id);
  const then = databaseIn(before, id);
  if (now === undefined || then === undefined) return new Set();
  const kept = new Set(now.props.properties.map((item) => item.id));
  return new Set(
    then.props.properties
      .map((item) => item.id)
      .filter((propertyId) => !kept.has(propertyId)),
  );
}

// The row's discussions without those about the removed properties.
function tidyRow(
  workspace: Workspace,
  rowId: BlockId,
  removed: ReadonlySet<string>,
): Operation[] {
  const row = workspace.blocks[rowId];
  if (row === undefined || !isPageLike(row)) return [];
  const discussions = row.props.discussions ?? [];
  const kept = discussions.filter(
    (item) => item.propertyId === undefined || !removed.has(item.propertyId),
  );
  if (kept.length === discussions.length) return [];
  const props = { ...row.props, discussions: kept };
  return [
    { type: "record.update", kind: "block", id: row.id, patch: { props } },
  ];
}

export const valueDiscussionTidier: Tidier = (workspace, changed, before) =>
  [...changed].flatMap((id) => {
    const removed = removedProperties(workspace, before, id);
    if (removed.size === 0) return [];
    const database = databaseIn(workspace, id);
    return (database?.childIds ?? []).flatMap((rowId) =>
      tidyRow(workspace, rowId, removed),
    );
  });
