// Takes the photos of a plan in one page of a 1440 x 900 window at 2x:
// each step may run a script, click, type, press a key, point at an
// element with the real mouse, then photograph the window or a region
// around an element, and print a value read from the page.
import { join, resolve } from "node:path";

const PUSH_PROFILE = resolve(".captures/profiles/push");
import { chromium, type Page } from "playwright-core";
import type { CapturePlan, CaptureStep } from "./capture.schema.ts";
import { drag, press } from "./capture-actions.ts";
import { printFelt } from "./capture-feedback.ts";
import { actHuman, usesHand } from "./capture-gestures.ts";
import { createHand, rest, type Hand } from "./capture-hand.ts";
import {
  CHROME,
  NOTION_PORT,
  REVIEW_ACCOUNT,
  REVIEW_URL,
} from "./capture-window.ts";

const WINDOW = {
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
};

export type Target = "notion" | "pagecraft";

interface Session {
  readonly page: Page;
  readonly end: () => Promise<void>;
}

// Notion is photographed in a fresh context that carries the sign-in of
// the open window; the window itself is left as it is.
async function notionSession(plan: CapturePlan): Promise<Session> {
  const browser = await chromium.connectOverCDP(
    `http://127.0.0.1:${String(NOTION_PORT)}`,
  );
  const window = browser.contexts()[0];
  if (window === undefined) throw new Error("The Notion window has no tab.");
  const context = await browser.newContext({
    ...WINDOW,
    colorScheme: plan.theme ?? "dark",
    storageState: await window.storageState(),
  });
  const end = async () => {
    await context.close();
    await browser.close();
  };
  return { page: await context.newPage(), end };
}

// Chrome's own switches for a microphone that plays a file.
function microphoneArgs(plan: CapturePlan): string[] {
  if (plan.microphone === undefined) return [];
  return [
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
    `--use-file-for-fake-audio-capture=${resolve(plan.microphone)}`,
  ];
}

// Push needs a real profile: Chrome turns it off in the private contexts
// the other photos use. Its own profile, in Chrome's full headless mode.
async function withProfile(plan: CapturePlan): Promise<Session> {
  const context = await chromium.launchPersistentContext(PUSH_PROFILE, {
    executablePath: CHROME,
    headless: false,
    args: ["--headless=new", ...microphoneArgs(plan)],
    ...WINDOW,
    colorScheme: plan.theme ?? "dark",
    permissions: plan.permissions ?? [],
  });
  const page = context.pages()[0] ?? (await context.newPage());
  return { page, end: () => context.close() };
}

async function headless(plan: CapturePlan): Promise<Session> {
  if (plan.permissions?.includes("notifications") === true) {
    return withProfile(plan);
  }
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: microphoneArgs(plan),
  });
  const context = await browser.newContext({
    ...WINDOW,
    colorScheme: plan.theme ?? "dark",
    permissions: plan.permissions ?? [],
  });
  const page = await context.newPage();
  if (plan.passkey === true) await addAuthenticator(page);
  return { page, end: () => browser.close() };
}

// Chrome's virtual authenticator (DevTools' WebAuthn domain): it keeps
// passkeys and confirms the person each time, as a fingerprint would.
async function addAuthenticator(page: Page): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
}

async function region(page: Page, step: CaptureStep) {
  if (step.clip === undefined) return undefined;
  const box = await page.locator(step.clip).first().boundingBox();
  if (box === null) return undefined;
  const pad = step.pad ?? 24;
  return {
    x: Math.max(0, box.x - pad),
    y: Math.max(0, box.y - pad),
    width: box.width + pad * 2,
    height: box.height + pad * 2,
  };
}

// The page, and the person's hand when the plan asks for one.
interface Stage {
  readonly page: Page;
  readonly hand: Hand | undefined;
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

// A step that fails leaves a photo of the window as it was, named
// <step>-failed.png, so the reason can be seen.
async function run(
  stage: Stage,
  step: CaptureStep,
  path: string,
): Promise<void> {
  const { page, hand } = stage;
  try {
    await actAndExpect(stage, step);
  } catch (error) {
    const failed = path.replace(/\.png$/, "-failed.png");
    await page.screenshot({ path: failed });
    console.error("step failed:", step.name, "- see", failed);
    if (hand !== undefined) await printFelt(hand, "at the failure:");
    throw error;
  }
  if (hand === undefined) await page.waitForTimeout(step.wait ?? 350);
  else await rest(hand, step.wait ?? 350);
  const clip = await region(page, step);
  await page.screenshot(clip === undefined ? { path } : { path, clip });
  const value: unknown =
    step.read === undefined ? undefined : await page.evaluate(step.read);
  console.log(path, value === undefined ? "" : JSON.stringify(value));
  if (hand !== undefined) await printFelt(hand, "");
}

function handFor(plan: CapturePlan, page: Page): Promise<Hand> | undefined {
  if (plan.human === undefined || plan.human === false) return undefined;
  return createHand(page, plan.human === true ? {} : plan.human);
}

// Signs the photo's context in to the review server, making the review
// account the first time.
async function signInForReview(page: Page): Promise<void> {
  const api = new URL("/api/account/", REVIEW_URL).href;
  const headers = { Origin: new URL(REVIEW_URL).origin };
  const signIn = await page.request.post(`${api}sign-in`, {
    data: REVIEW_ACCOUNT,
    headers,
  });
  if (signIn.ok()) return;
  await page.request.post(`${api}sign-up`, { data: REVIEW_ACCOUNT, headers });
}

// Photographs every step and answers the address the page ended on.
export async function takePhotos(
  target: Target,
  plan: CapturePlan,
  outDir: string,
): Promise<string> {
  const signedIn = target === "notion" && plan.guest !== true;
  const session = signedIn ? await notionSession(plan) : await headless(plan);
  const { page } = session;
  if (target === "pagecraft" && plan.guest !== true) {
    await signInForReview(page);
  }
  await page.goto(plan.url ?? REVIEW_URL, { waitUntil: "domcontentloaded" });
  // Notion draws its page well after load: wait for its blocks.
  if (signedIn) {
    await page.locator("[data-block-id]").first().waitFor({ timeout: 20000 });
  }
  await page.waitForTimeout(1200);
  try {
    const stage: Stage = { page, hand: await handFor(plan, page) };
    for (const [index, step] of plan.steps.entries()) {
      const name = `${String(index).padStart(2, "0")}-${step.name}.png`;
      await run(stage, step, join(outDir, name));
    }
    return page.url();
  } finally {
    await session.end();
  }
}
