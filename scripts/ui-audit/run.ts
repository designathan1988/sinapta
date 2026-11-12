// The interface audit: opens the app in a fresh, headless Google Chrome at
// 1440x900 @2x, in the light theme and then the dark, uses it as a person
// would and checks every moment for broken layout and behavior. Run with `npm run audit:ui` while the app is
// served (UI_AUDIT_URL, default http://localhost:5190/). Pictures and the
// report land in .ui-audit/; the exit code is 1 when anything was found.
import { mkdir, rm, writeFile } from "node:fs/promises";
import { chromium, type Browser, type Page } from "playwright-core";
import { createSession, type Finding, type Session } from "./audit-session.ts";
import { BLOCK_SCENARIOS } from "./scenarios-blocks.ts";
import { DATABASE_SCENARIOS } from "./scenarios-database.ts";
import { EDITOR_SCENARIOS } from "./scenarios-editor.ts";
import { SHELL_SCENARIOS } from "./scenarios-shell.ts";

const BASE = process.env.UI_AUDIT_URL ?? "http://localhost:5190/";
const FOLDER = new URL("../../.ui-audit/", import.meta.url);
const SCENARIOS = [
  ...EDITOR_SCENARIOS,
  ...SHELL_SCENARIOS,
  ...BLOCK_SCENARIOS,
  ...DATABASE_SCENARIOS,
];

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

async function runAll(session: Session): Promise<void> {
  for (const scenario of SCENARIOS) {
    try {
      await scenario.run(session);
    } catch (error) {
      const reason = String(error).split("\n")[0] ?? "";
      session.expect(false, scenario.name, `stopped: ${reason}`);
      await session.page.keyboard.press("Escape");
    }
  }
}

function report(findings: readonly Finding[]): string {
  const lines = findings.map(
    (finding) =>
      `| ${finding.step} | ${finding.check} | ${finding.target} | ${finding.detail} |`,
  );
  return [
    `# Interface audit: ${String(findings.length)} found`,
    "",
    "| Step | Check | Element | What is wrong |",
    "| --- | --- | --- | --- |",
    ...lines,
    "",
  ].join("\n");
}

// Every scenario in a fresh workspace, in one theme.
async function auditTheme(
  browser: Browser,
  theme: "light" | "dark",
): Promise<Finding[]> {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: theme,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  const session = createSession(page, FOLDER, theme);
  watchErrors(page, session);
  await page.goto(BASE);
  await page.locator(".app__page .editor").waitFor();
  await runAll(session);
  await context.close();
  return session.findings;
}

async function audit(): Promise<Finding[]> {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const light = await auditTheme(browser, "light");
    const dark = await auditTheme(browser, "dark");
    return [...light, ...dark];
  } finally {
    await browser.close();
  }
}

async function main(): Promise<void> {
  if (!(await isServed())) {
    console.error(`No app answers at ${BASE}. Serve it first: npm run dev`);
    process.exitCode = 2;
    return;
  }
  await rm(FOLDER, { recursive: true, force: true });
  await mkdir(FOLDER, { recursive: true });
  const findings = await audit();
  const text = report(findings);
  await writeFile(new URL("report.md", FOLDER), text);
  console.log(text);
  process.exitCode = findings.length > 0 ? 1 : 0;
}

await main();
