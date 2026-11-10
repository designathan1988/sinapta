import "./move-to.css";
import { html, type TemplateResult } from "lit-html";
import {
  movePage,
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
import { COPY } from "../../ui/copy.ts";
import { renderDialog } from "../../ui/dialog/index.ts";
import { MOVE_TO_OVERLAY_KIND } from "../page-menu/index.ts";
import { selectTreeRows } from "../sidebar/index.ts";

export const MOVE_TO_OVERLAY = MOVE_TO_OVERLAY_KIND;

function titleOf(page: PageBlock): string {
  const title = selectPageTitle(page);
  return title === "" ? COPY.sidebar.untitled : title;
}

// Pages the moved page can go into: every page except itself and the pages
// inside it.
function selectDestinations(state: AppState, pageId: BlockId): PageBlock[] {
  const expanded = Object.keys(state.workspace.blocks).flatMap(
    (id) => parseBlockId(id) ?? [],
  );
  const all = selectTreeRows({
    ...state,
    ui: { ...state.ui, expandedPageIds: expanded },
  });
  return all.flatMap((row) => {
    const page = selectPage(state, row.id);
    if (page === undefined) return [];
    const isInside = selectBreadcrumbs(state, row.id).some(
      (item) => item.id === pageId,
    );
    return isInside ? [] : [page];
  });
}

function renderOption(label: string, onChoose: () => void): TemplateResult {
  return html`<li>
    <button type="button" class="move-to__option" @click=${onChoose}>
      ${label}
    </button>
  </li>`;
}

// A single-pointer and keyboard alternative to dragging a page elsewhere.
export function renderMoveTo(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const pageId = parseBlockId(state.ui.overlay?.anchorId ?? "");
  const moveTo = (parentId: BlockId | null): void => {
    if (pageId === undefined) return;
    const parent = selectPage(state, parentId);
    const index = parent?.childIds.length ?? state.workspace.rootIds.length;
    dispatch(movePage.create({ pageId, parentId, index }));
    dispatch(closeOverlay.create({}));
  };
  const destinations =
    pageId === undefined ? [] : selectDestinations(state, pageId);
  const options = destinations.map((page) => {
    const path = selectBreadcrumbs(state, page.id).map(titleOf).join(" / ");
    return renderOption(path, () => {
      moveTo(page.id);
    });
  });
  const topLevel = renderOption(COPY.moveTo.topLevel, () => {
    moveTo(null);
  });
  return renderDialog({
    title: COPY.moveTo.title,
    closeLabel: COPY.moveTo.close,
    content: html`<ul class="move-to__list">
      ${topLevel}${options}
    </ul>`,
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
