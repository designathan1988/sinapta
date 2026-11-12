// Things drawn wrong, wherever they are: icons that draw nothing, pictures
// that did not load, a row whose items do not share its middle, text
// running out of its box, something pressable that is not a control, a
// control squeezed to nothing. Injected by source with the other
// page-*.ts files.
import {
  isInWindow,
  isShown,
  problemOf,
  type Problem,
} from "./page-elements.ts";
import { controlSelector } from "./page-discover.ts";

export function shownInWindow(selector: string): Element[] {
  return [...document.querySelectorAll(selector)].filter(
    (element) => isShown(element) && isInWindow(element),
  );
}

// An icon's drawn area; none when it can not be measured.
export function drawnBox(icon: SVGSVGElement): DOMRect | undefined {
  try {
    return icon.getBBox();
  } catch {
    return undefined;
  }
}

export function blankIconProblems(): Problem[] {
  return shownInWindow("svg").flatMap((icon) => {
    if (!(icon instanceof SVGSVGElement)) return [];
    const shapes = icon.querySelectorAll(
      "path, circle, rect, line, polyline, polygon, ellipse, use, text, image",
    );
    const box = drawnBox(icon);
    if (!box) return [];
    // A line draws in one direction only: blank is no size either way.
    if (shapes.length > 0 && (box.width > 0 || box.height > 0)) return [];
    return [problemOf("blank-icon", icon, "the icon draws nothing")];
  });
}

export function brokenImageProblems(): Problem[] {
  return [...document.querySelectorAll("img")].flatMap((image) => {
    if (!image.getAttribute("src") || !image.complete) return [];
    if (image.naturalWidth > 0 || !image.checkVisibility()) return [];
    return [
      problemOf(
        "broken-image",
        image,
        `${image.src.slice(0, 60)} did not load`,
      ),
    ];
  });
}

// Items of a row centered on its middle that are not: the one furthest
// from the others, by how much.
export function rowAlignmentProblems(): Problem[] {
  return shownInWindow("body *").flatMap((row) => {
    const style = getComputedStyle(row);
    if (!style.display.endsWith("flex") || style.alignItems !== "center")
      return [];
    if (!style.flexDirection.startsWith("row") || style.flexWrap !== "nowrap")
      return [];
    const items = [...row.children].filter((child) => {
      const position = getComputedStyle(child).position;
      return isShown(child) && position !== "absolute" && position !== "fixed";
    });
    if (items.length < 2) return [];
    const middles = items.map((item) => {
      const box = item.getBoundingClientRect();
      return box.top + box.height / 2;
    });
    const sorted = [...middles].sort((a, b) => a - b);
    const middle = sorted[Math.floor(sorted.length / 2)] ?? 0;
    const offs = middles.map((value) => value - middle);
    const worst = offs.reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a), 0);
    if (Math.abs(worst) <= 1.5) return [];
    const item = items[offs.indexOf(worst)] ?? row;
    const detail = `sits ${Math.abs(worst).toFixed(1)} px ${worst > 0 ? "below" : "above"} the middle of its row`;
    return [problemOf("row-misaligned", item, detail)];
  });
}

// The element's own text to measure, if any: not in a field, not emoji,
// whose advance is wider than what it draws.
export function ownText(element: Element): Text | undefined {
  if (element.closest('[contenteditable="true"], input, textarea'))
    return undefined;
  const text = [...element.childNodes].find(
    (node): node is Text => node instanceof Text && node.data.trim() !== "",
  );
  if (!text) return undefined;
  const emoji = /^[\p{Extended_Pictographic}\u{FE0F}\u{200D}\s]+$/u;
  return emoji.test(text.data) ? undefined : text;
}

// The box that holds an element's text: the element, or the first
// ancestor that is not inline.
export function holderOf(element: Element): Element | null {
  let holder: Element | null = element;
  while (holder && getComputedStyle(holder).display.startsWith("inline"))
    holder = holder.parentElement;
  return holder;
}

// Text drawn past the box that holds it, spilling or cut, without an
// ellipsis.
export function textOverflowProblems(): Problem[] {
  return shownInWindow("body *").flatMap((element) => {
    const text = ownText(element);
    const holder = text ? holderOf(element) : null;
    if (
      !text ||
      !holder ||
      getComputedStyle(holder).textOverflow === "ellipsis"
    )
      return [];
    const range = document.createRange();
    range.selectNodeContents(text);
    const drawn = range.getBoundingClientRect();
    const box = holder.getBoundingClientRect();
    const past = Math.max(drawn.right - box.right, drawn.bottom - box.bottom);
    if (past <= 2 || drawn.width === 0) return [];
    const detail = `its text runs ${String(Math.round(past))} px past its box`;
    return [problemOf("text-overflow", element, detail)];
  });
}

// Something that shows a pointing hand but is not a control: it can not
// be reached from the keyboard nor named to a screen reader.
export function pressableProblems(): Problem[] {
  const controls = controlSelector();
  return shownInWindow("body *").flatMap((element) => {
    if (getComputedStyle(element).cursor !== "pointer") return [];
    if (element.closest(`${controls}, label, summary`)) return [];
    if (element.querySelector(controls)) return [];
    const parent = element.parentElement;
    if (parent && getComputedStyle(parent).cursor === "pointer") return [];
    const detail = "shows a pointing hand but is not a button nor a link";
    return [problemOf("pressable-not-control", element, detail)];
  });
}

// Whether a control squeezed to nothing opens up once focused, as a
// search field that widens when it is used.
export function growsWhenFocused(control: Element): boolean {
  if (!(control instanceof HTMLElement) || control.tabIndex < 0) return false;
  const before = document.activeElement;
  // Measured where it comes to rest: no transition on the way.
  const transition = control.style.transition;
  control.style.transition = "none";
  control.focus();
  const box = control.getBoundingClientRect();
  control.blur();
  control.style.transition = transition;
  if (before instanceof HTMLElement) before.focus();
  return box.width >= 1 && box.height >= 1;
}

// A control laid out but squeezed to nothing, that does not open up when
// it is used.
export function zeroSizeProblems(): Problem[] {
  return [...document.querySelectorAll(controlSelector())].flatMap(
    (control) => {
      if (!control.checkVisibility() || control.closest(".visually-hidden"))
        return [];
      if (getComputedStyle(control).clipPath.startsWith("inset(50%")) return [];
      const box = control.getBoundingClientRect();
      if (box.width >= 1 && box.height >= 1) return [];
      if (!isInWindow(control.parentElement ?? control)) return [];
      if (growsWhenFocused(control)) return [];
      const detail = `laid out at ${box.width.toFixed(0)}×${box.height.toFixed(0)} px`;
      return [problemOf("zero-size-control", control, detail)];
    },
  );
}
