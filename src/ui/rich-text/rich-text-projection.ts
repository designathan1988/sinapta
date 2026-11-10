// Projects RichText from the store into an editable element with plain DOM
// calls. A template binding cannot own this content: the browser edits
// inside the element during composition and would break the binding.
import {
  plainText,
  safeHref,
  type RichText,
  type TextSpan,
} from "../../model/index.ts";

// Innermost first, so bold wraps italic wraps code.
const MARK_TAGS = [
  ["code", "code"],
  ["italic", "em"],
  ["bold", "strong"],
] as const;

function wrap(node: Node, tag: string): HTMLElement {
  const element = document.createElement(tag);
  element.append(node);
  return element;
}

function spanNode(span: TextSpan): Node {
  let node: Node = document.createTextNode(span.text);
  for (const [mark, tag] of MARK_TAGS) {
    if (span.marks?.includes(mark) === true) node = wrap(node, tag);
  }
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

// Makes the element show the given text. Does nothing when it already
// does, so the caret is not disturbed, and nothing while the browser is
// composing inside the element.
export function projectRichText(
  element: Element | undefined,
  rich: RichText,
): void {
  if (!(element instanceof HTMLElement)) return;
  if (element.hasAttribute("data-composing")) return;
  const signature = JSON.stringify(rich);
  const isCurrent =
    element.dataset.projected === signature &&
    element.textContent === plainText(rich);
  if (isCurrent) return;
  element.replaceChildren(...rich.map(spanNode), ...sentinel(rich));
  element.dataset.projected = signature;
}
