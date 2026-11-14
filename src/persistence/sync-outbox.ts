// What joining a workspace makes again (ADR-0013): the operations logged
// since the server's snapshot, and this browser's transactions the server
// never confirmed, typed while it was read included.
import {
  applyOperations,
  findInvariantViolation,
  parseWireOperations,
  type BlockId,
  type Operation,
  type Workspace,
} from "../model/index.ts";
import type { Pending } from "./sync-rebase.ts";
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

// This browser's changes the server never confirmed, made again on the
// server's workspace before it is shown, so that what is on screen stays
// as it is, typing included; each is then sent as usual. One that cannot
// be made again, or that would break the workspace's rules, is dropped.
export function withUnsent(
  workspace: Workspace,
  entries: readonly (readonly Operation[])[],
): { workspace: Workspace; pending: Pending[] } {
  let current = workspace;
  const pending: Pending[] = [];
  for (const operations of entries) {
    const result = applyOperations(current, operations);
    if (!result.ok) continue;
    const ids = touched(operations);
    if (findInvariantViolation(current, result.workspace, ids) !== undefined)
      continue;
    current = result.workspace;
    pending.push({ operations, inverse: result.inverse });
  }
  return { workspace: current, pending };
}

// The unconfirmed changes the outbox kept for this workspace, taken out of
// it: the session that sends them keeps them again.
export async function takeOutbox(
  sync: Sync,
  workspaceId: string,
): Promise<(readonly Operation[])[]> {
  const outbox = reply.readOutbox(await sync.outbox.load());
  if (outbox?.workspaceId !== workspaceId) return [];
  await sync.outbox.save(undefined);
  return outbox.entries.flatMap((entry) => {
    const operations = parseWireOperations(entry);
    return operations === undefined ? [] : [operations];
  });
}
