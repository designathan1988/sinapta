// Settings › General and People on the server: the workspace's name, its
// members and invitations. Only the workspace's owner changes them.
import * as v from "valibot";
import { answer, type ApiContext, type RouteTable } from "./api.ts";
import type { ApiRequest, ApiResponse } from "./http-exchange.ts";
import {
  invite,
  membersOf,
  removeInvite,
  removeMember,
  renameWorkspace,
  ROLES,
} from "./members.ts";
import type { WorkspaceRow } from "./rows.schema.ts";
import { sessionUser } from "./sessions.ts";
import { membership } from "./workspaces.ts";

const nameSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(100)),
});
const inviteSchema = v.object({
  email: v.pipe(v.string(), v.trim(), v.toLowerCase(), v.email()),
  role: v.picklist(ROLES),
});
const removeSchema = v.variant("kind", [
  v.object({ kind: v.literal("member"), userId: v.string() }),
  v.object({ kind: v.literal("invite"), email: v.string() }),
]);

// The workspace the path names, when the signed-in person owns it.
function owned(
  request: ApiRequest,
  context: ApiContext,
): WorkspaceRow | ApiResponse {
  const user = sessionUser(context, request);
  if (user === undefined) return answer(401, { error: "signed-out" });
  const workspace = membership(context, request.params.id ?? "", user.id);
  if (workspace === undefined) return answer(404, { error: "not-found" });
  if (workspace.role !== "owner") return answer(403, { error: "not-owner" });
  return workspace;
}

function isWorkspace(value: WorkspaceRow | ApiResponse): value is WorkspaceRow {
  return "role" in value;
}

export const MEMBER_ROUTES: RouteTable = {
  "GET /api/workspaces/:id/members": (request, context) => {
    const user = sessionUser(context, request);
    if (user === undefined) return answer(401, { error: "signed-out" });
    const workspace = membership(context, request.params.id ?? "", user.id);
    if (workspace === undefined) return answer(404, { error: "not-found" });
    return answer(200, membersOf(context, workspace.id));
  },
  "POST /api/workspaces/:id/members": (request, context) => {
    const workspace = owned(request, context);
    if (!isWorkspace(workspace)) return workspace;
    const person = v.parse(inviteSchema, request.body);
    const result = invite(context, workspace.id, person);
    return answer(200, { result, ...membersOf(context, workspace.id) });
  },
  "POST /api/workspaces/:id/members/remove": (request, context) => {
    const workspace = owned(request, context);
    if (!isWorkspace(workspace)) return workspace;
    const target = v.parse(removeSchema, request.body);
    if (target.kind === "member") {
      removeMember(context, workspace.id, target.userId);
    } else removeInvite(context, workspace.id, target.email);
    return answer(200, membersOf(context, workspace.id));
  },
  "POST /api/workspaces/:id/name": (request, context) => {
    const workspace = owned(request, context);
    if (!isWorkspace(workspace)) return workspace;
    const { name } = v.parse(nameSchema, request.body);
    renameWorkspace(context, workspace.id, name);
    return answer(204);
  },
};
