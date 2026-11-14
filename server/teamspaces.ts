// The workspace's teamspaces as the server knows them (ADR-0013): the list
// a member reads in Settings, joining them, the requests to join a closed
// one, and the server's own change that adds a member.
import {
  parseBlockId,
  type Block,
  type Operation,
  type Workspace,
} from "../src/model/index.ts";
import type { ApiContext } from "./api.ts";
import * as rows from "./rows.schema.ts";
import { logServerChange } from "./server-change.ts";

const TEAMSPACE = "teamspace";
const CLIENT_ID = "pagecraft-teamspaces";

export function teamspaceIn(
  workspace: Workspace,
  id: string,
): Block | undefined {
  const blockId = parseBlockId(id);
  const block = blockId === undefined ? undefined : workspace.blocks[blockId];
  return block?.type === TEAMSPACE ? block : undefined;
}

const memberIdsOf = (block: Block): string[] =>
  Array.isArray(block.props.memberIds)
    ? block.props.memberIds.filter(
        (id: unknown): id is string => typeof id === "string",
      )
    : [];

export const accessOf = (block: Block): string =>
  typeof block.props.access === "string" ? block.props.access : "open";

export function isInIt(block: Block, userId: string): boolean {
  return (
    accessOf(block) === "open" ||
    block.createdBy?.id === userId ||
    memberIdsOf(block).includes(userId)
  );
}

// Whether the teamspace's maker or the workspace's owner speaks.
export function mayManage(block: Block, userId: string, isOwner: boolean) {
  return isOwner || block.createdBy?.id === userId;
}

function hasOverrides(block: Block): boolean {
  const { security } = block.props;
  if (typeof security !== "object" || security === null) return false;
  return Object.values(security).some((value) => value === true);
}

export function requestsOf(context: ApiContext, workspaceId: string) {
  const found = context.db
    .prepare(
      "SELECT r.teamspace_id, r.user_id, u.name FROM teamspace_requests r JOIN users u ON u.id = r.user_id WHERE r.workspace_id = ? ORDER BY r.created_at",
    )
    .all(workspaceId);
  return rows.readRows(rows.requestRowSchema, found);
}

// Every teamspace a member may know of: all but the private ones they are
// not in, each with whether they are in it and who asks to join it.
export function listTeamspaces(
  context: ApiContext,
  workspace: Workspace,
  who: {
    readonly workspaceId: string;
    readonly userId: string;
    readonly isOwner: boolean;
  },
) {
  const requests = requestsOf(context, who.workspaceId);
  return workspace.rootIds.flatMap((id) => {
    const block = workspace.blocks[id];
    if (block?.type !== TEAMSPACE) return [];
    const isIn = isInIt(block, who.userId);
    if (accessOf(block) === "private" && !isIn) return [];
    const asking = mayManage(block, who.userId, who.isOwner)
      ? requests.filter((r) => r.teamspace_id === id)
      : [];
    return [
      {
        id,
        name: typeof block.props.name === "string" ? block.props.name : "",
        access: accessOf(block),
        owner: block.createdBy?.name ?? "",
        isMember: isIn,
        hasAsked: requests.some(
          (r) => r.teamspace_id === id && r.user_id === who.userId,
        ),
        isArchived: block.props.isArchived === true,
        hasOverrides: hasOverrides(block),
        requests: asking.map((r) => ({ userId: r.user_id, name: r.name })),
      },
    ];
  });
}

export interface TeamspaceRequest {
  readonly workspaceId: string;
  readonly teamspaceId: string;
  readonly userId: string;
}

export function forgetRequest(
  context: ApiContext,
  request: TeamspaceRequest,
): void {
  const { workspaceId, teamspaceId, userId } = request;
  context.db
    .prepare(
      "DELETE FROM teamspace_requests WHERE workspace_id = ? AND teamspace_id = ? AND user_id = ?",
    )
    .run(workspaceId, teamspaceId, userId);
}

// The server adds a person to a teamspace's members, as its own change
// that every client receives.
export function addMember(
  context: ApiContext,
  change: {
    readonly workspaceId: string;
    readonly by: string;
    readonly block: Block;
    readonly userId: string;
  },
): Operation {
  const { block, userId } = change;
  const memberIds = [...new Set([...memberIdsOf(block), userId])];
  const { id, ...rest } = block;
  const patch = {
    ...rest,
    props: { ...block.props, memberIds },
    updatedAt: new Date(context.now()).toISOString(),
  };
  const operation = {
    type: "record.update",
    kind: "block",
    id,
    patch,
  } as const;
  logServerChange(
    context,
    { workspaceId: change.workspaceId, by: change.by, clientId: CLIENT_ID },
    [operation],
  );
  forgetRequest(context, {
    workspaceId: change.workspaceId,
    teamspaceId: id,
    userId,
  });
  return operation;
}
