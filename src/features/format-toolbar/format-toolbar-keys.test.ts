import { describe, expect, it } from "vitest";
import { toolbarStep } from "./format-toolbar-keys.view.ts";

describe("toolbarStep", () => {
  it("moves right and left, wrapping at the ends", () => {
    expect(toolbarStep("ArrowRight", 0, 7)).toBe(1);
    expect(toolbarStep("ArrowRight", 6, 7)).toBe(0);
    expect(toolbarStep("ArrowLeft", 0, 7)).toBe(6);
  });

  it("jumps to the first and last button", () => {
    expect(toolbarStep("Home", 4, 7)).toBe(0);
    expect(toolbarStep("End", 1, 7)).toBe(6);
  });

  it("ignores other keys", () => {
    expect(toolbarStep("a", 1, 7)).toBeUndefined();
  });
});
