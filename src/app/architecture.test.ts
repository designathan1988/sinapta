// Fitness tests for the rules lint cannot see: they read the source tree
// and fail when a rule of CLAUDE.md or the specification is broken.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function listFiles(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = join(folder, entry.name);
    return entry.isDirectory() ? [path, ...listFiles(path)] : [path];
  });
}

const PATHS = listFiles(SRC);
const SOURCES = PATHS.filter((path) => path.endsWith(".ts"));

function fromSrc(path: string): string {
  return relative(SRC, path).split(sep).join("/");
}

function read(path: string): string {
  return readFileSync(path, "utf8");
}

const TIMERS =
  /\b(setTimeout|setInterval|queueMicrotask|requestAnimationFrame)\s*\(/;
const KEY_LISTENER = 'document.addEventListener("keydown"';
const KEY_OWNERS = [
  "app/bootstrap.ts",
  "ui/drag/pointer-drag.ts",
  "ui/shortcuts/scoped-keys.ts",
];
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const BANNED = new Set(["utils", "helpers", "common", "shared", "misc", "lib"]);
const IMPORT = /from "(\.{1,2}\/[^"]+)"/g;

function importsOf(path: string): string[] {
  return [...read(path).matchAll(IMPORT)].flatMap((match) =>
    match[1] === undefined ? [] : [match[1]],
  );
}

// The top-level folder of a path under src/, such as "features".
function layerOf(pathFromSrc: string): string {
  return pathFromSrc.split("/")[0] ?? "";
}

describe("architecture", () => {
  it("keeps timers out of views", () => {
    const offenders = SOURCES.filter(
      (path) => path.endsWith(".view.ts") && TIMERS.test(read(path)),
    ).map(fromSrc);
    expect(offenders).toEqual([]);
  });

  it("listens for keys on the document only in the shortcut owners", () => {
    const listeners = SOURCES.filter(
      (path) => !path.endsWith(".test.ts") && read(path).includes(KEY_LISTENER),
    ).map(fromSrc);
    expect(listeners.sort()).toEqual(KEY_OWNERS);
  });

  it("names every file and folder in kebab case", () => {
    const offenders = PATHS.map(fromSrc).filter((path) => {
      const name = path.split("/").at(-1) ?? "";
      return !KEBAB.test(name.split(".")[0] ?? "");
    });
    expect(offenders).toEqual([]);
  });

  it("uses no banned file or folder names", () => {
    const offenders = PATHS.map(fromSrc).filter((path) =>
      path
        .split("/")
        .some((segment) => BANNED.has(segment.split(".")[0] ?? "")),
    );
    expect(offenders).toEqual([]);
  });

  it("reaches another top-level folder only through an index", () => {
    const offenders = SOURCES.flatMap((path) => {
      const from = fromSrc(path);
      return importsOf(path).flatMap((specifier) => {
        const target = fromSrc(resolve(dirname(path), specifier));
        const isOtherLayer = layerOf(target) !== layerOf(from);
        const isEntry = target.endsWith("/index.ts") || target === "ui/copy.ts";
        return isOtherLayer && !isEntry ? [`${from} -> ${target}`] : [];
      });
    });
    expect(offenders).toEqual([]);
  });
});
