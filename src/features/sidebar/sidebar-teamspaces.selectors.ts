// The sidebar's Teamspaces section: each teamspace, open or closed, and
// the pages inside an open one.
import { selectTeamspaces } from "../../blocks/teamspace/index.ts";
import { firstGrapheme, type BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { selectPageRows, type TreeRow } from "./sidebar.selectors.ts";

export interface TeamspaceRow {
  readonly id: BlockId;
  readonly name: string;
  // The teamspace's emoji, or the first letter of its name.
  readonly mark: string;
  readonly isExpanded: boolean;
  readonly rows: readonly TreeRow[];
}

export function selectTeamspaceRows(state: AppState): TeamspaceRow[] {
  return selectTeamspaces(state).map((teamspace) => {
    const { name, icon } = teamspace.props;
    const isExpanded = state.ui.expandedPageIds.includes(teamspace.id);
    return {
      id: teamspace.id,
      name,
      mark: icon ?? firstGrapheme(name).toUpperCase(),
      isExpanded,
      rows: isExpanded ? selectPageRows(state, teamspace.childIds, 2) : [],
    };
  });
}
