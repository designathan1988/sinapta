// Takes the photos of a plan in one page of a 1440 x 900 window at 2x:
// each step may run a script, click, type, press a key, point at an
// element with the real mouse, then photograph the window or a region
// around an element, and print a value read from the page.
import { join } from "node:path";
import { chromium, type Page } from "playwright-core";
import type { CapturePlan, CaptureStep } from "./capture.schema.ts";
import { CHROME, NOTION_PORT, REVIEW_URL } from "./capture-window.ts";

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

async function headless(plan: CapturePlan): Promise<Session> {
  const browser = await chromium.launch({ executablePath: CHROME });
  const context = await browser.newContext({
    ...WINDOW,
    colorScheme: plan.theme ?? "dark",
  });
  return { page: await context.newPage(), end: () => browser.close() };
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

// Acts, then waits for what the step expects to appear; a page still
// loading may swallow the first action, so it is done once more.
async function actAndExpect(page: Page, step: CaptureStep): Promise<void> {
  await act(page, step);
  if (step.expect === undefined) return;
  const expected = page.locator(step.expect).first();
  try {
    await expected.waitFor({ timeout: 4000 });
  } catch {
    await act(page, step);
    await expected.waitFor({ timeout: 6000 });
  }
}

async function act(page: Page, step: CaptureStep): Promise<void> {
  if (step.eval !== undefined) await page.evaluate(step.eval);
  const timeout = 10000;
  if (step.click !== undefined) {
    await page.locator(step.click).first().click({ timeout });
  }
  if (step.type !== undefined) await page.keyboard.type(step.type);
  if (step.press !== undefined) await page.keyboard.press(step.press);
  if (step.hover === undefined) await page.mouse.move(2, 2);
  else await page.locator(step.hover).first().hover({ timeout });
}

// A step that fails leaves a photo of the window as it was, named
// <step>-failed.png, so the reason can be seen.
async function run(
  page: Page,
  step: CaptureStep,
  path: string,
): Promise<void> {
  try {
    await actAndExpect(page, step);
  } catch (error) {
    const failed = path.replace(/\.png$/, "-failed.png");
    await page.screenshot({ path: failed });
    console.error("step failed:", step.name, "- see", failed);
    throw error;
  }
  await page.waitForTimeout(step.wait ?? 350);
  const clip = await region(page, step);
  await page.screenshot(clip === undefined ? { path } : { path, clip });
  const value: unknown =
    step.read === undefined ? undefined : await page.evaluate(step.read);
  console.log(path, value === undefined ? "" : JSON.stringify(value));
}

// Photographs every step and answers the address the page ended on.
export async function takePhotos(
  target: Target,
  plan: CapturePlan,
  outDir: string,
): Promise<string> {
  const session =
    target === "notion" ? await notionSession(plan) : await headless(plan);
  const { page } = session;
  await page.goto(plan.url ?? REVIEW_URL, { waitUntil: "load" });
  // Notion draws its page well after load: wait for its blocks.
  if (target === "notion") {
    await page.locator("[data-block-id]").first().waitFor({ timeout: 20000 });
  }
  await page.waitForTimeout(1200);
  try {
    for (const [index, step] of plan.steps.entries()) {
      const name = `${String(index).padStart(2, "0")}-${step.name}.png`;
      await run(page, step, join(outDir, name));
    }
    return page.url();
  } finally {
    await session.end();
  }
}
