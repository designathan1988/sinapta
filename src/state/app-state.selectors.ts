import type { Theme } from "../model/index.ts";
import type { AppState } from "./app-state.ts";

export function selectCanUndo(state: AppState): boolean {
  return state.history.undo.length > 0;
}

export function selectCanRedo(state: AppState): boolean {
  return state.history.redo.length > 0;
}

export function selectTheme(state: AppState): Theme {
  return state.workspace.settings.theme;
}
