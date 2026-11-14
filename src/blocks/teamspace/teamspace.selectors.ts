import { isBlockOfType } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { TEAMSPACE_TYPE, type TeamspaceBlock } from "./teamspace.schema.ts";

// The workspace's teamspaces, in their order at its top.
export function selectTeamspaces(state: AppState): TeamspaceBlock[] {
  return state.workspace.rootIds.flatMap((id) => {
    const block = state.workspace.blocks[id];
    return block !== undefined &&
      isBlockOfType<TeamspaceBlock>(block, TEAMSPACE_TYPE)
      ? [block]
      : [];
  });
}
