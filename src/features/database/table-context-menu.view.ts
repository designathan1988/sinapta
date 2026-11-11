// A right click on a row of the table opens the row page's menu. From the
// keyboard (Shift+F10 or the menu key) there is no pointer, so the menu
// opens under the cell that has focus.
import { openOverlay, type Dispatch } from "../../state/index.ts";
import { PAGE_MENU_OVERLAY, pageMenuAnchorId } from "../page-menu/index.ts";
import { cellOf } from "./table-cell-ref.ts";

const ROW_PLACE = "row";

function pointOf(event: MouseEvent): { x: number; y: number } {
  if (event.clientX !== 0 || event.clientY !== 0) {
    return { x: event.clientX, y: event.clientY };
  }
  const cell =
    event.target instanceof Element
      ? event.target.closest("[data-cell]")
      : null;
  const rect = cell?.getBoundingClientRect();
  return { x: rect?.left ?? 0, y: rect?.bottom ?? 0 };
}

export function onRowContextMenu(event: Event, dispatch: Dispatch): void {
  if (!(event instanceof MouseEvent)) return;
  const cell = cellOf(event.target);
  if (cell === undefined) return;
  event.preventDefault();
  const anchorId = pageMenuAnchorId(ROW_PLACE, cell.rowId);
  const overlay = { kind: PAGE_MENU_OVERLAY, anchorId, point: pointOf(event) };
  dispatch(openOverlay.create({ overlay }));
}
