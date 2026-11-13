import type { BlockId, ViewId } from "../../model/index.ts";
import type { AppState, UiState } from "../../state/index.ts";

// Opens a template to be written: over the view it came from, in the
// center peek, as Notion's; without a view, as its own page.
export function openingTemplate(
  state: AppState,
  pageId: BlockId,
  viewId: ViewId | undefined,
): UiState {
  if (viewId === undefined) {
    return { ...state.ui, activePageId: pageId, activeCell: null, peek: null };
  }
  const peek = { pageId, viewId, mode: "center" as const };
  return { ...state.ui, activeCell: null, peek };
}
