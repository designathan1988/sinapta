import { describe, expect, it } from "vitest";
import { createTestApp } from "../../../../state/index.ts";
import { panMap, zoomMap } from "./map.commands.ts";
import { toBlockId } from "../../../../model/index.ts";
import type { Place } from "../../properties/place/index.ts";
import {
  frameOf,
  MAP_HEIGHT,
  MAP_WIDTH,
  placeAt,
  selectFrame,
  worldPixel,
  type Pin,
} from "./map.selectors.ts";

const FROM = { viewId: "v1", zoom: 2, centerX: 512, centerY: 512 };

describe("the map's camera", () => {
  it("zooms about the centre and keeps the place there", () => {
    const { store, dispatch } = createTestApp({ commands: [zoomMap] });

    dispatch(zoomMap.create({ from: FROM, by: 1 }));

    expect(store.getState().ui.mapCamera).toEqual({
      viewId: "v1",
      zoom: 3,
      centerX: 1024,
      centerY: 1024,
    });
  });

  it("moves from where it was moved before, against the drag", () => {
    const { store, dispatch } = createTestApp({ commands: [panMap] });

    dispatch(panMap.create({ from: FROM, dx: 10, dy: 0 }));
    dispatch(panMap.create({ from: FROM, dx: 10, dy: -5 }));

    expect(store.getState().ui.mapCamera).toMatchObject({
      centerX: 492,
      centerY: 517,
    });
  });

  it("shows the whole world when no row has a place", () => {
    expect(selectFrame(undefined, "v1", [])).toEqual({
      zoom: 1,
      centerX: 256,
      centerY: 256,
    });
  });
});

describe("placeAt", () => {
  it("finds the place under a point, the inverse of worldPixel", () => {
    const lisbon = { name: "", lat: 38.72, lng: -9.14 };
    const [x, y] = worldPixel(lisbon, 6);
    const frame = { zoom: 6, centerX: x, centerY: y };

    expect(placeAt(frame, 480, 240)).toEqual(lisbon);
  });
});

function pin(id: string, lat: number, lng: number): Pin {
  return { rowId: toBlockId(id), title: id, place: { name: id, lat, lng } };
}

const LISBON = pin("lisbon", 38.72, -9.14);
const MADRID = pin("madrid", 40.42, -3.7);

// How far apart two places are across the map, at a zoom.
function apart(a: Place, b: Place, zoom: number): number {
  return Math.abs(worldPixel(b, zoom)[0] - worldPixel(a, zoom)[0]);
}

describe("the map's first frame", () => {
  const pins = [LISBON, MADRID];

  it("is the closest zoom that holds every pin, centred between them", () => {
    const frame = frameOf(pins, MAP_WIDTH, MAP_HEIGHT);
    const [lisbonX] = worldPixel(LISBON.place, frame.zoom);
    const [madridX] = worldPixel(MADRID.place, frame.zoom);

    expect(apart(LISBON.place, MADRID.place, frame.zoom)).toBeLessThan(
      MAP_WIDTH * 0.8,
    );
    expect(
      apart(LISBON.place, MADRID.place, frame.zoom + 1),
    ).toBeGreaterThanOrEqual(MAP_WIDTH * 0.8);
    expect(frame.centerX).toBeCloseTo((lisbonX + madridX) / 2);
  });

  it("comes from the pins until the map is moved in that view", () => {
    const moved = { viewId: "v1", zoom: 3, centerX: 10, centerY: 20 };

    expect(selectFrame(moved, "v1", pins)).toBe(moved);
    expect(selectFrame(moved, "v2", pins)).toEqual(
      frameOf(pins, MAP_WIDTH, MAP_HEIGHT),
    );
  });

  it("zooms to the streets around a single pin", () => {
    expect(frameOf([LISBON], MAP_WIDTH, MAP_HEIGHT).zoom).toBe(16);
  });
});
