// A place, as Notion's Place property (ADR-0013): a name and where it is.
// Pagecraft has no address search (that needs a service of its own), so a
// place is typed as "Name @ latitude, longitude", or the two numbers alone.
import { compareText, type PropertyType } from "../../property-definition.ts";
import { TEXT_FILTERS } from "../../text-filters.ts";

export interface Place {
  readonly name: string;
  readonly lat: number;
  readonly lng: number;
}

function isLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

function fieldsOf(stored: unknown): Record<string, unknown> | undefined {
  if (typeof stored !== "object" || stored === null) return undefined;
  return Object.fromEntries(Object.entries(stored));
}

export function readPlace(stored: unknown): Place | undefined {
  const fields = fieldsOf(stored);
  const lat = fields?.lat;
  const lng = fields?.lng;
  const name = fields?.name;
  if (typeof lat !== "number" || typeof lng !== "number") return undefined;
  if (typeof name !== "string") return undefined;
  return isLatitude(lat) && isLongitude(lng) ? { name, lat, lng } : undefined;
}

const COORDINATES = /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

export function parsePlace(text: string): Place | undefined {
  const match = COORDINATES.exec(text.trim());
  if (match === null) return undefined;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  const name = text.slice(0, match.index).replace(/@\s*$/, "").trim();
  return readPlace({ name, lat, lng });
}

export function formatPlace(value: unknown): string {
  const place = readPlace(value);
  if (place === undefined) return "";
  const where = `${String(place.lat)}, ${String(place.lng)}`;
  return place.name === "" ? where : `${place.name} @ ${where}`;
}

export const placeProperty: PropertyType = {
  type: "place",
  label: "Place",
  icon: "map",
  editor: "text",
  input: { type: "text" },
  read: readPlace,
  parse: parsePlace,
  format: formatPlace,
  compare: compareText,
  filterOperators: TEXT_FILTERS,
  defaultFilter: "contains",
  renderCell: (value) => {
    const place = readPlace(value);
    return place === undefined ? "" : place.name || formatPlace(place);
  },
};
