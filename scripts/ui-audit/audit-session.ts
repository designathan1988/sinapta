// One audit run in one theme and width: the page under test, where the
// audit is in it, what was found, and a picture of each defect. Rules run
// inside the page; behaviors are asserted from here, after real clicks and
// keys.
import { fileURLToPath } from "node:url";
import type { Page } from "playwright-core";
import * as blockChecks from "./page-checks-blocks.ts";
import * as drawingChecks from "./page-checks-drawing.ts";
import * as pageChecks from "./page-checks.ts";
import * as discover from "./page-discover.ts";
import * as elements from "./page-elements.ts";
import type { Problem } from "./page-elements.ts";
import * as signature from "./page-signature.ts";
import { groupKey } from "./report.ts";

export interface Finding extends Problem {
  readonly step: string;
  readonly place: string;
  readonly state: string;
  readonly picture?: string;
}

export interface Coverage {
  places: number;
  controls: number;
  surfaces: number;
  states: number;
}

export interface Session {
  readonly page: Page;
  readonly label: string;
  readonly findings: Finding[];
  // Kinds of controls, rows and surfaces already exercised in this run.
  readonly seen: Set<string>;
  readonly coverage: Coverage;
  readonly deadline: number;
  place: string;
  state: string;
  // Checks the page as it is now; a full picture is kept when asked.
  check: (step: string, picture?: "always" | "on-problem") => Promise<void>;
  // Records problems found by the runner, cropping a picture of each.
  record: (problems: readonly Problem[], step: string) => Promise<void>;
  // Records a behavior that did not happen as it should.
  expect: (isTrue: boolean, step: string, detail: string) => void;
  // Runs a page-side expression with every page-side function at hand.
  call: (expression: string) => Promise<unknown>;
}

export const PAGE_MODULES = [
  elements,
  pageChecks,
  blockChecks,
  drawingChecks,
  signature,
  discover,
];

const isFunction = (value: unknown): value is (...args: never[]) => unknown =>
  typeof value === "function";

// The page-side functions by their source: Node strips the types, leaving
// plain script that the page can run.
const SOURCE = PAGE_MODULES.flatMap((module): unknown[] =>
  Object.values(module),
)
  .filter(isFunction)
  .map((check) => check.toString())
  .join("\n");

const RULES = [
  "overflowProblems",
  "overlayProblems",
  "clippedProblems",
  "overlapProblems",
  "contrastProblems",
  "handleProblems",
  "wrapProblems",
  "blankIconProblems",
  "brokenImageProblems",
  "rowAlignmentProblems",
  "textOverflowProblems",
  "pressableProblems",
  "zeroSizeProblems",
];

const RULES_RUN = `Reflect.set(window, "__auditShown", shownSet());
try { return [${RULES.join(", ")}].flatMap((rule) => rule()); }
finally { Reflect.set(window, "__auditShown", undefined); }`;

export function pageCall(page: Page, body: string): Promise<unknown> {
  return page.evaluate(`(() => {\n${SOURCE}\n${body}\n})()`);
}

export function runPageChecks(page: Page): Promise<Problem[]> {
  return pageCall(page, RULES_RUN).then(readProblems);
}

function isProblem(value: unknown): value is Problem {
  if (typeof value !== "object" || value === null) return false;
  return ["check", "target", "detail"].every(
    (key) => typeof Reflect.get(value, key) === "string",
  );
}

export function readProblems(value: unknown): Problem[] {
  if (!Array.isArray(value)) return [];
  const items: unknown[] = value;
  return items.filter(isProblem);
}

// Waits for the page's finite animations, such as a panel sliding in, so
// that what is checked is where it comes to rest; at most a second.
export const SETTLE = `Promise.race([
  Promise.all(document.getAnimations()
    .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
    .map((animation) => animation.finished.catch(() => undefined))),
  new Promise((done) => setTimeout(done, 1000)),
])`;

// The element's box with some of its surroundings, inside the window.
function clipOf(problem: Problem, page: Page) {
  const size = page.viewportSize() ?? { width: 1440, height: 900 };
  const box = problem.box ?? {
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
  };
  const x = Math.max(0, box.x - 24);
  const y = Math.max(0, box.y - 24);
  const width = Math.min(size.width - x, box.width + 48);
  const height = Math.min(size.height - y, box.height + 48);
  return width >= 1 && height >= 1 ? { x, y, width, height } : undefined;
}

export interface SessionSetup {
  readonly page: Page;
  readonly folder: URL;
  readonly label: string;
  readonly seconds: number;
}

// Takes a picture of each defect the first time it is met, named after
// the run and the rule; the name of the picture, if one was taken.
function pictureTaker(setup: SessionSetup) {
  const pictured = new Set<string>();
  let count = 0;
  return async (problem: Problem): Promise<string | undefined> => {
    const key = groupKey(problem);
    const clip = pictured.has(key) ? undefined : clipOf(problem, setup.page);
    if (!clip) return undefined;
    count += 1;
    pictured.add(key);
    const name = `${setup.label}-${String(count).padStart(3, "0")}-${problem.check}.png`;
    await setup.page.screenshot({
      path: fileURLToPath(new URL(name, setup.folder)),
      clip,
    });
    return name;
  };
}

function recorder(session: Session, setup: SessionSetup): Session["record"] {
  const takePicture = pictureTaker(setup);
  return async (problems, step) => {
    for (const problem of problems) {
      const picture = await takePicture(problem);
      const where = { step, place: session.place, state: session.state };
      session.findings.push({
        ...problem,
        ...where,
        ...(picture && { picture }),
      });
    }
  };
}

function checker(session: Session, setup: SessionSetup): Session["check"] {
  return async (step, picture = "on-problem") => {
    session.coverage.states += 1;
    await setup.page.evaluate(SETTLE);
    await session.record(await runPageChecks(setup.page), step);
    if (picture !== "always") return;
    const path = fileURLToPath(
      new URL(`${setup.label}-${step}.png`, setup.folder),
    );
    await setup.page.screenshot({ path });
  };
}

export function createSession(setup: SessionSetup): Session {
  const { page, label } = setup;
  const session: Session = {
    page,
    label,
    findings: [],
    seen: new Set(),
    place: "start",
    state: "at rest",
    deadline: Date.now() + setup.seconds * 1000,
    coverage: { places: 0, controls: 0, surfaces: 0, states: 0 },
    call: (body) => pageCall(page, body),
    record: () => Promise.resolve(),
    check: () => Promise.resolve(),
    expect: (isTrue, step, detail) => {
      if (isTrue) return;
      const where = { step, place: session.place, state: session.state };
      session.findings.push({
        check: "behavior",
        target: step,
        detail,
        kind: step,
        ...where,
      });
    },
  };
  session.record = recorder(session, setup);
  session.check = checker(session, setup);
  return session;
}
