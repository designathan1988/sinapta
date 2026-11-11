// Pointer drag to reorder items in a list or tree. While the pointer is
// down the browser owns the interaction; the caller is told once, on drop.
export type DragPosition = "before" | "after" | "inside";

// Places that take blocks dropped on them, such as the pages in the
// sidebar, carry `data-page-drop` with the id of their page.
export const PAGE_DROP_SELECTOR = "[data-page-drop]";

export interface DragOptions {
  // Which way the items run. Items in a row ("inline") are dropped before
  // or after each other, never inside. Defaults to "block".
  readonly axis?: "block" | "inline";
  // Matches every item that can be dragged and dropped on.
  readonly itemSelector: string;
  // Matches places elsewhere on the page that also take drops, inside
  // only, such as the pages in the sidebar for a dragged block.
  readonly elsewhereSelector?: string;
  readonly onDrop: DropHandler;
  // Called instead of `onDrop` when Alt is held at the drop.
  readonly onCopy?: DropHandler;
  // When given, a drop near the left or right edge of an item is a drop
  // beside it, as when blocks are put in columns.
  readonly onSideDrop?: (
    source: HTMLElement,
    target: HTMLElement,
    side: DragSide,
  ) => void;
}

export type DragSide = "left" | "right";

export type DropHandler = (
  source: HTMLElement,
  target: HTMLElement,
  position: DragPosition,
) => void;

// How far the pointer must travel, in CSS pixels, before a press is a drag.
const DRAG_THRESHOLD = 4;
const EDGE_SHARE = 0.3;
// How close to the left or right edge, as a share of the width, a drop
// is beside an item.
const SIDE_SHARE = 0.1;

interface Session {
  readonly container: HTMLElement;
  readonly source: HTMLElement;
  readonly startX: number;
  readonly startY: number;
  isDragging: boolean;
  isCopy: boolean;
  target: HTMLElement | undefined;
  position: DragPosition;
  side: DragSide | undefined;
}

function elementAt(event: PointerEvent): Element | null {
  return document.elementFromPoint(event.clientX, event.clientY);
}

// The item of the dragged list under the pointer, or a place elsewhere
// that takes drops.
function targetAt(
  event: PointerEvent,
  session: Session,
  options: DragOptions,
): { item: HTMLElement; isElsewhere: boolean } | undefined {
  const element = elementAt(event);
  const item = element?.closest<HTMLElement>(options.itemSelector);
  if (item != null && session.container.contains(item)) {
    return { item, isElsewhere: false };
  }
  const { elsewhereSelector } = options;
  const place =
    elsewhereSelector === undefined
      ? null
      : element?.closest<HTMLElement>(elsewhereSelector);
  return place == null ? undefined : { item: place, isElsewhere: true };
}

function positionIn(
  target: HTMLElement,
  event: PointerEvent,
  axis: DragOptions["axis"],
): DragPosition {
  const box = target.getBoundingClientRect();
  if (axis === "inline") {
    return event.clientX < box.left + box.width / 2 ? "before" : "after";
  }
  const share = (event.clientY - box.top) / box.height;
  if (share < EDGE_SHARE) return "before";
  return share > 1 - EDGE_SHARE ? "after" : "inside";
}

function sideIn(target: HTMLElement, event: PointerEvent) {
  const box = target.getBoundingClientRect();
  const share = (event.clientX - box.left) / Math.max(1, box.width);
  if (share < SIDE_SHARE) return "left";
  return share > 1 - SIDE_SHARE ? "right" : undefined;
}

interface Mark {
  readonly target: HTMLElement | undefined;
  readonly position: DragPosition;
  readonly side?: DragSide | undefined;
}

function mark(session: Session, { target, position, side }: Mark): void {
  session.target?.removeAttribute("data-drop");
  session.target = target === session.source ? undefined : target;
  session.position = position;
  session.side = side;
  session.target?.setAttribute("data-drop", side ?? position);
}

function track(
  session: Session,
  event: PointerEvent,
  options: DragOptions,
): void {
  const distance = Math.hypot(
    event.clientX - session.startX,
    event.clientY - session.startY,
  );
  if (!session.isDragging && distance < DRAG_THRESHOLD) return;
  session.isDragging = true;
  session.isCopy = event.altKey;
  session.source.setAttribute("data-dragging", "");
  const target = targetAt(event, session, options);
  const isInList = target !== undefined && !target.isElsewhere;
  const position = isInList
    ? positionIn(target.item, event, options.axis)
    : "inside";
  const side =
    isInList && options.onSideDrop !== undefined
      ? sideIn(target.item, event)
      : undefined;
  mark(session, { target: target?.item, position, side });
}

interface Drag {
  readonly session: Session;
  readonly options: DragOptions;
  readonly abort: AbortController;
}

// The click that follows a drag must not also activate the item. A drag
// that ends over another element may produce no click at all, so the next
// press cancels the wait.
function swallowNextClick(container: HTMLElement): void {
  const wait = new AbortController();
  const options = { capture: true, once: true, signal: wait.signal };
  const swallow = (click: Event): void => {
    click.stopPropagation();
    wait.abort();
  };
  container.addEventListener("click", swallow, options);
  container.addEventListener(
    "pointerdown",
    () => {
      wait.abort();
    },
    options,
  );
}

function finish(drag: Drag, isDrop: boolean): void {
  const { session, options } = drag;
  const { source, target, position, side, isDragging } = session;
  mark(session, { target: undefined, position: "inside" });
  source.removeAttribute("data-dragging");
  drag.abort.abort();
  if (!isDragging) return;
  swallowNextClick(session.container);
  if (!isDrop || target === undefined) return;
  if (side !== undefined && options.onSideDrop !== undefined) {
    options.onSideDrop(source, target, side);
    return;
  }
  const onDrop = session.isCopy
    ? (options.onCopy ?? options.onDrop)
    : options.onDrop;
  onDrop(source, target, position);
}

// The drag follows the pointer anywhere on the page, so that it can end
// over a place outside its list or outside the list altogether.
function listen(drag: Drag): void {
  const { session, options } = drag;
  const { signal } = drag.abort;
  const onMove = (move: PointerEvent): void => {
    track(session, move, options);
  };
  const onKey = (key: KeyboardEvent): void => {
    if (key.key === "Escape") finish(drag, false);
  };
  document.addEventListener("pointermove", onMove, { signal });
  document.addEventListener(
    "pointerup",
    (up) => {
      if (session.isDragging) session.isCopy = up.altKey;
      finish(drag, true);
    },
    { signal },
  );
  document.addEventListener(
    "pointercancel",
    () => {
      finish(drag, false);
    },
    { signal },
  );
  document.addEventListener("keydown", onKey, { signal });
}

// Call from a `pointerdown` handler on the list container.
export function startPointerDrag(
  event: PointerEvent,
  options: DragOptions,
): void {
  const container = event.currentTarget;
  const source = elementAt(event)?.closest<HTMLElement>(options.itemSelector);
  if (!(container instanceof HTMLElement) || source == null) return;
  if (event.button !== 0 || !container.contains(source)) return;
  const session: Session = {
    container,
    source,
    startX: event.clientX,
    startY: event.clientY,
    isDragging: false,
    isCopy: false,
    target: undefined,
    position: "inside",
    side: undefined,
  };
  listen({ session, options, abort: new AbortController() });
}
