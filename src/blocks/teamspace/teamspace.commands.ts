// Making a teamspace, as Notion's "Create teamspace": at the workspace's
// top, open in the sidebar; opening or closing it, and its members.
import {
  isBlockOfType,
  type BlockId,
  type Operation,
} from "../../model/index.ts";
import {
  defineCommand,
  type AppState,
  type CommandEffect,
} from "../../state/index.ts";
import {
  TEAMSPACE_TYPE,
  type TeamspaceAccess,
  type TeamspaceBlock,
  type TeamspaceProps,
  type TeamspaceSecurity,
} from "./teamspace.schema.ts";

export const createTeamspace = defineCommand<{
  name: string;
  description: string;
}>({
  type: "teamspace.create",
  newBlockIds: 1,
  handle(state, command) {
    const id = command.meta.blockIds[0];
    const name = command.name.trim();
    if (id === undefined || name === "") return {};
    const { now } = command.meta;
    const props = {
      name,
      icon: null,
      description: command.description.trim(),
    };
    const record = {
      id,
      type: TEAMSPACE_TYPE,
      parentId: null,
      childIds: [],
      props,
      createdAt: now,
      updatedAt: now,
    };
    const operations: Operation[] = [
      { type: "record.create", kind: "block", record },
      {
        type: "list.insert",
        list: { kind: "rootIds" },
        id,
        index: state.workspace.rootIds.length,
      },
    ];
    const expandedPageIds = [...state.ui.expandedPageIds, id];
    return { operations, ui: { ...state.ui, expandedPageIds } };
  },
});

function teamspaceUpdate(
  state: AppState,
  teamspaceId: BlockId,
  change: (props: TeamspaceProps) => Partial<TeamspaceProps>,
): CommandEffect {
  const block = state.workspace.blocks[teamspaceId];
  if (
    block === undefined ||
    !isBlockOfType<TeamspaceBlock>(block, TEAMSPACE_TYPE)
  ) {
    return {};
  }
  const props = { ...block.props, ...change(block.props) };
  return {
    operations: [
      {
        type: "record.update",
        kind: "block",
        id: teamspaceId,
        patch: { props },
      },
    ],
  };
}

// Opens a teamspace to the workspace, or closes it to its members.
export const setTeamspaceAccess = defineCommand<{
  teamspaceId: BlockId;
  access: TeamspaceAccess;
}>({
  type: "teamspace.setAccess",
  handle: (state, { teamspaceId, access }) =>
    teamspaceUpdate(state, teamspaceId, () => ({ access })),
});

// Adds a person to a teamspace's members, or takes them out.
export const toggleTeamspaceMember = defineCommand<{
  teamspaceId: BlockId;
  userId: string;
}>({
  type: "teamspace.toggleMember",
  handle: (state, { teamspaceId, userId }) =>
    teamspaceUpdate(state, teamspaceId, ({ memberIds = [] }) => ({
      memberIds: memberIds.includes(userId)
        ? memberIds.filter((id) => id !== userId)
        : [...memberIds, userId],
    })),
});

// Archives a teamspace, or brings it back.
export const archiveTeamspace = defineCommand<{
  teamspaceId: BlockId;
  isArchived: boolean;
}>({
  type: "teamspace.archive",
  handle: (state, { teamspaceId, isArchived }) =>
    teamspaceUpdate(state, teamspaceId, () => ({ isArchived })),
});

// Turns one of a teamspace's security overrides on or off.
export const setTeamspaceSecurity = defineCommand<{
  teamspaceId: BlockId;
  key: TeamspaceSecurity;
  isOn: boolean;
}>({
  type: "teamspace.setSecurity",
  handle: (state, { teamspaceId, key, isOn }) =>
    teamspaceUpdate(state, teamspaceId, ({ security = {} }) => ({
      security: { ...security, [key]: isOn },
    })),
});
