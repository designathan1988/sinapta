// What cells need from the workspace besides their values: the addresses
// of kept files and the titles of pages that are shown.
import {
  isPageLike,
  selectIsInTrash,
  selectPageTitle,
} from "../../blocks/page/index.ts";
import { parseBlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import type { CellContext } from "./property-definition.ts";

export function selectCellContext(state: AppState): CellContext {
  return {
    assetUrls: state.persistence.assetUrls,
    titleOf(pageId) {
      const id = parseBlockId(pageId);
      const page = id === undefined ? undefined : state.workspace.blocks[id];
      if (page === undefined || !isPageLike(page)) return undefined;
      return selectIsInTrash(state, page) ? undefined : selectPageTitle(page);
    },
  };
}
