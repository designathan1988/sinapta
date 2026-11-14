// Workspaces on the server (ADR-0013): the list, the first upload, the
// snapshot with the operations since, a client's transactions, and the
// stream that brings the others' transactions.
import * as v from "valibot";
import {
  parseWireOperations,
  SCHEMA_VERSION,
  type Operation,
} from "../src/model/index.ts";
import { answer, type ApiContext, type RouteTable } from "./api.ts";
import {
  guestWorkspace,
  mayWrite,
  reachOf,
  sharedWith,
  visibleTo,
} from "./guest-access.ts";
import type { Access } from "./sharing.ts";
import type { Listener } from "./workspace-events.ts";
import { currentState, currentWorkspace } from "./workspace-state.ts";
import type { ApiRequest, ApiResponse } from "./http-exchange.ts";
import type { UserRow, WorkspaceRow } from "./rows.schema.ts";
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
const OPERATIONS_EVENT = "operations";

interface Member {
  readonly user: UserRow;
  readonly workspace: WorkspaceRow;
}

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

// A guest reads the pages shared with them, as a workspace of their own.
function guestDownload(member: Member, context: ApiContext): ApiResponse {
  const { id } = member.workspace;
  const state = currentState(context, id);
  if (state === undefined) return NOT_FOUND;
  const reach = reachOf(
    state.workspace,
    sharedWith(context, id, member.user.email),
  );
  const snapshot = {
    schemaVersion: SCHEMA_VERSION,
    ...guestWorkspace(state.workspace, reach),
  };
  return answer(200, {
    workspace: member.workspace,
    seq: state.seq,
    snapshot,
    operations: [],
  });
}

function mayGuestWrite(
  member: Member,
  context: ApiContext,
  operations: readonly Operation[],
): boolean {
  if (member.workspace.role !== "guest") return true;
  const { id } = member.workspace;
  const workspace = currentWorkspace(context, id);
  if (workspace === undefined) return false;
  const reach = reachOf(workspace, sharedWith(context, id, member.user.email));
  return mayWrite(operations, reach, workspace);
}

// A guest's stream carries only the operations inside their reach; the
// others' events still come, empty, so that no number is missing.
function guestFilter(
  member: Member,
  context: ApiContext,
  send: Listener,
): Listener {
  if (member.workspace.role !== "guest") return send;
  const { id } = member.workspace;
  const start = currentWorkspace(context, id);
  const reach =
    start === undefined
      ? new Map<string, Access>()
      : reachOf(start, sharedWith(context, id, member.user.email));
  return (event, data) => {
    const logged = v.safeParse(loggedSchema, data);
    const workspace = currentWorkspace(context, id);
    if (!logged.success || workspace === undefined) return;
    const operations = parseWireOperations(logged.output.operations) ?? [];
    send(event, {
      ...logged.output,
      operations: visibleTo(operations, reach, workspace),
    });
  };
}

const loggedSchema = v.object({
  seq: v.number(),
  clientId: v.string(),
  operations: v.unknown(),
});

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
    if (member.workspace.role === "guest")
      return guestDownload(member, context);
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
    return answer(200, {
      operations: operationsAfter(context, id, afterOf(request)),
    });
  },
  "POST /api/workspaces/:id/operations": (request, context) => {
    const member = memberOf(request, context);
    if (!isMember(member)) return member;
    const parsed = parseOperations(request.body);
    if (parsed === undefined) return answer(400, { error: "bad-operations" });
    const workspaceId = member.workspace.id;
    if (!mayGuestWrite(member, context, parsed.operations)) {
      return answer(403, { error: "read-only" });
    }
    const seq = logOperations(context, {
      workspaceId,
      userId: member.user.id,
      ...parsed,
    });
    context.events.publish(workspaceId, OPERATIONS_EVENT, { seq, ...parsed });
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
            guestFilter(member, context, send),
          ),
      },
    };
  },
};
