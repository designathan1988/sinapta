// How a control looks and where everything else sits, before and after it
// is pointed at or focused: the page side of the sweep's hover and focus
// rules. Injected by source with the other page-*.ts files.
import {
  describeElement,
  isShown,
  problemOf,
  type Problem,
} from "./page-elements.ts";

export function auditElement(id: string): Element | null {
  return document.querySelector(`[data-audit-id="${id}"]`);
}

// The look of one element and its pseudo-elements, as one string.
export function lookOf(element: Element): string {
  const parts = [null, "::before", "::after"].map((pseudo) => {
    const s = getComputedStyle(element, pseudo);
    if (pseudo !== null && s.content === "none") return "";
    return [
      s.backgroundColor,
      s.backgroundImage,
      s.color,
      s.borderTopColor,
      s.borderBottomColor,
      s.boxShadow,
      s.outlineStyle,
      s.outlineColor,
      s.opacity,
      s.textDecorationLine,
      s.transform,
      s.filter,
      s.visibility,
      s.display,
    ].join("|");
  });
  return parts.join("/");
}

// The control's row: itself and the ancestors about its height, whose
// look changing when the control is pointed at is the control's response.
export function rowOf(control: Element): Element[] {
  const height = control.getBoundingClientRect().height;
  const row = [control];
  for (let node = control.parentElement; node; node = node.parentElement) {
    if (node === document.body) break;
    if (node.getBoundingClientRect().height > height * 2 + 16) break;
    row.push(node);
  }
  return row;
}

// The look of the control's row and of everything inside it.
export function responseOf(control: Element): string {
  const row = rowOf(control);
  const top = row.at(-1) ?? control;
  const inside = [...top.querySelectorAll("*")].slice(0, 300);
  return [...row, ...inside].map(lookOf).join("\n");
}

// Every shown element laid out in the flow, and where it is.
export function flowBoxes(): Map<Element, DOMRect> {
  const boxes = new Map<Element, DOMRect>();
  for (const element of document.body.querySelectorAll("*")) {
    const position = getComputedStyle(element).position;
    if (position === "absolute" || position === "fixed") continue;
    if (!element.checkVisibility()) continue;
    boxes.set(element, element.getBoundingClientRect());
  }
  return boxes;
}

// Remembers the control's look and the layout before it is pointed at.
export function rememberBefore(id: string): boolean {
  const control = auditElement(id);
  if (!control) return false;
  Reflect.set(window, "__auditLook", responseOf(control));
  Reflect.set(window, "__auditBoxes", flowBoxes());
  return true;
}

// How far an element of the remembered layout moved, 0 for the control,
// what it holds or what holds it.
export function distanceMoved(
  element: unknown,
  box: unknown,
  control: Element,
): number {
  if (!(element instanceof Element) || !(box instanceof DOMRect)) return 0;
  if (!element.isConnected || control.contains(element)) return 0;
  if (element.contains(control)) return 0;
  const now = element.getBoundingClientRect();
  return Math.max(Math.abs(now.left - box.left), Math.abs(now.top - box.top));
}

// The element of the remembered layout that moved the most, and by how
// much.
export function movedMost(control: Element): [Element, number] | undefined {
  const before: unknown = Reflect.get(window, "__auditBoxes");
  if (!(before instanceof Map)) return undefined;
  let most: [Element, number] | undefined;
  for (const [element, box] of before) {
    const moved = distanceMoved(element, box, control);
    if (
      moved >= 0.5 &&
      element instanceof Element &&
      (!most || moved > most[1])
    )
      most = [element, moved];
  }
  return most;
}

// Pointing at a control must visibly change it or its row, and never
// move what is around it.
export function hoverProblems(id: string): Problem[] {
  const control = auditElement(id);
  if (!control || !isShown(control)) return [];
  const problems: Problem[] = [];
  if (Reflect.get(window, "__auditLook") === responseOf(control)) {
    const detail = "pointing at it changes nothing on it or its row";
    problems.push(problemOf("no-hover-response", control, detail));
  }
  const moved = movedMost(control);
  if (moved) {
    const detail = `pointing at it moves ${describeElement(moved[0])} by ${moved[1].toFixed(1)} px`;
    problems.push(problemOf("hover-shifts-layout", control, detail));
  }
  return problems;
}

// Focus from the keyboard must show on the control or its row.
export function focusProblems(id: string): Problem[] {
  const control = auditElement(id);
  if (!(control instanceof HTMLElement) || !isShown(control)) return [];
  // A selected cell or the current page shows its state, focused or not.
  if (control.matches('[aria-selected="true"], [aria-current], [data-active]'))
    return [];
  if (document.activeElement instanceof HTMLElement)
    document.activeElement.blur();
  const before = responseOf(control);
  control.focus();
  const isFocused = document.activeElement === control;
  const after = responseOf(control);
  control.blur();
  if (!isFocused || before !== after) return [];
  const detail = "focus from the keyboard shows nothing on it or its row";
  return [problemOf("focus-not-visible", control, detail)];
}
