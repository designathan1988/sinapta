// Presses each kind of control that declares it opens something, judges
// what opened at rest, points at its rows, opens its submenus, then closes
// it as a person would and checks the page came back as it was.
import { readProblems, type Session } from "./audit-session.ts";
import type { ControlInfo } from "./page-discover.ts";
import {
  isOver,
  listControls,
  moveTo,
  settle,
  sweepControls,
} from "./sweep-controls.ts";

const text = (value: string) => JSON.stringify(value);

// The audit ids of the menus, popovers, dialogs and peeks now open.
const OPEN_SURFACES = `return [...document.querySelectorAll(
  "[popover]:popover-open, dialog[open], .peek")]
  .filter((element) => !element.matches('[role="tooltip"], .tooltip'))
  .map(auditIdOf);`;

async function openSurfaces(session: Session): Promise<string[]> {
  const value = await session.call(OPEN_SURFACES);
  return Array.isArray(value) ? value.map(String) : [];
}

// How the control looks with the pointer away; nothing when it is gone
// or hidden, as a menu's row once its menu has closed.
async function restLook(session: Session, control: ControlInfo) {
  await moveTo(session, await session.call("return quietPoint();"));
  await settle(session);
  return session.call(`const element = auditElement(${text(control.id)});
    // Focus a key press left on it is shown on purpose, not stuck.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    return element && isShown(element) ? responseOf(element) : "";`);
}

interface Flag {
  readonly id: string;
  readonly rule: string;
  readonly detail: string;
}

// Records a rule the runner saw broken on the element with the audit id.
async function flag(session: Session, found: Flag) {
  const body = `const element = auditElement(${text(found.id)});
    return element ? [problemOf(${text(found.rule)}, element, ${text(found.detail)})] : [];`;
  await session.record(readProblems(await session.call(body)), found.rule);
}

// Escape, then a click in a quiet corner; whatever stays open is reported
// and the page reloaded so the sweep can go on.
async function close(session: Session, surface: string): Promise<boolean> {
  await session.page.keyboard.press("Escape");
  await settle(session);
  if (!(await openSurfaces(session)).includes(surface)) return true;
  await moveTo(session, await session.call("return quietPoint();"));
  await session.page.mouse.down();
  await session.page.mouse.up();
  await settle(session);
  if (!(await openSurfaces(session)).includes(surface)) return true;
  await flag(session, {
    id: surface,
    rule: "not-closing",
    detail: "Escape and a click outside leave it open",
  });
  await session.page.reload();
  await settle(session);
  return false;
}

// After closing, the control must look as it did before it was opened.
async function checkRestored(
  session: Session,
  control: ControlInfo,
  before: unknown,
) {
  const after = await restLook(session, control);
  // Hidden before or after, as a header's actions shown only on hover:
  // there is no look to compare.
  if (after === "" || before === "") return;
  const expanded = await session.call(
    `return auditElement(${text(control.id)})?.getAttribute("aria-expanded") ?? "";`,
  );
  if (expanded === "true") {
    await flag(session, {
      id: control.id,
      rule: "stuck-state",
      detail: "still says it is open after what it opened has closed",
    });
  } else if (after !== before) {
    await flag(session, {
      id: control.id,
      rule: "stuck-state",
      detail: "drawn differently after what it opened has closed",
    });
  }
}

async function openOne(session: Session, control: ControlInfo, depth: number) {
  const before = await openSurfaces(session);
  const look = await restLook(session, control);
  await session.page.mouse.click(control.x, control.y);
  await settle(session);
  const opened = (await openSurfaces(session)).filter(
    (id) => !before.includes(id),
  );
  const surface = opened.at(-1);
  session.state = surface
    ? `with what "${control.label}" opens`
    : `after pressing "${control.label}"`;
  await session.check(`open-${control.kind}`);
  if (!surface) {
    const expanded = await session.call(
      `return auditElement(${text(control.id)})?.getAttribute("aria-expanded");`,
    );
    if (expanded === "true")
      await session.page.mouse.click(control.x, control.y);
    return;
  }
  session.coverage.surfaces += 1;
  await sweepControls(session, surface, "");
  if (depth < 2) await openEach(session, surface, depth + 1);
  if (await close(session, surface))
    await checkRestored(session, control, look);
}

// Each control that opens something, once per kind and label (the
// toolbar's Filter and Sort share a kind, not a menu), never one that
// could destroy or leave. The controls are listed again before each, as
// opening and closing may have drawn them anew.
export async function openEach(
  session: Session,
  scopeId: string,
  depth = 1,
): Promise<void> {
  for (;;) {
    if (isOver(session)) break;
    const controls = await listControls(
      session,
      `listControls(${text(scopeId)})`,
    );
    const next = controls.find(
      (control) =>
        control.opens &&
        !control.isRisky &&
        !session.seen.has(`open:${control.kind}:${control.label}`),
    );
    if (!next) break;
    session.seen.add(`open:${next.kind}:${next.label}`);
    await openOne(session, next, depth);
  }
  session.state = "at rest";
}
