// The menus of "Customize sidebar", as Notion's: a row's (Move up, Move
// down, and Show for a section that lists pages), "Add shortcut" (Create:
// New page, New database; Go to: Page, Settings) and "Add section" (a
// database view, or a section left out).
import { type TemplateResult } from "lit-html";
import {
  closeChildOverlay,
  setOverlayQuery,
  setFavoritesLimit,
  setSidebarSections,
  setSidebarShortcuts,
  setSidebarView,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderMenu, type MenuEntry } from "../../ui/menu/index.ts";
import {
  movedKeys,
  sectionViewId,
  selectHiddenSections,
  selectSections,
  selectShortcuts,
} from "./sidebar-layout.selectors.ts";
import {
  builtInChoice,
  pageChoices,
  viewChoices,
} from "./sidebar-customize-choices.ts";
import { builtInSectionLook } from "./sidebar-section-look.ts";

const TEXT = COPY.sidebarCustomize;
const LIMITS = [5, 10, 15, 20] as const;

interface Context {
  readonly state: AppState;
  readonly dispatch: Dispatch;
}

// What is typed into the open menu's search field: a menu of the mode is
// a list opened inside it, which keeps its own query.
function childQuery(state: AppState): string {
  return state.ui.overlay?.children?.at(-1)?.query ?? "";
}

function closeChild(context: Context): void {
  context.dispatch(closeChildOverlay.create({ depth: 0 }));
}

interface ChildMenu {
  readonly label: string;
  readonly items: readonly MenuEntry[];
  readonly searchPlaceholder?: string;
}

function childMenu(context: Context, menu: ChildMenu): TemplateResult {
  const { label, items, searchPlaceholder } = menu;
  const { state, dispatch } = context;
  return renderMenu({
    label,
    isChild: true,
    items,
    ...(searchPlaceholder !== undefined && {
      search: {
        placeholder: searchPlaceholder,
        query: childQuery(state),
        onQuery: (query: string) => {
          dispatch(setOverlayQuery.create({ query }));
        },
      },
    }),
    onClose: () => {
      closeChild(context);
    },
    context: { overlay: context.state.ui.overlay, dispatch: context.dispatch },
  });
}

function moveItems(
  keys: readonly string[],
  key: string,
  apply: (next: readonly string[]) => void,
): MenuEntry[] {
  const index = keys.indexOf(key);
  const move = (by: -1 | 1, label: string, icon: "up" | "down") =>
    keys[index + by] === undefined
      ? []
      : [
          {
            label,
            icon,
            onSelect: () => {
              apply(movedKeys(keys, key, by));
            },
          },
        ];
  return [...move(-1, TEXT.moveUp, "up"), ...move(1, TEXT.moveDown, "down")];
}

export function renderShortcutMenu(
  context: Context,
  key: string,
): TemplateResult {
  const keys = selectShortcuts(context.state);
  const apply = (next: readonly string[]) =>
    context.dispatch(setSidebarShortcuts.create({ keys: next }));
  return childMenu(context, {
    label: TEXT.shortcutMenu,
    items: moveItems(keys, key, apply),
  });
}

// "Show": how many pages a section lists, for favorites and kept views.
function showItem(context: Context, key: string): MenuEntry[] {
  const { state, dispatch } = context;
  const viewId = sectionViewId(state, key);
  const kept = (state.workspace.settings.sidebarViews ?? []).find(
    (entry) => entry.viewId === viewId,
  );
  if (key !== "favorites" && kept === undefined) return [];
  const current =
    kept === undefined ? state.workspace.settings.favoritesLimit : kept.limit;
  const pick = (limit: (typeof LIMITS)[number]) =>
    viewId === undefined
      ? dispatch(setFavoritesLimit.create({ limit }))
      : dispatch(setSidebarView.create({ viewId, changes: { limit } }));
  const items = LIMITS.map((limit): MenuEntry => ({
    label: String(limit),
    check: "radio",
    isChecked: limit === (current ?? (viewId === undefined ? 0 : 5)),
    onSelect: () => pick(limit),
  }));
  return [
    {
      label: TEXT.show,
      icon: "number",
      value: current === undefined ? TEXT.allFavorites : String(current),
      submenu: {
        id: `sidebar-show-${key}`,
        menu: () => ({ label: TEXT.show, items }),
      },
    },
  ];
}

export function renderSectionMenu(
  context: Context,
  key: string,
): TemplateResult {
  const keys = selectSections(context.state);
  const apply = (next: readonly string[]) =>
    context.dispatch(setSidebarSections.create({ keys: next }));
  return childMenu(context, {
    label: TEXT.sectionMenu,
    items: [...showItem(context, key), ...moveItems(keys, key, apply)],
  });
}

// A titled group of rows, left out when it has none.
function group(label: string, rows: readonly MenuEntry[]): MenuEntry[] {
  return rows.length === 0 ? [] : [{ kind: "section", label }, ...rows];
}

function isSearching(context: Context): boolean {
  return childQuery(context.state).trim() !== "";
}

export function renderAddShortcutMenu(context: Context): TemplateResult {
  const pages = pageChoices(context);
  const pageRow: MenuEntry = {
    label: TEXT.page,
    icon: "page",
    submenu: {
      id: "sidebar-add-page",
      menu: () => ({ label: TEXT.page, items: pages }),
    },
  };
  const items = [
    ...group(TEXT.create, [
      ...builtInChoice(context, "new-page", {
        label: COPY.sidebar.newPage,
        icon: "compose",
      }),
      ...builtInChoice(context, "new-database", {
        label: COPY.database.newDatabase,
        icon: "table",
      }),
    ]),
    ...group(TEXT.goTo, [
      ...(isSearching(context) ? pages : [pageRow]),
      ...builtInChoice(context, "settings", {
        label: TEXT.settings,
        icon: "settings",
      }),
    ]),
  ];
  return childMenu(context, {
    label: TEXT.addShortcut,
    items,
    searchPlaceholder: TEXT.searchShortcuts,
  });
}

export function renderAddSectionMenu(context: Context): TemplateResult {
  const { state, dispatch } = context;
  const keys = selectSections(state);
  const views = viewChoices(context);
  const hidden = selectHiddenSections(state).map((key): MenuEntry => {
    const look = builtInSectionLook(key);
    return {
      label: look.label,
      icon: look.icon,
      onSelect: () =>
        dispatch(setSidebarSections.create({ keys: [...keys, key] })),
    };
  });
  const viewRow: MenuEntry = {
    label: TEXT.databaseView,
    icon: "table",
    submenu: {
      id: "sidebar-add-view",
      menu: () => ({ label: TEXT.databaseView, items: views }),
    },
  };
  const items = [
    ...group(TEXT.pages, isSearching(context) ? views : [viewRow]),
    ...group(TEXT.sidebarSections, hidden),
  ];
  return childMenu(context, {
    label: TEXT.addSection,
    items,
    searchPlaceholder: TEXT.searchSections,
  });
}
