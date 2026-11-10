// Pointer drag to reorder items in a list or tree. While the pointer is
// down the browser owns the interaction; the caller is told once, on drop.
export type DragPosition = "before" | "after" | "inside";

export interface DragOptions {
  // Which way the items run. Items in a row ("inline") are dropped before
  // or after each other, never inside. Defaults to "block".
  readonly axis?: "block" | "inline";
  // Matches every item that can be dragged and dropped on.
  readonly itemSelector: string;
  readonly onDrop: (
    source: HTMLElement,
    target: HTMLElement,
    position: DragPosition,
  ) => void;
}

// How far the pointer must travel, in CSS pixels, before a press is a drag.
const DRAG_THRESHOLD = 4;
const EDGE_SHARE = 0.3;

interface Session {
  readonly source: HTMLElement;
  readonly startX: number;
  readonly startY: number;
  isDragging: boolean;
  target: HTMLElement | undefined;
  position: DragPosition;
}

function itemAt(
  event: PointerEvent,
  selector: string,
): HTMLElement | undefined {
  const element = document.elementFromPoint(event.clientX, event.clientY);
  return element?.closest<HTMLElement>(selector) ?? undefined;
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

function mark(
  session: Session,
  target: HTMLElement | undefined,
  position: DragPosition,
): void {
  session.target?.removeAttribute("data-drop");
  session.target = target === session.source ? undefined : target;
  session.position = position;
  session.target?.setAttribute("data-drop", position);
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
  session.source.setAttribute("data-dragging", "");
  const target = itemAt(event, options.itemSelector);
  const position =
    target === undefined ? "inside" : positionIn(target, event, options.axis);
  mark(session, target, position);
}

interface Drag {
  readonly session: Session;
  readonly container: HTMLElement;
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
  const { session, container, options } = drag;
  const { source, target, position, isDragging } = session;
  mark(session, undefined, "inside");
  source.removeAttribute("data-dragging");
  drag.abort.abort();
  if (!isDragging) return;
  swallowNextClick(container);
  if (isDrop && target !== undefined) options.onDrop(source, target, position);
}

function listen(drag: Drag): void {
  const { session, container, options } = drag;
  const { signal } = drag.abort;
  const onMove = (move: PointerEvent): void => {
    track(session, move, options);
  };
  const onKey = (key: KeyboardEvent): void => {
    if (key.key === "Escape") finish(drag, false);
  };
  container.addEventListener("pointermove", onMove, { signal });
  container.addEventListener(
    "pointerup",
    () => {
      finish(drag, true);
    },
    { signal },
  );
  container.addEventListener(
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
  const source = itemAt(event, options.itemSelector);
  if (!(container instanceof HTMLElement) || source === undefined) return;
  if (event.button !== 0) return;
  const session: Session = {
    source,
    startX: event.clientX,
    startY: event.clientY,
    isDragging: false,
    target: undefined,
    position: "inside",
  };
  listen({ session, container, options, abort: new AbortController() });
}
