// Notion's teamspace (ADR-0013): a place at the workspace's top that holds
// pages for everyone in the workspace, with a name, an icon and a line
// that says what it is for.
import * as v from "valibot";
import type { TypedBlock } from "../../model/index.ts";

export const TEAMSPACE_TYPE = "teamspace";

export const TEAMSPACE_ACCESS = ["open", "closed", "private"] as const;
export type TeamspaceAccess = (typeof TEAMSPACE_ACCESS)[number];

export const teamspacePropsSchema = v.object({
  name: v.string(),
  icon: v.nullable(v.string()),
  description: v.string(),
  // As Notion's: open, everyone in the workspace is in it; closed, everyone
  // sees it and asks to join, its pages are its members'; private, its
  // members alone know of it. Its maker is always in it.
  access: v.optional(v.picklist(TEAMSPACE_ACCESS)),
  memberIds: v.optional(v.array(v.string())),
  // Archived: kept, but out of the sidebar and of Move to.
  isArchived: v.optional(v.boolean()),
  // Settings that override the workspace's for its pages: no publishing
  // them to the web, no guests invited to them.
  security: v.optional(
    v.object({
      noPublishing: v.optional(v.boolean()),
      noGuests: v.optional(v.boolean()),
    }),
  ),
});

export const TEAMSPACE_SECURITY = ["noPublishing", "noGuests"] as const;
export type TeamspaceSecurity = (typeof TEAMSPACE_SECURITY)[number];

export type TeamspaceProps = v.InferOutput<typeof teamspacePropsSchema>;
export type TeamspaceBlock = TypedBlock<typeof TEAMSPACE_TYPE, TeamspaceProps>;
