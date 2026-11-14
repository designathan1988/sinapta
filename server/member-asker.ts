// The signed-in member of the workspace a path names, not a guest, for
// the routes only members use (Settings › Teamspaces, Connections).
import { answer, type ApiContext } from "./api.ts";
import type { ApiRequest, ApiResponse } from "./http-exchange.ts";
import type { UserRow, WorkspaceRow } from "./rows.schema.ts";
import { sessionUser } from "./sessions.ts";
import { membership } from "./workspaces.ts";

export interface Asker {
  readonly user: UserRow;
  readonly workspace: WorkspaceRow;
}

// A member of the workspace, not a guest, or the answer refusing them.
export function askerOf(
  request: ApiRequest,
  context: ApiContext,
): Asker | ApiResponse {
  const user = sessionUser(context, request);
  if (user === undefined) return answer(401, { error: "signed-out" });
  const workspace = membership(context, request.params.id ?? "", user.id);
  if (workspace === undefined) return answer(404, { error: "not-found" });
  return workspace.role === "guest"
    ? answer(403, { error: "not-allowed" })
    : { user, workspace };
}

export const isAsker = (value: Asker | ApiResponse): value is Asker =>
  "user" in value;
