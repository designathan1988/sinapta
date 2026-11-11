import { selectPageTitle } from "../../blocks/page/index.ts";
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
import {
  PALETTE_OVERLAY_KIND,
  SETTINGS_OVERLAY_KIND,
  SHORTCUT_HELP_OVERLAY_KIND,
} from "../../ui/shortcuts/index.ts";
import { createPage, isPageLike } from "../../blocks/page/index.ts";
import { createDatabase } from "../database/index.ts";
import { TRASH_OVERLAY } from "../trash/index.ts";
import {
  foldQuery,
  selectTextMatches,
} from "./command-palette-text.selectors.ts";

export const PALETTE_OVERLAY = PALETTE_OVERLAY_KIND;
const PAGE_LIMIT = 8;

// One thing the palette can do: a label and the command it dispatches.
export interface PaletteItem {
  readonly label: string;
  readonly command: Command;
  // "content" is a page found by the text of its blocks.
  readonly kind: "page" | "content" | "action";
  // The text around the match, for a page found by its text.
  readonly detail?: string;
}

function actions(): PaletteItem[] {
  const action = (label: string, command: Command): PaletteItem => ({
    label,
    command,
    kind: "action",
  });
  const open = (kind: string): Command =>
    openOverlay.create({ overlay: { kind } });
  return [
    action(COPY.palette.newPage, createPage.create({ parentId: null })),
    action(COPY.palette.newDatabase, createDatabase.create({ parentId: null })),
    action(COPY.palette.settings, open(SETTINGS_OVERLAY_KIND)),
    action(COPY.shortcutHelp.open, open(SHORTCUT_HELP_OVERLAY_KIND)),
    action(COPY.palette.trash, open(TRASH_OVERLAY)),
    action(COPY.palette.export, requestExport.create({})),
    action(COPY.palette.themeLight, setTheme.create({ theme: "light" })),
    action(COPY.palette.themeDark, setTheme.create({ theme: "dark" })),
    action(COPY.palette.themeSystem, setTheme.create({ theme: "system" })),
    action(COPY.palette.toggleSidebar, toggleSidebar.create({})),
    action(COPY.palette.undo, { type: UNDO_COMMAND }),
    action(COPY.palette.redo, { type: REDO_COMMAND }),
  ];
}

// Every page and row that is not in the trash, by title.
function pages(state: AppState): PaletteItem[] {
  return Object.values(state.workspace.blocks).flatMap(
    (block): PaletteItem[] => {
      if (!isPageLike(block) || block.props.isTrashed) return [];
      const title = selectPageTitle(block);
      const label = `${block.props.icon ?? ""} ${title === "" ? COPY.sidebar.untitled : title}`;
      const command = setActivePage.create({ pageId: block.id });
      return [{ label: label.trim(), command, kind: "page" }];
    },
  );
}

// What the palette lists for a query: pages whose title matches, then
// pages whose text matches, then matching actions. An empty query lists the actions only.
export function selectPaletteItems(
  state: AppState,
  query: string,
): PaletteItem[] {
  const needle = foldQuery(query.trim());
  const matches = (item: PaletteItem): boolean =>
    foldQuery(item.label).includes(needle);
  if (needle === "") return actions();
  const found = pages(state)
    .filter(matches)
    .sort((a, b) => a.label.localeCompare(b.label, "en-US"))
    .slice(0, PAGE_LIMIT);
  const titled = new Set(found.map((item) => item.label));
  const inText = selectTextMatches(state, needle, PAGE_LIMIT)
    .filter((match) => !titled.has(match.label))
    .map((match): PaletteItem => ({ ...match, kind: "content" }));
  return [...found, ...inText, ...actions().filter(matches)];
}
