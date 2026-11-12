// The seeded Tasks database: every view, its tools, a column's menu, a new
// row and the side peek, then the same page in a narrower window.
import type { Session } from "./audit-session.ts";
import type { Scenario } from "./scenarios-editor.ts";

const OPEN = "[popover]:popover-open, dialog[open]";
const TOOLBAR = ".app__page .database__toolbar";

async function openTasks(session: Session): Promise<void> {
  const { page } = session;
  await page.locator(".sidebar__row[aria-label='Tasks']").first().click();
  await page.locator(".app__page .database").waitFor();
  await session.check("tasks");
}

// Every view the database has, as a tab or under the switch.
async function everyView(session: Session): Promise<void> {
  const tabs = session.page.locator(".app__page .database__tab");
  const total = await tabs.count();
  for (let index = 0; index < total; index += 1) {
    const tab = tabs.nth(index);
    const name = (await tab.textContent())?.trim() ?? String(index);
    await tab.click();
    const isOpen = (await tab.getAttribute("aria-pressed")) === "true";
    session.expect(isOpen, `view-${name}`, "its tab did not open it");
    await session.check(`view-${name.toLowerCase()}`);
  }
  await tabs.first().click();
}

async function toolMenus(session: Session): Promise<void> {
  const { page } = session;
  for (const label of ["Filter", "Sort", "View settings"]) {
    await page.locator(`${TOOLBAR} button[aria-label='${label}']`).click();
    const isOpen = (await page.locator(OPEN).count()) > 0;
    session.expect(isOpen, `tool-${label}`, "its button opened nothing");
    await session.check(`tool-${label.toLowerCase().replace(" ", "-")}`);
    await page.keyboard.press("Escape");
  }
  await page.locator(".app__page .database__header-button").nth(1).click();
  const isOpen = (await page.locator(OPEN).count()) > 0;
  session.expect(isOpen, "column-menu", "a header press opened no menu");
  await session.check("column-menu");
  await page.keyboard.press("Escape");
}

async function newRowAndPeek(session: Session): Promise<void> {
  const { page } = session;
  const rows = page.locator(".app__page tbody tr");
  const before = await rows.count();
  await page
    .locator(TOOLBAR)
    .getByRole("button", { name: "New", exact: true })
    .click();
  session.expect(
    (await rows.count()) === before + 1,
    "new-row",
    "New added no row to the table",
  );
  const peek = page.locator(".peek");
  session.expect(
    await peek.isVisible(),
    "new-row",
    "the new row did not open in the side peek",
  );
  await session.check("new-row-peek");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  session.expect(
    !(await peek.isVisible()),
    "new-row",
    "Escape did not close the side peek",
  );
}

// Opens the first row in the side peek and checks it, then closes it.
async function peekFirstRow(session: Session, step: string): Promise<void> {
  const { page } = session;
  const row = page.locator(".app__page tbody tr").first();
  await row.hover();
  await row.locator(".database__open").click();
  await page.locator(".peek").waitFor();
  await session.check(step);
  await page.locator(".peek button[aria-label='Close']").click();
}

async function narrowWindow(session: Session): Promise<void> {
  const { page } = session;
  await page.setViewportSize({ width: 1024, height: 768 });
  await session.check("narrow-tasks");
  await peekFirstRow(session, "narrow-peek");
  await page.setViewportSize({ width: 1440, height: 900 });
}

export const DATABASE_SCENARIOS: readonly Scenario[] = [
  { name: "tasks", run: openTasks },
  { name: "views", run: everyView },
  { name: "tools", run: toolMenus },
  { name: "new-row", run: newRowAndPeek },
  { name: "peek", run: (session) => peekFirstRow(session, "peek") },
  { name: "narrow", run: narrowWindow },
];
