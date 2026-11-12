// The editor, used as a person would: every block pointed at, text typed,
// the "/" menu, the block menu and a to-do ticked, each checked after.
import type { Session } from "./audit-session.ts";

export interface Scenario {
  readonly name: string;
  readonly run: (session: Session) => Promise<void>;
}

const BLOCKS = ".app__page .editor .editor__block";
// Any open menu: the block menus, the "/" menu, the page menus.
const MENU = "[popover]:popover-open";

// Whether a menu shows within a moment, as a person would wait for it.
export async function showsSoon(
  session: Session,
  selector: string,
): Promise<boolean> {
  try {
    await session.page.locator(selector).first().waitFor({ timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

// Points at each block of the open page, near its top, where Notion shows
// its handles, and checks them there.
async function pointAtEveryBlock(session: Session, prefix: string) {
  const blocks = session.page.locator(BLOCKS);
  const total = await blocks.count();
  for (let index = 0; index < total; index += 1) {
    const block = blocks.nth(index);
    await block.scrollIntoViewIfNeeded();
    await block.hover({ position: { x: 24, y: 4 } });
    await session.check(`${prefix}-block-${String(index)}`, "on-problem");
  }
  session.expect(total > 0, prefix, "the open page shows no blocks");
}

async function typeInNewBlock(session: Session): Promise<void> {
  const { page } = session;
  await page.locator(`${BLOCKS} [contenteditable='true']`).last().click();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Typed by the audit");
  const typed = await page
    .locator(BLOCKS, { hasText: "Typed by the audit" })
    .count();
  session.expect(typed > 0, "typing", "typed text did not show in a new block");
  await session.check("typed");
}

async function slashMenu(session: Session): Promise<void> {
  const { page } = session;
  await page.keyboard.press("Enter");
  await page.keyboard.type("/");
  const isOpen = await showsSoon(session, MENU);
  session.expect(isOpen, "slash-menu", "typing / did not open the block menu");
  await session.check("slash-menu");
  await page.keyboard.type("heading 2");
  await session.check("slash-menu-filtered");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Audit heading");
  const heading = page.locator(BLOCKS, { hasText: "Audit heading" }).last();
  const isHeading = (await heading.locator("h1, h2, h3, h4").count()) > 0;
  session.expect(
    isHeading,
    "slash-heading",
    "choosing Heading 2 made no heading",
  );
  await heading.hover({ position: { x: 24, y: 4 } });
  await session.check("new-heading-handles");
}

async function blockMenu(session: Session): Promise<void> {
  const { page } = session;
  const block = page.locator(BLOCKS).first();
  await block.hover({ position: { x: 24, y: 4 } });
  await block.locator(":scope > .editor__handle:not([data-add])").click();
  const isOpen = await showsSoon(session, MENU);
  session.expect(
    isOpen,
    "block-menu",
    "the grip did not open the block's menu",
  );
  await session.check("block-menu");
  await page.keyboard.press("Escape");
  const isClosed = !(await page.locator(MENU).first().isVisible());
  session.expect(
    isClosed,
    "block-menu",
    "Escape did not close the block's menu",
  );
}

async function tickToDo(session: Session): Promise<void> {
  const box = session.page.locator(".app__page .to-do__check").first();
  const before = await box.isChecked();
  await box.click();
  const after = await box.isChecked();
  session.expect(after !== before, "to-do", "a click did not tick the to-do");
  await box.click();
}

export const EDITOR_SCENARIOS: readonly Scenario[] = [
  { name: "start", run: (session) => session.check("start") },
  { name: "handles", run: (session) => pointAtEveryBlock(session, "start") },
  { name: "typing", run: typeInNewBlock },
  { name: "slash-menu", run: slashMenu },
  { name: "block-menu", run: blockMenu },
  { name: "to-do", run: tickToDo },
];
