import { html, type TemplateResult } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import {
  createPage,
  movePage,
  selectDropTarget,
  selectStepTarget,
  type MoveDirection,
} from "../../blocks/page/index.ts";
import { parseBlockId, type BlockId } from "../../model/index.ts";
import {
  openOverlay,
  setActivePage,
  togglePageExpanded,
  type Dispatch,
} from "../../state/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import { startPointerDrag } from "../../ui/drag/index.ts";
import { PAGE_MENU_OVERLAY, pageMenuAnchorId } from "../page-menu/index.ts";
import { renderRow, TREE_PLACE, type Context } from "./sidebar-row.view.ts";
import type { TreeRow } from "./sidebar.selectors.ts";

function rowOf(event: Event): HTMLElement | null {
  const { target } = event;
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLElement>("[data-page-id]");
}

function pageIdOf(row: HTMLElement | null): BlockId | undefined {
  return parseBlockId(row?.dataset.pageId ?? "");
}

function onTreeClick(event: Event, dispatch: Dispatch): void {
  const pageId = pageIdOf(rowOf(event));
  if (pageId === undefined || !(event.target instanceof Element)) return;
  const action =
    event.target.closest<HTMLElement>("[data-action]")?.dataset.action;
  if (action === "toggle") dispatch(togglePageExpanded.create({ pageId }));
  else if (action === "add") dispatch(createPage.create({ parentId: pageId }));
  else dispatch(setActivePage.create({ pageId }));
}

function focusSibling(row: HTMLElement, offset: number): void {
  const rows = [
    ...(row.parentElement?.querySelectorAll<HTMLElement>("[role=treeitem]") ??
      []),
  ];
  rows[rows.indexOf(row) + offset]?.focus();
}

const MOVE_KEYS: Record<string, MoveDirection> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowRight: "in",
  ArrowLeft: "out",
};

// Alt with an arrow key moves the focused page; focus stays on it.
function movePageByKey(event: KeyboardEvent, context: Context): boolean {
  const direction = MOVE_KEYS[event.key];
  const pageId = pageIdOf(rowOf(event));
  if (!event.altKey || direction === undefined || pageId === undefined) {
    return false;
  }
  event.preventDefault();
  const target = selectStepTarget(context.state, pageId, direction);
  if (target !== undefined) context.dispatch(movePage.create(target));
  // Moving the row in the document drops focus; give it back.
  document.querySelector<HTMLElement>(`[data-page-id="${pageId}"]`)?.focus();
  announce(target === undefined ? COPY.moveTo.notMoved : COPY.moveTo.moved);
  return true;
}

function startRowDrag(event: PointerEvent, context: Context): void {
  if (
    event.target instanceof Element &&
    event.target.closest("button") !== null
  ) {
    return;
  }
  startPointerDrag(event, {
    itemSelector: "[data-page-id]",
    onDrop(source, target, position) {
      const pageId = pageIdOf(source);
      const targetId = pageIdOf(target);
      if (pageId === undefined || targetId === undefined) return;
      const drop = selectDropTarget(context.state, pageId, {
        targetId,
        position,
      });
      if (drop === undefined) return;
      const result = context.dispatch(movePage.create(drop));
      announce(result.ok ? COPY.moveTo.moved : COPY.moveTo.notMoved);
    },
  });
}

// Shift+F10 and the context menu key open the focused row's menu.
function openMenuByKey(event: KeyboardEvent, context: Context): boolean {
  const isMenuKey =
    event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey);
  const pageId = pageIdOf(rowOf(event));
  if (!isMenuKey || pageId === undefined) return false;
  event.preventDefault();
  const anchorId = pageMenuAnchorId(TREE_PLACE, pageId);
  context.dispatch(
    openOverlay.create({ overlay: { kind: PAGE_MENU_OVERLAY, anchorId } }),
  );
  return true;
}

// A right click on a row opens the page's menu at the pointer.
function onTreeContextMenu(event: MouseEvent, context: Context): void {
  const pageId = pageIdOf(rowOf(event));
  if (pageId === undefined) return;
  event.preventDefault();
  const anchorId = pageMenuAnchorId(TREE_PLACE, pageId);
  const isPointer = event.clientX !== 0 || event.clientY !== 0;
  const point = { x: event.clientX, y: event.clientY };
  const overlay = { kind: PAGE_MENU_OVERLAY, anchorId };
  context.dispatch(
    openOverlay.create({
      overlay: isPointer ? { ...overlay, point } : overlay,
    }),
  );
}

// Keyboard support of the ARIA tree pattern.
function onTreeKeyDown(event: KeyboardEvent, context: Context): void {
  const { dispatch } = context;
  const row = rowOf(event);
  const pageId = pageIdOf(row);
  // Keys pressed on a button inside a row belong to that button.
  if (row === null || pageId === undefined || event.target !== row) return;
  if (movePageByKey(event, context) || openMenuByKey(event, context)) return;
  const isExpanded = row.getAttribute("aria-expanded");
  const open = (): void => {
    dispatch(setActivePage.create({ pageId }));
  };
  const toggle = (): void => {
    dispatch(togglePageExpanded.create({ pageId }));
  };
  const actions: Record<string, () => void> = {
    ArrowDown() {
      focusSibling(row, 1);
    },
    ArrowUp() {
      focusSibling(row, -1);
    },
    ArrowRight() {
      if (isExpanded === "false") toggle();
      else focusSibling(row, 1);
    },
    ArrowLeft() {
      if (isExpanded === "true") toggle();
    },
    Enter: open,
    " ": open,
  };
  const action = actions[event.key];
  if (action === undefined) return;
  event.preventDefault();
  action();
}

// The page tree: rows, with pointer, keyboard and drag handling delegated
// from the list element.
export function renderTree(
  rows: readonly TreeRow[],
  context: Context,
): TemplateResult {
  return html`<ul
    class="sidebar__tree"
    role="tree"
    aria-label=${COPY.shell.pagesLabel}
    @click=${(event: Event) => {
      onTreeClick(event, context.dispatch);
    }}
    @pointerdown=${(event: PointerEvent) => {
      startRowDrag(event, context);
    }}
    @keydown=${(event: KeyboardEvent) => {
      onTreeKeyDown(event, context);
    }}
    @contextmenu=${(event: MouseEvent) => {
      onTreeContextMenu(event, context);
    }}
  >
    ${repeat(
      rows,
      (row) => row.id,
      (row) => renderRow(row, context),
    )}
  </ul>`;
}
