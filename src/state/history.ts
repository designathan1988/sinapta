// Undo and redo. A history entry holds the operations that reverse one
// workspace transaction.
import { applyOperations, type Operation } from "../model/index.ts";
import type { AppState, HistoryEntry, HistoryState } from "./app-state.ts";

export const HISTORY_LIMIT = 200;
export const UNDO_COMMAND = "history.undo";
export const REDO_COMMAND = "history.redo";

// Settings changes (the theme) are not part of the undo history.
function isRecorded(operations: readonly Operation[]): boolean {
  return operations.some(
    (operation) =>
      operation.type !== "record.update" || operation.kind !== "settings",
  );
}

function entryFor(
  state: AppState,
  inverse: readonly Operation[],
): HistoryEntry {
  return {
    operations: inverse,
    selection: state.ui.selection,
    activePageId: state.ui.activePageId,
  };
}

// The history after a transaction whose inverse is `inverse`, applied to
// `before`.
export function recordTransaction(
  before: AppState,
  applied: readonly Operation[],
  inverse: readonly Operation[],
): HistoryState {
  if (!isRecorded(applied)) return before.history;
  const undo = [...before.history.undo, entryFor(before, inverse)];
  return { undo: undo.slice(-HISTORY_LIMIT), redo: [] };
}

type Direction = "undo" | "redo";

// Moves one entry from one stack to the other and applies it. Returns the
// same state when there is nothing to move.
export function travelHistory(state: AppState, direction: Direction): AppState {
  const from = state.history[direction];
  const entry = from.at(-1);
  if (entry === undefined) return state;
  const result = applyOperations(state.workspace, entry.operations);
  if (!result.ok) return state;
  const opposite: Direction = direction === "undo" ? "redo" : "undo";
  const history: HistoryState = {
    ...state.history,
    [direction]: from.slice(0, -1),
    [opposite]: [...state.history[opposite], entryFor(state, result.inverse)],
  };
  const ui = {
    ...state.ui,
    selection: entry.selection,
    activePageId: entry.activePageId,
  };
  return { ...state, workspace: result.workspace, ui, history };
}
