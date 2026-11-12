// Finds every control a person can use in the page, or inside one part of
// it, with no list of screens: by the roles and elements the project
// builds every control from. Injected by source with the other page-*.ts
// files.
import { isInWindow, isShown, kindOf } from "./page-elements.ts";

export interface ControlInfo {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
  // Declares it opens something: a menu, a popover, a dialog, a part.
  readonly opens: boolean;
  // Pressing it could destroy, leave, or open the system's dialogs.
  readonly isRisky: boolean;
  readonly isFocusable: boolean;
  // A field: pointing at it is not expected to change it.
  readonly isField: boolean;
  readonly x: number;
  readonly y: number;
}

export function controlSelector(): string {
  const roles = [
    "button",
    "link",
    "tab",
    "menuitem",
    "menuitemradio",
    "menuitemcheckbox",
    "option",
    "checkbox",
    "switch",
    "treeitem",
  ];
  return [
    "button",
    "a[href]",
    "input",
    "select",
    "textarea",
    '[contenteditable="true"]',
    '[tabindex]:not([tabindex="-1"])',
    ...roles.map((role) => `[role="${role}"]`),
  ].join(", ");
}

// A fresh id the runner can find the element by again.
export function auditIdOf(element: Element): string {
  const known = element.getAttribute("data-audit-id");
  if (known) return known;
  const next = Number(Reflect.get(window, "__auditNext") ?? 0) + 1;
  Reflect.set(window, "__auditNext", next);
  element.setAttribute("data-audit-id", String(next));
  return String(next);
}

export function isRiskyControl(element: Element, label: string): boolean {
  const words =
    /delete|trash|remove|clear|reset|import|export|download|print|upload|sign out|discard/i;
  if (words.test(label)) return true;
  if (element.matches('input[type="file"], a[download], a[target="_blank"]'))
    return true;
  return element.matches("a[href]") && !element.matches('a[href^="#"]');
}

export function controlInfo(element: Element): ControlInfo {
  const label =
    element.getAttribute("aria-label") ??
    element.textContent.trim().replace(/\s+/g, " ").slice(0, 40);
  const popup = element.getAttribute("aria-haspopup");
  const opens =
    (popup !== null && popup !== "false") ||
    element.hasAttribute("aria-expanded") ||
    element.hasAttribute("popovertarget");
  const shape = `${element.querySelector("svg") ? "icon" : ""}${label ? "+text" : ""}`;
  const box = element.getBoundingClientRect();
  return {
    id: auditIdOf(element),
    kind: `${kindOf(element)}:${shape}:${popup ?? ""}`,
    label,
    opens,
    isRisky: isRiskyControl(element, label),
    isFocusable: element instanceof HTMLElement && element.tabIndex >= 0,
    // Fields, and areas that take a click to write, as an editor's space
    // under its text, show the caret, not a hover.
    isField:
      element.matches('input, textarea, select, [contenteditable="true"]') ||
      getComputedStyle(element).cursor === "text",
    x: box.left + box.width / 2,
    y: box.top + box.height / 2,
  };
}

// Every shown, enabled control in the window, inside the part with the
// given audit id or in the whole page.
export function listControls(scopeId: string): ControlInfo[] {
  const scope = scopeId
    ? document.querySelector(`[data-audit-id="${scopeId}"]`)
    : document.body;
  if (!scope) return [];
  return [...scope.querySelectorAll(controlSelector())]
    .filter((element) => !element.matches(":disabled, [aria-disabled='true']"))
    .filter((element) => isShown(element) && isInWindow(element))
    .map(controlInfo);
}

// One row of each kind whose controls may show only while it is pointed
// at: sidebar rows, table rows, blocks, cards.
export function listRows(): ControlInfo[] {
  const rows = document.querySelectorAll(
    '[role="treeitem"], [role="row"], tbody tr, [data-block-id], [data-row-id], [data-page-id]',
  );
  const seen = new Set<string>();
  // Blocks of each type are their own kind: a heading's handles sit
  // differently from a paragraph's.
  return [...rows]
    .filter((row) => isShown(row) && isInWindow(row))
    .map((row) => {
      const info = controlInfo(row);
      return {
        ...info,
        kind: `${info.kind}:${row.getAttribute("data-type") ?? ""}`,
      };
    })
    .filter((row) => !seen.has(row.kind) && Boolean(seen.add(row.kind)));
}

// A point inside the row that is not over the control, to point at the
// row alone; the window's quiet corner when the control fills the row.
export function restPoint(controlId: string, rowId: string): number[] {
  const control = document.querySelector(`[data-audit-id="${controlId}"]`);
  const row = document.querySelector(`[data-audit-id="${rowId}"]`);
  if (control && row) {
    const r = row.getBoundingClientRect();
    for (const x of [r.left + 2, r.right - 2, r.left + r.width / 2]) {
      const y = r.top + Math.min(r.height / 2, 12);
      const hit = document.elementFromPoint(x, y);
      if (hit && row.contains(hit) && !control.contains(hit)) return [x, y];
    }
  }
  return quietPoint();
}

// A point over nothing that reacts to the pointer.
export function quietPoint(): number[] {
  const candidates = [
    [innerWidth / 2, 4],
    [innerWidth - 4, innerHeight - 4],
    [innerWidth / 2, innerHeight - 4],
  ];
  for (const [x = 0, y = 0] of candidates) {
    const hit = document.elementFromPoint(x, y);
    if (!hit?.closest(controlSelector())) return [x, y];
  }
  return [innerWidth / 2, 4];
}
