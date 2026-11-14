// Workspaces on the server (ADR-0013): the list, the first upload, the
// snapshot with the operations since, a client's transactions, and the
// stream that brings the others' transactions.
import { pushMentions } from "./push-mentions.ts";
import { answer, type ApiContext, type RouteTable } from "./api.ts";
import {
  mayChangeAll,
  OPERATIONS_EVENT,
  partialDownload,
  seenOperations,
  streamFilter,
  type Member,
} from "./workspace-access.ts";
import type { ApiRequest, ApiResponse } from "./http-exchange.ts";
import { sessionUser } from "./sessions.ts";
import {
  createWorkspaceSchema,
  parseBody,
  parseOperations,
} from "./workspace.schema.ts";
import {
  createWorkspace,
  logOperations,
  markOpened,
  membership,
  operationsAfter,
  snapshotOf,
  workspacesOf,
} from "./workspaces.ts";

const SIGNED_OUT = answer(401, { error: "signed-out" });
const NOT_FOUND = answer(404, { error: "not-found" });

// The signed-in member of the workspace the path names, or the answer
// that refuses the request.
function memberOf(
  request: ApiRequest,
  context: ApiContext,
): Member | ApiResponse {
  const user = sessionUser(context, request);
  if (user === undefined) return SIGNED_OUT;
  const workspace = membership(context, request.params.id ?? "", user.id);
  return workspace === undefined ? NOT_FOUND : { user, workspace };
}

function isMember(value: Member | ApiResponse): value is Member {
  return "user" in value;
}

function afterOf(request: ApiRequest): number {
  const after = Number(request.query.get("after") ?? "0");
  return Number.isInteger(after) && after >= 0 ? after : 0;
}

export const WORKSPACE_ROUTES: RouteTable = {
  "GET /api/workspaces": (request, context) => {
    const user = sessionUser(context, request);
    if (user === undefined) return SIGNED_OUT;
    return answer(200, {
      workspaces: workspacesOf(context, user.id),
      lastWorkspaceId: user.last_workspace_id,
    });
  },
  "POST /api/workspaces": (request, context) => {
    const user = sessionUser(context, request);
    if (user === undefined) return SIGNED_OUT;
    const body = parseBody(createWorkspaceSchema, request.body);
    const workspace = createWorkspace(context, { ownerId: user.id, ...body });
    return answer(201, { workspace, seq: 0 });
  },
  "GET /api/workspaces/:id": (request, context) => {
    const member = memberOf(request, context);
    if (!isMember(member)) return member;
    const partial = partialDownload(member, context);
    if (partial !== undefined) return partial;
    const { id } = member.workspace;
    const snapshot = snapshotOf(context, id);
    if (snapshot === undefined) return NOT_FOUND;
    const operations = operationsAfter(context, id, snapshot.seq);
    return answer(200, {
      workspace: member.workspace,
      ...snapshot,
      operations,
    });
  },
  "POST /api/workspaces/:id/open": (request, context) => {
    const member = memberOf(request, context);
    if (!isMember(member)) return member;
    markOpened(context, member.user.id, member.workspace.id);
    return answer(204);
  },
  "GET /api/workspaces/:id/operations": (request, context) => {
    const member = memberOf(request, context);
    if (!isMember(member)) return member;
    const { id } = member.workspace;
    const logged = operationsAfter(context, id, afterOf(request));
    return answer(200, {
      operations: seenOperations(member, context, logged),
    });
  },
  "POST /api/workspaces/:id/operations": (request, context) => {
    const member = memberOf(request, context);
    if (!isMember(member)) return member;
    const parsed = parseOperations(request.body);
    if (parsed === undefined) return answer(400, { error: "bad-operations" });
    const workspaceId = member.workspace.id;
    if (!mayChangeAll(member, context, parsed.operations)) {
      return answer(403, { error: "read-only" });
    }
    const seq = logOperations(context, {
      workspaceId,
      userId: member.user.id,
      ...parsed,
    });
    context.events.publish(workspaceId, OPERATIONS_EVENT, { seq, ...parsed });
    const { user } = member;
    void pushMentions(context, {
      workspaceId,
      author: user,
      operations: parsed.operations,
    });
    return answer(200, { seq });
  },
  "GET /api/workspaces/:id/events": (request, context) => {
    const member = memberOf(request, context);
    if (!isMember(member)) return member;
    const workspaceId = member.workspace.id;
    return {
      status: 200,
      stream: {
        start: (send) =>
          context.events.listen(
            workspaceId,
            streamFilter(member, context, send),
          ),
      },
    };
  },
};
