// The map view's pins and how the map is framed (ADR-0013): every row with
// a place, on Web Mercator tiles, at the closest zoom that shows them all.
import type { BlockId } from "../../../../model/index.ts";
import type { MapCamera } from "../../../../state/index.ts";
import { readPlace, type Place } from "../../properties/place/index.ts";
import type { TableModel } from "../../table-model.selectors.ts";

export const TILE = 256;
// The map's drawn size; the view scales it to its width.
export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 480;
const MAX_ZOOM = 16;

export interface Pin {
  readonly rowId: BlockId;
  readonly title: string;
  readonly place: Place;
}

export interface MapFrame {
  readonly zoom: number;
  // The world pixel at the map's centre, at that zoom.
  readonly centerX: number;
  readonly centerY: number;
}

// A longitude and latitude as pixels of the whole world at a zoom.
export function worldPixel(place: Place, zoom: number): [number, number] {
  const size = TILE * 2 ** zoom;
  const sin = Math.sin((place.lat * Math.PI) / 180);
  const x = ((place.lng + 180) / 360) * size;
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size;
  return [x, y];
}

export function selectPins(model: TableModel): Pin[] {
  const column = model.columns.find((each) => each.property.type === "place");
  if (column === undefined) return [];
  return model.rows.flatMap((row) => {
    const place = readPlace(row.values[column.property.id]);
    return place === undefined
      ? []
      : [{ rowId: row.id, title: row.title, place }];
  });
}

// The closest zoom at which every pin fits a map of this size.
export function frameOf(
  pins: readonly Pin[],
  width: number,
  height: number,
): MapFrame {
  for (let zoom = MAX_ZOOM; zoom >= 0; zoom -= 1) {
    const points = pins.map((pin) => worldPixel(pin.place, zoom));
    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => y);
    const spanX = Math.max(...xs) - Math.min(...xs);
    const spanY = Math.max(...ys) - Math.min(...ys);
    if (zoom === 0 || (spanX < width * 0.8 && spanY < height * 0.8)) {
      return {
        zoom,
        centerX: (Math.max(...xs) + Math.min(...xs)) / 2,
        centerY: (Math.max(...ys) + Math.min(...ys)) / 2,
      };
    }
  }
  return { zoom: 0, centerX: TILE / 2, centerY: TILE / 2 };
}

// The camera the map is seen through: where it was moved to, else the one
// that frames its pins, else the whole world.
export function selectFrame(
  camera: MapCamera | undefined,
  viewId: string,
  pins: readonly Pin[],
): MapFrame {
  if (camera?.viewId === viewId) return camera;
  if (pins.length > 0) return frameOf(pins, MAP_WIDTH, MAP_HEIGHT);
  return { zoom: 1, centerX: TILE, centerY: TILE };
}

// The place under a point of the map, in its drawn pixels.
export function placeAt(frame: MapFrame, x: number, y: number): Place {
  const size = TILE * 2 ** frame.zoom;
  const worldX = frame.centerX + x - MAP_WIDTH / 2;
  const worldY = frame.centerY + y - MAP_HEIGHT / 2;
  const lng = (worldX / size) * 360 - 180;
  const lat =
    (Math.atan(Math.sinh(Math.PI * (1 - (2 * worldY) / size))) * 180) / Math.PI;
  const round = (value: number) => Math.round(value * 1e5) / 1e5;
  return { name: "", lat: round(lat), lng: round(lng) };
}

// The place property the map reads, when the view shows one.
export function selectPlaceProperty(model: TableModel): string | undefined {
  return model.columns.find((each) => each.property.type === "place")?.property
    .id;
}
