// Right-click menus in the editor.
import { parseBlockId } from "../../model/index.ts";
import { openOverlay, type Dispatch } from "../../state/index.ts";
import { BLOCK_MENU_OVERLAY } from "./editor-block-menu.view.ts";

const BLOCK = ".editor__block";

// A right click on a block opens its menu at the pointer. Shift+F10 and
// the menu key fire the same event with no pointer; the menu then sits by
// the block's handle.
export function onBlockContextMenu(event: Event, dispatch: Dispatch): void {
  if (!(event instanceof MouseEvent) || !(event.target instanceof Element)) {
    return;
  }
  const block = event.target.closest<HTMLElement>(BLOCK);
  const blockId = parseBlockId(block?.dataset.blockId ?? "");
  if (blockId === undefined) return;
  event.preventDefault();
  const isPointer = event.clientX !== 0 || event.clientY !== 0;
  const point = { x: event.clientX, y: event.clientY };
  const overlay = { kind: BLOCK_MENU_OVERLAY, anchorId: blockId };
  dispatch(
    openOverlay.create({
      overlay: isPointer ? { ...overlay, point } : overlay,
    }),
  );
}
