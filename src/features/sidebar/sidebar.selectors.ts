import {
  DATABASE_TYPE,
  selectPage,
  selectPageTitle,
} from "../../blocks/page/index.ts";
import { selectDatabase } from "../../blocks/database/index.ts";
import type { BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";

// One visible row of the page tree.
export interface TreeRow {
  readonly id: BlockId;
  readonly title: string;
  readonly icon: string | null;
  // A database shows a table glyph when it has no icon.
  readonly isDatabase: boolean;
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

// A data source added to a database lives inside it, as Notion's, while
// that database still lists it.
function isKeptInside(state: AppState, id: BlockId): boolean {
  const owner = selectDatabase(state, id)?.props.sourceOf;
  if (owner === undefined) return false;
  const sources = selectDatabase(state, owner)?.props.sourceIds ?? [];
  return sources.includes(id);
}

function addRows(state: AppState, walk: Walk, rows: TreeRow[]): void {
  for (const id of walk.ids) {
    const page = selectPage(state, id);
    if (page === undefined || page.props.isTrashed) continue;
    if (isKeptInside(state, id)) continue;
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
      isDatabase: page.type === DATABASE_TYPE,
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
// The workspace's top pages under Private, or those shared with people
// under Shared (ADR-0013).
export function selectTreeRows(
  state: AppState,
  section: "private" | "shared" = "private",
): TreeRow[] {
  const shared = new Set(state.persistence.sync.shared);
  const ids = state.workspace.rootIds.filter(
    (id) => shared.has(id) === (section === "shared"),
  );
  const rows: TreeRow[] = [];
  addRows(state, { ids, level: 1 }, rows);
  return withTabStop(rows);
}

// Each tree is one stop for Tab: the open page's row, else its first.
function withTabStop(rows: readonly TreeRow[]): TreeRow[] {
  const tabStop = Math.max(
    0,
    rows.findIndex((row) => row.isActive),
  );
  return rows.map((row, index) => ({ ...row, isTabStop: index === tabStop }));
}

// The rows of the given pages at a level, with their open children: the
// pages of a teamspace under its row.
export function selectPageRows(
  state: AppState,
  ids: readonly BlockId[],
  level: number,
): TreeRow[] {
  const rows: TreeRow[] = [];
  addRows(state, { ids, level }, rows);
  return withTabStop(rows);
}
