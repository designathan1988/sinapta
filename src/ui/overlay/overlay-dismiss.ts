// Light dismiss for menus and popovers: a press outside the open overlay
// and outside the control that opened it closes the overlay.
import "./overlay.css";
import { whenConnected } from "../focus/index.ts";
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

// The list open inside the overlay, and the control that opened it.
const CHILD = [
  "[data-overlay][data-child]",
  "[data-overlay-child-anchor][aria-expanded='true']",
].join(", ");

function isWithin(target: EventTarget | null, selector: string): boolean {
  return target instanceof Element && target.closest(selector) !== null;
}

export function installOverlayDismiss(
  store: AppStore,
  dispatch: Dispatch,
): void {
  document.addEventListener("pointerdown", (event) => {
    const { overlay } = store.getState().ui;
    if (overlay === null) return;
    const { target } = event;
    // A press elsewhere in the overlay closes only the list open in it.
    if (overlay.child !== undefined && !isWithin(target, CHILD)) {
      dispatch(closeChildOverlay.create({}));
    }
    if (!isWithin(target, INSIDE)) dispatch(closeOverlay.create({}));
  });
}

// Puts focus back on the control that opened the overlay, or the list
// open inside it.
export function focusOverlayAnchor(): void {
  const child = document.querySelector<HTMLElement>(
    "[data-overlay-child-anchor][aria-expanded='true']",
  );
  const anchor = document.querySelector<HTMLElement>(
    "[data-overlay-anchor][aria-expanded='true']",
  );
  (child ?? anchor)?.focus();
}

// Shows a popover element once it is in the document.
export function showPopoverWhenConnected(element: Element | undefined): void {
  if (!(element instanceof HTMLElement)) return;
  whenConnected(element, () => {
    if (!element.isConnected) return;
    if (!element.matches(":popover-open")) element.showPopover();
    element.querySelector<HTMLElement>("[data-autofocus]")?.focus();
  });
}
