// Takes the photos of a plan in one page of a 1440 x 900 window at 2x:
// each step may run a script, click, type, press a key, point at an
// element with the real mouse, then photograph the window or a region
// around an element, and print a value read from the page.
import { join, resolve } from "node:path";

const PUSH_PROFILE = resolve(".captures/profiles/push");
import { chromium, type Page } from "playwright-core";
import type { CapturePlan } from "./capture.schema.ts";
import { notePointerCapture } from "./capture-cursor-state.ts";
import { createHand, type Hand } from "./capture-hand.ts";
import type { Stage } from "./capture-photo.ts";
import { listenForProblems } from "./capture-problems.ts";
import { runStep } from "./capture-step-run.ts";
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
  if (plan.human !== undefined && plan.human !== false) {
    await notePointerCapture(page);
  }
  await page.goto(plan.url ?? REVIEW_URL, { waitUntil: "domcontentloaded" });
  // Notion draws its page well after load: wait for its blocks.
  if (signedIn) {
    await page.locator("[data-block-id]").first().waitFor({ timeout: 20000 });
  }
  await page.waitForTimeout(1200);
  try {
    const hand = await handFor(plan, page);
    const problems = listenForProblems(page);
    const stage: Stage = { page, hand, plan, composer: undefined, problems };
    for (const [index, step] of plan.steps.entries()) {
      const name = `${String(index).padStart(2, "0")}-${step.name}.png`;
      await runStep(stage, step, join(outDir, name));
    }
    return page.url();
  } finally {
    await session.end();
  }
}
