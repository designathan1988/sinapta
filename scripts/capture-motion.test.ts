import { describe, expect, it } from "vitest";
import { aimPoint, seededRandom } from "./capture-motion.ts";
import {
  planCorrection,
  planPrimary,
  planWheel,
  summarize,
} from "./capture-reach.ts";
import { planChord, planTyping } from "./capture-typing.ts";

const from = { x: 100, y: 700 };
const to = { x: 900, y: 240 };

function reachWith(seed: number) {
  const motor = { random: seededRandom(seed), width: 24 };
  const primary = planPrimary(from, to, motor);
  const correction = planCorrection(primary.end, to, motor);
  return {
    primary,
    correction,
    all: [...primary.samples, ...correction.samples],
  };
}

describe("a reach of the hand", () => {
  it("ends exactly on the aimed point after the correction", () => {
    const { correction } = reachWith(1);
    expect(correction.samples.at(-1)).toMatchObject(to);
  });

  it("is never a straight line and differs from seed to seed", () => {
    const bends = [1, 2, 3, 4, 5].map(
      (seed) => summarize(from, to, reachWith(seed).all).bend,
    );
    expect(Math.min(...bends)).toBeGreaterThan(2);
    expect(new Set(bends.map(Math.round)).size).toBeGreaterThan(3);
  });

  it("replays the same path from the same seed", () => {
    expect(reachWith(7).all).toEqual(reachWith(7).all);
  });

  it("takes a human time for a long reach, with uneven report gaps", () => {
    const { primary } = reachWith(3);
    const last = primary.samples.at(-1)?.t ?? 0;
    expect(last).toBeGreaterThan(250);
    expect(last).toBeLessThan(1500);
    const gaps = primary.samples
      .slice(1)
      .map((s, i) => s.t - (primary.samples[i]?.t ?? 0));
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeGreaterThan(2);
  });

  it("speeds up then slows down", () => {
    const { primary } = reachWith(4);
    const steps = primary.samples.slice(1).map((s, i) => {
      const p = primary.samples[i] ?? s;
      return Math.hypot(s.x - p.x, s.y - p.y) / Math.max(s.t - p.t, 1);
    });
    const peak = steps.indexOf(Math.max(...steps));
    expect(peak).toBeGreaterThan(0);
    expect(peak).toBeLessThan(steps.length - 1);
  });

  it("aims inside the box, near but not on the asked spot", () => {
    const random = seededRandom(9);
    const box = { x: 10, y: 10, width: 40, height: 20 };
    const points = Array.from({ length: 50 }, () =>
      aimPoint(box, [0.5, 0.5], random),
    );
    for (const p of points) {
      expect(p.x).toBeGreaterThanOrEqual(13);
      expect(p.x).toBeLessThanOrEqual(47);
    }
    expect(points.some((p) => p.x !== 30)).toBe(true);
  });
});

describe("the wheel", () => {
  it("turns in notches that add up to the asked scroll", () => {
    const ticks = planWheel([0, 600], seededRandom(2));
    expect(ticks).toHaveLength(6);
    expect(ticks.reduce((sum, tick) => sum + tick.dy, 0)).toBe(600);
  });
});

describe("typing", () => {
  function typedText(events: ReturnType<typeof planTyping>["events"]): string {
    let text = "";
    let shift = false;
    for (const event of events) {
      if (event.key === "Shift") shift = event.kind === "down";
      else if (event.kind === "text") text += event.key;
      else if (event.kind === "down" && event.key === "Backspace")
        text = text.slice(0, -1);
      else if (event.kind === "down")
        text += shift ? event.key.toUpperCase() : event.key;
    }
    return text;
  }

  it("ends with the meant text, slips included", () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const typist = { random: seededRandom(seed), wpm: 60, typos: 0.15 };
      const { events } = planTyping("Hello World, café Notes", typist);
      expect(typedText(events)).toBe("Hello World, café Notes");
    }
  });

  it("slips sometimes when asked to", () => {
    const typist = { random: seededRandom(5), wpm: 60, typos: 0.2 };
    expect(
      planTyping("the quick brown fox jumps", typist).typos,
    ).toBeGreaterThan(0);
  });

  it("presses a shortcut's modifiers before its key and lets go after", () => {
    const events = planChord("Control+Shift+K", seededRandom(1));
    const keyDown = events.findIndex((e) => e.key === "K" && e.kind === "down");
    const keyUp = events.findIndex((e) => e.key === "K" && e.kind === "up");
    expect(events.slice(0, keyDown).map((e) => e.key)).toEqual([
      "Control",
      "Shift",
    ]);
    expect(events.slice(keyUp + 1).every((e) => e.kind === "up")).toBe(true);
  });
});
