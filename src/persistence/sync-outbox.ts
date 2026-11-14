// What joining a workspace makes again (ADR-0013): the operations logged
// since the server's snapshot, and this browser's transactions the server
// never confirmed.
import {
  applyOperations,
  findInvariantViolation,
  parseWireOperations,
  type BlockId,
  type Operation,
  type Workspace,
} from "../model/index.ts";
import { replayOffline } from "../state/index.ts";
import type { Sync } from "./sync-session.ts";
import * as reply from "./sync.schema.ts";

// The blocks a transaction touches: its records and the lists it changes.
function touched(operations: readonly Operation[]): Set<BlockId> {
  const ids = new Set<BlockId>();
  for (const operation of operations) {
    if (operation.type === "list.insert" || operation.type === "list.remove") {
      ids.add(operation.id);
      if (operation.list.kind === "childIds") ids.add(operation.list.blockId);
    } else if (operation.kind === "block") {
      ids.add("record" in operation ? operation.record.id : operation.id);
    }
  }
  return ids;
}

// Each logged transaction made again in turn; one that cannot be, or that
// would break the workspace's rules (a child listed twice), is skipped, so
// the rest still loads.
export function withLogged(
  workspace: Workspace,
  logged: readonly reply.Logged[],
): { workspace: Workspace; seq: number | undefined } {
  let current = workspace;
  for (const entry of logged) {
    const operations = parseWireOperations(entry.operations) ?? [];
    const result = applyOperations(current, operations);
    if (!result.ok) continue;
    const ids = touched(operations);
    const broken = findInvariantViolation(current, result.workspace, ids);
    if (broken === undefined) current = result.workspace;
  }
  return { workspace: current, seq: logged.at(-1)?.seq };
}

// Makes again, on the server's workspace, what this browser changed while
// the server never heard of it; each change is then sent as usual.
export async function replayOutbox(sync: Sync, workspaceId: string) {
  const outbox = reply.readOutbox(await sync.outbox.load());
  if (outbox?.workspaceId !== workspaceId) return;
  await sync.outbox.save(undefined);
  for (const entry of outbox.entries) {
    const operations = parseWireOperations(entry);
    if (operations !== undefined) {
      sync.dispatch(replayOffline.create({ operations }));
    }
  }
}
