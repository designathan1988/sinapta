// What follows an answer about the open workspace: the list of
// workspaces again after a new name or icon; after deleting or leaving
// it, another of the person's workspaces, or a new empty one when none is
// left.
import type { SyncRequest } from "../state/index.ts";

export interface AfterSteps {
  // Asks for the list again; true when the person has any workspace.
  readonly relist: () => Promise<boolean>;
  // Closes the open workspace and joins the one opened last.
  readonly rejoin: () => Promise<void>;
  // Closes the open workspace and makes a new empty one.
  readonly startEmpty: () => Promise<void>;
}

export async function afterAnswer(
  kind: SyncRequest["kind"],
  steps: AfterSteps,
): Promise<void> {
  if (kind === "rename" || kind === "workspace-icon") {
    await steps.relist();
    return;
  }
  if (kind !== "delete-workspace" && kind !== "leave-workspace") return;
  if (await steps.relist()) await steps.rejoin();
  else await steps.startEmpty();
}
