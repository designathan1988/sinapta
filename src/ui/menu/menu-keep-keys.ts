import { afterRender } from "../focus/index.ts";

// A panel with nothing to choose (a note, a card) still keeps the keys:
// once it is drawn, when nothing in the menu has the focus, its Back (or
// Close) button takes it, so arrows and Escape go on working.
export function keepKeys(header: Element | undefined): void {
  if (!(header instanceof HTMLElement)) return;
  afterRender(() => {
    const menu = header.closest(".menu");
    if (menu === null || !header.isConnected) return;
    if (menu.contains(document.activeElement)) return;
    const button =
      header.querySelector<HTMLElement>(".menu__back") ??
      header.querySelector<HTMLElement>(".menu__close");
    button?.focus();
  });
}
