// One audit run: the page under test, what was found, and the pictures of
// the moments it was checked. Checks run inside the page; behaviors are
// asserted from here, after real clicks and keys.
import { fileURLToPath } from "node:url";
import type { Page } from "playwright-core";
import * as blockChecks from "./page-checks-blocks.ts";
import * as pageChecks from "./page-checks.ts";
import type { Problem } from "./page-checks.ts";

export interface Finding extends Problem {
  readonly step: string;
}

export interface Session {
  readonly page: Page;
  readonly findings: Finding[];
  // Checks the page as it is now; its picture is kept always, or only
  // when something is wrong.
  check: (step: string, picture?: "always" | "on-problem") => Promise<void>;
  // Records a behavior that did not happen as it should.
  expect: (isTrue: boolean, step: string, detail: string) => void;
}

const isFunction = (value: unknown): value is (...args: never[]) => unknown =>
  typeof value === "function";

// The checks by their source: Node strips the types, leaving plain
// script that the page can run.
const SOURCE = [pageChecks, blockChecks]
  .flatMap((module): unknown[] => Object.values(module))
  .filter(isFunction)
  .map((check) => check.toString())
  .join("\n");

const CHECKS = [
  "overflowProblems",
  "overlayProblems",
  "clippedProblems",
  "overlapProblems",
  "contrastProblems",
  "handleProblems",
  "wrapProblems",
];

const RUN = `(() => {\n${SOURCE}\nreturn [${CHECKS.join(", ")}].flatMap((check) => check());\n})()`;

function isProblem(value: unknown): value is Problem {
  if (typeof value !== "object" || value === null) return false;
  return ["check", "target", "detail"].every(
    (key) => typeof Reflect.get(value, key) === "string",
  );
}

function readProblems(value: unknown): Problem[] {
  if (!Array.isArray(value)) return [];
  const items: unknown[] = value;
  return items.filter(isProblem);
}

// Waits for the page's finite animations, such as a panel sliding in, so
// that what is checked is where it comes to rest; at most a second.
const SETTLE = `Promise.race([
  Promise.all(document.getAnimations()
    .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
    .map((animation) => animation.finished.catch(() => undefined))),
  new Promise((done) => setTimeout(done, 1000)),
])`;

// A session's pictures and findings are named by the theme it runs in.
export function createSession(page: Page, folder: URL, theme: string): Session {
  const findings: Finding[] = [];
  let count = 0;
  const check = async (step: string, picture = "always"): Promise<void> => {
    count += 1;
    const name = `${theme}-${String(count).padStart(3, "0")}-${step}`;
    await page.evaluate(SETTLE);
    const found = readProblems(await page.evaluate(RUN));
    findings.push(...found.map((problem) => ({ ...problem, step: name })));
    if (picture === "always" || found.length > 0) {
      const path = fileURLToPath(new URL(`${name}.png`, folder));
      await page.screenshot({ path });
    }
  };
  const expect = (isTrue: boolean, step: string, detail: string): void => {
    if (!isTrue)
      findings.push({ check: "behavior", target: step, detail, step });
  };
  return { page, findings, check, expect };
}
