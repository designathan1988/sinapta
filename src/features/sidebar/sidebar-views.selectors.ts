// What a view kept in the sidebar shows: its section's name, the database
// it reads and the views it could show instead.
import { selectPageTitle } from "../../blocks/page/index.ts";
import type { BlockId, SidebarView, ViewId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { selectHolderOfView } from "../database/index.ts";

export interface Section {
  readonly entry: SidebarView;
  readonly name: string;
  readonly databaseId: BlockId;
  readonly databaseName: string;
  // The views of the database, or of the linked view, the view is one of.
  readonly viewIds: readonly ViewId[];
  // True when the view is the database's own, not a linked view's.
  readonly isOwnView: boolean;
}

export function selectSection(
  state: AppState,
  entry: SidebarView,
): Section | undefined {
  const view = state.workspace.views[entry.viewId];
  const holder =
    view === undefined ? undefined : selectHolderOfView(state, view);
  if (holder === undefined) return undefined;
  const title = selectPageTitle(holder.database);
  const databaseName = title === "" ? COPY.database.untitled : title;
  return {
    entry,
    name: entry.name ?? databaseName,
    databaseId: holder.database.id,
    databaseName,
    viewIds: holder.viewIds,
    isOwnView: holder.holderId === holder.database.id,
  };
}
