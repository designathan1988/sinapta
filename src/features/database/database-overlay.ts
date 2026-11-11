// Whether an overlay of one database is the one open: its kind and the
// database it belongs to both match.
import type { AppState } from "../../state/index.ts";

export interface DatabaseOverlay {
  readonly kind: string;
  readonly anchorId: string;
}

export function isOpenFor(state: AppState, overlay: DatabaseOverlay): boolean {
  const open = state.ui.overlay;
  return open?.kind === overlay.kind && open.anchorId === overlay.anchorId;
}
