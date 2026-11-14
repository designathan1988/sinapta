// What a capture step does with the mouse and the keyboard: click,
// double-click, right-click, type, press, and drag.
import type { Page } from "playwright-core";
import type { CaptureStep } from "./capture.schema.ts";

// Clicks, answering the file chooser the click opens with "upload".
async function click(page: Page, step: CaptureStep): Promise<void> {
  if (step.click === undefined) return;
  const { upload } = step;
  const chooser =
    upload === undefined ? undefined : page.waitForEvent("filechooser");
  await page.locator(step.click).first().click({ timeout: 10000 });
  if (chooser !== undefined && upload !== undefined) {
    await (await chooser).setFiles(upload);
  }
}

// Clicks by selector or at a point, then types or presses a key.
export async function press(page: Page, step: CaptureStep): Promise<void> {
  await click(page, step);
  if (step.rightClick !== undefined) {
    await page
      .locator(step.rightClick)
      .first()
      .click({ button: "right", timeout: 10000 });
  }
  if (step.doubleClick !== undefined) {
    await page.locator(step.doubleClick).first().dblclick({ timeout: 10000 });
  }
  if (step.clickAt !== undefined) {
    const [x, y] = step.clickAt;
    await page.mouse.click(x, y, { clickCount: step.clicks ?? 1 });
  }
  if (step.type !== undefined) await page.keyboard.type(step.type);
  if (step.press !== undefined) await page.keyboard.press(step.press);
}

// Presses the mouse on an element's middle and moves it in steps by an
// offset, as a hand drags, then lets go; "hold" keeps a key down (Alt to
// drag a copy).
export async function drag(page: Page, step: CaptureStep): Promise<void> {
  if (step.drag === undefined) return;
  const box = await page.locator(step.drag).first().boundingBox();
  if (box === null) throw new Error(`nothing to drag: ${step.drag}`);
  const [dx, dy] = step.by ?? [0, 0];
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  if (step.hold !== undefined) await page.keyboard.down(step.hold);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 12 });
  await page.mouse.up();
  if (step.hold !== undefined) await page.keyboard.up(step.hold);
}
