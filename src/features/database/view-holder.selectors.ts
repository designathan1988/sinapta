// What holds a set of views: a database, whose views are its own, or a
// linked view, which shows another database through views of its own.
import {
  selectDatabase,
  type DatabaseBlock,
} from "../../blocks/database/index.ts";
import {
  LINKED_VIEW_TYPE,
  type LinkedViewBlock,
  type LinkedViewProps,
} from "../../blocks/linked-view/index.ts";
import {
  isBlockOfType,
  type BlockId,
  type View,
  type ViewId,
} from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";

export interface ViewHolder {
  readonly holderId: BlockId;
  // The database whose rows the views show.
  readonly database: DatabaseBlock;
  readonly viewIds: readonly ViewId[];
}

export function selectLinkedProps(
  state: AppState,
  blockId: BlockId,
): LinkedViewProps | undefined {
  const block = state.workspace.blocks[blockId];
  return block !== undefined &&
    isBlockOfType<LinkedViewBlock>(block, LINKED_VIEW_TYPE)
    ? block.props
    : undefined;
}

export function selectViewHolder(
  state: AppState,
  holderId: BlockId | null,
): ViewHolder | undefined {
  if (holderId === null) return undefined;
  const own = selectDatabase(state, holderId);
  if (own !== undefined) {
    return { holderId, database: own, viewIds: own.props.viewIds };
  }
  const linked = selectLinkedProps(state, holderId);
  const database = selectDatabase(state, linked?.databaseId ?? null);
  if (linked === undefined || database === undefined) return undefined;
  return { holderId, database, viewIds: linked.viewIds };
}

// The view that is shown: the one chosen for the holder, or its first.
export function selectActiveView(
  state: AppState,
  holder: ViewHolder,
): View | undefined {
  const chosen = state.ui.activeViewIds[holder.holderId];
  const viewId =
    chosen !== undefined && holder.viewIds.includes(chosen)
      ? chosen
      : holder.viewIds[0];
  return viewId === undefined ? undefined : state.workspace.views[viewId];
}

// The holder of a view: its database, or the linked view that lists it.
export function selectHolderOfView(
  state: AppState,
  view: View,
): ViewHolder | undefined {
  const own = selectViewHolder(state, view.databaseId);
  if (own?.viewIds.includes(view.id)) return own;
  const linked = Object.values(state.workspace.blocks).find(
    (block) =>
      block.type === LINKED_VIEW_TYPE &&
      selectLinkedProps(state, block.id)?.viewIds.includes(view.id),
  );
  return linked === undefined ? undefined : selectViewHolder(state, linked.id);
}
