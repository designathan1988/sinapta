// A teamspace's security overrides, as Notion's (n94-teamspace-filters):
// its pages are not published to the web, or no guest is invited to them.
import { parseBlockId, type Block } from "../src/model/index.ts";
import type { ApiContext } from "./api.ts";
import type { PageRef } from "./sharing.ts";
import { currentWorkspace } from "./workspace-state.ts";

export type Override = "noPublishing" | "noGuests";

// The teamspace the page lives in, when it lives in one.
function teamspaceOf(context: ApiContext, page: PageRef): Block | undefined {
  const workspace = currentWorkspace(context, page.workspaceId);
  let id = parseBlockId(page.pageId);
  let top: Block | undefined;
  while (id !== undefined && workspace !== undefined) {
    top = workspace.blocks[id];
    id = top?.parentId ?? undefined;
  }
  return top?.type === "teamspace" ? top : undefined;
}

export function isOverridden(
  context: ApiContext,
  page: PageRef,
  override: Override,
): boolean {
  const security = teamspaceOf(context, page)?.props.security;
  if (typeof security !== "object" || security === null) return false;
  return Object.entries(security).some(
    ([key, value]) => key === override && value === true,
  );
}

// Whether the address belongs to someone already in the workspace, who
// would not be a guest.
export function isInWorkspace(
  context: ApiContext,
  workspaceId: string,
  email: string,
): boolean {
  const found = context.db
    .prepare(
      "SELECT 1 AS one FROM members m JOIN users u ON u.id = m.user_id WHERE m.workspace_id = ? AND u.email = ? AND m.role != 'guest'",
    )
    .get(workspaceId, email);
  return found !== undefined;
}
