// Proves the audit catches what it must and nothing else: sweeps
// fixtures/defects.html, where every case is marked with the rule it
// breaks or "none", and fails on any broken case not reported under its
// rule and on any report about a correct case. Needs Chrome, not the app.
// Run with `npm run audit:ui:self-test`.
import { mkdir, rm } from "node:fs/promises";
import { chromium, type Page } from "playwright-core";
import { createSession, type Finding } from "./audit-session.ts";
import { sweepControls, sweepRows } from "./sweep-controls.ts";
import { openEach } from "./sweep-surfaces.ts";

const FIXTURE = new URL("./fixtures/defects.html", import.meta.url);
const FOLDER = new URL("../../.ui-audit/self-test/", import.meta.url);

// The fixture's cases: each marked element's id and the rule it breaks,
// or "none".
async function casesOf(page: Page): Promise<string[][]> {
  const value: unknown = await page.evaluate(() =>
    [...document.querySelectorAll("[data-expect]")].map((element) => [
      element.id,
      element.getAttribute("data-expect") ?? "",
    ]),
  );
  if (!Array.isArray(value)) return [];
  const items: unknown[] = value;
  return items.map((item) => (Array.isArray(item) ? item.map(String) : []));
}

async function openFixture(page: Page): Promise<void> {
  page.setDefaultTimeout(5000);
  // The fixture's missing picture would hold up the load event.
  await page.goto(FIXTURE.href, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() =>
    [...document.images].every((image) => image.complete),
  );
}

async function sweepFixture(): Promise<{
  findings: Finding[];
  cases: string[][];
}> {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await openFixture(page);
    const setup = { page, folder: FOLDER, label: "self-test", seconds: 60 };
    const session = createSession(setup);
    session.place = "fixture";
    await session.check("at-rest");
    await sweepRows(session);
    await sweepControls(session, "", "");
    await openEach(session, "");
    return { findings: session.findings, cases: await casesOf(page) };
  } finally {
    await browser.close();
  }
}

// The rules reported on each case, by its id; "" for findings outside
// every case.
function rulesByCase(findings: readonly Finding[]): Map<string, Set<string>> {
  const rules = new Map<string, Set<string>>();
  for (const finding of findings) {
    const marker = finding.marker ?? "";
    const known = rules.get(marker) ?? new Set<string>();
    known.add(finding.check);
    rules.set(marker, known);
  }
  return rules;
}

// What went wrong on one case: a broken case not reported under its
// rule, or a correct case reported at all.
function caseError(rule: string, id: string, found: ReadonlySet<string>) {
  const names = [...found].join(", ");
  if (rule === "none")
    return found.size > 0
      ? `false finding on correct case #${id}: ${names}`
      : "";
  if (found.has(rule)) return "";
  return `missed ${rule} on #${id}${found.size > 0 ? ` (found ${names})` : ""}`;
}

function judge(
  findings: readonly Finding[],
  cases: readonly string[][],
): string[] {
  const rules = rulesByCase(findings);
  const errors = cases
    .map(([id = "", rule = ""]) =>
      caseError(rule, id, rules.get(id) ?? new Set()),
    )
    .filter(Boolean);
  const stray = findings
    .filter((item) => !item.marker)
    .map(
      (item) =>
        `finding outside every case: ${item.check} on ${item.target}: ${item.detail}`,
    );
  return [...errors, ...stray];
}

async function main(): Promise<void> {
  const started = Date.now();
  await rm(FOLDER, { recursive: true, force: true });
  await mkdir(FOLDER, { recursive: true });
  const { findings, cases } = await sweepFixture();
  const errors = judge(findings, cases);
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  const broken = cases.filter(([, rule]) => rule !== "none").length;
  console.log(
    `Self-test: ${String(cases.length)} cases (${String(broken)} broken) in ${seconds} s`,
  );
  for (const error of errors) console.log(`  ✗ ${error}`);
  console.log(
    errors.length === 0
      ? "  ✓ every broken case found, no false finding"
      : `  ${String(errors.length)} problems`,
  );
  process.exitCode = errors.length === 0 ? 0 : 1;
}

await main();
