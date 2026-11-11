// Rules that refuse a change before it applies, such as a lock that keeps
// a page as it is. A guard reads the workspace as it was and the
// operations a command would apply; true refuses them all.
import type { Operation, Workspace } from "../model/index.ts";

export type Guard = (
  workspace: Workspace,
  operations: readonly Operation[],
) => boolean;

export function isGuarded(
  guards: readonly Guard[],
  workspace: Workspace,
  operations: readonly Operation[],
): boolean {
  if (operations.length === 0) return false;
  return guards.some((guard) => guard(workspace, operations));
}
