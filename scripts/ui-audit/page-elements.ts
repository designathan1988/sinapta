// What every page-side rule shares: what a problem is, how an element is
// named and grouped, whether it is seen, and the colors behind it. Like
// every page-*.ts file, its functions are injected into the page by their
// source: each may call any other page-side function by name and nothing
// else, module constants included.

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface Problem {
  readonly check: string;
  readonly target: string;
  readonly detail: string;
  // The element's kind, to group the same defect on many elements.
  readonly kind?: string;
  // Where the element was, to crop its picture.
  readonly box?: Box;
  // The self-test fixture's id of the case the element belongs to.
  readonly marker?: string;
}

// A short name for an element in a report: its tag and classes, then its
// label or its first words.
export function describeElement(element: Element): string {
  const label = element.getAttribute("aria-label");
  const text = element.textContent.trim().replace(/\s+/g, " ").slice(0, 40);
  if (label !== null) return `${kindOf(element)} [${label}]`;
  return text === "" ? kindOf(element) : `${kindOf(element)} "${text}"`;
}

// What makes elements the same kind: tag, role and first two classes.
export function kindOf(element: Element): string {
  const classes = [...element.classList]
    .filter((name) => !name.startsWith("audit-"))
    .slice(0, 2)
    .join(".");
  const role = element.getAttribute("role");
  const tag = element.tagName.toLowerCase();
  return `${tag}${classes ? `.${classes}` : ""}${role ? `[${role}]` : ""}`;
}

// The self-test case an element belongs to, if any.
export function markerOf(element: Element): string {
  return element.closest("[data-expect]")?.id ?? "";
}

export function problemOf(
  check: string,
  element: Element,
  detail: string,
): Problem {
  const r = element.getBoundingClientRect();
  return {
    check,
    target: describeElement(element),
    detail,
    kind: kindOf(element),
    box: { x: r.left, y: r.top, width: r.width, height: r.height },
    marker: markerOf(element),
  };
}

// The part of an element its scrolling and clipping ancestors leave in
// view; none when they cut it away, as a table's columns past the edge
// of the main area beside a side peek.
export function visibleBox(element: Element): DOMRect | undefined {
  let box = element.getBoundingClientRect();
  for (let node = element.parentElement; node; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (style.overflowX === "visible" && style.overflowY === "visible")
      continue;
    const clip = node.getBoundingClientRect();
    const left = Math.max(box.left, clip.left);
    const top = Math.max(box.top, clip.top);
    const right = Math.min(box.right, clip.right);
    const bottom = Math.min(box.bottom, clip.bottom);
    if (right - left < 1 || bottom - top < 1) return undefined;
    box = new DOMRect(left, top, right - left, bottom - top);
  }
  return box;
}

// Seen by the reader: laid out, not hidden, not transparent, not clipped
// away as a skip link or a screen-reader-only label is, not cut off by
// what holds it, any size. During a check, read from the set made once.
export function isShown(element: Element): boolean {
  const known: unknown = Reflect.get(window, "__auditShown");
  if (known instanceof Set) return known.has(element);
  const rect = element.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return false;
  const clip = getComputedStyle(element).clipPath;
  if (clip.startsWith("inset(50%")) return false;
  if (element.closest(".visually-hidden")) return false;
  if (visibleBox(element) === undefined) return false;
  return element.checkVisibility({
    opacityProperty: true,
    visibilityProperty: true,
  });
}

// Hidden from sight whatever its box: not drawn, clear, or clipped away
// as screen-reader-only content is.
export function isHiddenByStyle(element: Element, style: CSSStyleDeclaration) {
  if (style.display === "none" || Number(style.opacity) === 0) return true;
  if (style.clipPath.startsWith("inset(50%")) return true;
  return element.classList.contains("visually-hidden");
}

// Every element seen in the page, found in one walk down the tree that
// carries the clipping of scrolling ancestors; the top layer and fixed
// elements clip to the window.
export function shownSet(): Set<Element> {
  const shown = new Set<Element>();
  const view = new DOMRect(0, 0, innerWidth, innerHeight);
  const walk = (parent: Element, clip: DOMRect): void => {
    for (const element of parent.children) {
      const style = getComputedStyle(element);
      if (isHiddenByStyle(element, style)) continue;
      const own =
        element.matches(":popover-open, dialog[open]") ||
        style.position === "fixed"
          ? view
          : clip;
      const r = element.getBoundingClientRect();
      const left = Math.max(r.left, own.left);
      const top = Math.max(r.top, own.top);
      const right = Math.min(r.right, own.right);
      const bottom = Math.min(r.bottom, own.bottom);
      const isSeen = right - left >= 1 && bottom - top >= 1;
      if (isSeen && style.visibility === "visible") shown.add(element);
      const scrolls =
        style.overflowX !== "visible" || style.overflowY !== "visible";
      walk(
        element,
        scrolls
          ? new DOMRect(
              left,
              top,
              Math.max(0, right - left),
              Math.max(0, bottom - top),
            )
          : own,
      );
    }
  };
  walk(document.body, view);
  return shown;
}

export function isInWindow(element: Element): boolean {
  const r = element.getBoundingClientRect();
  return (
    r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth
  );
}

// A color as sRGB 0-255 and alpha 0-1, whatever space CSS wrote it in;
// each color is worked out once.
export function toRgba(color: string): number[] {
  const cache: unknown = Reflect.get(window, "__auditColors");
  const colors = cache instanceof Map ? cache : new Map<string, number[]>();
  Reflect.set(window, "__auditColors", colors);
  const known: unknown = colors.get(color);
  if (Array.isArray(known)) return known.map(Number);
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (context === null) return [0, 0, 0, 0];
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0, a = 0] = context.getImageData(0, 0, 1, 1).data;
  const rgba = [r, g, b, a / 255];
  colors.set(color, rgba);
  return rgba;
}

// The color behind an element: its own background and its ancestors',
// see-through ones laid over the opaque one beneath.
export function backgroundOf(element: Element): number[] {
  const layers: number[][] = [];
  for (let node: Element | null = element; node; node = node.parentElement) {
    const rgba = toRgba(getComputedStyle(node).backgroundColor);
    if ((rgba[3] ?? 0) > 0) layers.push(rgba);
    if ((rgba[3] ?? 0) >= 0.99) break;
  }
  return layers.reduceRight(
    (under, [r = 0, g = 0, b = 0, a = 0]) => [
      r * a + (under[0] ?? 0) * (1 - a),
      g * a + (under[1] ?? 0) * (1 - a),
      b * a + (under[2] ?? 0) * (1 - a),
    ],
    [255, 255, 255],
  );
}

export function luminance(rgb: number[]): number {
  const [r = 0, g = 0, b = 0] = rgb.map((value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
