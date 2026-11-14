// Moving about a map view, as Notion's: drag to move it, scroll or its
// "+" and "−" to zoom, and a double-click to add a row at that place.
import { html, type TemplateResult } from "lit-html";
import type { MapCamera } from "../../../../state/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import { renderIcon } from "../../../../ui/icon/index.ts";
import { addRow } from "../../row.commands.ts";
import type { TableContext } from "../../table-cell.view.ts";
import { panMap, zoomMap } from "./map.commands.ts";
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  placeAt,
  selectPlaceProperty,
  type MapFrame,
} from "./map.selectors.ts";

function cameraFrom(context: TableContext, frame: MapFrame): MapCamera {
  return { viewId: context.model.view.id, ...frame };
}

// A point of the canvas in the map's drawn pixels, at any width.
function drawnPoint(event: MouseEvent): [number, number] | undefined {
  if (!(event.currentTarget instanceof HTMLElement)) return undefined;
  const box = event.currentTarget.getBoundingClientRect();
  if (box.width === 0) return undefined;
  const scale = MAP_WIDTH / box.width;
  return [
    (event.clientX - box.left) * scale,
    (event.clientY - box.top) * scale,
  ];
}

export function onMapPointerDown(event: PointerEvent): void {
  if (!(event.target instanceof Element) || event.target.closest("button")) {
    return;
  }
  if (event.currentTarget instanceof HTMLElement) {
    event.currentTarget.setPointerCapture(event.pointerId);
  }
}

export function onMapPointerMove(
  event: PointerEvent,
  context: TableContext,
  frame: MapFrame,
): void {
  if (event.buttons !== 1 || !(event.currentTarget instanceof HTMLElement)) {
    return;
  }
  if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
  const scale = MAP_WIDTH / event.currentTarget.getBoundingClientRect().width;
  context.dispatch(
    panMap.create({
      from: cameraFrom(context, frame),
      dx: event.movementX * scale,
      dy: event.movementY * scale,
    }),
  );
}

export function onMapWheel(
  event: WheelEvent,
  context: TableContext,
  frame: MapFrame,
): void {
  if (event.deltaY === 0) return;
  event.preventDefault();
  const by = event.deltaY < 0 ? 1 : -1;
  context.dispatch(zoomMap.create({ from: cameraFrom(context, frame), by }));
}

export function onMapDoubleClick(
  event: MouseEvent,
  context: TableContext,
  frame: MapFrame,
): void {
  const propertyId = selectPlaceProperty(context.model);
  const point = drawnPoint(event);
  if (propertyId === undefined || point === undefined) return;
  if (event.target instanceof Element && event.target.closest("button")) return;
  const [x, y] = point;
  if (x < 0 || y < 0 || x > MAP_WIDTH || y > MAP_HEIGHT) return;
  context.dispatch(
    addRow.create({
      databaseId: context.model.database.id,
      values: { [propertyId]: placeAt(frame, x, y) },
      opensPage: true,
      viewId: context.model.view.id,
    }),
  );
}

export function renderMapControls(
  context: TableContext,
  frame: MapFrame,
): TemplateResult {
  const zoom = (by: number) => () =>
    context.dispatch(zoomMap.create({ from: cameraFrom(context, frame), by }));
  return html`<div class="map__zoom">
    <button
      type="button"
      class="map__zoom-button"
      aria-label=${COPY.database.zoomIn}
      @click=${zoom(1)}
    >
      ${renderIcon("plus")}
    </button>
    <button
      type="button"
      class="map__zoom-button"
      aria-label=${COPY.database.zoomOut}
      @click=${zoom(-1)}
    >
      <span aria-hidden="true">−</span>
    </button>
  </div>`;
}
