// A change the server makes itself (ADR-0013), as a teamspace's new member
// or a page an integration writes: logged in order like a client's, and
// sent to every client listening.
import type { Operation } from "../src/model/index.ts";
import type { ApiContext } from "./api.ts";
import { logOperations } from "./workspaces.ts";

export interface ServerChange {
  readonly workspaceId: string;
  // The person or integration the change is made for.
  readonly by: string;
  readonly clientId: string;
}

export function logServerChange(
  context: ApiContext,
  change: ServerChange,
  operations: readonly Operation[],
): number {
  const seq = logOperations(context, {
    workspaceId: change.workspaceId,
    userId: change.by,
    clientId: change.clientId,
    operations: [...operations],
  });
  context.events.publish(change.workspaceId, "operations", {
    seq,
    clientId: change.clientId,
    operations,
  });
  return seq;
}
