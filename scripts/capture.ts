// Photographs the running app at native pixels, as the interface is
// judged: headless Chrome (no window), 1440 x 900 at 2x. Each step may run
// a script, click, point at an element with the real mouse, then capture
// the window or a region around an element; it may print a value read
// from the page. Usage: npm run capture -- <steps.json> [outDir]
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Page } from "playwright-core";
import { readCapturePlan, type CaptureStep } from "./capture.schema.ts";

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
  if (step.hover === undefined) await page.mouse.move(2, 2);
  else await page.locator(step.hover).first().hover();
  await page.waitForTimeout(step.wait ?? 350);
  const clip = await region(page, step);
  await page.screenshot(clip === undefined ? { path } : { path, clip });
  const value: unknown =
    step.read === undefined ? undefined : await page.evaluate(step.read);
  console.log(path, value === undefined ? "" : JSON.stringify(value));
}

const [stepsFile = "", outDir = ".captures"] = process.argv.slice(2);
const plan = readCapturePlan(readFileSync(stepsFile, "utf8"));
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  colorScheme: plan.theme ?? "dark",
});
const page = await context.newPage();
await page.goto(plan.url ?? "http://localhost:5190/", { waitUntil: "load" });
await page.waitForTimeout(1200);
for (const [index, step] of plan.steps.entries()) {
  const name = `${String(index).padStart(2, "0")}-${step.name}.png`;
  await run(page, step, join(outDir, name));
}
await browser.close();
