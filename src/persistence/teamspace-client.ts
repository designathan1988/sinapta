// Settings › Teamspaces on the server (ADR-0013): the list, joining or
// asking to join, an owner's approval, and the limit on making them.
import { setTeamspaceList, type SyncRequest } from "../state/index.ts";
import { getJson, type Sync } from "./sync-session.ts";
import { readJoined, readTeamspaceList } from "./sync.schema.ts";

export type TeamspaceRequest = Extract<
  SyncRequest,
  {
    kind:
      "teamspaces" | "join-teamspace" | "approve-teamspace" | "teamspace-limit";
  }
>;

export function isTeamspaceRequest(
  request: SyncRequest,
): request is TeamspaceRequest {
  return (
    request.kind === "teamspaces" ||
    request.kind === "join-teamspace" ||
    request.kind === "approve-teamspace" ||
    request.kind === "teamspace-limit"
  );
}

// What the client does once the server has answered: read the workspace
// again, as after joining a teamspace, or the list of workspaces again.
export interface Afterwards {
  readonly reload: () => void;
  readonly relist: () => void;
}

function routeOf(request: TeamspaceRequest, base: string) {
  switch (request.kind) {
    case "teamspaces":
      return [`${base}/teamspaces`, undefined] as const;
    case "join-teamspace":
      return [`${base}/teamspaces/${request.teamspaceId}/join`, {}] as const;
    case "approve-teamspace":
      return [
        `${base}/teamspaces/${request.teamspaceId}/approve`,
        { userId: request.userId },
      ] as const;
    case "teamspace-limit":
      return [`${base}/teamspace-limit`, { limited: request.limited }] as const;
  }
}

async function relistTeamspaces(sync: Sync, base: string): Promise<void> {
  const list = readTeamspaceList(
    await getJson(sync.send, `${base}/teamspaces`),
  );
  if (list !== undefined)
    sync.dispatch(setTeamspaceList.create({ teamspaces: list }));
}

export async function answerTeamspaces(
  sync: Sync,
  request: TeamspaceRequest,
  context: {
    readonly workspaceId: string | null;
    readonly afterwards: Afterwards;
  },
): Promise<void> {
  if (context.workspaceId === null) return;
  const base = `/api/workspaces/${context.workspaceId}`;
  const [path, body] = routeOf(request, base);
  const reply = await getJson(sync.send, path, body);
  if (request.kind === "teamspaces") {
    const list = readTeamspaceList(reply);
    if (list !== undefined)
      sync.dispatch(setTeamspaceList.create({ teamspaces: list }));
    return;
  }
  if (request.kind === "teamspace-limit") context.afterwards.relist();
  if (readJoined(reply) === true) context.afterwards.reload();
  await relistTeamspaces(sync, base);
}
