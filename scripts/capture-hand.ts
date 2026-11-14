// A person's hand on the page's real mouse: it strokes toward a point in
// a bent, uneven reach and corrects, and rests with a slight drift. The
// plans come from capture-motion.ts and capture-reach.ts; this file only
// plays them on time and keeps where the hand is. Finding an element,
// scrolling to it and looking again is capture-sight.ts.
import type { Page } from "playwright-core";
import {
  gaussian,
  seededRandom,
  type Box,
  type Point,
  type Random,
  type Sample,
} from "./capture-motion.ts";
import {
  planCorrection,
  planPrimary,
  planRest,
  summarize,
} from "./capture-reach.ts";
import { observe, type Watch } from "./capture-watch.ts";

export interface HandOptions {
  readonly seed?: number | undefined;
  readonly wpm?: number | undefined;
  readonly typos?: number | undefined;
}

export interface Hand {
  readonly page: Page;
  readonly random: Random;
  readonly wpm: number;
  readonly typos: number;
  at: Point;
  pressed: boolean;
  // What the hand did during the current step, printed with its photo.
  readonly notes: string[];
  // The step's "watch", read after every event the hand sends.
  watch: Watch | undefined;
}

export interface Target {
  readonly selector: string;
  // Where in the box to aim, as fractions of its width and height.
  readonly aim?: readonly [number, number] | undefined;
}

export const sleep = (ms: number): Promise<void> =>
  new Promise((done) => setTimeout(done, Math.max(0, ms)));

// The hand starts resting somewhere below the middle of the window.
export async function createHand(
  page: Page,
  options: HandOptions,
): Promise<Hand> {
  const seed = options.seed ?? Math.floor(Math.random() * 1e9);
  console.log(
    `hand: seed ${String(seed)} (add "seed": ${String(seed)} to replay)`,
  );
  const random = seededRandom(seed);
  const at = {
    x: 720 + 140 * gaussian(random),
    y: 560 + 70 * gaussian(random),
  };
  await page.mouse.move(at.x, at.y);
  const wpm = options.wpm ?? 45;
  const typos = options.typos ?? 0;
  const hand: Hand = {
    page,
    random,
    wpm,
    typos,
    at,
    pressed: false,
    notes: [],
    watch: undefined,
  };
  return hand;
}

// Moves through the samples on their own clock; a sample whose time has
// already passed is dropped, as a busy mouse drops reports.
export async function play(
  hand: Hand,
  samples: readonly Sample[],
): Promise<void> {
  const start = performance.now();
  for (const [index, sample] of samples.entries()) {
    const next = samples[index + 1];
    const now = performance.now() - start;
    if (next !== undefined && now > next.t) continue;
    await sleep(sample.t - now);
    await hand.page.mouse.move(sample.x, sample.y);
    hand.at = sample;
    await observe(hand);
  }
}

export async function rest(hand: Hand, ms: number): Promise<void> {
  await play(hand, planRest(hand.at, ms, hand.random));
  hand.at = { x: hand.at.x, y: hand.at.y };
}

export async function boxOf(hand: Hand, selector: string): Promise<Box> {
  const element = hand.page.locator(selector).first();
  await element.waitFor({ state: "visible", timeout: 10000 });
  const box = await element.boundingBox();
  if (box === null) throw new Error(`nothing to reach: ${selector}`);
  return box;
}

// A reach to a point, with no second look: for points and areas.
export async function travel(hand: Hand, to: Point, box: Box): Promise<void> {
  const motor = motorFor(hand, box);
  const from = hand.at;
  const primary = planPrimary(from, to, motor);
  await play(hand, primary.samples);
  const correction = planCorrection(hand.at, to, motor);
  await play(hand, correction.samples);
  hand.at = to;
  note(hand, {
    from,
    to,
    samples: [...primary.samples, ...correction.samples],
  });
}

export function motorFor(hand: Hand, box: Box) {
  const width = Math.max(4, Math.min(box.width, box.height));
  return { random: hand.random, width, pressed: hand.pressed };
}

export function note(
  hand: Hand,
  move: { from: Point; to: Point; samples: Sample[] },
): void {
  const s = summarize(move.from, move.to, move.samples);
  const round = (n: number) => String(Math.round(n));
  hand.notes.push(
    `${hand.pressed ? "drag" : "move"} ${round(s.span)} px, ${String(s.events)} events,` +
      ` bend ${round(s.bend)} px, overshoot ${round(Math.max(0, s.overshoot))} px`,
  );
}
