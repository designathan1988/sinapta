// The rows of Settings › Teamspaces (n89, n94): the teamspaces this
// person has, and those the server lists that they are not in, kept by
// Notion's filters (status, owner, access, security) and the search.
import {
  selectTeamspaces,
  type TeamspaceBlock,
} from "../../blocks/teamspace/index.ts";
import type { AppState, ListedTeamspace } from "../../state/index.ts";

export interface TeamspaceTableRow {
  readonly id: string;
  readonly name: string;
  readonly owner: string;
  readonly access: string;
  readonly isArchived: boolean;
  readonly hasOverrides: boolean;
  // Present for a teamspace this person has; absent for one only listed.
  readonly teamspace?: TeamspaceBlock;
  readonly listed?: ListedTeamspace;
}

function rowOf(teamspace: TeamspaceBlock, listed?: ListedTeamspace) {
  const { security = {} } = teamspace.props;
  return {
    id: teamspace.id,
    name: teamspace.props.name,
    owner: teamspace.createdBy?.name ?? "",
    access: teamspace.props.access ?? "open",
    isArchived: teamspace.props.isArchived === true,
    hasOverrides: Object.values(security).some((value) => value === true),
    teamspace,
    ...(listed !== undefined && { listed }),
  };
}

export function selectAllTeamspaceRows(state: AppState): TeamspaceTableRow[] {
  const listed = state.persistence.sync.teamspaces;
  const local = selectTeamspaces(state);
  const ids = new Set<string>(local.map((teamspace) => teamspace.id));
  const known = local.map((teamspace) =>
    rowOf(
      teamspace,
      listed.find((each) => each.id === teamspace.id),
    ),
  );
  const others = listed
    .filter((each) => !ids.has(each.id))
    .map((each) => ({ ...each, listed: each }));
  return [...known, ...others];
}

// A filter's chosen value, as the overlay keeps it.
export function filterOf(state: AppState, name: string): string | undefined {
  return state.ui.overlay?.values?.[name]?.[0];
}

// Each filter left unset keeps every row.
const keeps = (chosen: string | undefined, value: string): boolean =>
  chosen === undefined || chosen === value;

function isKept(row: TeamspaceTableRow, state: AppState): boolean {
  const words = (state.ui.overlay?.query ?? "").trim().toLowerCase();
  const status = filterOf(state, "status") ?? "active";
  return (
    row.name.toLowerCase().includes(words) &&
    keeps(status, row.isArchived ? "archived" : "active") &&
    keeps(filterOf(state, "owner"), row.owner) &&
    keeps(filterOf(state, "access"), row.access) &&
    keeps(filterOf(state, "security"), row.hasOverrides ? "overrides" : "")
  );
}

export function selectTeamspaceTable(state: AppState): TeamspaceTableRow[] {
  return selectAllTeamspaceRows(state).filter((row) => isKept(row, state));
}

// The owners the Owner filter offers, each once.
export function selectTeamspaceOwners(state: AppState): string[] {
  const names = selectAllTeamspaceRows(state).map((row) => row.owner);
  return [...new Set(names.filter((name) => name !== ""))];
}
