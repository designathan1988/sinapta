// Projects RichText from the store into an editable element with plain DOM
// calls. A template binding cannot own this content: the browser edits
// inside the element during composition and would break the binding.
import {
  plainText,
  safeHref,
  type RichText,
  type TextSpan,
} from "../../model/index.ts";

// Innermost first, so bold wraps italic wraps the rest.
const MARK_TAGS = [
  ["code", "code"],
  ["strikethrough", "s"],
  ["underline", "u"],
  ["italic", "em"],
  ["bold", "strong"],
] as const;

function wrap(node: Node, tag: string): HTMLElement {
  const element = document.createElement(tag);
  element.append(node);
  return element;
}

// Color and highlight are one element around the marks, styled by their
// data attributes from the tone tokens.
function toned(node: Node, span: TextSpan): Node {
  if (span.color === undefined && span.highlight === undefined) return node;
  const element = wrap(node, "span");
  if (span.color !== undefined) element.dataset.color = span.color;
  if (span.highlight !== undefined) element.dataset.highlight = span.highlight;
  return element;
}

function spanNode(span: TextSpan): Node {
  let node: Node = document.createTextNode(span.text);
  for (const [mark, tag] of MARK_TAGS) {
    if (span.marks?.includes(mark) === true) node = wrap(node, tag);
  }
  node = toned(node, span);
  const href = span.href === undefined ? undefined : safeHref(span.href);
  if (href === undefined) return node;
  const link = wrap(node, "a");
  link.setAttribute("href", href);
  link.setAttribute("rel", "noreferrer");
  return link;
}

// A final line break needs something after it to be drawn and reachable.
function sentinel(rich: RichText): Node[] {
  return plainText(rich).endsWith("\n") ? [document.createElement("br")] : [];
}

// The text each element was last made to show. Text in the store is never
// edited in place, so the same reference means the same text, and a page
// of a thousand unchanged blocks costs a thousand lookups per keystroke.
const projected = new WeakMap<Element, RichText>();

// Makes the element show the given text. Does nothing when it already
// does, so the caret is not disturbed, and nothing while the browser is
// composing inside the element.
export function projectRichText(
  element: Element | undefined,
  rich: RichText,
): void {
  if (!(element instanceof HTMLElement)) return;
  if (projected.get(element) === rich) return;
  if (element.hasAttribute("data-composing")) return;
  projected.set(element, rich);
  // The browser may already show this text: it typed it during composition.
  const isCurrent =
    element.dataset.projected === JSON.stringify(rich) &&
    element.textContent === plainText(rich);
  if (isCurrent) return;
  element.replaceChildren(...rich.map(spanNode), ...sentinel(rich));
  element.dataset.projected = JSON.stringify(rich);
}
