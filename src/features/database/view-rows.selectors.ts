// The rows of any view, filtered and sorted as it says, whether or not it
// is the one shown: a view kept in the sidebar lists its first pages.
import type { ViewId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { selectRows } from "./row-values.selectors.ts";
import {
  sortedAndFiltered,
  titleProperty,
  type TableRow,
} from "./table-model.selectors.ts";
import { selectHolderOfView } from "./view-holder.selectors.ts";

export function selectViewRows(
  state: AppState,
  viewId: ViewId,
  today = "",
): readonly TableRow[] {
  const view = state.workspace.views[viewId];
  const holder =
    view === undefined ? undefined : selectHolderOfView(state, view);
  const title = titleProperty();
  if (view === undefined || holder === undefined || title === undefined) {
    return [];
  }
  const { database } = holder;
  const data = selectRows({ state, today }, database);
  const properties = [title, ...database.props.properties];
  return sortedAndFiltered(data, { view, properties, today, state });
}
