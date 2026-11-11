// Focuses an element the first time it is drawn, as the search field of
// a panel that comes in, and never again: a later render leaves focus
// where the person put it. Lit calls a ref again whenever another element
// shares its callback, so the element itself is remembered.
import { whenConnected } from "./when-connected.ts";

const focused = new WeakSet<Element>();

export function focusOnce(element: Element | undefined): void {
  if (!(element instanceof HTMLElement) || focused.has(element)) return;
  focused.add(element);
  whenConnected(element, () => {
    if (element.isConnected) element.focus();
  });
}
