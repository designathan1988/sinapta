// Checks of the editor and the database tools, run inside the page as
// page-checks.ts's are: injected by source, calling each other and
// page-checks.ts's functions by name.
import type { Problem } from "./page-checks.ts";
import { describeElement, isShown } from "./page-checks.ts";

// Where a block's first row sits, measured on its first character seen;
// an empty block's editable line where it has none. Text of the blocks
// inside it does not count.
export function firstLine(
  block: Element,
): { top: number; height: number } | undefined {
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const owner = node.parentElement;
    if (!owner || !node.textContent?.trim()) continue;
    if (owner.closest(".editor__block") !== block) continue;
    // The block's first row as seen: its text, or a control above it as
    // a code block's language; not screen-reader labels nor its handles.
    const skip = ".editor__handle, .visually-hidden, [aria-hidden='true']";
    if (owner.closest(skip)) continue;
    const range = document.createRange();
    range.setStart(node, 0);
    range.setEnd(node, 1);
    const rect = range.getClientRects()[0];
    if (rect) return { top: rect.top, height: rect.height };
  }
  const editable = [...block.querySelectorAll("[contenteditable='true']")].find(
    (element) => element.closest(".editor__block") === block,
  );
  if (!editable) return undefined;
  const lineHeight = parseFloat(getComputedStyle(editable).lineHeight);
  return { top: editable.getBoundingClientRect().top, height: lineHeight };
}

// The block under the pointer shows its "+" and grip level with its first
// line of text, as Notion's do, whatever space the block opens above it.
export function handleProblems(): Problem[] {
  const block = [...document.querySelectorAll(".editor__block:hover")].at(-1);
  if (!block) return [];
  const line = firstLine(block);
  if (!line) return [];
  const center = line.top + line.height / 2;
  const handles = [...block.children].filter((child) =>
    child.classList.contains("editor__handle"),
  );
  return handles.flatMap((handle): Problem[] => {
    const target = `${describeElement(handle)} of ${describeElement(block)}`;
    if (!isShown(handle)) {
      return [
        {
          check: "handle-hidden",
          target,
          detail: "not shown while its block is pointed at",
        },
      ];
    }
    const box = handle.getBoundingClientRect();
    const off = box.top + box.height / 2 - center;
    if (Math.abs(off) <= 3) return [];
    const top = block.getBoundingClientRect().top;
    const where = `handle at ${String(Math.round(box.top - top))} px, line at ${String(Math.round(line.top - top))} px from the block's top`;
    const detail = `${String(Math.round(Math.abs(off)))} px ${off > 0 ? "below" : "above"} the middle of the block's first line (${where})`;
    return [{ check: "handle-misaligned", target, detail }];
  });
}

// A row of tools that should stay on one line, wrapped onto two.
export function wrapProblems(): Problem[] {
  const rows = document.querySelectorAll(".database__toolbar, .app__top-bar");
  return [...rows].flatMap((row): Problem[] => {
    // Tools of a row share its middle; one a line lower is a new line.
    const middles = [...row.children]
      .filter((child) => isShown(child))
      .map((child) => {
        const box = child.getBoundingClientRect();
        return box.top + box.height / 2;
      });
    const spread = Math.max(...middles) - Math.min(...middles);
    if (!isShown(row) || middles.length < 2 || spread <= 12) return [];
    const detail = `its tools' middles lie ${String(Math.round(spread))} px apart: two lines`;
    return [{ check: "wrapped-toolbar", target: describeElement(row), detail }];
  });
}
