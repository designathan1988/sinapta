// Light dismiss for menus and popovers: a press outside the open overlay
// and outside the control that opened it closes the overlay.
import "./overlay.css";
import { whenConnected } from "../focus/index.ts";
import {
  childDepthOf,
  OPEN_CHILD_ANCHOR,
  popoverSourceOf,
} from "./overlay-child.ts";
import {
  closeChildOverlay,
  closeOverlay,
  type AppStore,
  type Dispatch,
} from "../../state/index.ts";

const INSIDE = [
  "[data-overlay]",
  "[data-overlay-anchor][aria-expanded='true']",
  "[data-overlay-anchor='open']",
  "dialog",
].join(", ");

function isWithin(target: EventTarget | null, selector: string): boolean {
  return target instanceof Element && target.closest(selector) !== null;
}

// How many of the open lists and submenus a press keeps: those it is in,
// and the one of the control it is on.
function keptChildren(target: EventTarget | null): number {
  if (!(target instanceof Element)) return 0;
  const onAnchor = isWithin(target, OPEN_CHILD_ANCHOR) ? 1 : 0;
  return childDepthOf(target) + onAnchor;
}

export function installOverlayDismiss(
  store: AppStore,
  dispatch: Dispatch,
): void {
  document.addEventListener("pointerdown", (event) => {
    const { overlay } = store.getState().ui;
    if (overlay === null) return;
    const { target } = event;
    // A press elsewhere in the overlay closes the lists it is outside of.
    const depth = keptChildren(target);
    if (depth < (overlay.children?.length ?? 0)) {
      dispatch(closeChildOverlay.create({ depth }));
    }
    if (!isWithin(target, INSIDE)) dispatch(closeOverlay.create({}));
  });
}

// Escape closes an open overlay even while the focus is still on the
// control that opened it, as after a click; a key pressed inside the
// overlay is the overlay's own to handle. True when it closed one.
export function closeOverlayOnEscape(
  event: KeyboardEvent,
  store: AppStore,
  dispatch: Dispatch,
): boolean {
  if (event.key !== "Escape" || event.defaultPrevented) return false;
  if (store.getState().ui.overlay === null) return false;
  if (isWithin(event.target, "[data-overlay], dialog")) return false;
  dispatch(closeOverlay.create({}));
  return true;
}

const OPEN_ANCHOR =
  "[data-overlay-anchor][aria-expanded='true'], [data-overlay-anchor='open']";

// A control kept out of the tab order inside a tree's row, as a sidebar
// row's "…", gives the focus to its row, as Notion's does: the row is the
// stop the keyboard knows.
function focusTarget(
  control: HTMLElement | undefined,
): HTMLElement | undefined {
  const row = control?.closest<HTMLElement>("[role=treeitem]");
  return control?.tabIndex === -1 && row !== null ? row : control;
}

// Puts focus back on the control that opened the innermost open list, or
// on the one that opened the overlay when all of it closes; an overlay
// with no control of its own, as Customize sidebar, gives it to the
// control of its innermost list.
export function focusOverlayAnchor(closing = { isWhole: false }): void {
  const children = [
    ...document.querySelectorAll<HTMLElement>(OPEN_CHILD_ANCHOR),
  ];
  const child = closing.isWhole ? undefined : children.at(-1);
  const anchor =
    document.querySelector<HTMLElement>(
      "[data-overlay-anchor][aria-expanded='true']",
    ) ?? children.at(-1);
  focusTarget(child ?? anchor)?.focus();
}

// A submenu opened under the pointer leaves focus where it is, as
// Notion's do; opened from the keyboard, it takes focus.
function takesFocus(element: Element, source: Element | undefined): boolean {
  const isSubmenu = element.matches("[data-placement='beside']");
  if (isSubmenu && isTypingElsewhere(element)) return false;
  return !isSubmenu || source?.matches(":hover") !== true;
}

// A field of another open overlay that has the focus: a submenu opening
// beside it, as a new property's settings beside its name, leaves the
// person typing there.
function isTypingElsewhere(element: Element): boolean {
  const active = document.activeElement;
  return (
    active instanceof HTMLInputElement &&
    !element.contains(active) &&
    active.closest("[data-overlay]") !== null
  );
}

// A control that the window cuts on the side, as the last column of a
// wide table, is scrolled into view before its overlay opens, so the
// overlay can sit beside it inside the window, as Notion's.
export function revealAnchor(anchor: Element, windowWidth: number): void {
  const box = anchor.getBoundingClientRect();
  if (box.left >= 0 && box.right <= windowWidth) return;
  anchor.scrollIntoView({ block: "nearest", inline: "nearest" });
}

// Shows a popover element once it is in the document, and focuses its
// first field or row. A popover already open is left as it is: lit calls
// a ref again whenever another element shares its callback, as nested
// menus do, and a second focus would pull it away from where it is.
export function showPopoverWhenConnected(element: Element | undefined): void {
  if (!(element instanceof HTMLElement)) return;
  whenConnected(element, () => {
    if (!element.isConnected || element.matches(":popover-open")) return;
    // A list follows its control, and so is placed by it.
    const source = popoverSourceOf(element);
    const anchor = document.querySelector(OPEN_ANCHOR);
    if (anchor !== null && source === undefined) {
      revealAnchor(anchor, window.innerWidth);
    }
    element.showPopover(source === undefined ? undefined : { source });
    if (takesFocus(element, source)) {
      element.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
  });
}
