// The page menu's "Updates & analytics", which docks the panel beside the
// page, or closes it when it is open on that page.
import type { BlockId } from "../../model/index.ts";
import {
  showPageUpdates,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuItem } from "../../ui/menu/index.ts";

export function updatesItem(
  state: AppState,
  pageId: BlockId,
  dispatch: Dispatch,
): MenuItem {
  const isOpen = state.ui.pageUpdates?.pageId === pageId;
  return {
    label: COPY.pageUpdates.open,
    icon: "chart",
    onSelect: () =>
      dispatch(showPageUpdates.create({ pageId: isOpen ? null : pageId })),
  };
}
