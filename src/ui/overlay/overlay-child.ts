// The lists and submenus open inside an overlay: how deep a control sits
// among them, which one is open for a control, and the control a list
// follows, which the browser then anchors it to.
import type { OpenOverlay } from "../../state/index.ts";

export const CHILD_MENU = "[data-overlay][data-child]";
export const OPEN_CHILD_ANCHOR =
  "[data-overlay-child-anchor][aria-expanded='true']";

// How many open lists and submenus hold the element: 0 in the overlay
// itself. A control opens its own list at this depth.
export function childDepthOf(element: Element): number {
  let depth = 0;
  let menu = element.closest(CHILD_MENU);
  while (menu !== null) {
    depth += 1;
    menu = menu.parentElement?.closest(CHILD_MENU) ?? null;
  }
  return depth;
}

// Where the list of this control is among the open ones; -1 when closed.
export function childIndexOf(
  overlay: OpenOverlay | null,
  anchorId: string,
): number {
  return (
    overlay?.children?.findIndex((child) => child.anchorId === anchorId) ?? -1
  );
}

// A list or submenu is drawn right after the control that opened it.
export function popoverSourceOf(element: Element): HTMLElement | undefined {
  const control = element.previousElementSibling;
  return element.matches(CHILD_MENU) &&
    control instanceof HTMLElement &&
    control.matches("[data-overlay-child-anchor]")
    ? control
    : undefined;
}
