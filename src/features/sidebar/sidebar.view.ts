import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
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
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { startPointerDrag } from "../../ui/drag/index.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { renderPageMenuButton } from "../page-menu/index.ts";
import { TRASH_OVERLAY } from "../trash/index.ts";
import { renderFavorites } from "./sidebar-favorites.view.ts";
import { selectTreeRows, type TreeRow } from "./sidebar.selectors.ts";

const LEVEL_PROPERTY = "--sidebar-level";

function rowOf(event: Event): HTMLElement | null {
  const { target } = event;
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLElement>("[data-page-id]");
}

function pageIdOf(row: HTMLElement | null): BlockId | undefined {
  return parseBlockId(row?.dataset.pageId ?? "");
}

function renderAddButton(): TemplateResult {
  return html`<button
    type="button"
    class="sidebar__add"
    tabindex="-1"
    data-action="add"
    aria-label=${COPY.sidebar.addSubpage}
    title=${COPY.sidebar.addSubpage}
  >
    ${renderIcon("plus")}
  </button>`;
}

// Indentation depends on the level, so it is set through the CSSOM.
function setLevel(row: Element | undefined, level: number): void {
  if (row instanceof HTMLElement) {
    row.style.setProperty(LEVEL_PROPERTY, String(level));
  }
}

interface Context {
  readonly state: AppState;
  readonly dispatch: Dispatch;
}

function renderRow(row: TreeRow, context: Context): TemplateResult {
  const title = row.title === "" ? COPY.sidebar.untitled : row.title;
  return html`<li
    class="sidebar__row"
    role="treeitem"
    tabindex=${row.isTabStop ? "0" : "-1"}
    data-page-id=${row.id}
    aria-level=${row.level}
    aria-current=${row.isActive ? "page" : nothing}
    aria-expanded=${row.hasChildren ? String(row.isExpanded) : nothing}
    ?data-untitled=${row.title === ""}
    ${ref((element) => {
      setLevel(element, row.level);
    })}
  >
    <button
      type="button"
      class="sidebar__toggle"
      tabindex="-1"
      data-action="toggle"
      aria-label=${
        row.isExpanded ? COPY.sidebar.collapsePage : COPY.sidebar.expandPage
      }
      ?hidden=${!row.hasChildren}
    >
      ${renderIcon("chevron")}
    </button>
    <span class="sidebar__icon" aria-hidden="true">${row.icon ?? ""}</span>
    <span class="sidebar__title">${title}</span>
    ${renderPageMenuButton({ place: "tree", pageId: row.id, ...context })}
    ${renderAddButton()}
  </li>`;
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

// Keyboard support of the ARIA tree pattern.
function onTreeKeyDown(event: KeyboardEvent, context: Context): void {
  const { dispatch } = context;
  if (movePageByKey(event, context)) return;
  const row = rowOf(event);
  const pageId = pageIdOf(row);
  if (row === null || pageId === undefined) return;
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

function renderFooter(dispatch: Dispatch): TemplateResult {
  return html`${renderButton({
    label: COPY.sidebar.newPage,
    icon: "plus",
    onClick: () => dispatch(createPage.create({ parentId: null })),
  })}
  ${renderButton({
    label: COPY.trash.open,
    icon: "trash",
    onClick: () =>
      dispatch(openOverlay.create({ overlay: { kind: TRASH_OVERLAY } })),
  })}`;
}

export function renderSidebar(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const rows = selectTreeRows(state);
  const tree = html`<ul
    class="sidebar__tree"
    role="tree"
    aria-label=${COPY.shell.pagesLabel}
    @click=${(event: Event) => {
      onTreeClick(event, dispatch);
    }}
    @pointerdown=${(event: PointerEvent) => {
      startRowDrag(event, { state, dispatch });
    }}
    @keydown=${(event: KeyboardEvent) => {
      onTreeKeyDown(event, { state, dispatch });
    }}
  >
    ${repeat(
      rows,
      (row) => row.id,
      (row) => renderRow(row, { state, dispatch }),
    )}
  </ul>`;
  return html`<div class="sidebar">
    ${renderFavorites(state, dispatch)}
    ${
      rows.length === 0
        ? html`<p class="sidebar__empty">${COPY.shell.emptyWorkspace}</p>`
        : tree
    }
    ${renderFooter(dispatch)}
  </div>`;
}
