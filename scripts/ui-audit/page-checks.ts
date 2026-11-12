// Checks that run inside the page under audit. The runner injects every
// function of this file by its source, so each may call the others by
// name; none may use anything from outside this file, module constants
// included.

export interface Problem {
  readonly check: string;
  readonly target: string;
  readonly detail: string;
}

// A short name for an element in a report: its tag and classes, then its
// label or its first words.
export function describeElement(element: Element): string {
  const classes = [...element.classList].slice(0, 2).join(".");
  const name = element.tagName.toLowerCase() + (classes ? `.${classes}` : "");
  const label = element.getAttribute("aria-label");
  const text = element.textContent.trim().slice(0, 40);
  if (label !== null) return `${name} [${label}]`;
  return text === "" ? name : `${name} "${text}"`;
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
// what holds it, any size.
export function isShown(element: Element): boolean {
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

export function overflowProblems(): Problem[] {
  const root = document.documentElement;
  const extra = root.scrollWidth - root.clientWidth;
  if (extra <= 1) return [];
  const detail = `the page scrolls sideways by ${String(extra)} px`;
  return [{ check: "page-overflow", target: "html", detail }];
}

// The open menu's distance from the control that opened it.
export function detachedProblems(overlay: Element): Problem[] {
  if (overlay instanceof HTMLDialogElement) return [];
  const anchor = document.querySelector(
    '[data-overlay-anchor][aria-expanded="true"]',
  );
  if (anchor === null || !isShown(anchor)) return [];
  const a = anchor.getBoundingClientRect();
  const o = overlay.getBoundingClientRect();
  const gap = Math.max(
    a.left - o.right,
    o.left - a.right,
    a.top - o.bottom,
    o.top - a.bottom,
    0,
  );
  if (gap <= 16) return [];
  const detail = `${String(Math.round(gap))} px from ${describeElement(anchor)}`;
  return [
    { check: "overlay-detached", target: describeElement(overlay), detail },
  ];
}

// Every open menu, popover and dialog lies inside the window and, when a
// control opened it, beside that control.
export function overlayProblems(): Problem[] {
  const open = document.querySelectorAll(
    "[popover]:popover-open, dialog[open]",
  );
  return [...open].flatMap((overlay) => {
    if (!isShown(overlay) || overlay.matches('[role="tooltip"], .tooltip'))
      return [];
    const r = overlay.getBoundingClientRect();
    const isOutside =
      r.left < -1 ||
      r.top < -1 ||
      r.right > innerWidth + 1 ||
      r.bottom > innerHeight + 1;
    const where = `${String(Math.round(r.left))},${String(Math.round(r.top))} to ${String(Math.round(r.right))},${String(Math.round(r.bottom))}`;
    const offscreen = isOutside
      ? [
          {
            check: "overlay-offscreen",
            target: describeElement(overlay),
            detail: `${where} leaves the window`,
          },
        ]
      : [];
    return [...offscreen, ...detachedProblems(overlay)];
  });
}

// True when the element or a part of it ends cut text with an ellipsis.
export function hasEllipsis(element: Element): boolean {
  return [element, ...element.querySelectorAll("*")].some(
    (part) => getComputedStyle(part).textOverflow === "ellipsis",
  );
}

// A control whose text runs past its edge without an ellipsis.
export function clippedProblems(): Problem[] {
  const controls = document.querySelectorAll(
    'button, [role="menuitem"], [role="menuitemradio"], [role="option"], [role="tab"]',
  );
  return [...controls].flatMap((control) => {
    if (!(control instanceof HTMLElement) || !isShown(control)) return [];
    // An emoji's advance is wider than what it draws: judged by its ink.
    const text = control.textContent.trim();
    if (/^[\p{Extended_Pictographic}\u{FE0F}\u{200D}]+$/u.test(text)) return [];
    const extra = control.scrollWidth - control.clientWidth;
    if (extra <= 1 || hasEllipsis(control)) return [];
    const detail = `its content runs ${String(extra)} px past its edge`;
    return [{ check: "clipped", target: describeElement(control), detail }];
  });
}

export function isInWindow(element: Element): boolean {
  const r = element.getBoundingClientRect();
  return (
    r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth
  );
}

// The part of the smaller of two boxes that the other covers.
export function overlapShare(a: DOMRect, b: DOMRect): number {
  const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  if (width <= 0 || height <= 0) return 0;
  const smaller = Math.min(a.width * a.height, b.width * b.height);
  return (width * height) / smaller;
}

// Two controls on the same layer covering each other: one can not be
// pressed where it is drawn.
export function overlapProblems(): Problem[] {
  const layer = (element: Element) =>
    element.closest("[popover], dialog") ?? document.body;
  const controls = [
    ...document.querySelectorAll("button, a[href], input, select, textarea"),
  ].filter((element) => isShown(element) && isInWindow(element));
  const problems: Problem[] = [];
  controls.forEach((a, index) => {
    for (const b of controls.slice(index + 1)) {
      if (a.contains(b) || b.contains(a) || layer(a) !== layer(b)) continue;
      const boxA = visibleBox(a);
      const boxB = visibleBox(b);
      if (!boxA || !boxB) continue;
      const share = overlapShare(boxA, boxB);
      if (share < 0.3) continue;
      const detail = `${String(Math.round(share * 100))}% covered by ${describeElement(b)}`;
      problems.push({ check: "overlap", target: describeElement(a), detail });
    }
  });
  return problems;
}

// A color as sRGB 0-255 and alpha 0-1, whatever space CSS wrote it in.
export function toRgba(color: string): number[] {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (context === null) return [0, 0, 0, 0];
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0, a = 0] = context.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a / 255];
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

// Text drawn almost in its background's color: it is there but unseen.
export function contrastProblems(): Problem[] {
  const all = [...document.querySelectorAll("body *")];
  return all.flatMap((element) => {
    const hasText = [...element.childNodes].some(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
    );
    if (!hasText || !isShown(element) || !isInWindow(element)) return [];
    // Text made fully clear is meant unseen, as a click area's hint.
    const color = toRgba(getComputedStyle(element).color);
    if ((color[3] ?? 0) < 0.05) return [];
    const front = luminance(color);
    const back = luminance(backgroundOf(element));
    const ratio =
      (Math.max(front, back) + 0.05) / (Math.min(front, back) + 0.05);
    if (ratio >= 1.5) return [];
    const detail = `contrast ${ratio.toFixed(2)}:1 against its background`;
    return [
      { check: "invisible-text", target: describeElement(element), detail },
    ];
  });
}
