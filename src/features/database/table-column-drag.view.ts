import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import { startPointerDrag } from "../../ui/drag/index.ts";
import type { TableContext } from "./table-cell.view.ts";
import { selectColumnDrop } from "./table.selectors.ts";
import { setPropertyOrder } from "./view.commands.ts";

const COLUMN = "th[data-property-id]";
const NOT_DRAGGABLE = ".database__resizer";

// A header dragged sideways moves its column. The column menu's "Move
// left" and "Move right" do the same from the keyboard.
export function startColumnDrag(
  event: PointerEvent,
  context: TableContext,
): void {
  if (event.target instanceof Element && event.target.closest(NOT_DRAGGABLE))
    return;
  startPointerDrag(event, {
    axis: "inline",
    itemSelector: COLUMN,
    onDrop(source, target, position) {
      const propertyOrder = selectColumnDrop(context.model, {
        sourceId: source.dataset.propertyId ?? "",
        targetId: target.dataset.propertyId ?? "",
        position,
      });
      if (propertyOrder === undefined) return;
      const viewId = context.model.view.id;
      context.dispatch(setPropertyOrder.create({ viewId, propertyOrder }));
      announce(COPY.database.columnMoved);
    },
  });
}
