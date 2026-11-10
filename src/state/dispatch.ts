// The only write path to the store: dispatch(command).
import {
  applyOperations,
  createBlockId,
  findInvariantViolation,
  type InvariantViolation,
  type OperationError,
} from "../model/index.ts";
import type { AppState } from "./app-state.ts";
import type {
  Command,
  CommandEffect,
  CommandMeta,
  CommandRegistry,
} from "./command-registry.ts";
import {
  REDO_COMMAND,
  recordTransaction,
  travelHistory,
  UNDO_COMMAND,
} from "./history.ts";
import type { AppStore } from "./store.ts";

export type DispatchError =
  | { readonly kind: "unknown-command"; readonly type: string }
  | { readonly kind: "operation-failed"; readonly error: OperationError }
  | {
      readonly kind: "invariant-broken";
      readonly violation: InvariantViolation;
    };

export type DispatchResult =
  { readonly ok: true } | { readonly ok: false; readonly error: DispatchError };

export type Dispatch = (command: Command) => DispatchResult;

export interface DispatcherOptions {
  readonly store: AppStore;
  readonly registry: CommandRegistry;
  // Injected so that tests are deterministic.
  readonly now?: () => string;
  readonly createId?: typeof createBlockId;
}

type Next = { readonly state: AppState } | { readonly error: DispatchError };

function applyEffect(state: AppState, effect: CommandEffect): Next {
  const operations = effect.operations ?? [];
  const ui = effect.ui ?? state.ui;
  const persistence = effect.persistence ?? state.persistence;
  if (operations.length === 0) return { state: { ...state, ui, persistence } };
  const result = applyOperations(state.workspace, operations);
  if (!result.ok) {
    return { error: { kind: "operation-failed", error: result.error } };
  }
  const violation = findInvariantViolation(
    state.workspace,
    result.workspace,
    result.changed.blockIds,
  );
  if (violation !== undefined) {
    return { error: { kind: "invariant-broken", violation } };
  }
  const history = recordTransaction(state, operations, result.inverse);
  return {
    state: { workspace: result.workspace, ui, history, persistence },
  };
}

function isSameState(a: AppState, b: AppState): boolean {
  return (
    a.workspace === b.workspace &&
    a.ui === b.ui &&
    a.history === b.history &&
    a.persistence === b.persistence
  );
}

interface Sources {
  readonly registry: CommandRegistry;
  readonly now: () => string;
  readonly createId: typeof createBlockId;
}

function nextState(state: AppState, command: Command, sources: Sources): Next {
  if (command.type === UNDO_COMMAND) {
    return { state: travelHistory(state, "undo") };
  }
  if (command.type === REDO_COMMAND) {
    return { state: travelHistory(state, "redo") };
  }
  const definition = sources.registry.get(command.type);
  if (definition === undefined) {
    return { error: { kind: "unknown-command", type: command.type } };
  }
  const meta: CommandMeta = {
    now: sources.now(),
    blockIds: Array.from({ length: definition.newBlockIds }, sources.createId),
  };
  return applyEffect(state, definition.handle(state, command, meta));
}

export function createDispatcher(options: DispatcherOptions): Dispatch {
  const { store } = options;
  const sources: Sources = {
    registry: options.registry,
    now: options.now ?? (() => new Date().toISOString()),
    createId: options.createId ?? createBlockId,
  };
  let isNotifying = false;

  return function dispatch(command) {
    if (isNotifying) {
      throw new Error(
        `"${command.type}" was dispatched while subscribers were being notified.`,
      );
    }
    const state = store.getState();
    const result = nextState(state, command, sources);
    if ("error" in result) return { ok: false, error: result.error };
    if (isSameState(state, result.state)) return { ok: true };
    isNotifying = true;
    try {
      store.setState(result.state, true);
    } finally {
      isNotifying = false;
    }
    return { ok: true };
  };
}
