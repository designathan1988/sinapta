import {
  DATABASE_TYPE,
  selectPage,
  selectPageTitle,
} from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";

// One visible row of the page tree.
export interface TreeRow {
  readonly id: BlockId;
  readonly title: string;
  readonly icon: string | null;
  // 1 for a top-level page.
  readonly level: number;
  readonly hasChildren: boolean;
  readonly isExpanded: boolean;
  readonly isActive: boolean;
  // The one row reachable with Tab; arrow keys move between rows.
  readonly isTabStop: boolean;
}

interface Walk {
  readonly ids: readonly BlockId[];
  readonly level: number;
}

function addRows(state: AppState, walk: Walk, rows: TreeRow[]): void {
  for (const id of walk.ids) {
    const page = selectPage(state, id);
    if (page === undefined || page.props.isTrashed) continue;
    // The rows of a database are shown in its table, not in the tree.
    const childIds = page.type === DATABASE_TYPE ? [] : page.childIds;
    const childPageIds = childIds.filter((childId) => {
      const child = selectPage(state, childId);
      return child !== undefined && !child.props.isTrashed;
    });
    const isExpanded = state.ui.expandedPageIds.includes(id);
    rows.push({
      id,
      title: selectPageTitle(page),
      icon: page.props.icon,
      level: walk.level,
      hasChildren: childPageIds.length > 0,
      isExpanded,
      isActive: state.ui.activePageId === id,
      isTabStop: false,
    });
    if (isExpanded) {
      addRows(state, { ids: childPageIds, level: walk.level + 1 }, rows);
    }
  }
}

// The rows the sidebar shows, in order: pages, with the children of
// expanded pages, without trashed pages.
export function selectTreeRows(state: AppState): TreeRow[] {
  const rows: TreeRow[] = [];
  addRows(state, { ids: state.workspace.rootIds, level: 1 }, rows);
  const tabStop = Math.max(
    0,
    rows.findIndex((row) => row.isActive),
  );
  return rows.map((row, index) => ({ ...row, isTabStop: index === tabStop }));
}
