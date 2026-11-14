// The Move to popover opened by "+"'s "New page “…” in…": every place a
// page can go, and choosing one makes the page there and links the line
// to it.
import { PAGE_TYPE } from "../../blocks/page/index.ts";
import { parseBlockId, type BlockId } from "../../model/index.ts";
import {
  closeOverlay,
  type AppState,
  type Dispatch,
  type OpenOverlay,
} from "../../state/index.ts";
import { createPageInAt } from "../editor/index.ts";
import { NEW_PAGE_PURPOSE } from "../page-menu/index.ts";

export interface NewPageRequest {
  readonly blockId: BlockId;
  readonly title: string;
  readonly start: number;
  readonly end: number;
}

// The new page's place in the line: the "+" and the words after it.
function rangeOf(range: readonly string[] | undefined) {
  const [start, end] = (range ?? []).map(Number);
  if (start === undefined || end === undefined) return undefined;
  return Number.isNaN(start + end) ? undefined : { start, end };
}

export function newPageRequestOf(
  overlay: OpenOverlay | null,
): NewPageRequest | undefined {
  if (overlay === null) return undefined;
  const values = overlay.values ?? {};
  if (values.purpose?.[0] !== NEW_PAGE_PURPOSE) return undefined;
  const blockId = parseBlockId(overlay.anchorId ?? "");
  const range = rangeOf(values.range);
  if (blockId === undefined || range === undefined) return undefined;
  const [title = ""] = values.title ?? [];
  return { blockId, title, ...range };
}

// Only pages hold new pages, not databases.
export function holdsNewPage(state: AppState, id: BlockId): boolean {
  return state.workspace.blocks[id]?.type === PAGE_TYPE;
}

export function newPageIn(
  request: NewPageRequest,
  dispatch: Dispatch,
): (parentId: BlockId | null) => () => void {
  return (parentId) => () => {
    dispatch(closeOverlay.create({}));
    dispatch(createPageInAt.create({ ...request, parentId }));
  };
}
