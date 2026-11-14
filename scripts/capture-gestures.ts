// A capture step done by the hand of capture-hand.ts, in the order a
// person does it: run the step's script, bring the hand to what it points
// at, turn the wheel, click or press and drag (a key held if asked), let
// go, type, press a shortcut. Each press waits the moment a person takes
// to see they are on target; each click holds the button for a moment.
import type { CaptureStep } from "./capture.schema.ts";
import { between, type Point } from "./capture-motion.ts";
import { planChord, planTyping, type KeyEvent } from "./capture-typing.ts";
import { rest, sleep, travel, type Hand, type Target } from "./capture-hand.ts";
import { reach, wheel } from "./capture-sight.ts";
import { observe, startWatch } from "./capture-watch.ts";

type Button = "left" | "right";

async function clickHere(
  hand: Hand,
  button: Button,
  clicks: number,
): Promise<void> {
  const { mouse } = hand.page;
  for (let count = 1; count <= clicks; count += 1) {
    await mouse.down({ button, clickCount: count });
    await observe(hand);
    await sleep(between(hand.random, 55, 130));
    await mouse.up({ button, clickCount: count });
    await observe(hand);
    if (count < clicks) await sleep(between(hand.random, 70, 160));
  }
}

// The moment between arriving and pressing: the eye confirms the target.
const settle = (hand: Hand): Promise<void> =>
  rest(hand, between(hand.random, 60, 220));

async function clickOn(
  hand: Hand,
  target: Target,
  how: { button: Button; clicks: number },
) {
  await reach(hand, target);
  await settle(hand);
  await clickHere(hand, how.button, how.clicks);
}

async function pressDown(hand: Hand): Promise<void> {
  await hand.page.mouse.down();
  hand.pressed = true;
  await observe(hand);
}

export async function release(hand: Hand): Promise<void> {
  await rest(hand, between(hand.random, 40, 120));
  await hand.page.mouse.up();
  hand.pressed = false;
  await observe(hand);
}

// Grabs, waits a moment as a hand does before pulling, carries it to the
// destination, lingers to see where it will land, and lets go.
async function dragOn(
  hand: Hand,
  step: CaptureStep,
  aim: Target["aim"],
): Promise<void> {
  if (step.drag === undefined) return;
  await reach(hand, { selector: step.drag });
  await settle(hand);
  await pressDown(hand);
  await rest(hand, between(hand.random, 120, 350));
  if (step.to !== undefined) {
    await reach(hand, { selector: step.to, aim });
  } else {
    const [dx, dy] = step.by ?? [0, 0];
    const to: Point = { x: hand.at.x + dx, y: hand.at.y + dy };
    await travel(hand, to, { ...to, width: 24, height: 24 });
  }
  await rest(hand, between(hand.random, 150, 450));
  await release(hand);
}

async function upload(hand: Hand, step: CaptureStep, act: () => Promise<void>) {
  if (step.upload === undefined) return act();
  const chooser = hand.page.waitForEvent("filechooser");
  await act();
  await (await chooser).setFiles(step.upload);
}

async function pressGestures(
  hand: Hand,
  step: CaptureStep,
  aim: Target["aim"],
) {
  const left: { button: Button; clicks: number } = {
    button: "left",
    clicks: 1,
  };
  if (step.click !== undefined) {
    const selector = step.click;
    await upload(hand, step, () => clickOn(hand, { selector, aim }, left));
  }
  if (step.doubleClick !== undefined) {
    await clickOn(
      hand,
      { selector: step.doubleClick, aim },
      { button: "left", clicks: 2 },
    );
  }
  if (step.rightClick !== undefined) {
    await clickOn(
      hand,
      { selector: step.rightClick, aim },
      { button: "right", clicks: 1 },
    );
  }
  if (step.clickAt !== undefined) {
    const [x, y] = step.clickAt;
    await travel(hand, { x, y }, { x: x - 6, y: y - 6, width: 12, height: 12 });
    await settle(hand);
    await clickHere(hand, "left", step.clicks ?? 1);
  }
  if (step.down !== undefined) {
    await reach(hand, { selector: step.down, aim });
    await settle(hand);
    await pressDown(hand);
  }
  await dragOn(hand, step, aim);
}

// The hand goes to a point, or to an element to point at it, without
// pressing; "aim" belongs to it only when nothing else is reached.
async function approach(hand: Hand, step: CaptureStep, aim: Target["aim"]) {
  if (step.pointAt !== undefined) {
    const [x, y] = step.pointAt;
    await travel(hand, { x, y }, { x: x - 6, y: y - 6, width: 12, height: 12 });
  }
  const selector = step.moveTo ?? step.hover;
  if (selector !== undefined) await reach(hand, { selector, aim });
}

export async function playKeys(
  hand: Hand,
  events: readonly KeyEvent[],
): Promise<void> {
  const { keyboard } = hand.page;
  const start = performance.now();
  for (const event of events) {
    await sleep(event.t - (performance.now() - start));
    if (event.kind === "down") await keyboard.down(event.key);
    else if (event.kind === "up") await keyboard.up(event.key);
    else await keyboard.insertText(event.key);
    await observe(hand);
  }
}

async function keys(hand: Hand, step: CaptureStep): Promise<void> {
  if (step.type !== undefined) {
    const typing = planTyping(step.type, hand);
    await playKeys(hand, typing.events);
    const fixed =
      typing.typos > 0 ? `, ${String(typing.typos)} typo(s) fixed` : "";
    hand.notes.push(`typed ${String(step.type.length)} characters${fixed}`);
  }
  if (step.press !== undefined) {
    await playKeys(hand, planChord(step.press, hand.random));
    hand.notes.push(`pressed ${step.press}`);
  }
}

function presses(step: CaptureStep): boolean {
  const targets = [
    step.click,
    step.doubleClick,
    step.rightClick,
    step.down,
    step.drag,
  ];
  return (
    targets.some((target) => target !== undefined) || step.clickAt !== undefined
  );
}

// The fields only a hand can do.
export function usesHand(step: CaptureStep): boolean {
  const fields = [
    step.watch,
    step.pointAt,
    step.down,
    step.moveTo,
    step.up,
    step.to,
    step.aim,
    step.wheel,
  ];
  return fields.some((field) => field !== undefined);
}

export async function actHuman(hand: Hand, step: CaptureStep): Promise<void> {
  if (step.eval !== undefined) await hand.page.evaluate(step.eval);
  startWatch(hand, step.watch);
  await observe(hand);
  await approach(hand, step, presses(step) ? undefined : step.aim);
  if (step.wheel !== undefined) await wheel(hand, step.wheel);
  if (step.hold !== undefined) await hand.page.keyboard.down(step.hold);
  await pressGestures(hand, step, step.aim);
  if (step.hold !== undefined) await hand.page.keyboard.up(step.hold);
  if (step.up === true) await release(hand);
  await keys(hand, step);
}
