import "./move-to.css";
import { html, type TemplateResult } from "lit-html";
import {
  DATABASE_TYPE,
  movePage,
  PAGE_TYPE,
  selectBreadcrumbs,
  selectPage,
  selectPageTitle,
  type PageBlock,
} from "../../blocks/page/index.ts";
import {
  firstGrapheme,
  parseBlockId,
  type BlockId,
} from "../../model/index.ts";
import {
  closeOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { moveBlocksToPage, selectPageIdOf } from "../editor/index.ts";
import { MOVE_TO_OVERLAY_KIND } from "../page-menu/index.ts";
import { renderMovePopover } from "./move-to-popover.view.ts";
import { selectPageRows, selectTreeRows } from "../sidebar/index.ts";
import { selectSidebarTeamspaces } from "../../blocks/teamspace/index.ts";

export const MOVE_TO_OVERLAY = MOVE_TO_OVERLAY_KIND;

function titleOf(page: PageBlock): string {
  const title = selectPageTitle(page);
  return title === "" ? COPY.sidebar.untitled : title;
}

// Every page of the tree, as if it were all expanded.
function selectAllPages(state: AppState): PageBlock[] {
  const expanded = Object.keys(state.workspace.blocks).flatMap(
    (id) => parseBlockId(id) ?? [],
  );
  const open = { ...state, ui: { ...state.ui, expandedPageIds: expanded } };
  const all = [
    ...selectSidebarTeamspaces(state).flatMap((teamspace) =>
      selectPageRows(open, teamspace.childIds, 2),
    ),
    ...selectTreeRows(open, "shared"),
    ...selectTreeRows(open),
  ];
  return all.flatMap((row) => selectPage(state, row.id) ?? []);
}

// Pages a moved page can go into: every page except itself and the pages
// inside it. Blocks go into any other page, but not into a database.
function selectDestinations(state: AppState, movedId: BlockId): PageBlock[] {
  const pageOfBlock = selectPageIdOf(state, movedId);
  if (selectPage(state, movedId) === undefined) {
    return selectAllPages(state).filter(
      (page) => page.type === PAGE_TYPE && page.id !== pageOfBlock,
    );
  }
  return selectAllPages(state).filter(
    (page) =>
      !selectBreadcrumbs(state, page.id).some((item) => item.id === movedId),
  );
}

// A page goes at the end of its new parent; blocks go at the end of the
// chosen page.
function moveCommand(
  state: AppState,
  movedId: BlockId,
  parentId: BlockId | null,
) {
  if (selectPage(state, movedId) === undefined && parentId !== null) {
    return moveBlocksToPage.create({ blockIds: [movedId], pageId: parentId });
  }
  const parent =
    parentId === null ? undefined : state.workspace.blocks[parentId];
  const index = parent?.childIds.length ?? state.workspace.rootIds.length;
  return movePage.create({ pageId: movedId, parentId, index });
}

export interface MoveEntry {
  readonly label: string;
  // The page's emoji or glyph, a teamspace's letter.
  readonly icon: TemplateResult | string;
  readonly onChoose: () => void;
}

function iconOf(page: PageBlock): TemplateResult | string {
  return (
    page.props.icon ??
    renderIcon(page.type === DATABASE_TYPE ? "database" : "page")
  );
}

export function renderOption(entry: MoveEntry): TemplateResult {
  return html`<li>
    <button type="button" class="move-to__option" @click=${entry.onChoose}>
      <span class="move-to__icon" aria-hidden="true">${entry.icon}</span>
      <span class="move-to__label">${entry.label}</span>
    </button>
  </li>`;
}

// Where the moved page or block may go: the top level and the teamspaces
// for a page, then every page it may go into, by its path.
function selectEntries(state: AppState, dispatch: Dispatch): MoveEntry[] {
  const movedId = parseBlockId(state.ui.overlay?.anchorId ?? "");
  if (movedId === undefined) return [];
  const isPage = selectPage(state, movedId) !== undefined;
  const moveTo = (parentId: BlockId | null) => () => {
    dispatch(moveCommand(state, movedId, parentId));
    dispatch(closeOverlay.create({}));
    if (!isPage) announce(COPY.blockMenu.movedToPage);
  };
  const pages = selectDestinations(state, movedId).map((page) => ({
    icon: iconOf(page),
    label: selectBreadcrumbs(state, page.id).map(titleOf).join(" / "),
    onChoose: moveTo(page.id),
  }));
  if (!isPage) return pages;
  const teamspaces = selectSidebarTeamspaces(state).map((teamspace) => ({
    icon: firstGrapheme(teamspace.props.name).toUpperCase(),
    label: teamspace.props.name,
    onChoose: moveTo(teamspace.id),
  }));
  const top = {
    icon: renderIcon("home"),
    label: COPY.moveTo.topLevel,
    onChoose: moveTo(null),
  };
  return [top, ...teamspaces, ...pages];
}

// A single-pointer and keyboard alternative to dragging a page elsewhere:
// Notion's popover with a search, under the control that opened it.
export function renderMoveTo(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const entries = selectEntries(state, dispatch);
  const movedId = parseBlockId(state.ui.overlay?.anchorId ?? "");
  const isPage = selectPage(state, movedId ?? null) !== undefined;
  return renderMovePopover(state, dispatch, { entries, isPage });
}
