// What a guest of a workspace reaches (ADR-0013): the pages shared with
// them and everything inside, at the access each was shared with; nothing
// else is sent to them, and they change nothing else.
import {
  isCommentChange,
  mayChange,
  parseBlockId,
  type Block,
  type BlockId,
  type Operation,
  type View,
  type Workspace,
} from "../src/model/index.ts";
import type { ApiContext } from "./api.ts";
import * as rows from "./rows.schema.ts";
import type { Access } from "./sharing.ts";

// Every block a guest reaches, with the access they have to it.
export type Reach = Map<string, Access>;

export function sharedWith(
  context: ApiContext,
  workspaceId: string,
  email: string,
): Map<string, Access> {
  const found = context.db
    .prepare(
      "SELECT page_id AS id, access FROM page_shares WHERE workspace_id = ? AND email = ?",
    )
    .all(workspaceId, email);
  const pages = rows.readRows(rows.sharedPageRowSchema, found);
  return new Map(pages.map((page) => [page.id, page.access]));
}

export function reachOf(
  workspace: Workspace,
  shared: ReadonlyMap<string, Access>,
): Reach {
  const reach: Reach = new Map();
  const visit = (id: BlockId, access: Access): void => {
    const block = workspace.blocks[id];
    if (block === undefined) return;
    reach.set(id, shared.get(id) ?? access);
    for (const child of block.childIds)
      visit(child, shared.get(child) ?? access);
  };
  for (const [id, access] of shared) {
    const blockId = parseBlockId(id);
    if (blockId !== undefined) visit(blockId, access);
  }
  return reach;
}

// The shared pages as a workspace of the guest's own: they are its roots.
export function guestWorkspace(workspace: Workspace, reach: Reach): Workspace {
  const blocks: Record<BlockId, Block> = {};
  const rootIds: BlockId[] = [];
  for (const block of Object.values(workspace.blocks)) {
    if (!reach.has(block.id)) continue;
    const isRoot = block.parentId === null || !reach.has(block.parentId);
    blocks[block.id] = isRoot ? { ...block, parentId: null } : block;
    if (isRoot) rootIds.push(block.id);
  }
  const views: Record<View["id"], View> = {};
  for (const view of Object.values(workspace.views)) {
    if (reach.has(view.databaseId)) views[view.id] = view;
  }
  return { ...workspace, blocks, views, rootIds };
}

// The block an operation is about, for the guest's reach; undefined when it
// touches the workspace's top or its settings, which a guest never does.
function changedBlockOf(
  operation: Extract<Operation, { type: "record.update" | "record.delete" }>,
  workspace: Workspace,
): string | undefined {
  if (operation.kind === "settings") return undefined;
  if (operation.kind === "block") return operation.id;
  return workspace.views[operation.id]?.databaseId;
}

export function blockOf(
  operation: Operation,
  workspace: Workspace,
): string | undefined {
  switch (operation.type) {
    case "record.create":
      return operation.kind === "block"
        ? (operation.record.parentId ?? undefined)
        : operation.record.databaseId;
    case "record.update":
    case "record.delete":
      return changedBlockOf(operation, workspace);
    case "list.insert":
    case "list.remove":
      return operation.list.kind === "rootIds"
        ? undefined
        : operation.list.blockId;
  }
}

// Operations the guest may see; the blocks others create inside their
// reach join it.
export function visibleTo(
  operations: readonly Operation[],
  reach: Reach,
  workspace: Workspace,
): Operation[] {
  return operations.filter((operation) => {
    const target = blockOf(operation, workspace);
    const access = target === undefined ? undefined : reach.get(target);
    if (access === undefined) return false;
    if (operation.type === "record.create" && operation.kind === "block") {
      reach.set(operation.record.id, access);
    }
    return true;
  });
}

// True when every operation stays inside pages the guest may edit, or
// only comments on pages they may comment on.
export function mayWrite(
  operations: readonly Operation[],
  reach: Reach,
  workspace: Workspace,
): boolean {
  return operations.every((operation) => {
    const target = blockOf(operation, workspace);
    const access = target === undefined ? undefined : reach.get(target);
    const id = target === undefined ? undefined : parseBlockId(target);
    const current = id === undefined ? undefined : workspace.blocks[id];
    return mayChange(access, isCommentChange(operation, current));
  });
}
