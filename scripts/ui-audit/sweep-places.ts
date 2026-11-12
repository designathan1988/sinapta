// Every place a person can reach from the sidebar, found in the page, not
// listed by hand: Home, each page of the tree, and each view of each
// database. Each is entered and swept: judged at rest, its rows and
// controls pointed at and focused, what its controls open opened.
import type { Session } from "./audit-session.ts";
import { isOver, settle, sweepControls, sweepRows } from "./sweep-controls.ts";
import { openEach } from "./sweep-surfaces.ts";

export type SweepMode = "full" | "narrow";

const PLACES = `return ["Home", ...new Set([...document.querySelectorAll(
  '.app__sidebar [role="treeitem"]')].map((row) => row.getAttribute("aria-label") ?? "")
  .filter(Boolean))];`;

const VIEWS = `return [...document.querySelectorAll(".app__page .database__tab")]
  .map((tab) => tab.textContent.trim());`;

async function names(session: Session, body: string): Promise<string[]> {
  const value = await session.call(body);
  return Array.isArray(value) ? value.map(String) : [];
}

async function enterPlace(session: Session, name: string): Promise<void> {
  const { page } = session;
  const target =
    name === "Home"
      ? page.locator(".app__sidebar .sidebar__item", { hasText: "Home" })
      : page.locator(`.app__sidebar [role="treeitem"][aria-label="${name}"]`);
  await target.first().click();
  await settle(session);
  session.place = `${session.label} · ${name}`;
  session.state = "at rest";
  session.coverage.places += 1;
}

// One place as it is: judged at rest, then pointed at, focused and opened
// where its kinds are new.
async function sweepHere(session: Session, mode: SweepMode): Promise<void> {
  await session.check("at-rest");
  if (mode === "full") {
    await sweepRows(session);
    await sweepControls(session, "", "");
  }
  await openEach(session, "");
}

// Each view of the database open in the place, its first view last
// again.
async function sweepViews(session: Session, mode: SweepMode): Promise<void> {
  const views = await names(session, VIEWS);
  const place = session.place;
  for (const view of views.slice(1)) {
    if (isOver(session)) break;
    await session.page
      .locator(".app__page .database__tab", { hasText: view })
      .first()
      .click();
    await settle(session);
    session.place = `${place} › ${view}`;
    session.coverage.places += 1;
    await sweepHere(session, mode);
  }
  const first = views[0];
  if (first)
    await session.page
      .locator(".app__page .database__tab", { hasText: first })
      .first()
      .click();
}

export async function sweepApp(
  session: Session,
  mode: SweepMode,
): Promise<void> {
  for (const name of await names(session, PLACES)) {
    if (isOver(session)) {
      session.expect(
        false,
        "budget",
        `the time budget ended before "${name}" was swept`,
      );
      return;
    }
    try {
      await enterPlace(session, name);
      await sweepHere(session, mode);
      await sweepViews(session, mode);
    } catch (error) {
      const reason = String(error).split("\n")[0] ?? "";
      session.expect(false, `sweep ${name}`, `stopped: ${reason}`);
      await session.page.keyboard.press("Escape");
    }
  }
}
