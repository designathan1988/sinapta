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

// Home shows while it is open and no page has been opened since: any
// command that opens a page, a new one included, replaces it.
export function selectIsHomeShown(state: AppState): boolean {
  return state.ui.isHomeOpen && state.ui.activePageId === null;
}
