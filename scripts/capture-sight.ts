// The hand's eye: it brings an element into view (the wheel over the
// area that scrolls it, or, with the button held, a wait at that area's
// edge for the page to scroll by itself), reaches for it, looks again
// (it may have moved, or a menu opened over it) and corrects.
import { aimPoint, type Box, type Point } from "./capture-motion.ts";
import { planCorrection, planPrimary, planWheel } from "./capture-reach.ts";
import {
  boxOf,
  motorFor,
  note,
  play,
  rest,
  sleep,
  travel,
  type Hand,
  type Target,
} from "./capture-hand.ts";
import { wheelLabel } from "./capture-trace.ts";
import { observe } from "./capture-watch.ts";

function inView(hand: Hand, box: Box): boolean {
  const view = hand.page.viewportSize() ?? { width: 1440, height: 900 };
  const y = box.y + box.height / 2;
  const x = box.x + box.width / 2;
  return y > 4 && y < view.height - 4 && x > 4 && x < view.width - 4;
}

// The visible part of the box that scrolls the element: where the hand
// must be for the wheel, or the edge, to scroll it.
async function scrollerOf(hand: Hand, selector: string): Promise<Box> {
  return hand.page
    .locator(selector)
    .first()
    .evaluate((element) => {
      let node = element.parentElement;
      while (node !== null) {
        const { overflowY } = getComputedStyle(node);
        const scrolls = /auto|scroll/.test(overflowY);
        if (scrolls && node.scrollHeight > node.clientHeight) break;
        node = node.parentElement;
      }
      const rect = (node ?? document.documentElement).getBoundingClientRect();
      const top = Math.max(rect.top, 0);
      const bottom = Math.min(rect.bottom, innerHeight);
      return { x: rect.left, y: top, width: rect.width, height: bottom - top };
    });
}

export async function wheel(
  hand: Hand,
  delta: readonly [number, number],
): Promise<void> {
  const ticks = planWheel(delta, hand.random);
  const start = performance.now();
  for (const tick of ticks) {
    await sleep(tick.t - (performance.now() - start));
    await hand.page.mouse.wheel(tick.dx, tick.dy);
    await observe(hand);
  }
  await sleep(120);
  hand.notes.push(`wheel ${String(delta)} in ${String(ticks.length)} notches`);
  hand.trace.keys.push(wheelLabel(delta, ticks.length));
}

// Off screen: with the button up the hand goes over the scrolling area
// and turns the wheel; holding it, the hand waits at that area's edge for
// the page to scroll by itself, and turns the wheel only if it does not.
async function bringIntoView(hand: Hand, selector: string): Promise<Box> {
  let before: Box | undefined;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const box = await boxOf(hand, selector);
    if (inView(hand, box) || box.y === before?.y) return box;
    before = box;
    const area = await scrollerOf(hand, selector);
    const down = box.y > area.y + area.height / 2;
    if (
      hand.pressed &&
      attempt === 0 &&
      (await waitAtEdge(hand, { selector }, { area, down }))
    ) {
      continue;
    }
    if (!hand.pressed)
      await travel(hand, aimPoint(area, [0.5, 0.5], hand.random), area);
    const gap = box.y + box.height / 2 - (area.y + area.height / 2);
    await wheel(hand, [0, Math.max(-700, Math.min(700, gap))]);
  }
  return boxOf(hand, selector);
}

interface Edge {
  readonly area: Box;
  readonly down: boolean;
}

async function waitAtEdge(
  hand: Hand,
  target: Target,
  edge: Edge,
): Promise<boolean> {
  const { area, down } = edge;
  const y = down ? area.y + area.height - 10 : area.y + 10;
  await travel(hand, { x: hand.at.x, y }, { ...area, height: 20 });
  for (let waited = 0; waited < 4000; waited += 150) {
    await rest(hand, 150);
    if (inView(hand, await boxOf(hand, target.selector))) {
      hand.notes.push(
        `held at the ${down ? "bottom" : "top"} edge: the page scrolled`,
      );
      return true;
    }
  }
  hand.notes.push("held at the edge 4 s: nothing scrolled, turned the wheel");
  return false;
}

// Reaches for an element: brings it into view, strokes toward it, looks
// again (it may have moved, or a menu opened over it) and corrects.
export async function reach(hand: Hand, target: Target): Promise<Point> {
  const aim = target.aim ?? [0.5, 0.5];
  const box = await bringIntoView(hand, target.selector);
  const from = hand.at;
  const point = aimPoint(box, aim, hand.random);
  const primary = planPrimary(from, point, motorFor(hand, box));
  await play(hand, primary.samples);
  const seen = await boxOf(hand, target.selector);
  const final = contains(seen, point)
    ? point
    : aimPoint(seen, aim, hand.random);
  const correction = planCorrection(hand.at, final, motorFor(hand, seen));
  await play(hand, correction.samples);
  hand.at = final;
  note(hand, {
    from,
    to: final,
    samples: [...primary.samples, ...correction.samples],
  });
  await lookAt(hand, target.selector);
  return final;
}

// What a person would see on arriving: a target they cannot see (no
// opacity, hidden) or one something else covers is noted, not hidden.
async function lookAt(hand: Hand, selector: string): Promise<void> {
  const seen = await hand.page
    .locator(selector)
    .first()
    .evaluate((element, at) => {
      let opacity = 1;
      for (
        let node: Element | null = element;
        node;
        node = node.parentElement
      ) {
        opacity *= Number(getComputedStyle(node).opacity);
      }
      const under = document.elementFromPoint(at.x, at.y);
      const covered = under !== null && !element.contains(under);
      const hidden = getComputedStyle(element).visibility !== "visible";
      const cover = covered ? (under.classList[0] ?? under.tagName) : "";
      return { opacity, hidden, cover };
    }, hand.at);
  if (seen.opacity < 0.1 || seen.hidden) {
    hand.notes.push(
      `arrived on ${selector}, but it cannot be seen (opacity ${seen.opacity.toFixed(2)})`,
    );
  }
  if (seen.cover !== "") {
    hand.notes.push(
      `aimed at ${selector}, but the pointer is on .${seen.cover}`,
    );
  }
}

function contains(box: Box, point: Point): boolean {
  const inX = point.x > box.x + 1 && point.x < box.x + box.width - 1;
  return inX && point.y > box.y + 1 && point.y < box.y + box.height - 1;
}
