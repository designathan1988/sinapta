// Projects RichText from the store into an editable element with plain DOM
// calls. A template binding cannot own this content: the browser edits
// inside the element during composition and would break the binding.
import {
  plainText,
  safeHref,
  type Mention,
  type RichText,
  type TextSpan,
} from "../../model/index.ts";
import { renderEquationInto } from "./equation.view.ts";

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

// A mention is one piece the caret steps over; its data attributes say
// what it points to.
function mentionNode(span: TextSpan, mention: Mention): Node {
  const element = wrap(document.createTextNode(span.text), "span");
  element.className = "mention";
  element.setAttribute("contenteditable", "false");
  if (mention.kind === "page") element.dataset.pageId = mention.pageId;
  else if (mention.kind === "person") element.dataset.personId = mention.userId;
  else {
    element.dataset.date = mention.date;
    if (mention.isReminder === true) element.dataset.reminder = "";
  }
  return element;
}

// An inline equation is one piece too; it is drawn in its own shadow
// root, and its source stays as its text, so the caret counts it.
function equationNode(span: TextSpan, source: string): Node {
  const element = wrap(document.createTextNode(span.text), "span");
  element.className = "equation";
  element.setAttribute("contenteditable", "false");
  element.dataset.equation = source;
  renderEquationInto(element, source);
  return element;
}

// Text a discussion is about, and a suggested edit, marked.
function commentMarked(node: Node, span: TextSpan): Node {
  if (span.comments === undefined || span.comments.length === 0) return node;
  const marked = wrap(node, "span");
  marked.className = "comment-mark";
  marked.dataset.discussions = span.comments.join(" ");
  if (span.suggestion !== undefined)
    marked.dataset.suggestion = span.suggestion;
  return marked;
}

function spanNode(span: TextSpan): Node {
  if (span.mention !== undefined) return mentionNode(span, span.mention);
  if (span.equation !== undefined) return equationNode(span, span.equation);
  let node: Node = document.createTextNode(span.text);
  for (const [mark, tag] of MARK_TAGS) {
    if (span.marks?.includes(mark) === true) node = wrap(node, tag);
  }
  node = toned(node, span);
  node = commentMarked(node, span);
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
