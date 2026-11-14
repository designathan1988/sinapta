// How a person's hand moves the mouse, as numbers: no page, no clock.
// A reach is one fast primary stroke that lands a little short of or past
// the aim, then one or two slow corrective strokes (Meyer's optimized
// submovements). Each stroke follows a bent path with a minimum-jerk speed
// profile that peaks early, its time follows Fitts' law, a tremor of 8 to
// 12 Hz shakes it, and the mouse reports it at 60 to 125 Hz.
export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Sample extends Point {
  // Milliseconds from the start of the movement.
  readonly t: number;
}

export interface Box extends Point {
  readonly width: number;
  readonly height: number;
}

export type Random = () => number;

export interface Motor {
  readonly random: Random;
  // The size of what is aimed at, for Fitts' law.
  readonly width: number;
  // The button is held: a dragging hand is slower and steadier.
  readonly pressed?: boolean;
}

// Mulberry32: the same seed gives the same hand, so a run can be replayed.
export function seededRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let next = Math.imul(state ^ (state >>> 15), 1 | state);
    next ^= next + Math.imul(next ^ (next >>> 7), 61 | next);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

// A standard normal number (Box-Muller).
export function gaussian(random: Random): number {
  const u = Math.max(random(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
}

export function between(random: Random, low: number, high: number): number {
  return low + (high - low) * random();
}

export function distance(from: Point, to: Point): number {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

// Fitts' law, Shannon form: 110 ms + 140 ms per bit, varied by about
// a fifth from one reach to the next.
export function fittsDuration(span: number, motor: Motor): number {
  const bits = Math.log2(span / Math.max(motor.width, 4) + 1);
  const spread = Math.exp(0.18 * gaussian(motor.random));
  const drag = motor.pressed === true ? 1.3 : 1;
  return Math.max(70, (110 + 140 * bits) * spread * drag);
}

// Where a person lands in a box: near the asked spot, never exactly on it,
// always inside.
export function aimPoint(
  box: Box,
  aim: readonly [number, number],
  random: Random,
): Point {
  const inset = Math.min(3, box.width / 4, box.height / 4);
  const spreadX = Math.min(box.width * 0.1, 12) * gaussian(random);
  const spreadY = Math.min(box.height * 0.1, 6) * gaussian(random);
  const x = box.x + box.width * aim[0] + spreadX;
  const y = box.y + box.height * aim[1] + spreadY;
  return {
    x: Math.min(box.x + box.width - inset, Math.max(box.x + inset, x)),
    y: Math.min(box.y + box.height - inset, Math.max(box.y + inset, y)),
  };
}

// The minimum-jerk position at time fraction u, warped so the speed peaks
// before the middle, as a reaching hand's does.
function strokeProgress(u: number, warp: number): number {
  const w = Math.pow(u, warp);
  return 10 * w ** 3 - 15 * w ** 4 + 6 * w ** 5;
}

function cubic(points: readonly Point[], s: number): Point {
  const [a, b, c, d] = points;
  if (
    a === undefined ||
    b === undefined ||
    c === undefined ||
    d === undefined
  ) {
    throw new Error("a stroke needs four points");
  }
  const r = 1 - s;
  return {
    x: r ** 3 * a.x + 3 * r * r * s * b.x + 3 * r * s * s * c.x + s ** 3 * d.x,
    y: r ** 3 * a.y + 3 * r * r * s * b.y + 3 * r * s * s * c.y + s ** 3 * d.y,
  };
}

// A bent path: the two inner control points leave the straight line to
// one side by different amounts, as a wrist turning on its pivot does.
function bentPath(from: Point, to: Point, random: Random): Point[] {
  const span = distance(from, to);
  const nx = -(to.y - from.y) / Math.max(span, 1);
  const ny = (to.x - from.x) / Math.max(span, 1);
  const bend = span * 0.1 * gaussian(random);
  const along = (f: number, side: number): Point => ({
    x: from.x + (to.x - from.x) * f + nx * side,
    y: from.y + (to.y - from.y) * f + ny * side,
  });
  const first = bend * between(random, 0.6, 1.3);
  const second = bend * between(random, 0.3, 1.1);
  return [
    from,
    along(between(random, 0.2, 0.4), first),
    along(between(random, 0.6, 0.8), second),
    to,
  ];
}

export interface Stroke {
  readonly from: Point;
  readonly to: Point;
  readonly duration: number;
}

// The samples of one stroke, reported at the mouse's own uneven rate.
export function strokeSamples(
  stroke: Stroke,
  random: Random,
  start = 0,
): Sample[] {
  const path = bentPath(stroke.from, stroke.to, random);
  const warp = between(random, 0.8, 0.95);
  const rate = 1000 / between(random, 60, 125);
  const samples: Sample[] = [];
  for (
    let t = rate;
    t < stroke.duration;
    t += rate * between(random, 0.75, 1.25)
  ) {
    const point = cubic(path, strokeProgress(t / stroke.duration, warp));
    samples.push({ ...point, t: start + t });
  }
  samples.push({ ...stroke.to, t: start + stroke.duration });
  return samples;
}
