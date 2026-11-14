// One step of a plan: what it changes around the page first (offline,
// reload), the action itself (by the hand in a "human" plan), the wait
// for what it expects, the photo — with a photo at every phase of the
// gesture when "frames" is on — what it reads, what the hand felt, and
// what went wrong behind the photo (console, page errors, network).
import type { Page } from "playwright-core";
import type { CaptureStep } from "./capture.schema.ts";
import { drag, press } from "./capture-actions.ts";
import { shownCursor } from "./capture-cursor-state.ts";
import { printFelt } from "./capture-feedback.ts";
import { actHuman, usesHand } from "./capture-gestures.ts";
import { rest, type Hand } from "./capture-hand.ts";
import { photograph, type Stage } from "./capture-photo.ts";
import { takeProblems } from "./capture-problems.ts";

async function act(page: Page, step: CaptureStep): Promise<void> {
  if (step.eval !== undefined) await page.evaluate(step.eval);
  await press(page, step);
  await drag(page, step);
  // After a click the mouse stays on what it clicked: submenus that open
  // on hover close when it leaves. Otherwise it rests in a corner.
  if (step.hover !== undefined) {
    await page.locator(step.hover).first().hover({ timeout: 10000 });
  } else if (
    step.click === undefined &&
    step.clickAt === undefined &&
    step.rightClick === undefined &&
    step.doubleClick === undefined &&
    step.drag === undefined
  ) {
    await page.mouse.move(2, 2);
  }
}

// The network cut or restored, or the page read again from the server,
// before the step acts: how a person tests that work was kept.
async function changeSurroundings(
  stage: Stage,
  step: CaptureStep,
): Promise<void> {
  if (step.offline !== undefined)
    await stage.page.context().setOffline(step.offline);
  if (step.reload !== true) return;
  await stage.page.reload({ waitUntil: "domcontentloaded" });
  await stage.page.waitForTimeout(1200);
}

async function actOnce(stage: Stage, step: CaptureStep): Promise<void> {
  if (stage.hand !== undefined) return actHuman(stage.hand, step);
  if (usesHand(step)) throw new Error(`step ${step.name} needs "human"`);
  return act(stage.page, step);
}

// Acts, then waits for what the step expects to appear; a page still
// loading may swallow the first action, so it is done once more (and a
// person whose click did nothing clicks again).
async function actAndExpect(stage: Stage, step: CaptureStep): Promise<void> {
  await changeSurroundings(stage, step);
  await actOnce(stage, step);
  if (step.expect === undefined) return;
  const expected = stage.page.locator(step.expect).first();
  try {
    await expected.waitFor({ timeout: 4000 });
  } catch (error) {
    // A gesture in the middle of a held button is not done twice.
    if (stage.hand?.pressed === true || step.up === true) throw error;
    stage.hand?.notes.push("nothing expected appeared: did it again");
    await actOnce(stage, step);
    await expected.waitFor({ timeout: 6000 });
  }
}

// With "frames", the hand photographs each phase of its gesture as it
// happens: <step>.1-arrived.png, <step>.2-pressed.png, …
function filmPhases(stage: Stage, step: CaptureStep, path: string): void {
  const { hand } = stage;
  if (hand === undefined) return;
  const on = step.frames ?? stage.plan.frames ?? false;
  if (!on) {
    hand.snap = undefined;
    return;
  }
  let count = 0;
  hand.snap = async (phase) => {
    count += 1;
    const frame = path.replace(/\.png$/, `.${String(count)}-${phase}.png`);
    const cursor = await shownCursor(hand);
    await photograph(stage, { step, path: frame, cursor });
    console.log(`  frame ${frame} · cursor ${cursor.keyword}`);
  };
}

async function failed(
  stage: Stage,
  step: CaptureStep,
  path: string,
): Promise<void> {
  const failedPath = path.replace(/\.png$/, "-failed.png");
  await stage.page.screenshot({ path: failedPath });
  console.error("step failed:", step.name, "- see", failedPath);
  if (stage.hand !== undefined) await printFelt(stage.hand, "at the failure:");
  for (const line of takeProblems(stage.problems)) console.error(line);
}

async function settle(
  page: Page,
  hand: Hand | undefined,
  ms: number,
): Promise<void> {
  if (hand === undefined) await page.waitForTimeout(ms);
  else await rest(hand, ms);
}

// A step that fails leaves a photo of the window as it was, named
// <step>-failed.png, so the reason can be seen.
export async function runStep(
  stage: Stage,
  step: CaptureStep,
  path: string,
): Promise<void> {
  const { page, hand } = stage;
  filmPhases(stage, step, path);
  try {
    await actAndExpect(stage, step);
  } catch (error) {
    await failed(stage, step, path);
    throw error;
  }
  await settle(page, hand, step.wait ?? 350);
  const cursor = hand === undefined ? undefined : await shownCursor(hand);
  await photograph(stage, { step, path, cursor });
  const value: unknown =
    step.read === undefined ? undefined : await page.evaluate(step.read);
  console.log(path, value === undefined ? "" : JSON.stringify(value));
  if (hand !== undefined) await printFelt(hand, "");
  for (const line of takeProblems(stage.problems)) console.log(line);
}
