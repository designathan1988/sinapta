// Light dismiss for menus and popovers: a press outside the open overlay
// and outside the control that opened it closes the overlay.
import "./overlay.css";
import {
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

export function installOverlayDismiss(
  store: AppStore,
  dispatch: Dispatch,
): void {
  document.addEventListener("pointerdown", (event) => {
    if (store.getState().ui.overlay === null) return;
    const { target } = event;
    if (target instanceof Element && target.closest(INSIDE) !== null) return;
    dispatch(closeOverlay.create({}));
  });
}

// Puts focus back on the control that opened the overlay.
export function focusOverlayAnchor(): void {
  document
    .querySelector<HTMLElement>("[data-overlay-anchor][aria-expanded='true']")
    ?.focus();
}

// Shows a popover element once it is in the document.
export function showPopoverWhenConnected(element: Element | undefined): void {
  if (!(element instanceof HTMLElement)) return;
  if (!element.isConnected) {
    queueMicrotask(() => {
      showPopoverWhenConnected(element);
    });
    return;
  }
  if (!element.matches(":popover-open")) element.showPopover();
  element.querySelector<HTMLElement>("[data-autofocus]")?.focus();
}
