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

// Whether a person is in a teamspace: its maker, or one of its members;
// everyone is in an open one.
export function isInTeamspace(
  teamspace: TeamspaceBlock,
  userId: string,
): boolean {
  const { access = "open", memberIds = [] } = teamspace.props;
  return (
    access === "open" ||
    teamspace.createdBy?.id === userId ||
    memberIds.includes(userId)
  );
}

// The teamspaces the sidebar and Move to show: not archived, and, while
// signed in, those this person is in.
export function selectSidebarTeamspaces(state: AppState): TeamspaceBlock[] {
  const me = state.persistence.account.user?.id;
  return selectTeamspaces(state).filter(
    (teamspace) =>
      teamspace.props.isArchived !== true &&
      (me === undefined || isInTeamspace(teamspace, me)),
  );
}
