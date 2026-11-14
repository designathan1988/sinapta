import { stampAuthor, type Operation } from "../model/index.ts";
import type { AppState } from "./app-state.ts";
import type { CommandEffect } from "./command-registry.ts";

// The transaction's operations, stamped with the signed-in person; the
// others' come stamped already.
export function authored(
  state: AppState,
  effect: CommandEffect,
): readonly Operation[] {
  const operations = effect.operations ?? [];
  const { user } = state.persistence.account;
  if (effect.isRemote === true || user === null) return operations;
  return stampAuthor(operations, { id: user.id, name: user.name });
}
