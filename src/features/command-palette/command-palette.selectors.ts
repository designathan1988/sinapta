import {
  isPageLike,
  selectPage,
  type PageBlock,
} from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import {
  openOverlay,
  REDO_COMMAND,
  requestExport,
  setActivePage,
  setTheme,
  toggleSidebar,
  UNDO_COMMAND,
  type AppState,
  type Command,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { IconName } from "../../ui/icon/index.ts";
import {
  PALETTE_OVERLAY_KIND,
  SETTINGS_OVERLAY_KIND,
  SHORTCUT_HELP_OVERLAY_KIND,
} from "../../ui/shortcuts/index.ts";
import { createPage } from "../../blocks/page/index.ts";
import { createDatabase } from "../database/index.ts";
import { TRASH_OVERLAY } from "../trash/index.ts";
import {
  foldQuery,
  selectTextMatches,
} from "./command-palette-text.selectors.ts";
import {
  selectPagePath,
  titleOf,
} from "./command-palette-preview.selectors.ts";

export const PALETTE_OVERLAY = PALETTE_OVERLAY_KIND;
const PAGE_LIMIT = 8;
const RECENT_LIMIT = 8;

// One thing the palette can do: a label and the command it dispatches.
export interface PaletteItem {
  readonly label: string;
  readonly command: Command;
  // "content" is a page found by the text of its blocks.
  readonly kind: "page" | "content" | "action";
  // The list it shows under: recent pages, found pages, or actions.
  readonly section: "recent" | "pages" | "actions";
  // An action's own icon.
  readonly glyph?: IconName;
  readonly pageId?: BlockId;
  readonly icon?: string | null;
  // The pages it is in, outermost first.
  readonly path?: string;
  // The text around the match, for a page found by its text, and where
  // the match is in it.
  readonly detail?: string;
  readonly match?: { readonly start: number; readonly length: number };
  // Where the page opens: at the block that matched.
  readonly href?: string;
}

// How the search narrows, as Notion's filters.
export interface PaletteOptions {
  readonly isTitleOnly?: boolean;
}

function pageItem(
  state: AppState,
  page: PageBlock,
  section: PaletteItem["section"],
): PaletteItem {
  return {
    label: titleOf(page),
    command: setActivePage.create({ pageId: page.id }),
    kind: "page",
    section,
    pageId: page.id,
    icon: page.props.icon,
    path: selectPagePath(state, page),
  };
}

// The pages opened last, newest first.
function recents(state: AppState): PaletteItem[] {
  return state.ui.recentPageIds
    .flatMap((id) => {
      const page = selectPage(state, id);
      return page === undefined || page.props.isTrashed ? [] : [page];
    })
    .slice(0, RECENT_LIMIT)
    .map((page) => pageItem(state, page, "recent"));
}

// An action's row: its words, its command and its own icon.
function action(label: string, command: Command, glyph: IconName): PaletteItem {
  return { label, command, glyph, kind: "action", section: "actions" };
}

function actions(): PaletteItem[] {
  const open = (kind: string): Command =>
    openOverlay.create({ overlay: { kind } });
  return [
    action(
      COPY.palette.newPage,
      createPage.create({ parentId: null }),
      "compose",
    ),
    action(
      COPY.palette.newDatabase,
      createDatabase.create({ parentId: null }),
      "table",
    ),
    action(COPY.palette.settings, open(SETTINGS_OVERLAY_KIND), "settings"),
    action(COPY.shortcutHelp.open, open(SHORTCUT_HELP_OVERLAY_KIND), "help"),
    action(COPY.palette.trash, open(TRASH_OVERLAY), "trash"),
    action(COPY.palette.export, requestExport.create({}), "download"),
    action(COPY.palette.themeLight, setTheme.create({ theme: "light" }), "sun"),
    action(COPY.palette.themeDark, setTheme.create({ theme: "dark" }), "moon"),
    action(
      COPY.palette.themeSystem,
      setTheme.create({ theme: "system" }),
      "monitor",
    ),
    action(COPY.palette.toggleSidebar, toggleSidebar.create({}), "sidebar"),
    action(COPY.palette.undo, { type: UNDO_COMMAND }, "restore"),
    action(COPY.palette.redo, { type: REDO_COMMAND }, "redo"),
  ];
}

// Every page and row that is not in the trash, by title.
function pages(state: AppState): PaletteItem[] {
  return Object.values(state.workspace.blocks).flatMap((block) =>
    isPageLike(block) && !block.props.isTrashed
      ? [pageItem(state, block, "pages")]
      : [],
  );
}

function contentItems(state: AppState, needle: string): PaletteItem[] {
  return selectTextMatches(state, needle, PAGE_LIMIT).map((found) => ({
    ...pageItem(state, found.page, "pages"),
    kind: "content",
    detail: found.detail,
    match: found.match,
    href: found.href,
  }));
}

// What the palette lists for a query: pages whose title matches, then
// pages whose text matches, then matching actions. An empty query lists
// the recent pages, then the actions.
export function selectPaletteItems(
  state: AppState,
  query: string,
  options: PaletteOptions = {},
): PaletteItem[] {
  const needle = foldQuery(query.trim());
  if (needle === "") return [...recents(state), ...actions()];
  const matches = (item: PaletteItem): boolean =>
    foldQuery(item.label).includes(needle);
  const found = pages(state)
    .filter(matches)
    .sort((a, b) => a.label.localeCompare(b.label, "en-US"))
    .slice(0, PAGE_LIMIT);
  const titled = new Set(found.map((item) => item.pageId));
  const inText =
    options.isTitleOnly === true
      ? []
      : contentItems(state, needle).filter((item) => !titled.has(item.pageId));
  return [...found, ...inText, ...actions().filter(matches)];
}
