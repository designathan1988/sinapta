import type { BlockDefinition } from "../block-definition.ts";
import {
  archiveTeamspace,
  createTeamspace,
  setTeamspaceAccess,
  setTeamspaceSecurity,
  toggleTeamspaceMember,
} from "./teamspace.commands.ts";
import { TEAMSPACE_TYPE, teamspacePropsSchema } from "./teamspace.schema.ts";

// Not offered in menus: a teamspace is made from Settings › Teamspaces.
export const teamspaceDefinition: BlockDefinition = {
  type: TEAMSPACE_TYPE,
  propsSchema: teamspacePropsSchema,
  continuesAs: "paragraph",
  createProps: () => ({ name: "", icon: null, description: "" }),
  commands: [
    createTeamspace,
    setTeamspaceAccess,
    toggleTeamspaceMember,
    archiveTeamspace,
    setTeamspaceSecurity,
  ],
};
