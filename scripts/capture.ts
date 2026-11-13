// Photographs the running app at native pixels, as the interface is
// judged: headless Chrome (no window), 1440 x 900 at 2x. Each step may run
// a script, click, point at an element with the real mouse, then capture
// the window or a region around an element; it may print a value read
// from the page. A plan may name a signed-in profile (npm run
// capture:login) to photograph a site such as Notion the same way.
// Usage: npm run capture -- <steps.json> [outDir]
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Page } from "playwright-core";
import {
  readCapturePlan,
  type CapturePlan,
  type CaptureStep,
} from "./capture.schema.ts";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

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

async function run(page: Page, step: CaptureStep, path: string): Promise<void> {
  if (step.eval !== undefined) await page.evaluate(step.eval);
  if (step.click !== undefined) await page.locator(step.click).first().click();
  if (step.type !== undefined) await page.keyboard.type(step.type);
  if (step.press !== undefined) await page.keyboard.press(step.press);
  if (step.hover === undefined) await page.mouse.move(2, 2);
  else await page.locator(step.hover).first().hover();
  await page.waitForTimeout(step.wait ?? 350);
  const clip = await region(page, step);
  await page.screenshot(clip === undefined ? { path } : { path, clip });
  const value: unknown =
    step.read === undefined ? undefined : await page.evaluate(step.read);
  console.log(path, value === undefined ? "" : JSON.stringify(value));
}

// The window every photo is taken in: a laptop's 1440 x 900, at 2x.
const WINDOW = {
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
} as const;

// A tab to photograph in, and how to let it go afterwards.
interface Session {
  readonly page: Page;
  readonly end: () => Promise<void>;
}

// A signed-in site is photographed through the window npm run
// capture:login keeps open: a fresh context of 1440 x 900 at 2x carries
// that window's sign-in (cookies and storage), and the window stays open.
async function signedIn(plan: CapturePlan): Promise<Session> {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
  const window = browser.contexts()[0];
  if (window === undefined) throw new Error("No window on port 9333.");
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

async function open(plan: CapturePlan): Promise<Session> {
  if (plan.profile !== undefined) return signedIn(plan);
  const browser = await chromium.launch({ executablePath: CHROME });
  const context = await browser.newContext({
    ...WINDOW,
    colorScheme: plan.theme ?? "dark",
  });
  return { page: await context.newPage(), end: () => browser.close() };
}

const [stepsFile = "", outDir = ".captures"] = process.argv.slice(2);
const plan = readCapturePlan(readFileSync(stepsFile, "utf8"));
mkdirSync(outDir, { recursive: true });
const { page, end } = await open(plan);
await page.goto(plan.url ?? "http://localhost:5190/", { waitUntil: "load" });
await page.waitForTimeout(plan.profile === undefined ? 1200 : 4000);
for (const [index, step] of plan.steps.entries()) {
  const name = `${String(index).padStart(2, "0")}-${step.name}.png`;
  await run(page, step, join(outDir, name));
}
await end();
