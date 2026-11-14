// Settings › Teamspaces on the server (ADR-0013): the teamspaces a member
// may know of, joining an open one, asking to join a closed one and its
// owners' approval, and whether only the workspace's owners make them.
import * as v from "valibot";
import { answer, type ApiContext, type RouteTable } from "./api.ts";
import type { ApiRequest, ApiResponse } from "./http-exchange.ts";
import type { UserRow, WorkspaceRow } from "./rows.schema.ts";
import { sessionUser } from "./sessions.ts";
import {
  accessOf,
  addMember,
  isInIt,
  listTeamspaces,
  mayManage,
  teamspaceIn,
} from "./teamspaces.ts";
import { currentWorkspace } from "./workspace-state.ts";
import { membership } from "./workspaces.ts";

const NOT_FOUND = answer(404, { error: "not-found" });
const NOT_ALLOWED = answer(403, { error: "not-allowed" });

interface Asker {
  readonly user: UserRow;
  readonly workspace: WorkspaceRow;
}

// A member of the workspace, not a guest, or the answer refusing them.
function askerOf(
  request: ApiRequest,
  context: ApiContext,
): Asker | ApiResponse {
  const user = sessionUser(context, request);
  if (user === undefined) return answer(401, { error: "signed-out" });
  const workspace = membership(context, request.params.id ?? "", user.id);
  if (workspace === undefined) return NOT_FOUND;
  return workspace.role === "guest" ? NOT_ALLOWED : { user, workspace };
}

const isAsker = (value: Asker | ApiResponse): value is Asker => "user" in value;

function whoOf(asker: Asker) {
  return {
    workspaceId: asker.workspace.id,
    userId: asker.user.id,
    isOwner: asker.workspace.role === "owner",
  };
}

function join(asker: Asker, context: ApiContext, teamspaceId: string) {
  const workspace = currentWorkspace(context, asker.workspace.id);
  const block = workspace && teamspaceIn(workspace, teamspaceId);
  if (block === undefined) return NOT_FOUND;
  const access = accessOf(block);
  const userId = asker.user.id;
  if (isInIt(block, userId)) return answer(200, { joined: true });
  if (access === "private") return NOT_FOUND;
  if (access === "closed") {
    context.db
      .prepare(
        "INSERT OR IGNORE INTO teamspace_requests (workspace_id, teamspace_id, user_id, created_at) VALUES (?, ?, ?, ?)",
      )
      .run(asker.workspace.id, teamspaceId, userId, context.now());
    return answer(200, { requested: true });
  }
  const workspaceId = asker.workspace.id;
  addMember(context, { workspaceId, by: userId, block, userId });
  return answer(200, { joined: true });
}

const approveSchema = v.object({ userId: v.string() });
const limitSchema = v.object({ limited: v.boolean() });

export const TEAMSPACE_ROUTES: RouteTable = {
  "GET /api/workspaces/:id/teamspaces": (request, context) => {
    const asker = askerOf(request, context);
    if (!isAsker(asker)) return asker;
    const workspace = currentWorkspace(context, asker.workspace.id);
    if (workspace === undefined) return NOT_FOUND;
    return answer(200, {
      teamspaces: listTeamspaces(context, workspace, whoOf(asker)),
      limited: asker.workspace.limitsTeamspaces === 1,
    });
  },
  "POST /api/workspaces/:id/teamspaces/:teamspace/join": (request, context) => {
    const asker = askerOf(request, context);
    if (!isAsker(asker)) return asker;
    return join(asker, context, request.params.teamspace ?? "");
  },
  "POST /api/workspaces/:id/teamspaces/:teamspace/approve": (
    request,
    context,
  ) => {
    const asker = askerOf(request, context);
    if (!isAsker(asker)) return asker;
    const { userId } = v.parse(approveSchema, request.body);
    const workspace = currentWorkspace(context, asker.workspace.id);
    const block =
      workspace && teamspaceIn(workspace, request.params.teamspace ?? "");
    if (block === undefined) return NOT_FOUND;
    const who = whoOf(asker);
    if (!mayManage(block, who.userId, who.isOwner)) return NOT_ALLOWED;
    addMember(context, {
      workspaceId: who.workspaceId,
      by: who.userId,
      block,
      userId,
    });
    return answer(200, { approved: true });
  },
  "POST /api/workspaces/:id/teamspace-limit": (request, context) => {
    const asker = askerOf(request, context);
    if (!isAsker(asker)) return asker;
    if (asker.workspace.role !== "owner") return NOT_ALLOWED;
    const { limited } = v.parse(limitSchema, request.body);
    context.db
      .prepare("UPDATE workspaces SET limits_teamspaces = ? WHERE id = ?")
      .run(limited ? 1 : 0, asker.workspace.id);
    return answer(200, { limited });
  },
};
