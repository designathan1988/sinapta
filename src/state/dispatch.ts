// The only write path to the store: dispatch(command).
import {
  applyOperations,
  createBlockId,
  createPropertyId,
  createViewId,
  findInvariantViolation,
  type InvariantViolation,
  type OperationError,
  type Workspace,
} from "../model/index.ts";
import type { AppState } from "./app-state.ts";
import type {
  Command,
  CommandEffect,
  CommandMeta,
  CommandRegistry,
  NewIds,
} from "./command-registry.ts";
import {
  REDO_COMMAND,
  recordTransaction,
  travelHistory,
  UNDO_COMMAND,
} from "./history.ts";
import type { AppStore } from "./store.ts";
import { loadWorkspace } from "./workspace.commands.ts";

export type DispatchError =
  | { readonly kind: "unknown-command"; readonly type: string }
  | { readonly kind: "operation-failed"; readonly error: OperationError }
  | {
      readonly kind: "invariant-broken";
      readonly violation: InvariantViolation;
    }
  // Another tab holds the workspace for writing.
  | { readonly kind: "read-only" };

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

// A workspace that replaces the current one (a load, an import, the first
// run's pages) is checked whole: every block, and every id at the top level.
function findWholeWorkspaceViolation(
  workspace: Workspace,
): InvariantViolation | undefined {
  const ids = new Set([
    ...Object.values(workspace.blocks).map((block) => block.id),
    ...workspace.rootIds,
  ]);
  return findInvariantViolation(workspace, workspace, ids);
}

function applyEffect(
  state: AppState,
  effect: CommandEffect,
  now: string,
): Next {
  const operations = effect.operations ?? [];
  const ui = effect.ui ?? state.ui;
  const persistence = effect.persistence ?? state.persistence;
  if (effect.workspace !== undefined) {
    const violation = findWholeWorkspaceViolation(effect.workspace);
    if (violation !== undefined) {
      return { error: { kind: "invariant-broken", violation } };
    }
    const history = { undo: [], redo: [] };
    return { state: { workspace: effect.workspace, ui, history, persistence } };
  }
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
  const history = recordTransaction(state, {
    applied: operations,
    inverse: result.inverse,
    mergeKey: effect.mergeKey,
    now,
  });
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

function createMeta(sources: Sources, ids: NewIds): CommandMeta {
  const make = <TId>(count: number | undefined, create: () => TId): TId[] =>
    Array.from({ length: count ?? 0 }, create);
  return {
    now: sources.now(),
    blockIds: make(ids.blocks, sources.createId),
    viewIds: make(ids.views, createViewId),
    propertyIds: make(ids.properties, createPropertyId),
  };
}

// A read-only tab follows the writer tab: it reloads what that tab saved
// and keeps its own interface state, but writes no workspace data.
function isRefusedWhileReadOnly(
  state: AppState,
  command: Command,
  effect: CommandEffect,
): boolean {
  if (!state.persistence.isReadOnly) return false;
  if (effect.workspace !== undefined)
    return command.type !== loadWorkspace.type;
  return (effect.operations ?? []).length > 0;
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
  const meta = createMeta(sources, definition.newIdsFor(command));
  const effect = definition.handle(state, command, meta);
  if (isRefusedWhileReadOnly(state, command, effect)) {
    return { error: { kind: "read-only" } };
  }
  return applyEffect(state, effect, meta.now);
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
