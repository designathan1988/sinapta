// The sidebar's tabs: the one shown, the sections each holds ("Move to
// tab"), and the Calendar tab's upcoming pages, the dated pages of the
// views the owner manages in calendar, from today on.
import { selectDatabase } from "../../blocks/database/index.ts";
import {
  selectIsInTrash,
  selectPage,
  selectPageTitle,
} from "../../blocks/page/index.ts";
import type { BlockId, View } from "../../model/index.ts";
import type { AppState, SidebarTab } from "../../state/index.ts";
import { readDateValue } from "../database/index.ts";
import { selectSections } from "./sidebar-layout.selectors.ts";

export function selectSidebarTab(state: AppState): SidebarTab {
  return state.workspace.settings.sidebarTab ?? "home";
}

export function selectTabOfSection(state: AppState, key: string): SidebarTab {
  return state.workspace.settings.sectionTabs?.[key] ?? "home";
}

export function selectTabSections(state: AppState, tab: SidebarTab): string[] {
  return selectSections(state).filter(
    (key) => selectTabOfSection(state, key) === tab,
  );
}

export interface Upcoming {
  readonly pageId: BlockId;
  readonly title: string;
  readonly icon: string | null;
  readonly day: string;
}

// The date property a view's dates come from: its own, or the first.
function datePropertyOf(state: AppState, view: View): string | undefined {
  const database = selectDatabase(state, view.databaseId);
  const properties = database?.props.properties ?? [];
  return (
    view.datePropertyId ??
    properties.find((property) => property.type === "date")?.id
  );
}

function upcomingOf(state: AppState, view: View, today: string): Upcoming[] {
  const database = selectDatabase(state, view.databaseId);
  const propertyId = datePropertyOf(state, view);
  if (database === undefined || propertyId === undefined) return [];
  return database.childIds.flatMap((rowId) => {
    const row = selectPage(state, rowId);
    if (row === undefined || database.props.templateIds.includes(rowId))
      return [];
    if (selectIsInTrash(state, row)) return [];
    const day = readDateValue(row.props.values?.[propertyId])?.start;
    if (day === undefined || day < today) return [];
    const title = selectPageTitle(row);
    return [{ pageId: row.id, title, icon: row.props.icon, day }];
  });
}

// The managed views' pages from today on, soonest first, each once.
export function selectUpcoming(state: AppState, today: string): Upcoming[] {
  const seen = new Set<BlockId>();
  return (state.workspace.settings.calendarViewIds ?? [])
    .flatMap((id) => {
      const view = Object.values(state.workspace.views).find(
        (each) => each.id === id,
      );
      return view === undefined ? [] : upcomingOf(state, view, today);
    })
    .sort((a, b) => a.day.localeCompare(b.day))
    .filter((item) => !seen.has(item.pageId) && seen.add(item.pageId));
}
