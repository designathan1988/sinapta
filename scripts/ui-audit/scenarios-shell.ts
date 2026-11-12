// The shell around the page: its menus, search, inbox, trash, settings and
// a new page, each opened as a person would and checked while open.
import type { Session } from "./audit-session.ts";
import type { Scenario } from "./scenarios-editor.ts";

const OPEN = "[popover]:popover-open, dialog[open]";

// Opens something with a click, checks it, then closes it with Escape and
// makes sure it went.
async function openAndClose(
  session: Session,
  step: string,
  open: () => Promise<void>,
): Promise<void> {
  const { page } = session;
  await open();
  const isOpen = (await page.locator(OPEN).count()) > 0;
  session.expect(isOpen, step, "nothing opened");
  await session.check(step);
  await page.keyboard.press("Escape");
  const isClosed = (await page.locator(OPEN).count()) === 0;
  session.expect(isClosed, step, "Escape left it open");
}

// A row of a menu that is open, by its words.
function menuRow(session: Session, words: string) {
  return session.page.locator(".menu [data-index]", { hasText: words }).first();
}

async function pageMenus(session: Session): Promise<void> {
  const { page } = session;
  await openAndClose(session, "page-menu", () =>
    page.locator(".page-menu__button[data-place='bar']").click(),
  );
  const row = page.locator(".sidebar__row").first();
  await openAndClose(session, "sidebar-row-menu", async () => {
    await row.hover();
    await row.locator(".page-menu__button[data-place='tree']").click();
  });
}

async function panels(session: Session): Promise<void> {
  const { page } = session;
  await openAndClose(session, "search", () =>
    page.locator(".sidebar__search").click(),
  );
  await openAndClose(session, "inbox", () =>
    page.getByRole("button", { name: "Inbox", exact: true }).click(),
  );
  await openAndClose(session, "trash", async () => {
    await page
      .getByRole("button", { name: "Templates, trash and more" })
      .click();
    await menuRow(session, "Trash").click();
  });
  await openAndClose(session, "settings", async () => {
    await page.locator(".sidebar__workspace").click();
    await menuRow(session, "Settings").click();
  });
}

async function newPage(session: Session): Promise<void> {
  const { page } = session;
  await page
    .locator(".app__sidebar")
    .getByRole("button", { name: "New page" })
    .first()
    .click();
  const title = page.locator(".app__page .editor__title");
  const isFocused = await title.evaluate(
    (element) => element === document.activeElement,
  );
  session.expect(
    isFocused,
    "new-page",
    "a new page did not put the caret in its title",
  );
  await page.keyboard.type("Audit page");
  const row = page.locator(".sidebar__row[aria-label='Audit page']");
  session.expect(
    (await row.count()) === 1,
    "new-page",
    "the sidebar does not list the new page by its title",
  );
  await session.check("new-page");
}

export const SHELL_SCENARIOS: readonly Scenario[] = [
  { name: "page-menus", run: pageMenus },
  { name: "panels", run: panels },
  { name: "new-page", run: newPage },
];
