// Notion's Map view (ADR-0013): OpenStreetMap's tiles under a pin for every
// row with a place; a pin opens its row.
import "./map.css";
import { html, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { COPY } from "../../../../ui/copy.ts";
import { openRow } from "../../row-open.commands.ts";
import type { TableContext } from "../../table-cell.view.ts";
import {
  onMapDoubleClick,
  onMapPointerDown,
  onMapPointerMove,
  onMapWheel,
  renderMapControls,
} from "./map-controls.view.ts";
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  selectFrame,
  selectPins,
  TILE,
  worldPixel,
  type MapFrame,
  type Pin,
} from "./map.selectors.ts";

const WIDTH = MAP_WIDTH;
const HEIGHT = MAP_HEIGHT;

// Places an element on the map, in shares of its width and height, so
// the map keeps its frame at any width.
function at(left: number, top: number) {
  return ref((element) => {
    if (!(element instanceof HTMLElement)) return;
    element.style.setProperty("--map-x", `${String((left / WIDTH) * 100)}%`);
    element.style.setProperty("--map-y", `${String((top / HEIGHT) * 100)}%`);
  });
}

function renderTiles(frame: MapFrame): TemplateResult[] {
  const count = 2 ** frame.zoom;
  const left = frame.centerX - WIDTH / 2;
  const top = frame.centerY - HEIGHT / 2;
  const tiles: TemplateResult[] = [];
  for (let ty = Math.floor(top / TILE); ty * TILE < top + HEIGHT; ty += 1) {
    for (let tx = Math.floor(left / TILE); tx * TILE < left + WIDTH; tx += 1) {
      if (ty < 0 || ty >= count) continue;
      const x = ((tx % count) + count) % count;
      const src = `https://tile.openstreetmap.org/${String(frame.zoom)}/${String(x)}/${String(ty)}.png`;
      tiles.push(
        html`<img
          class="map__tile"
          src=${src}
          alt=""
          loading="lazy"
          ${at(tx * TILE - left, ty * TILE - top)}
        />`,
      );
    }
  }
  return tiles;
}

function renderPin(pin: Pin, frame: MapFrame, context: TableContext) {
  const [x, y] = worldPixel(pin.place, frame.zoom);
  const left = x - frame.centerX + WIDTH / 2;
  const top = y - frame.centerY + HEIGHT / 2;
  const title = pin.title === "" ? COPY.sidebar.untitled : pin.title;
  return html`<button
    type="button"
    class="map__pin"
    ${at(left, top)}
    aria-label=${title}
    @click=${() =>
      context.dispatch(
        openRow.create({ rowId: pin.rowId, viewId: context.model.view.id }),
      )}
  >
    <span class="map__label">${title}</span>
  </button>`;
}

export function renderMap(context: TableContext): TemplateResult {
  const pins = selectPins(context.model);
  const viewId = context.model.view.id;
  const frame = selectFrame(context.state.ui.mapCamera, viewId, pins);
  return html`<div
    class="map"
    role="region"
    aria-label=${COPY.database.layouts.map}
  >
    <div
      class="map__canvas"
      @pointerdown=${onMapPointerDown}
      @pointermove=${(event: PointerEvent) => {
        onMapPointerMove(event, context, frame);
      }}
      @wheel=${(event: WheelEvent) => {
        onMapWheel(event, context, frame);
      }}
      @dblclick=${(event: MouseEvent) => {
        onMapDoubleClick(event, context, frame);
      }}
    >
      ${renderTiles(frame)} ${pins.map((pin) => renderPin(pin, frame, context))}
      ${renderMapControls(context, frame)}
    </div>
    <p class="map__credit">
      ${pins.length === 0 ? COPY.database.noPlaces : COPY.database.mapHint} ·
      ${COPY.database.mapCredit}
    </p>
  </div>`;
}
