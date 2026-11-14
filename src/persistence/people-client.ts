// Settings › My account, General and People on the server (ADR-0013):
// the account's name, the workspace's name, its members and invitations.
import { renameAccount, setPeople, type SyncRequest } from "../state/index.ts";
import { readUser } from "./account.schema.ts";
import { getJson, type Sync } from "./sync-session.ts";
import { readPeople } from "./sync.schema.ts";

export type PeopleRequest = Exclude<
  SyncRequest,
  { kind: "switch" } | { kind: "create" }
>;

function publishPeople(sync: Sync, body: unknown): void {
  const people = readPeople(body);
  if (people !== undefined) sync.dispatch(setPeople.create(people));
}

type Asked = readonly [path: string, body: unknown];

// The route and body each request goes to, under the open workspace.
function routeOf(request: PeopleRequest, base: string): Asked | undefined {
  switch (request.kind) {
    case "people":
      return [`${base}/members`, undefined];
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
    case "rename":
      return [`${base}/name`, { name: request.name }];
    case "profile":
      return undefined;
  }
}

// Asks the server, then records what came back: the people, the account's
// name, or the workspaces with the new name.
export async function answerPeople(
  sync: Sync,
  request: PeopleRequest,
  workspaceId: string | null,
): Promise<void> {
  if (request.kind === "profile") {
    const reply = await getJson(sync.send, "/api/account/profile", {
      name: request.name,
    });
    const user = readUser(reply);
    if (user !== undefined)
      sync.dispatch(renameAccount.create({ name: user.name }));
    return;
  }
  if (workspaceId === null) return;
  const asked = routeOf(request, `/api/workspaces/${workspaceId}`);
  if (asked === undefined) return;
  const [path, body] = asked;
  const reply = await getJson(sync.send, path, body);
  if (request.kind !== "rename") publishPeople(sync, reply);
}
