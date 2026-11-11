// Scrolls a scroller so a part of it is centered, the first time the
// scroller is drawn, as a timeline opens on today; later renders leave
// the scroll where the person put it. Only the scroller moves: the page
// around it stays where it is.
import { afterRender } from "./after-render.ts";

const revealed = new WeakSet<Element>();

export function centerChild(scroller: Element, child: Element | null): void {
  if (!(scroller instanceof HTMLElement) || !(child instanceof HTMLElement))
    return;
  const left =
    child.offsetLeft - (scroller.clientWidth - child.offsetWidth) / 2;
  scroller.scrollLeft = Math.max(0, left);
}

export function revealOnce(selector: string) {
  return (element: Element | undefined): void => {
    if (!(element instanceof HTMLElement) || revealed.has(element)) return;
    revealed.add(element);
    afterRender(() => {
      centerChild(element, element.querySelector(selector));
    });
  };
}
