import { describe, expect, it } from "vitest";
import { formatPlace, parsePlace, readPlace } from "./place.definition.ts";

describe("the Place property", () => {
  it("reads a name and its latitude and longitude", () => {
    expect(parsePlace("Lisbon office @ 38.7223, -9.1393")).toEqual({
      name: "Lisbon office",
      lat: 38.7223,
      lng: -9.1393,
    });
  });

  it("reads the two numbers alone as a place without a name", () => {
    expect(parsePlace(" 41.15, -8.61 ")).toEqual({
      name: "",
      lat: 41.15,
      lng: -8.61,
    });
  });

  it("refuses what is not on the globe", () => {
    expect(parsePlace("Nowhere @ 91, 10")).toBeUndefined();
    expect(parsePlace("Lisbon")).toBeUndefined();
    expect(readPlace({ name: "x", lat: 10, lng: 200 })).toBeUndefined();
  });

  it("writes a place as it is typed", () => {
    expect(formatPlace({ name: "Porto", lat: 41.15, lng: -8.61 })).toBe(
      "Porto @ 41.15, -8.61",
    );
    expect(formatPlace({ name: "", lat: 1, lng: 2 })).toBe("1, 2");
    expect(formatPlace("broken")).toBe("");
  });
});
