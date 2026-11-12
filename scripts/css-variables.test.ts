import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Every custom property a style sheet reads is defined: by the tokens, by
// a style sheet, or by the code that sets it. A misspelled or missing one
// draws nothing and goes unnoticed.
const SOURCE = "src";
const DEFINITION = /(--[a-z0-9-]+)\s*:/g;
const USE = /var\((--[a-z0-9-]+)/g;
const SET_IN_CODE = /["`'](--[a-z0-9-]+)["`']/g;

function files(folder: string, extension: string): string[] {
  return readdirSync(folder, { recursive: true, encoding: "utf8" })
    .filter((path) => path.endsWith(extension))
    .map((path) => join(folder, path));
}

function names(paths: readonly string[], pattern: RegExp): Set<string> {
  const found = new Set<string>();
  for (const path of paths) {
    for (const match of readFileSync(path, "utf8").matchAll(pattern)) {
      if (match[1] !== undefined) found.add(match[1]);
    }
  }
  return found;
}

describe("the style sheets", () => {
  it("read only custom properties that something defines", () => {
    const sheets = files(SOURCE, ".css");
    const defined = new Set([
      ...names(sheets, DEFINITION),
      ...names(files(SOURCE, ".ts"), SET_IN_CODE),
    ]);
    const missing = sheets.flatMap((path) =>
      [...names([path], USE)]
        .filter((name) => !defined.has(name))
        .map((name) => `${name} in ${path}`),
    );

    expect(missing).toEqual([]);
  });
});
