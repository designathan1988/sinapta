// Notion's teamspace (ADR-0013): a place at the workspace's top that holds
// pages for everyone in the workspace, with a name, an icon and a line
// that says what it is for.
import * as v from "valibot";
import type { TypedBlock } from "../../model/index.ts";

export const TEAMSPACE_TYPE = "teamspace";

export const TEAMSPACE_ACCESS = ["open", "closed"] as const;
export type TeamspaceAccess = (typeof TEAMSPACE_ACCESS)[number];

export const teamspacePropsSchema = v.object({
  name: v.string(),
  icon: v.nullable(v.string()),
  description: v.string(),
  // Open: everyone in the workspace sees it. Closed: its members alone,
  // and the person who made it.
  access: v.optional(v.picklist(TEAMSPACE_ACCESS)),
  memberIds: v.optional(v.array(v.string())),
});

export type TeamspaceProps = v.InferOutput<typeof teamspacePropsSchema>;
export type TeamspaceBlock = TypedBlock<typeof TEAMSPACE_TYPE, TeamspaceProps>;
