import { describe, expect, it } from "vitest";
import { menuPointPlace } from "./menu-point.ts";

const WINDOW = { width: 1440, height: 900 };
const MENU = { width: 280, height: 400 };

describe("a menu opened at the pointer", () => {
  it("opens at the pointer when the window has room", () => {
    expect(menuPointPlace({ x: 200, y: 100 }, MENU, WINDOW)).toEqual({
      x: 200,
      y: 100,
    });
  });

  it("opens upward from a pointer near the bottom, as Notion's", () => {
    expect(menuPointPlace({ x: 200, y: 757 }, MENU, WINDOW)).toEqual({
      x: 200,
      y: 357,
    });
  });

  it("opens leftward at the right edge", () => {
    expect(menuPointPlace({ x: 1300, y: 100 }, MENU, WINDOW).x).toBe(1020);
  });

  it("stays inside a window too short either way", () => {
    expect(
      menuPointPlace({ x: 10, y: 300 }, MENU, { width: 1440, height: 500 }).y,
    ).toBe(92);
  });
});
