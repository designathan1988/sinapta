// What a member sees (ADR-0013), as Notion's: the teamspaces and their
// pages, the top pages they made, those every member may open, older pages
// made before pages had makers, and the pages shared with them. Another
// member's private pages stay theirs.
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

export interface Viewer {
  readonly workspaceId: string;
  readonly userId: string;
  readonly email: string;
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
function isSeenAtTop(block: Block, userId: string, open: Set<string>): boolean {
  if (block.type === TEAMSPACE || open.has(block.id)) return true;
  return block.createdBy === undefined || block.createdBy.id === userId;
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
    if (block !== undefined && isSeenAtTop(block, viewer.userId, open)) {
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
  userId: string,
): boolean | undefined {
  if (operation.type === "record.update" && operation.kind === "settings") {
    return true;
  }
  if (operation.type === "record.create" && operation.kind === "block") {
    const { record } = operation;
    if (record.parentId !== null) return undefined;
    const isSeen = isSeenAtTop(record, userId, new Set());
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
  context: { readonly workspace: Workspace; readonly userId: string },
): Operation[] {
  return operations.filter((operation) => {
    const top = topSeen(operation, reach, context.userId);
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

// True when every change stays where the member may make it: the top of
// the workspace, their reach at an access that allows it, or blocks the
// server does not hold yet.
export function mayMemberWrite(
  operations: readonly Operation[],
  reach: Reach,
  context: { readonly workspace: Workspace; readonly userId: string },
): boolean {
  const scratch: Reach = new Map(reach);
  return operations.every((operation) => {
    const top = topSeen(operation, scratch, context.userId);
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
