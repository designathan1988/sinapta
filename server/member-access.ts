// What a member sees (ADR-0013), as Notion's: the teamspaces and their
// pages, the top pages they made, those every member may open, and the
// pages shared with them; the owner also sees the pages made before pages
// had makers. Another member's private pages stay theirs.
import {
  isCommentChange,
  mayChange,
  parseBlockId,
  type Block,
  type Operation,
  type Workspace,
} from "../src/model/index.ts";
import type { ApiContext } from "./api.ts";
import { blockOf, reachOf, sharedWith, type Reach } from "./guest-access.ts";
import * as rows from "./rows.schema.ts";
import type { Access } from "./sharing.ts";

const TEAMSPACE = "teamspace";

// Who reads: a member, and whether they own the workspace, whose are the
// pages made before pages had makers (the browser's copy they uploaded).
export interface Who {
  readonly userId: string;
  readonly isOwner: boolean;
  // False while only the workspace's owners may make teamspaces.
  readonly mayMakeTeamspaces?: boolean;
}

export interface Viewer extends Who {
  readonly workspaceId: string;
  readonly email: string;
}

export interface Seeing extends Who {
  readonly workspace: Workspace;
}

function openToAll(context: ApiContext, workspaceId: string): Set<string> {
  const found = context.db
    .prepare(
      "SELECT page_id AS id, general FROM page_access WHERE workspace_id = ? AND general != 'invited'",
    )
    .all(workspaceId);
  return new Set(rows.readRows(rows.generalRowSchema, found).map((r) => r.id));
}

// A top block every member sees, or this one alone.
function isSeenAtTop(block: Block, who: Who, open: Set<string>): boolean {
  const isMaker =
    block.createdBy === undefined
      ? who.isOwner
      : block.createdBy.id === who.userId;
  if (block.type === TEAMSPACE) {
    return isMaker || isInTeamspace(block, who.userId);
  }
  return open.has(block.id) || isMaker;
}

// An open teamspace is everyone's; a closed one its members'.
function isInTeamspace(block: Block, userId: string): boolean {
  if (block.props.access !== "closed") return true;
  const members = block.props.memberIds;
  return Array.isArray(members) && members.includes(userId);
}

export function memberReach(
  context: ApiContext,
  viewer: Viewer,
  workspace: Workspace,
): { readonly reach: Reach; readonly shared: Map<string, Access> } {
  const open = openToAll(context, viewer.workspaceId);
  const seen = new Map<string, Access>();
  for (const id of workspace.rootIds) {
    const block = workspace.blocks[id];
    if (block !== undefined && isSeenAtTop(block, viewer, open)) {
      seen.set(id, "full");
    }
  }
  const reach = reachOf(workspace, seen);
  const all = sharedWith(context, viewer.workspaceId, viewer.email);
  const shared = new Map([...all].filter(([id]) => !reach.has(id)));
  for (const [id, access] of reachOf(workspace, shared)) reach.set(id, access);
  return { reach, shared };
}

function blockIn(workspace: Workspace, id: string | undefined) {
  const blockId = id === undefined ? undefined : parseBlockId(id);
  return blockId === undefined ? undefined : workspace.blocks[blockId];
}

// Whether an operation at the workspace's top or on its settings is seen,
// and the reach it opens; undefined for an operation inside a block.
function topSeen(
  operation: Operation,
  reach: Reach,
  who: Who,
): boolean | undefined {
  if (operation.type === "record.update" && operation.kind === "settings") {
    return true;
  }
  if (operation.type === "record.create" && operation.kind === "block") {
    const { record } = operation;
    if (record.parentId !== null) return undefined;
    const isSeen = isSeenAtTop(record, who, new Set());
    if (isSeen) reach.set(record.id, "full");
    return isSeen;
  }
  const isTopList =
    (operation.type === "list.insert" || operation.type === "list.remove") &&
    operation.list.kind === "rootIds";
  return isTopList ? reach.has(operation.id) : undefined;
}

// The operations a member sees; the blocks made inside their reach join it.
export function memberVisible(
  operations: readonly Operation[],
  reach: Reach,
  context: Seeing,
): Operation[] {
  return operations.filter((operation) => {
    const top = topSeen(operation, reach, context);
    if (top !== undefined) return top;
    const target = blockOf(operation, context.workspace);
    const access = target === undefined ? undefined : reach.get(target);
    if (access === undefined) return false;
    if (operation.type === "record.create" && operation.kind === "block") {
      reach.set(operation.record.id, access);
    }
    return true;
  });
}

function makesTeamspace(operation: Operation): boolean {
  return (
    operation.type === "record.create" &&
    operation.kind === "block" &&
    operation.record.type === TEAMSPACE
  );
}

// True when every change stays where the member may make it: the top of
// the workspace, their reach at an access that allows it, or blocks the
// server does not hold yet.
export function mayMemberWrite(
  operations: readonly Operation[],
  reach: Reach,
  context: Seeing,
): boolean {
  const scratch: Reach = new Map(reach);
  return operations.every((operation) => {
    if (makesTeamspace(operation) && context.mayMakeTeamspaces === false) {
      return false;
    }
    const top = topSeen(operation, scratch, context);
    if (top !== undefined) return top;
    const target = blockOf(operation, context.workspace);
    const access = target === undefined ? undefined : scratch.get(target);
    const current = blockIn(context.workspace, target);
    if (operation.type === "record.create" && operation.kind === "block") {
      if (access !== undefined) scratch.set(operation.record.id, access);
    }
    // A block the server does not hold is no one's private page.
    if (
      access === undefined &&
      blockIn(context.workspace, target) === undefined
    ) {
      return true;
    }
    return mayChange(access, isCommentChange(operation, current));
  });
}
