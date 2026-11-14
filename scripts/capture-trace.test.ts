import { describe, expect, it } from "vitest";
import type { CapturePlan, CaptureStep } from "./capture.schema.ts";
import { layersFor } from "./capture-photo.ts";
import { chordLabel, typedLabel, wheelLabel } from "./capture-trace.ts";

describe("the keys drawn on a photo", () => {
  it("names a shortcut as keycaps", () => {
    expect(chordLabel("Control+Shift+ArrowDown")).toBe("Ctrl + Shift + ↓");
    expect(chordLabel("Shift++")).toBe("Shift + +");
    expect(chordLabel("Escape")).toBe("Esc");
  });

  it("keeps the slips and Backspaces of what was typed", () => {
    const events = [
      { kind: "down", key: "S", t: 0 },
      { kind: "up", key: "S", t: 1 },
      { kind: "down", key: "p", t: 2 },
      { kind: "down", key: "Backspace", t: 3 },
      { kind: "down", key: "e", t: 4 },
      { kind: "text", key: "é", t: 5 },
      { kind: "down", key: "Enter", t: 6 },
    ] as const;
    expect(typedLabel(events)).toBe("Sp⌫eé↵");
  });

  it("names the wheel by its direction and notches", () => {
    expect(wheelLabel([0, 400], 4)).toBe("Wheel ↓ × 4");
  });
});

describe("the overlay layers", () => {
  const step: CaptureStep = { name: "a" };
  const plan: CapturePlan = { steps: [step] };

  it("are all off unless asked", () => {
    expect(layersFor(plan, step)).toEqual({
      cursor: false,
      trail: false,
      keys: false,
    });
  });

  it("come from the plan, and a step overrides them", () => {
    const on: CapturePlan = {
      overlay: { cursor: true, trail: true },
      steps: [step],
    };
    expect(layersFor(on, step)).toEqual({
      cursor: true,
      trail: true,
      keys: false,
    });
    expect(layersFor(on, { name: "b", overlay: false })).toEqual({
      cursor: false,
      trail: false,
      keys: false,
    });
    expect(layersFor(plan, { name: "c", overlay: { keys: true } }).keys).toBe(
      true,
    );
  });
});
