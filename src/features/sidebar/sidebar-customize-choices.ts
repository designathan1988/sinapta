// What "Add shortcut" and "Add section" offer in "Customize sidebar": the
// pages to pin, the built-in shortcuts not shown, and the database views
// not kept in the sidebar yet.
import { DATABASE_TYPE, isPageLike } from "../../blocks/page/index.ts";
import { selectIsInTrash, selectPageTitle } from "../../blocks/page/index.ts";
import {
  addSidebarView,
  setSidebarSections,
  setSidebarShortcuts,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuEntry } from "../../ui/menu/index.ts";
import { LAYOUT_ICONS } from "../database/index.ts";
import {
  pageShortcutKey,
  selectSections,
  selectShortcuts,
  viewSectionKey,
} from "./sidebar-layout.selectors.ts";

interface Context {
  readonly state: AppState;
  readonly dispatch: Dispatch;
}

export function pageChoices(context: Context): MenuEntry[] {
  const { state, dispatch } = context;
  const keys = selectShortcuts(state);
  return Object.values(state.workspace.blocks).flatMap((block) => {
    if (!isPageLike(block) || selectIsInTrash(state, block)) return [];
    const key = pageShortcutKey(block.id);
    if (keys.includes(key)) return [];
    const title = selectPageTitle(block);
    return [
      {
        label: title === "" ? COPY.sidebar.untitled : title,
        icon: block.type === DATABASE_TYPE ? "database" : "page",
        onSelect: () =>
          dispatch(setSidebarShortcuts.create({ keys: [...keys, key] })),
      },
    ];
  });
}

// A built-in shortcut to add, unless the sidebar shows it already.
export function builtInChoice(
  context: Context,
  key: string,
  look: { label: string; icon: "compose" | "table" | "settings" },
): MenuEntry[] {
  const keys = selectShortcuts(context.state);
  if (keys.includes(key)) return [];
  return [
    {
      ...look,
      onSelect: () => {
        context.dispatch(setSidebarShortcuts.create({ keys: [...keys, key] }));
      },
    },
  ];
}

export function viewChoices(context: Context): MenuEntry[] {
  const { state, dispatch } = context;
  const keys = selectSections(state);
  return Object.values(state.workspace.views).flatMap((view) => {
    const key = viewSectionKey(view.id);
    const database = state.workspace.blocks[view.databaseId];
    if (keys.includes(key) || database === undefined) return [];
    if (!isPageLike(database) || selectIsInTrash(state, database)) return [];
    const title = selectPageTitle(database);
    return [
      {
        label: `${title === "" ? COPY.database.untitled : title} · ${view.name}`,
        icon: LAYOUT_ICONS[view.type],
        onSelect: () => {
          dispatch(addSidebarView.create({ viewId: view.id }));
          dispatch(setSidebarSections.create({ keys: [...keys, key] }));
        },
      },
    ];
  });
}
