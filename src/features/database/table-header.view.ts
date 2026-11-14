// The header row of the table: each header a button that opens its
// column's menu, as Notion's; resize handles; and the button that adds a
// property.
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { closeOverlay, openOverlay } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { viewIsLocked } from "../../blocks/page/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import { COLUMN_MENU_OVERLAY, isOpenFor } from "./database-overlay.ts";
import { propertyType } from "./property-registry.ts";
import type { TableContext } from "./table-cell.view.ts";
import type { TableColumn } from "./table-model.selectors.ts";
import { startColumnDrag } from "./table-column-drag.view.ts";
import { setFrozenStart } from "./table-column-style.ts";
import { renderGutterHeader } from "./table-gutter.view.ts";
import {
  MAX_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  resizeProperty,
} from "./view.commands.ts";

export const PROPERTY_TYPES_OVERLAY = "property-types";
const RESIZE_STEP = 16;
const RESIZE_KEYS: Record<string, number> = {
  ArrowLeft: -RESIZE_STEP,
  ArrowRight: RESIZE_STEP,
};

// Column widths come from the store as numbers, so they are set through
// the CSSOM, not through a style attribute.
export function setColumnWidth(
  column: Element | undefined,
  width: number,
): void {
  if (column instanceof HTMLElement) {
    column.style.setProperty("inline-size", `${String(width)}px`);
  }
}

// The width a pointer position asks for: its distance from the header's
// start edge.
function widthAt(event: PointerEvent): number {
  const header =
    event.target instanceof Element ? event.target.closest("th") : null;
  return event.clientX - (header?.getBoundingClientRect().left ?? 0);
}

function capture(event: PointerEvent): void {
  if (event.currentTarget instanceof Element) {
    event.currentTarget.setPointerCapture(event.pointerId);
  }
}

// While dragging, the browser owns the width; the store gets it once.
function preview(event: PointerEvent): void {
  const handle = event.currentTarget;
  if (
    !(handle instanceof Element) ||
    !handle.hasPointerCapture(event.pointerId)
  )
    return;
  const id =
    handle.closest<HTMLElement>("[data-property-id]")?.dataset.propertyId ?? "";
  const column = handle
    .closest("table")
    ?.querySelector(`col[data-property-id="${id}"]`);
  setColumnWidth(
    column ?? undefined,
    Math.max(MIN_COLUMN_WIDTH, widthAt(event)),
  );
}

function renderResizer(
  column: TableColumn,
  context: TableContext,
): TemplateResult {
  const viewId = context.model.view.id;
  const propertyId = column.property.id;
  const resize = (width: number): void => {
    context.dispatch(resizeProperty.create({ viewId, propertyId, width }));
  };
  const onKeyDown = (event: KeyboardEvent): void => {
    const step = RESIZE_KEYS[event.key];
    if (step === undefined) return;
    event.preventDefault();
    resize(column.width + step);
  };
  return html`<span
    class="database__resizer"
    role="separator"
    tabindex="0"
    aria-orientation="vertical"
    aria-label=${`${COPY.database.resizeColumn} ${column.property.name}`}
    aria-valuenow=${column.width}
    aria-valuemin=${MIN_COLUMN_WIDTH}
    aria-valuemax=${MAX_COLUMN_WIDTH}
    @pointerdown=${capture}
    @pointermove=${preview}
    @pointerup=${(event: PointerEvent) => {
      resize(widthAt(event));
    }}
    @keydown=${onKeyDown}
  ></span>`;
}

// The header itself, as Notion's: its type's icon and its name; a press
// opens the column's menu, which holds the sorts. The sorts show in the
// row of pills under the toolbar, not in the header.
function renderHeaderButton(
  column: TableColumn,
  context: TableContext,
): TemplateResult {
  const { property } = column;
  const { overlay } = context.state.ui;
  const anchorId = column.property.id;
  // The column's menu, with its property's settings in submenus, sits by
  // this button.
  const isOpen =
    overlay?.anchorId === anchorId && overlay.kind === COLUMN_MENU_OVERLAY;
  const toggle = (): void => {
    const next = { kind: COLUMN_MENU_OVERLAY, anchorId };
    context.dispatch(
      isOpen ? closeOverlay.create({}) : openOverlay.create({ overlay: next }),
    );
  };
  return html`<button
    type="button"
    class="database__header-button"
    data-overlay-anchor
    aria-haspopup="menu"
    aria-expanded=${String(isOpen)}
    title=${property.description ?? nothing}
    aria-description=${property.description ?? nothing}
    @click=${toggle}
  >
    ${renderIcon(column.isTitle ? "title" : propertyType(property.type).icon)}
    <span class="database__header-name">${property.name}</span>
  </button>`;
}

function renderHeader(
  column: TableColumn,
  context: TableContext,
): TemplateResult {
  const { property, sortDirection } = column;
  return html`<th
    class="database__header"
    scope="col"
    data-property-id=${property.id}
    aria-sort=${sortDirection ?? "none"}
    ?data-frozen=${column.frozenStart !== undefined}
    ${ref((element) => {
      setFrozenStart(element, column.frozenStart);
    })}
  >
    ${renderHeaderButton(column, context)} ${renderResizer(column, context)}
  </th>`;
}

function renderAddProperty(context: TableContext): TemplateResult {
  // A locked view takes no new property, as Notion's; its column stays.
  if (viewIsLocked(context.state.workspace, context.model.view)) {
    return html`<th class="database__header" scope="col" data-add></th>`;
  }
  const overlay = {
    kind: PROPERTY_TYPES_OVERLAY,
    anchorId: context.model.holderId,
  };
  const isOpen = isOpenFor(context.state, overlay);
  const toggle = (): void => {
    context.dispatch(
      isOpen ? closeOverlay.create({}) : openOverlay.create({ overlay }),
    );
  };
  return html`<th class="database__header" scope="col" data-add>
    <button
      type="button"
      class="database__add-property"
      data-overlay-anchor
      aria-haspopup="menu"
      aria-expanded=${String(isOpen)}
      aria-label=${COPY.database.addProperty}
      title=${tooltipTitle(COPY.database.addProperty)}
      interestfor=${TOOLTIP_TARGET}
      @click=${toggle}
    >
      ${renderIcon("plus")}
    </button>
  </th>`;
}

export function renderHeaderRow(context: TableContext): TemplateResult {
  return html`<tr
    aria-rowindex="1"
    @pointerdown=${(event: PointerEvent) => {
      startColumnDrag(event, context);
    }}
  >
    ${renderGutterHeader(context)}
    ${context.model.columns.map((column) => renderHeader(column, context))}
    ${renderAddProperty(context)}
  </tr>`;
}
