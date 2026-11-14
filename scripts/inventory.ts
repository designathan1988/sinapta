// What the app lets a person do, read from the code as it is right now
// (about a second): every part of the app with its controls, menu
// entries, events, keys, drags, commands, announcements and server
// paths, the global shortcuts, and the routes the server answers.
//
//   npm run inventory                 one line per part of the app
//   npm run inventory -- sidebar      everything about matching parts
//   npm run inventory -- all          everything about every part
import { readFileSync } from "node:fs";
import * as code from "./inventory-code.ts";
import { readSources, type SourceFile } from "./inventory-source.ts";
import { controlsIn, type Control } from "./inventory-templates.ts";
import { copyText, shortcutLines } from "./inventory-text.ts";

interface Part {
  readonly name: string;
  readonly files: SourceFile[];
  readonly tests: number;
}

function partsOf(files: readonly SourceFile[]): Part[] {
  const byName = new Map<string, SourceFile[]>();
  for (const file of files) {
    byName.set(file.module, [...(byName.get(file.module) ?? []), file]);
  }
  return [...byName.entries()]
    .map(([name, all]) => ({
      name,
      files: all.filter((file) => !file.isTest),
      tests: all.filter((file) => file.isTest).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const each = <T>(part: Part, read: (file: SourceFile) => T[]): T[] =>
  part.files.flatMap(read);
const joined = (values: string[]): string =>
  [...new Set(values)].sort().join(", ");

function controlLine(control: Control, copy: (path: string) => string): string {
  const label = control.label === undefined ? "" : ` "${copy(control.label)}"`;
  const attrs =
    control.attrs.length === 0 ? "" : ` [${control.attrs.join(" ")}]`;
  const events =
    control.events.length === 0 ? "" : ` — ${control.events.join(", ")}`;
  const file = control.file.split("/").pop() ?? "";
  return `- ${control.tag}${control.kind === "" ? "" : "." + control.kind}${attrs}${label}${events} (${file})`;
}

function section(title: string, values: string[]): string[] {
  return values.length === 0 ? [] : [`${title}: ${joined(values)}`];
}

// The facts beside the controls, one line each, read from every file.
function facts(part: Part, names: Map<string, string>): [string, string[]][] {
  return [
    ["DOM events listened to", each(part, (f) => code.domEvents(f.text))],
    ["Keys handled", each(part, (f) => code.keysHandled(f.text))],
    ["Drag, drop, paste, wheel", each(part, (f) => code.dragKinds(f.text))],
    [
      "Commands dispatched",
      each(part, (f) => code.commandsUsed(f.text, names)),
    ],
    ["Server paths called", each(part, (f) => code.apiCalls(f.text))],
    ["Server routes", each(part, (f) => code.serverRoutes(f.text))],
  ];
}

function detail(
  part: Part,
  names: Map<string, string>,
  copy: (p: string) => string,
): string[] {
  const controls = each(part, (f) => controlsIn(f.text, f.path));
  const labels = each(part, (f) => code.listedLabels(f.text)).map(copy);
  const said = each(part, (f) => code.announced(f.text)).map(copy);
  const quoted = (values: string[]) => values.map((v) => `"${v}"`);
  return [
    `## ${part.name} — ${String(part.files.length)} files, ${String(part.tests)} tests`,
    `Controls (${String(controls.length)}):`,
    ...controls.map((c) => controlLine(c, copy)),
    ...section("Menu and list entries", quoted(labels)),
    ...section("Announces", quoted(said)),
    ...facts(part, names).flatMap(([title, values]) => section(title, values)),
    "",
  ];
}

function summary(part: Part, names: Map<string, string>): string {
  const controls = each(part, (f) => controlsIn(f.text, f.path)).length;
  const commands = new Set(each(part, (f) => code.commandsUsed(f.text, names)))
    .size;
  const keys = new Set(each(part, (f) => code.keysHandled(f.text))).size;
  const drags = joined(each(part, (f) => code.dragKinds(f.text)));
  return `| ${part.name} | ${String(controls)} | ${String(commands)} | ${String(keys)} | ${drags} | ${String(part.tests)} |`;
}

// Headings of docs/notion-study.md that name the asked part.
function studyHeadings(words: string[]): string[] {
  const study = readFileSync("docs/notion-study.md", "utf8").split("\n");
  return study.filter(
    (line) =>
      line.startsWith("#") && words.some((w) => line.toLowerCase().includes(w)),
  );
}

const started = performance.now();
const words = process.argv.slice(2).map((word) => word.toLowerCase());
const files = readSources(".");
const names = code.commandNames(files);
const copy = await copyText();
const parts = partsOf(files);
if (words.length === 0) {
  console.log(
    "| part | controls | commands | keys | drag, drop, paste, wheel | tests |",
  );
  console.log("| --- | --- | --- | --- | --- | --- |");
  for (const part of parts) console.log(summary(part, names));
  console.log(["", "Global shortcuts:", ...(await shortcutLines())].join("\n"));
} else {
  const all = words.includes("all");
  const chosen = parts.filter(
    (p) => all || words.some((w) => p.name.toLowerCase().includes(w)),
  );
  for (const part of chosen) console.log(detail(part, names, copy).join("\n"));
  const users = parts.filter(
    (p) => !chosen.includes(p) && chosen.some((c) => usesPart(p, c)),
  );
  console.log(
    `Used by: ${users.map((p) => p.name).join(", ") || "nothing else"}`,
  );
  console.log(
    ["Also mentioned in:", ...mentions(parts, chosen, words)].join("\n"),
  );
  console.log(["Notion study:", ...studyHeadings(words)].join("\n"));
}
const ms = Math.round(performance.now() - started);
console.log(`\nRead ${String(files.length)} files in ${String(ms)} ms.`);

function mentionCount(text: string, found: RegExp[]): number {
  return found.reduce((sum, re) => sum + (text.match(re)?.length ?? 0), 0);
}

// Other parts that name the asked words as whole words (a block's keys
// live in the editor, its menu entry in the slash menu, its export in the
// Markdown export), the files with the most mentions first.
function mentions(all: Part[], chosen: Part[], asked: string[]): string[] {
  const found = asked
    .filter((word) => word !== "all")
    .map((word) => new RegExp(`\\b${word}\\b`, "gi"));
  if (found.length === 0) return [];
  const lines = all
    .filter((part) => !chosen.includes(part))
    .map((part) => {
      const files = part.files
        .map((file) => ({ file, count: mentionCount(file.text, found) }))
        .filter((entry) => entry.count > 0)
        .sort((a, b) => b.count - a.count);
      const total = files.reduce((sum, entry) => sum + entry.count, 0);
      const top = files
        .slice(0, 4)
        .map(
          (e) => `${e.file.path.split("/").pop() ?? ""} (${String(e.count)})`,
        );
      return { total, line: `- ${part.name}: ${top.join(", ")}` };
    })
    .filter((entry) => entry.total > 0)
    .sort((a, b) => b.total - a.total);
  return lines.slice(0, 12).map((entry) => entry.line);
}

function usesPart(user: Part, used: Part): boolean {
  const folder = `/${used.name.split("/").pop() ?? ""}/`;
  return user.files.some((file) => file.text.includes(`${folder}index.ts"`));
}
