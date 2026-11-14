import { describe, expect, it } from "vitest";
import { createTestApp } from "../../../../state/index.ts";
import { panMap, zoomMap } from "./map.commands.ts";
import { placeAt, selectFrame, worldPixel } from "./map.selectors.ts";

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
