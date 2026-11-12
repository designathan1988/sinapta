// The page-wide rules: sideways scroll, menus and dialogs in place, text
// cut off, controls covering each other, unseen text. Injected into the
// page by source with the other page-*.ts files.
import {
  describeElement,
  isInWindow,
  isShown,
  luminance,
  backgroundOf,
  problemOf,
  toRgba,
  visibleBox,
  type Problem,
} from "./page-elements.ts";

export function overflowProblems(): Problem[] {
  const root = document.documentElement;
  const extra = root.scrollWidth - root.clientWidth;
  if (extra <= 1) return [];
  const detail = `the page scrolls sideways by ${String(extra)} px`;
  return [{ check: "page-overflow", target: "html", detail, kind: "html" }];
}

// The gap between two boxes, 0 when they touch or overlap.
export function gapBetween(a: DOMRect, b: DOMRect): number {
  return Math.max(
    a.left - b.right,
    b.left - a.right,
    a.top - b.bottom,
    b.top - a.bottom,
    0,
  );
}

// The open menu's distance from the control that opened it: the nearest
// open opener outside it, as a submenu's is its menu's row.
export function detachedProblems(overlay: Element): Problem[] {
  if (overlay instanceof HTMLDialogElement) return [];
  const openers = [
    ...document.querySelectorAll(
      '[data-overlay-anchor][aria-expanded="true"], [aria-expanded="true"][aria-haspopup]',
    ),
  ].filter((opener) => isShown(opener) && !overlay.contains(opener));
  const o = overlay.getBoundingClientRect();
  const gaps = openers.map((opener) =>
    gapBetween(opener.getBoundingClientRect(), o),
  );
  if (gaps.length === 0) return [];
  const gap = Math.min(...gaps);
  if (gap <= 16) return [];
  const anchor = openers[gaps.indexOf(gap)] ?? overlay;
  const detail = `${String(Math.round(gap))} px from ${describeElement(anchor)}`;
  return [problemOf("overlay-detached", overlay, detail)];
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
    const out = Math.max(
      -r.left,
      -r.top,
      r.right - innerWidth,
      r.bottom - innerHeight,
    );
    const offscreen =
      out > 1
        ? [
            problemOf(
              "overlay-offscreen",
              overlay,
              `${String(Math.round(out))} px outside the window`,
            ),
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
    return [problemOf("clipped", control, detail)];
  });
}

// A control something else is drawn over, where it would be pressed: a
// press there reaches the other element, not the control. A small
// control set inside a larger one, as a row's "…", covers only its own
// part of it and is fine.
export function overlapProblems(): Problem[] {
  const layer = (element: Element) =>
    element.closest("[popover], dialog") ?? document.body;
  const controls = [
    ...document.querySelectorAll("button, a[href], input, select, textarea"),
  ].filter((element) => isShown(element) && isInWindow(element));
  return controls.flatMap((control) => {
    const box = visibleBox(control);
    if (!box) return [];
    const hit = document.elementFromPoint(
      box.left + box.width / 2,
      box.top + box.height / 2,
    );
    if (!hit || control.contains(hit) || hit.contains(control)) return [];
    if (layer(hit) !== layer(control)) return [];
    const detail = `its middle is covered by ${describeElement(hit)}`;
    return [problemOf("covered", control, detail)];
  });
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
    return [problemOf("invisible-text", element, detail)];
  });
}
