// Another person's caret in a block's text, as Notion's: a thin line in
// their color with their name above it. It sits over the text, out of the
// editable element, placed where the offset falls in the drawn text.
import { html, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { whenConnected } from "../../ui/focus/index.ts";

export interface Caret {
  readonly name: string;
  readonly offset: number;
}

// The text node and the offset inside it that a text offset falls on.
function pointAt(root: Element, offset: number): [Node, number] | undefined {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let left = offset;
  let last: Text | undefined;
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    if (!(node instanceof Text)) continue;
    last = node;
    if (left <= node.length) return [node, left];
    left -= node.length;
  }
  return last === undefined ? undefined : [last, last.length];
}

// Measures where the offset is drawn in the block's text, and puts the
// caret there through the CSSOM.
function measure(element: HTMLElement, offset: number): void {
  const block = element.closest(".editor__block");
  const text = block?.querySelector("[data-text]") ?? null;
  if (block === null || text === null) return;
  const point = pointAt(text, offset);
  const range = document.createRange();
  if (point === undefined) range.selectNodeContents(text);
  else range.setStart(point[0], point[1]);
  range.collapse(true);
  const spot = range.getBoundingClientRect();
  const box = block.getBoundingClientRect();
  const line = spot.height > 0 ? spot : text.getBoundingClientRect();
  element.style.setProperty("--caret-x", `${String(spot.left - box.left)}px`);
  element.style.setProperty("--caret-y", `${String(line.top - box.top)}px`);
  element.style.setProperty("--caret-h", `${String(line.height)}px`);
}

// The caret is measured once it is in the page, beside its text.
function place(offset: number) {
  return ref((element) => {
    if (!(element instanceof HTMLElement)) return;
    whenConnected(element, () => {
      measure(element, offset);
    });
  });
}

export function renderCaret(caret: Caret): TemplateResult {
  return html`<span
    class="presence__caret"
    contenteditable="false"
    aria-hidden="true"
    ${place(caret.offset)}
    ><span class="presence__flag">${caret.name}</span></span
  >`;
}
