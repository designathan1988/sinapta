// A whole reach of the hand toward a point, planned in two parts so the
// caller can look again in between: the primary stroke, aimed at the
// point but landing short or long and off to a side, and the correction,
// planned once the target is seen again (it may have moved), in one or
// two small strokes. Tremor rides on every sample but the last.
import {
  between,
  distance,
  fittsDuration,
  gaussian,
  strokeSamples,
  type Motor,
  type Point,
  type Random,
  type Sample,
} from "./capture-motion.ts";

export interface Reach {
  readonly samples: Sample[];
  readonly end: Point;
}

// Where the primary stroke ends. Long reaches past a third of the time
// overshoot by 3 to 10 percent; the others stop 2 to 8 percent short.
// Either way it lands a little to one side of the line.
function primaryEnd(from: Point, to: Point, motor: Motor): Point {
  const { random } = motor;
  const span = distance(from, to);
  if (span < 6) return to;
  const ux = (to.x - from.x) / span;
  const uy = (to.y - from.y) / span;
  const overshoot =
    span > 120 && random() < (motor.pressed === true ? 0.2 : 0.35);
  const along = overshoot
    ? between(random, 0.03, 0.1)
    : -between(random, 0.02, 0.08);
  const side = span * 0.025 * gaussian(random);
  return {
    x: to.x + ux * span * along - uy * side,
    y: to.y + uy * span * along + ux * side,
  };
}

// The tremor of a resting hand: two sines of 8 to 12 Hz and a little
// noise, under a pixel, half as much when the button is held.
function tremor(samples: Sample[], motor: Motor): Sample[] {
  const { random } = motor;
  const size = between(random, 0.3, 0.8) * (motor.pressed === true ? 0.5 : 1);
  const f1 = between(random, 8, 12) / 1000;
  const f2 = between(random, 8, 12) / 1000;
  const p1 = between(random, 0, 6.28);
  const p2 = between(random, 0, 6.28);
  return samples.map((s, index) => {
    if (index === samples.length - 1) return s;
    const dx = size * Math.sin(6.28 * f1 * s.t + p1) + 0.2 * gaussian(random);
    const dy = size * Math.sin(6.28 * f2 * s.t + p2) + 0.2 * gaussian(random);
    return { x: s.x + dx, y: s.y + dy, t: s.t };
  });
}

// A device pixel at 2x is half a CSS pixel: positions come in halves.
function onDevicePixels(samples: Sample[]): Sample[] {
  return samples.map((s) => ({
    x: Math.round(s.x * 2) / 2,
    y: Math.round(s.y * 2) / 2,
    t: s.t,
  }));
}

export function planPrimary(from: Point, to: Point, motor: Motor): Reach {
  const end = primaryEnd(from, to, motor);
  const span = distance(from, end);
  if (span < 0.5) return { samples: [], end };
  const duration = fittsDuration(span, motor) * 0.85;
  const samples = strokeSamples({ from, to: end, duration }, motor.random);
  return { samples: onDevicePixels(tremor(samples, motor)), end };
}

// One small stroke, or with a third of the chance two (the first landing
// a pixel or two off), each after a short look of 0 to 60 ms.
export function planCorrection(from: Point, to: Point, motor: Motor): Reach {
  const { random } = motor;
  if (distance(from, to) < 0.5) return { samples: [], end: to };
  const twice = distance(from, to) > 4 && random() < 0.33;
  const near: Point = twice
    ? { x: to.x + 1.5 * gaussian(random), y: to.y + 1.5 * gaussian(random) }
    : to;
  const legs = twice ? [near, to] : [to];
  let at = from;
  let clock = 0;
  const samples: Sample[] = [];
  for (const leg of legs) {
    clock += between(random, 0, 60);
    const duration = Math.max(
      60,
      fittsDuration(distance(at, leg), motor) * 0.6,
    );
    samples.push(
      ...strokeSamples({ from: at, to: leg, duration }, random, clock),
    );
    clock += duration;
    at = leg;
  }
  return { samples: onDevicePixels(tremor(samples, motor)), end: to };
}

// A hand left on the mouse is never still: a drift of under a pixel now
// and then, every 120 to 400 ms, for as long as it rests.
export function planRest(
  at: Point,
  duration: number,
  random: Random,
): Sample[] {
  const samples: Sample[] = [];
  for (
    let t = between(random, 120, 400);
    t < duration;
    t += between(random, 120, 400)
  ) {
    samples.push({
      x: Math.round((at.x + 0.6 * gaussian(random)) * 2) / 2,
      y: Math.round((at.y + 0.6 * gaussian(random)) * 2) / 2,
      t,
    });
  }
  return samples;
}

export interface ReachSummary {
  readonly span: number;
  readonly duration: number;
  readonly events: number;
  // Farthest point from the straight line, in pixels.
  readonly bend: number;
  // How far past the target the hand went, in pixels.
  readonly overshoot: number;
}

export function summarize(
  from: Point,
  to: Point,
  samples: Sample[],
): ReachSummary {
  const span = distance(from, to);
  const ux = (to.x - from.x) / Math.max(span, 1);
  const uy = (to.y - from.y) / Math.max(span, 1);
  let bend = 0;
  let overshoot = 0;
  for (const s of samples) {
    const along = (s.x - from.x) * ux + (s.y - from.y) * uy;
    const across = Math.abs((s.x - from.x) * uy - (s.y - from.y) * ux);
    bend = Math.max(bend, across);
    overshoot = Math.max(overshoot, along - span);
  }
  const last = samples[samples.length - 1];
  return {
    span,
    duration: last?.t ?? 0,
    events: samples.length,
    bend,
    overshoot,
  };
}

export interface WheelTick {
  readonly dx: number;
  readonly dy: number;
  readonly t: number;
}

// A mouse wheel turns in notches of 100 px, flicked two to five at a
// time, 25 to 70 ms apart, with a pause of 120 to 350 ms between flicks.
export function planWheel(
  delta: readonly [number, number],
  random: Random,
): WheelTick[] {
  const [dx, dy] = delta;
  const notches = Math.max(
    1,
    Math.round(Math.max(Math.abs(dx), Math.abs(dy)) / 100),
  );
  const ticks: WheelTick[] = [];
  let t = 0;
  let flick = 2 + Math.floor(random() * 4);
  for (let n = 0; n < notches; n += 1) {
    ticks.push({ dx: dx / notches, dy: dy / notches, t });
    flick -= 1;
    if (flick === 0) {
      t += between(random, 120, 350);
      flick = 2 + Math.floor(random() * 4);
    } else {
      t += between(random, 25, 70);
    }
  }
  return ticks;
}
