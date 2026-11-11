// Whether an overlay of one database is the one open: its kind and the
// database it belongs to both match.
import type { AppState } from "../../state/index.ts";

// A column's menu, and the settings of its property opened from it; both
// sit by the column's menu button.
export const COLUMN_MENU_OVERLAY = "column-menu";
export const PROPERTY_EDIT_OVERLAY = "property-edit";

export interface DatabaseOverlay {
  readonly kind: string;
  readonly anchorId: string;
}

export function isOpenFor(state: AppState, overlay: DatabaseOverlay): boolean {
  const open = state.ui.overlay;
  return open?.kind === overlay.kind && open.anchorId === overlay.anchorId;
}
