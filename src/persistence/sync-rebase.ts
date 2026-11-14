// Another client's operations arrive while some of this client's are not
// yet confirmed: those came after them on the server, so they are taken
// back, the others' applied, and they are made again (ADR-0013). Pure.
import {
  applyOperations,
  type Operation,
  type Workspace,
} from "../model/index.ts";

export interface Pending {
  // As sent to the server: updates carry the whole record.
  readonly operations: readonly Operation[];
  // What takes them back from the workspace as it is now.
  readonly inverse: readonly Operation[];
}

export interface Rebase {
  // One transaction for the store: back, theirs, again.
  readonly operations: readonly Operation[];
  // The pending transactions with what takes them back after it.
  readonly pending: readonly Pending[];
}

function takeBack(pending: readonly Pending[]): Operation[] {
  return [...pending].reverse().flatMap((entry) => entry.inverse);
}

// Undefined when the others' operations do not apply: the caller then
// reads the whole workspace again.
export function rebase(
  workspace: Workspace,
  pending: readonly Pending[],
  remote: readonly Operation[],
): Rebase | undefined {
  const back = takeBack(pending);
  const before = applyOperations(workspace, [...back, ...remote]);
  if (!before.ok) return undefined;
  let current = before.workspace;
  const kept: Pending[] = [];
  const again: Operation[] = [];
  for (const entry of pending) {
    const result = applyOperations(current, entry.operations);
    // A change the others' made impossible is dropped, as the server will.
    if (!result.ok) continue;
    current = result.workspace;
    kept.push({ operations: entry.operations, inverse: result.inverse });
    again.push(...entry.operations);
  }
  return { operations: [...back, ...remote, ...again], pending: kept };
}
