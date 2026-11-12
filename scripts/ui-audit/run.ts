// The interface audit: opens the served app in fresh, headless Google
// Chrome profiles and uses it as a person would. In light and dark at
// 1440x900 it runs the scripted scenarios, then sweeps every place by
// itself; at 1024x768 it sweeps again, judging every place and surface.
// Run with `npm run audit:ui` (UI_AUDIT_URL, default
// http://localhost:5190/; UI_AUDIT_ONLY narrows it, see
// specs/001-auto-ui-audit/contracts/cli.md). Pictures and the report land
// in .ui-audit/; the exit code is 1 when anything was found.
import { mkdir, readdir, rm } from "node:fs/promises";
import { chromium, type Browser, type Page } from "playwright-core";
import { createSession, type Session } from "./audit-session.ts";
import { groupFindings, readPrevious, writeReport } from "./report.ts";
import { BLOCK_SCENARIOS } from "./scenarios-blocks.ts";
import { DATABASE_SCENARIOS } from "./scenarios-database.ts";
import { EDITOR_SCENARIOS } from "./scenarios-editor.ts";
import { SHELL_SCENARIOS } from "./scenarios-shell.ts";
import { sweepApp, type SweepMode } from "./sweep-places.ts";

const BASE = process.env.UI_AUDIT_URL ?? "http://localhost:5190/";
const ONLY = (process.env.UI_AUDIT_ONLY ?? "").split(",").filter(Boolean);
const FOLDER = new URL("../../.ui-audit/", import.meta.url);
const SCENARIOS = [
  ...EDITOR_SCENARIOS,
  ...SHELL_SCENARIOS,
  ...BLOCK_SCENARIOS,
  ...DATABASE_SCENARIOS,
];

interface Run {
  readonly label: string;
  readonly theme: "light" | "dark";
  readonly width: number;
  readonly height: number;
  readonly mode: SweepMode;
  readonly seconds: number;
}

const RUNS: readonly Run[] = [
  {
    label: "light",
    theme: "light",
    width: 1440,
    height: 900,
    mode: "full",
    seconds: 40,
  },
  {
    label: "dark",
    theme: "dark",
    width: 1440,
    height: 900,
    mode: "full",
    seconds: 35,
  },
  {
    label: "narrow",
    theme: "light",
    width: 1024,
    height: 768,
    mode: "narrow",
    seconds: 15,
  },
];

const allows = (...words: string[]) =>
  ONLY.length === 0 || words.some((word) => ONLY.includes(word));

async function isServed(): Promise<boolean> {
  try {
    return (await fetch(BASE)).ok;
  } catch {
    return false;
  }
}

// Errors the page throws or logs are findings too.
function watchErrors(page: Page, session: Session): void {
  page.on("pageerror", (error) => {
    session.expect(false, "page-error", error.message);
  });
  page.on("console", (message) => {
    if (message.type() === "error")
      session.expect(false, "console-error", message.text());
  });
}

async function runScenarios(session: Session): Promise<void> {
  for (const scenario of SCENARIOS) {
    session.place = `${session.label} · scenario ${scenario.name}`;
    try {
      await scenario.run(session);
    } catch (error) {
      const reason = String(error).split("\n")[0] ?? "";
      session.expect(false, scenario.name, `stopped: ${reason}`);
      await session.page.keyboard.press("Escape");
    }
  }
}

async function auditRun(browser: Browser, run: Run): Promise<Session> {
  const context = await browser.newContext({
    viewport: { width: run.width, height: run.height },
    deviceScaleFactor: 2,
    colorScheme: run.theme,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  const session = createSession({
    page,
    folder: FOLDER,
    label: run.label,
    seconds: run.seconds,
  });
  watchErrors(page, session);
  try {
    // A dev server may still be compiling a change: the first load waits.
    await page.goto(BASE, { timeout: 30_000 });
    await page.locator(".app__page .editor").waitFor({ timeout: 30_000 });
    if (run.mode === "full" && allows("scenarios")) await runScenarios(session);
    if (allows("sweep")) await sweepApp(session, run.mode);
  } catch (error) {
    const reason = String(error).split("\n")[0] ?? "";
    session.expect(false, "load", `the run stopped: ${reason}`);
  }
  await context.close();
  return session;
}

async function auditAll(): Promise<Session[]> {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const sessions: Session[] = [];
    for (const run of RUNS) {
      const width = run.mode === "full" ? "desktop" : "narrow";
      if (allows(run.theme) && allows(width))
        sessions.push(await auditRun(browser, run));
    }
    return sessions;
  } finally {
    await browser.close();
  }
}

async function clearPictures(): Promise<void> {
  await mkdir(FOLDER, { recursive: true });
  for (const name of await readdir(FOLDER)) {
    if (name !== "findings.json")
      await rm(new URL(name, FOLDER), { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  if (!(await isServed())) {
    console.error(`No app answers at ${BASE}. Serve it first: npm run dev`);
    process.exitCode = 2;
    return;
  }
  const started = Date.now();
  await clearPictures();
  const previous = await readPrevious(new URL("findings.json", FOLDER));
  const sessions = await auditAll();
  const groups = groupFindings(
    sessions.flatMap((s) => s.findings),
    new Set(previous.map((g) => g.key)),
  );
  const current = new Set(groups.map((group) => group.key));
  const coverage = sessions.reduce(
    (sum, s) => ({
      places: sum.places + s.coverage.places,
      controls: sum.controls + s.coverage.controls,
      surfaces: sum.surfaces + s.coverage.surfaces,
      states: sum.states + s.coverage.states,
    }),
    { places: 0, controls: 0, surfaces: 0, states: 0 },
  );
  const fixed = previous.filter((group) => !current.has(group.key));
  const seconds = (Date.now() - started) / 1000;
  console.log(await writeReport(FOLDER, { groups, fixed, coverage, seconds }));
  process.exitCode = groups.length > 0 ? 1 : 0;
}

await main();
