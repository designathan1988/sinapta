// Showing a block: once the render has finished, the page scrolls the
// block into view and flashes it once, as when a link to a block opens,
// or a heading is chosen from an outline.
import { afterRender } from "./after-render.ts";

export function revealBlock(
  blockId: string,
  where: ScrollLogicalPosition = "center",
): void {
  afterRender(() => {
    const selector = `[data-block-id="${CSS.escape(blockId)}"]`;
    const block = document.querySelector<HTMLElement>(selector);
    if (block === null) return;
    block.scrollIntoView({ block: where });
    block.setAttribute("data-flash", "");
    block.addEventListener(
      "animationend",
      () => {
        block.removeAttribute("data-flash");
      },
      { once: true },
    );
  });
}
