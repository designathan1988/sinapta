// Settings › My account, General and People on the server (ADR-0013):
// the account's name, the workspace's name, its members and invitations.
import {
  renameAccount,
  setPeople,
  setShared,
  setSharing,
  type SyncRequest,
} from "../state/index.ts";
import { readUser } from "./account.schema.ts";
import type { IntegrationRequest } from "./integration-client.ts";
import type { TeamspaceRequest } from "./teamspace-client.ts";
import { getJson, type Sync } from "./sync-session.ts";
import { readPeople, readSharedIds, readSharing } from "./sync.schema.ts";

export type PeopleRequest = Exclude<
  SyncRequest,
  | { kind: "switch" }
  | { kind: "create" }
  | TeamspaceRequest
  | IntegrationRequest
>;

function publishPeople(sync: Sync, body: unknown): void {
  const people = readPeople(body);
  if (people !== undefined) sync.dispatch(setPeople.create(people));
}

type Asked = readonly [path: string, body: unknown];

// The route and body each request goes to, under the open workspace.
function routeOf(request: PeopleRequest, base: string): Asked | undefined {
  if (isWorkspaceRequest(request)) return workspaceRoute(request, base);
  switch (request.kind) {
    case "people":
      return [`${base}/members`, undefined];
    case "shared":
      return [`${base}/shared`, undefined];
    case "invite":
      return [`${base}/members`, { email: request.email, role: request.role }];
    case "remove-member":
      return [
        `${base}/members/remove`,
        { kind: "member", userId: request.userId },
      ];
    case "remove-invite":
      return [
        `${base}/members/remove`,
        { kind: "invite", email: request.email },
      ];
    case "profile":
      return undefined;
    case "ai-fill":
      return [
        `${base}/ai/fill`,
        {
          databaseId: request.databaseId,
          propertyId: request.propertyId,
          action: request.action,
        },
      ];
    default:
      return sharingRoute(request, base);
  }
}

type WorkspaceRequest = Extract<
  PeopleRequest,
  {
    kind:
      | "rename"
      | "plan"
      | "workspace-icon"
      | "delete-workspace"
      | "leave-workspace";
  }
>;

const WORKSPACE_KINDS: ReadonlySet<string> = new Set([
  "rename",
  "plan",
  "workspace-icon",
  "delete-workspace",
  "leave-workspace",
]);

function isWorkspaceRequest(
  request: PeopleRequest,
): request is WorkspaceRequest {
  return WORKSPACE_KINDS.has(request.kind);
}

// Settings › General: the workspace's name and icon, deleting or leaving it.
function workspaceRoute(request: WorkspaceRequest, base: string): Asked {
  switch (request.kind) {
    case "rename":
      return [`${base}/name`, { name: request.name }];
    case "plan":
      return [`${base}/plan`, { plan: request.plan }];
    case "workspace-icon":
      return [`${base}/icon`, { icon: request.icon }];
    case "delete-workspace":
      return [`${base}/delete`, { name: request.name }];
    case "leave-workspace":
      return [`${base}/leave`, {}];
  }
}

type SharingRequest = Extract<
  PeopleRequest,
  { kind: "sharing" | "share" | "unshare" | "general" | "publish" }
>;

function sharingRoute(request: SharingRequest, base: string): Asked {
  const page = `${base}/pages/${request.pageId}/sharing`;
  switch (request.kind) {
    case "sharing":
      return [page, undefined];
    case "share":
      return [page, { email: request.email, access: request.access }];
    case "unshare":
      return [`${page}/remove`, { email: request.email }];
    case "general":
      return [`${page}/general`, { general: request.general }];
    case "publish":
      return [`${page}/publish`, { published: request.published }];
  }
}

async function answerProfile(sync: Sync, name: string): Promise<void> {
  const reply = await getJson(sync.send, "/api/account/profile", { name });
  const user = readUser(reply);
  if (user !== undefined) {
    sync.dispatch(renameAccount.create({ name: user.name }));
  }
}

// Requests whose answer holds no people.
const QUIET = new Set([
  "rename",
  "plan",
  "ai-fill",
  "workspace-icon",
  "delete-workspace",
  "leave-workspace",
]);

// Records what the server answered a request about the workspace.
function record(sync: Sync, request: PeopleRequest, reply: unknown): void {
  if ("pageId" in request) {
    const sharing = readSharing(reply, request.pageId);
    if (sharing !== undefined) sync.dispatch(setSharing.create({ sharing }));
  } else if (request.kind === "shared") {
    const pageIds = readSharedIds(reply);
    if (pageIds !== undefined) sync.dispatch(setShared.create({ pageIds }));
  } else if (!QUIET.has(request.kind)) {
    publishPeople(sync, reply);
  }
}

// Asks the server, then records what came back: the people, the account's
// name, the page's sharing or the shared pages.
export async function answerPeople(
  sync: Sync,
  request: PeopleRequest,
  workspaceId: string | null,
): Promise<void> {
  if (request.kind === "profile") {
    await answerProfile(sync, request.name);
    return;
  }
  if (workspaceId === null) return;
  const asked = routeOf(request, `/api/workspaces/${workspaceId}`);
  if (asked === undefined) return;
  const [path, body] = asked;
  record(sync, request, await getJson(sync.send, path, body));
}
