// What joining a workspace makes again (ADR-0013): the operations logged
// since the server's snapshot, and this browser's transactions the server
// never confirmed.
import {
  applyOperations,
  parseWireOperations,
  type Workspace,
} from "../model/index.ts";
import { replayOffline } from "../state/index.ts";
import type { Sync } from "./sync-session.ts";
import * as reply from "./sync.schema.ts";

export function withLogged(
  workspace: Workspace,
  logged: readonly reply.Logged[],
): { workspace: Workspace; seq: number | undefined } {
  let current = workspace;
  for (const entry of logged) {
    const operations = parseWireOperations(entry.operations) ?? [];
    const result = applyOperations(current, operations);
    if (result.ok) current = result.workspace;
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
