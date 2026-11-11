// The rows a peek steps through: those of the view it came from, in that
// view's order, and where the peeked row is among them.
import type { BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { selectTableModel } from "../database/index.ts";

export function selectPeekRows(state: AppState): readonly BlockId[] {
  const { peek } = state.ui;
  const view = peek === null ? undefined : state.workspace.views[peek.viewId];
  if (view === undefined) return [];
  const model = selectTableModel(state, view.databaseId);
  return model?.rows.map((row) => row.id) ?? [];
}

export interface PeekPlace {
  readonly hasPrevious: boolean;
  readonly hasNext: boolean;
}

export function selectPeekPlace(state: AppState): PeekPlace {
  const rows = selectPeekRows(state);
  const { peek } = state.ui;
  const index = peek === null ? -1 : rows.indexOf(peek.pageId);
  return {
    hasPrevious: index > 0,
    hasNext: index !== -1 && index < rows.length - 1,
  };
}
