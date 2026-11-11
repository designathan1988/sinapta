// Dragging a block by its handle: onto another block to move it there,
// with Alt to drop a copy instead, beside another block to make columns,
// or onto a page in the sidebar to move it to the end of that page.
import {
  countBlockTree,
  parseBlockId,
  type BlockId,
} from "../../model/index.ts";
import { dropBeside } from "../../blocks/column-list/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  PAGE_DROP_SELECTOR,
  startPointerDrag,
  type DragPosition,
  type DragSide,
} from "../../ui/drag/index.ts";
import type { InputContext } from "./editor-input.view.ts";
import { copyBlockTo } from "./editor-insert.commands.ts";
import {
  moveBlock,
  moveBlocksToPage,
  selectBlockDrop,
} from "./editor-move.commands.ts";

const BLOCK = ".editor__block";

function idOf(element: Element): BlockId | undefined {
  return parseBlockId(
    element.closest<HTMLElement>(BLOCK)?.dataset.blockId ?? "",
  );
}

interface BlockDrop {
  readonly blockId: BlockId;
  readonly target: HTMLElement;
  readonly position: DragPosition;
}

function dropOnPage(drop: BlockDrop, { dispatch }: InputContext): boolean {
  const pageId = parseBlockId(drop.target.dataset.pageDrop ?? "");
  if (pageId === undefined) return false;
  const blockIds = [drop.blockId];
  const result = dispatch(moveBlocksToPage.create({ blockIds, pageId }));
  if (result.ok) announce(COPY.blockMenu.movedToPage);
  return true;
}

function dropOnBlock(drop: BlockDrop, context: InputContext): void {
  const { blockId, position } = drop;
  const targetId = idOf(drop.target);
  if (targetId === undefined) return;
  const move = selectBlockDrop(context.state, blockId, { targetId, position });
  if (move === undefined) return;
  context.dispatch(moveBlock.create(move));
  announce(COPY.blockMenu.moved);
}

function copyOnBlock(drop: BlockDrop, { state, dispatch }: InputContext): void {
  const { blockId, position } = drop;
  const targetId = idOf(drop.target);
  if (targetId === undefined) return;
  const blockCount = countBlockTree(state.workspace, blockId);
  dispatch(copyBlockTo.create({ blockId, targetId, position, blockCount }));
  announce(COPY.blockMenu.copied);
}

// Dragging starts on a handle.
export function startBlockDrag(
  event: PointerEvent,
  context: InputContext,
): void {
  const handle =
    event.target instanceof Element
      ? event.target.closest("[data-handle]")
      : null;
  if (handle === null) return;
  const dropWith =
    (onBlock: typeof dropOnBlock) =>
    (source: HTMLElement, target: HTMLElement, position: DragPosition) => {
      const blockId = idOf(source);
      if (blockId === undefined) return;
      const drop = { blockId, target, position };
      if (!dropOnPage(drop, context)) onBlock(drop, context);
    };
  const onSideDrop = (
    source: HTMLElement,
    target: HTMLElement,
    side: DragSide,
  ): void => {
    const blockId = idOf(source);
    const targetId = idOf(target);
    if (blockId === undefined || targetId === undefined) return;
    context.dispatch(dropBeside.create({ blockId, targetId, side }));
  };
  startPointerDrag(event, {
    itemSelector: BLOCK,
    elsewhereSelector: PAGE_DROP_SELECTOR,
    onDrop: dropWith(dropOnBlock),
    onCopy: dropWith(copyOnBlock),
    onSideDrop,
  });
}
