// The report: each defect once, with how many elements share it, ranked by
// how much it hurts, pictured, and compared with the previous run.
import { readFile, writeFile } from "node:fs/promises";
import type { Coverage, Finding } from "./audit-session.ts";
import type { Problem } from "./page-elements.ts";

export interface Group {
  readonly key: string;
  readonly rank: number;
  readonly rule: string;
  readonly element: string;
  readonly place: string;
  readonly state: string;
  readonly detail: string;
  readonly picture: string;
  readonly count: number;
  readonly status: "new" | "still there";
}

// The same defect on many elements, or in many places, shares one key:
// its rule, the kind of element, and its detail without the numbers.
export function groupKey(problem: Problem): string {
  const detail = problem.detail.replace(/-?\d+(\.\d+)?/g, "N");
  return `${problem.check}|${problem.kind ?? problem.target}|${detail}`;
}

const FIRST = new Set([
  "behavior",
  "console-error",
  "page-error",
  "invisible-text",
  "not-closing",
  "stuck-state",
  "broken-image",
  "blank-icon",
  "overlay-offscreen",
  "zero-size-control",
  "handle-hidden",
]);
const LAST = new Set([
  "row-misaligned",
  "clipped",
  "no-hover-response",
  "pressable-not-control",
]);

export function rankOf(rule: string): number {
  if (FIRST.has(rule)) return 1;
  return LAST.has(rule) ? 3 : 2;
}

export function groupFindings(
  findings: readonly Finding[],
  previous: ReadonlySet<string>,
): Group[] {
  const groups = new Map<string, Group>();
  for (const finding of findings) {
    const key = groupKey(finding);
    const known = groups.get(key);
    if (known) {
      groups.set(key, {
        ...known,
        count: known.count + 1,
        picture: known.picture || (finding.picture ?? ""),
      });
      continue;
    }
    groups.set(key, {
      key,
      rank: rankOf(finding.check),
      rule: finding.check,
      element: finding.target,
      place: finding.place,
      state: finding.state,
      detail: finding.detail,
      picture: finding.picture ?? "",
      count: 1,
      status: previous.has(key) ? "still there" : "new",
    });
  }
  return [...groups.values()].sort(
    (a, b) => a.rank - b.rank || b.count - a.count,
  );
}

export async function readPrevious(file: URL): Promise<Group[]> {
  try {
    const parsed: unknown = JSON.parse(await readFile(file, "utf8"));
    if (!Array.isArray(parsed)) return [];
    const items: unknown[] = parsed;
    return items.filter(isGroup);
  } catch {
    return [];
  }
}

function isGroup(value: unknown): value is Group {
  if (typeof value !== "object" || value === null) return false;
  return ["key", "rule", "element", "detail"].every(
    (field) => typeof Reflect.get(value, field) === "string",
  );
}

const cell = (text: string) => text.replace(/\|/g, "\\|").replace(/\s+/g, " ");

function rowOf(group: Group): string {
  const picture = group.picture ? `[picture](${group.picture})` : "";
  return `| ${String(group.rank)} | ${group.status} | ${group.rule} | ${cell(group.element)} | ${cell(group.place)} | ${cell(group.state)} | ${cell(group.detail)} | ${String(group.count)} | ${picture} |`;
}

export interface Summary {
  readonly groups: readonly Group[];
  readonly fixed: readonly Group[];
  readonly coverage: Coverage;
  readonly seconds: number;
}

export function reportText(summary: Summary): string {
  const { groups, fixed, coverage } = summary;
  return [
    `# Interface audit: ${String(groups.length)} found, ${String(fixed.length)} fixed`,
    "",
    `Judged ${String(coverage.places)} places, ${String(coverage.controls)} kinds of controls, ${String(coverage.surfaces)} surfaces and ${String(coverage.states)} states in ${summary.seconds.toFixed(0)} s.`,
    "",
    "| Rank | Status | Rule | Element | Place | State | Detail | Count | Picture |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...groups.map(rowOf),
    "",
    ...(fixed.length > 0
      ? [
          "## Fixed since the last run",
          "",
          ...fixed.map(
            (group) =>
              `- ${group.rule}: ${cell(group.element)} (${cell(group.detail)})`,
          ),
          "",
        ]
      : []),
  ].join("\n");
}

export async function writeReport(
  folder: URL,
  summary: Summary,
): Promise<string> {
  const text = reportText(summary);
  await writeFile(new URL("report.md", folder), text);
  await writeFile(
    new URL("findings.json", folder),
    JSON.stringify(summary.groups, null, 2),
  );
  return text;
}
