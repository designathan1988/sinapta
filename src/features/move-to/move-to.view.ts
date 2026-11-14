import "./move-to.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  movePage,
  PAGE_TYPE,
  selectBreadcrumbs,
  selectPage,
  selectPageTitle,
  type PageBlock,
} from "../../blocks/page/index.ts";
import { parseBlockId, type BlockId } from "../../model/index.ts";
import {
  closeOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderDialog } from "../../ui/dialog/index.ts";
import { moveBlocksToPage, selectPageIdOf } from "../editor/index.ts";
import { MOVE_TO_OVERLAY_KIND } from "../page-menu/index.ts";
import { selectPageRows, selectTreeRows } from "../sidebar/index.ts";
import { selectTeamspaces } from "../../blocks/teamspace/index.ts";

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
    ...selectTeamspaces(state).flatMap((teamspace) =>
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

function renderOption(label: string, onChoose: () => void): TemplateResult {
  return html`<li>
    <button type="button" class="move-to__option" @click=${onChoose}>
      ${label}
    </button>
  </li>`;
}

// The teamspaces a page may go into, as Notion's Move to lists them.
function renderTeamspaces(
  state: AppState,
  moveTo: (parentId: BlockId) => void,
): TemplateResult[] {
  return selectTeamspaces(state).map((teamspace) =>
    renderOption(teamspace.props.name, () => {
      moveTo(teamspace.id);
    }),
  );
}

// A single-pointer and keyboard alternative to dragging a page elsewhere.
export function renderMoveTo(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const movedId = parseBlockId(state.ui.overlay?.anchorId ?? "");
  const isPage = selectPage(state, movedId ?? null) !== undefined;
  const moveTo = (parentId: BlockId | null): void => {
    if (movedId === undefined) return;
    dispatch(moveCommand(state, movedId, parentId));
    dispatch(closeOverlay.create({}));
    if (!isPage) announce(COPY.blockMenu.movedToPage);
  };
  const destinations =
    movedId === undefined ? [] : selectDestinations(state, movedId);
  const options = destinations.map((page) => {
    const path = selectBreadcrumbs(state, page.id).map(titleOf).join(" / ");
    return renderOption(path, () => {
      moveTo(page.id);
    });
  });
  // A page may become a top-level page or go into a teamspace; a block
  // always needs a page.
  const topLevel = isPage
    ? renderOption(COPY.moveTo.topLevel, () => {
        moveTo(null);
      })
    : nothing;
  const teamspaces = isPage ? renderTeamspaces(state, moveTo) : [];
  return renderDialog({
    title: COPY.moveTo.title,
    closeLabel: COPY.moveTo.close,
    content: html`<ul class="move-to__list">
      ${topLevel}${teamspaces}${options}
    </ul>`,
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
