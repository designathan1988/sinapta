// Points at and focuses one control of each kind, as a person would, and
// judges what that does: the control or its row must visibly respond,
// nothing around it may move, focus from the keyboard must show. Rows are
// pointed at first, for the controls they show only then.
import { readProblems, SETTLE, type Session } from "./audit-session.ts";
import type { Problem } from "./page-elements.ts";
import type { ControlInfo } from "./page-discover.ts";

const text = (value: string) => JSON.stringify(value);

function isControlInfo(value: unknown): value is ControlInfo {
  if (typeof value !== "object" || value === null) return false;
  return (
    typeof Reflect.get(value, "id") === "string" &&
    typeof Reflect.get(value, "kind") === "string" &&
    typeof Reflect.get(value, "x") === "number"
  );
}

export async function listControls(
  session: Session,
  body: string,
): Promise<ControlInfo[]> {
  const value = await session.call(`return ${body};`);
  if (!Array.isArray(value)) return [];
  const items: unknown[] = value;
  return items.filter(isControlInfo);
}

export async function settle(session: Session): Promise<void> {
  await session.page.evaluate(SETTLE);
}

export async function moveTo(session: Session, point: unknown): Promise<void> {
  if (!Array.isArray(point)) return;
  const [x = 0, y = 0] = point.map(Number);
  await session.page.mouse.move(x, y);
}

export function isOver(session: Session): boolean {
  return Date.now() > session.deadline;
}

// Drops what pointing did not cause: no hover from a field, and a layout
// change that stays when the pointer moves away again (the page changed
// on its own, as a save status does).
interface Pointed {
  readonly control: ControlInfo;
  readonly rowId: string;
}

async function keepCausedByPointing(
  session: Session,
  pointed: Pointed,
  found: Problem[],
): Promise<Problem[]> {
  const { control, rowId } = pointed;
  let kept = control.isField
    ? found.filter((problem) => problem.check !== "no-hover-response")
    : found;
  if (!kept.some((problem) => problem.check === "hover-shifts-layout"))
    return kept;
  const id = text(control.id);
  await moveTo(
    session,
    await session.call(`return restPoint(${id}, ${text(rowId)});`),
  );
  await settle(session);
  const stays = await session.call(
    `return Boolean(movedMost(auditElement(${id})));`,
  );
  if (stays === true)
    kept = kept.filter((problem) => problem.check !== "hover-shifts-layout");
  await session.page.mouse.move(control.x, control.y);
  await settle(session);
  return kept;
}

// Points at the control, from a point of its row or a quiet corner, and
// judges its response and the layout, then the whole page in that state.
async function pointAt(session: Session, control: ControlInfo, rowId: string) {
  const id = text(control.id);
  await moveTo(
    session,
    await session.call(`return restPoint(${id}, ${text(rowId)});`),
  );
  await settle(session);
  if ((await session.call(`return rememberBefore(${id});`)) !== true) return;
  await session.page.mouse.move(control.x, control.y);
  await settle(session);
  session.state = `pointing at "${control.label}"`;
  const found = readProblems(
    await session.call(`return hoverProblems(${id});`),
  );
  const kept = await keepCausedByPointing(session, { control, rowId }, found);
  await session.record(kept, `point-${control.kind}`);
  await session.check(`point-${control.kind}`);
}

async function focusOn(session: Session, control: ControlInfo): Promise<void> {
  await session.page.keyboard.press("Shift");
  session.state = `focused "${control.label}"`;
  const found = await session.call(
    `return focusProblems(${text(control.id)});`,
  );
  await session.record(readProblems(found), `focus-${control.kind}`);
}

// One control of each kind not yet exercised, in the part with the given
// audit id or the whole page.
export async function sweepControls(
  session: Session,
  scopeId: string,
  rowId: string,
): Promise<void> {
  const controls = await listControls(
    session,
    `listControls(${text(scopeId)})`,
  );
  for (const control of controls) {
    if (isOver(session)) return;
    if (session.seen.has(control.kind)) continue;
    session.seen.add(control.kind);
    session.coverage.controls += 1;
    await pointAt(session, control, rowId);
    if (control.isFocusable) await focusOn(session, control);
  }
  session.state = "at rest";
}

// Each kind of row once: pointed at, judged (its handles among the rest),
// then its own controls swept while it stays pointed at.
export async function sweepRows(session: Session): Promise<void> {
  const rows = await listControls(session, "listRows()");
  for (const row of rows) {
    if (isOver(session)) return;
    if (session.seen.has(`row:${row.kind}`)) continue;
    session.seen.add(`row:${row.kind}`);
    await session.page.mouse.move(row.x, row.y);
    await settle(session);
    session.state = `pointing at the row "${row.label}"`;
    await session.check(`row-${row.kind}`);
    await sweepControls(session, row.id, row.id);
  }
  session.state = "at rest";
}
