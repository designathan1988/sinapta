// Each workspace as it stands now, built by the model from its snapshot
// and the operations since, and kept up to date as operations arrive
// (ADR-0013): what publishing and permissions read.
import * as v from "valibot";
import {
  applyOperations,
  parseWireOperations,
  parseWorkspaceFile,
  SCHEMA_VERSION,
  type Block,
  type BlockId,
  type PropsSchemas,
  type Workspace,
} from "../src/model/index.ts";
import type { ApiContext } from "./api.ts";
import { operationsAfter, snapshotOf } from "./workspaces.ts";

// The server keeps a block's props as they came: their types' schemas
// belong to the client.
const anyProps = v.record(v.string(), v.unknown());
const PROPS: PropsSchemas = {
  get: () => anyProps,
  has: () => true,
  size: 0,
  forEach: () => undefined,
  entries: () => new Map<string, typeof anyProps>().entries(),
  keys: () => new Map<string, typeof anyProps>().keys(),
  values: () => new Map<string, typeof anyProps>().values(),
  [Symbol.iterator]: () =>
    new Map<string, typeof anyProps>()[Symbol.iterator](),
};

export interface Kept {
  readonly seq: number;
  readonly workspace: Workspace;
}

const kept = new WeakMap<ApiContext, Map<string, Kept>>();

function cacheOf(context: ApiContext): Map<string, Kept> {
  const cache = kept.get(context) ?? new Map<string, Kept>();
  kept.set(context, cache);
  return cache;
}

function readSnapshot(snapshot: unknown): Workspace | undefined {
  const file = v.safeParse(
    v.object({ schemaVersion: v.literal(SCHEMA_VERSION) }),
    snapshot,
  );
  if (!file.success || typeof snapshot !== "object" || snapshot === null) {
    return undefined;
  }
  const parsed = parseWorkspaceFile(snapshot, PROPS);
  return parsed.ok ? parsed.workspace : undefined;
}

function applyLogged(workspace: Workspace, operations: unknown): Workspace {
  const parsed = parseWireOperations(operations);
  if (parsed === undefined) return workspace;
  const result = applyOperations(workspace, parsed);
  return result.ok ? result.workspace : workspace;
}

// The workspace now, or undefined when its snapshot cannot be read.
export function currentWorkspace(
  context: ApiContext,
  workspaceId: string,
): Workspace | undefined {
  return currentState(context, workspaceId)?.workspace;
}

// The workspace now with the last operation applied to it.
export function currentState(
  context: ApiContext,
  workspaceId: string,
): Kept | undefined {
  const cache = cacheOf(context);
  const known = cache.get(workspaceId);
  const base =
    known ??
    (() => {
      const snapshot = snapshotOf(context, workspaceId);
      const workspace = readSnapshot(snapshot?.snapshot);
      return snapshot === undefined || workspace === undefined
        ? undefined
        : { seq: snapshot.seq, workspace };
    })();
  if (base === undefined) return undefined;
  let { seq, workspace } = base;
  for (const logged of operationsAfter(context, workspaceId, seq)) {
    workspace = applyLogged(workspace, logged.operations);
    seq = logged.seq;
  }
  const now = { seq, workspace };
  cache.set(workspaceId, now);
  return now;
}

// A page and everything inside it, as a workspace of its own whose root it
// is, with the views of its databases: what a published page shows.
export function pageAlone(
  workspace: Workspace,
  pageId: BlockId,
): Workspace | undefined {
  const page = workspace.blocks[pageId];
  if (page === undefined) return undefined;
  const blocks: Record<BlockId, Block> = {};
  const visit = (id: BlockId): void => {
    const block = workspace.blocks[id];
    if (block === undefined) return;
    blocks[id] = id === pageId ? { ...block, parentId: null } : block;
    block.childIds.forEach(visit);
  };
  visit(pageId);
  const views = Object.fromEntries(
    Object.entries(workspace.views).filter(([, view]) =>
      Object.hasOwn(blocks, view.databaseId),
    ),
  );
  return { ...workspace, blocks, views, rootIds: [pageId] };
}
