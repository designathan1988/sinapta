// The sidebar's shortcuts and sections in the order the owner arranged
// them in "Customize sidebar", those hidden left out; Notion's defaults
// until arranged. A page shortcut is "page:<id>", a view's section
// "view:<id>".
import { isPageLike, selectIsInTrash } from "../../blocks/page/index.ts";
import { parseBlockId, parseViewId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";

export const BUILT_IN_SHORTCUTS = [
  "new-page",
  "new-database",
  "settings",
] as const;
export type BuiltInShortcut = (typeof BUILT_IN_SHORTCUTS)[number];
const DEFAULT_SHORTCUTS: readonly string[] = ["new-page", "new-database"];

export const BUILT_IN_SECTIONS = ["favorites", "private"] as const;
export type BuiltInSection = (typeof BUILT_IN_SECTIONS)[number];

const PAGE_PREFIX = "page:";
const VIEW_PREFIX = "view:";

export function pageShortcutKey(pageId: string): string {
  return `${PAGE_PREFIX}${pageId}`;
}

export function viewSectionKey(viewId: string): string {
  return `${VIEW_PREFIX}${viewId}`;
}

// The page a shortcut opens, when it is one still outside the trash.
export function shortcutPageId(state: AppState, key: string) {
  if (!key.startsWith(PAGE_PREFIX)) return undefined;
  const pageId = parseBlockId(key.slice(PAGE_PREFIX.length));
  const page =
    pageId === undefined ? undefined : state.workspace.blocks[pageId];
  if (page === undefined || !isPageLike(page)) return undefined;
  return selectIsInTrash(state, page) ? undefined : page.id;
}

// The view a section shows, when it is one kept in the sidebar.
export function sectionViewId(state: AppState, key: string) {
  if (!key.startsWith(VIEW_PREFIX)) return undefined;
  const viewId = parseViewId(key.slice(VIEW_PREFIX.length));
  const kept = state.workspace.settings.sidebarViews ?? [];
  return kept.some((entry) => entry.viewId === viewId) ? viewId : undefined;
}

function isBuiltIn<T extends string>(
  list: readonly T[],
  key: string,
): key is T {
  return list.some((item) => item === key);
}

export function selectShortcuts(state: AppState): readonly string[] {
  const stored = state.workspace.settings.sidebarShortcuts;
  return (stored ?? DEFAULT_SHORTCUTS).filter(
    (key) =>
      isBuiltIn(BUILT_IN_SHORTCUTS, key) ||
      shortcutPageId(state, key) !== undefined,
  );
}

// The sections in order: those arranged, then any view kept in the
// sidebar since, which goes last, as Notion adds it.
export function selectSections(state: AppState): readonly string[] {
  const { sidebarSections, sidebarViews } = state.workspace.settings;
  const arranged = (sidebarSections ?? BUILT_IN_SECTIONS).filter(
    (key) =>
      isBuiltIn(BUILT_IN_SECTIONS, key) ||
      sectionViewId(state, key) !== undefined,
  );
  const added = (sidebarViews ?? [])
    .map((entry) => viewSectionKey(entry.viewId))
    .filter((key) => !arranged.includes(key));
  return [...arranged, ...added];
}

// The built-in sections left out, which "Add section" offers again.
export function selectHiddenSections(
  state: AppState,
): readonly BuiltInSection[] {
  const shown = selectSections(state);
  return BUILT_IN_SECTIONS.filter((key) => !shown.includes(key));
}

// The order with one key moved a place up or down.
export function movedKeys(
  keys: readonly string[],
  key: string,
  by: -1 | 1,
): readonly string[] {
  const from = keys.indexOf(key);
  const to = from + by;
  if (from === -1 || to < 0 || to >= keys.length) return keys;
  const next = keys.filter((other) => other !== key);
  next.splice(to, 0, key);
  return next;
}

// The order with one key dropped onto another's place.
export function droppedKeys(
  keys: readonly string[],
  moved: string,
  onto: string,
): readonly string[] {
  if (moved === onto || !keys.includes(moved) || !keys.includes(onto)) {
    return keys;
  }
  const next = keys.filter((key) => key !== moved);
  next.splice(keys.indexOf(onto), 0, moved);
  return next;
}
