// The cursor a person would see, as the browser chooses it: while an
// element holds the pointer capture (a drag's handle) its cursor wins
// over what is under the pointer; a custom url() cursor falls back to
// the keyword after it; "auto" is the I-beam over editable or selectable
// text and the arrow elsewhere (CSS UI 3).
import type { Page } from "playwright-core";
import type { Hand } from "./capture-hand.ts";

const CAPTURE_KEY = "capture.pointer-capture";

// Notes which element holds the pointer capture; it only listens.
export async function notePointerCapture(page: Page): Promise<void> {
  await page.addInitScript((key: string) => {
    const symbol = Symbol.for(key);
    const keep = (target: EventTarget | null): void => {
      Reflect.set(window, symbol, target);
    };
    addEventListener(
      "gotpointercapture",
      (event) => {
        keep(event.target);
      },
      true,
    );
    addEventListener(
      "lostpointercapture",
      () => {
        keep(null);
      },
      true,
    );
  }, CAPTURE_KEY);
}

export interface ShownCursor {
  readonly keyword: string;
  // Why it is this one, when it is not simply the element's own cursor.
  readonly why: string;
}

function overSelectableText(at: { x: number; y: number }): boolean {
  const position = document.caretPositionFromPoint(at.x, at.y);
  const node = position?.offsetNode;
  if (node?.nodeType !== Node.TEXT_NODE || node.parentElement === null)
    return false;
  if (getComputedStyle(node.parentElement).userSelect === "none") return false;
  const range = document.createRange();
  range.selectNodeContents(node);
  return [...range.getClientRects()].some(
    (r) =>
      at.x >= r.left && at.x <= r.right && at.y >= r.top && at.y <= r.bottom,
  );
}

// What "auto" shows: the I-beam over editable or selectable text.
function autoCursor(
  source: Element,
  at: { x: number; y: number },
): ShownCursor {
  const field =
    "textarea, input:not([type=button], [type=submit], [type=reset], [type=checkbox], [type=radio], [type=range], [type=color], [type=file], [type=image])";
  const editable =
    source instanceof HTMLElement &&
    (source.isContentEditable || source.matches(field));
  if (editable) return { keyword: "text", why: "auto over editable" };
  return overSelectableText(at)
    ? { keyword: "text", why: "auto over text" }
    : { keyword: "default", why: "auto" };
}

function readShownCursor(input: {
  at: { x: number; y: number };
  key: string;
}): ShownCursor {
  const { at, key } = input;
  const held: unknown = Reflect.get(window, Symbol.for(key));
  const captured = held instanceof Element && held.isConnected ? held : null;
  const source = captured ?? document.elementFromPoint(at.x, at.y);
  if (source === null) return { keyword: "default", why: "nothing under it" };
  const why = captured === null ? "" : "pointer capture";
  const keyword =
    getComputedStyle(source).cursor.split(",").pop()?.trim() ?? "auto";
  if (keyword !== "auto") return { keyword, why };
  if (captured !== null) return { keyword: "default", why: "auto, captured" };
  return autoCursor(source, at);
}

function isShown(value: unknown): value is ShownCursor {
  if (typeof value !== "object" || value === null) return false;
  const keyword: unknown = Reflect.get(value, "keyword");
  return (
    typeof keyword === "string" && typeof Reflect.get(value, "why") === "string"
  );
}

// The functions go into the page together: they call each other.
export async function shownCursor(hand: Hand): Promise<ShownCursor> {
  const input = JSON.stringify({ at: hand.at, key: CAPTURE_KEY });
  const script = [
    "(() => {",
    `const overSelectableText = ${overSelectableText.toString()};`,
    `const autoCursor = ${autoCursor.toString()};`,
    `const readShownCursor = ${readShownCursor.toString()};`,
    `return readShownCursor(${input});`,
    "})()",
  ].join("\n");
  const shown: unknown = await hand.page.evaluate(script);
  return isShown(shown) ? shown : { keyword: "default", why: "unread" };
}
