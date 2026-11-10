// Finds what differs between two workspaces. Records are never edited in
// place, so comparing references is enough.
import type { ChangedRecords } from "./operation.ts";
import type { Workspace } from "./workspace.schema.ts";

function changedKeys<TId extends string>(
  previous: Readonly<Record<TId, unknown>>,
  next: Readonly<Record<TId, unknown>>,
): Set<TId> {
  const changed = new Set<TId>();
  if (previous === next) return changed;
  for (const id in next) {
    if (previous[id] !== next[id]) changed.add(id);
  }
  for (const id in previous) {
    if (!(id in next)) changed.add(id);
  }
  return changed;
}

export function diffWorkspace(
  previous: Workspace,
  next: Workspace,
): ChangedRecords {
  return {
    blockIds: changedKeys(previous.blocks, next.blocks),
    viewIds: changedKeys(previous.views, next.views),
    hasMetaChange:
      previous.rootIds !== next.rootIds || previous.settings !== next.settings,
  };
}
