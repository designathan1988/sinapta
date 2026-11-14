// The source the inventory reads, as it is on disk right now: every
// TypeScript file of src/ and server/, each with the part of the app it
// belongs to (a feature, a block type, a ui part, a layer, the server).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface SourceFile {
  readonly path: string;
  readonly text: string;
  readonly module: string;
  readonly isTest: boolean;
}

// "src/features/sidebar/x.ts" → "features/sidebar";
// "src/features/database/view-settings/x.ts" → "features/database/view-settings";
// "src/blocks/x.ts" → "blocks"; "src/state/x.ts" → "state"; "server/…" → "server".
export function moduleOf(path: string): string {
  const parts = path.replaceAll("\\", "/").split("/");
  if (parts[0] === "server") return "server";
  const [, layer = "", folder = "", inner, deeper] = parts;
  if (layer.endsWith(".ts")) return "src";
  if (inner === undefined) return layer;
  if (!["features", "blocks", "ui"].includes(layer)) return layer;
  return deeper === undefined
    ? `${layer}/${folder}`
    : `${layer}/${folder}/${inner}`;
}

export function readSources(root: string): SourceFile[] {
  const files: SourceFile[] = [];
  for (const top of ["src", "server"]) {
    const names = readdirSync(join(root, top), { recursive: true });
    for (const name of names) {
      if (typeof name !== "string" || !name.endsWith(".ts")) continue;
      const path = `${top}/${name.replaceAll("\\", "/")}`;
      files.push({
        path,
        text: readFileSync(join(root, path), "utf8"),
        module: moduleOf(path),
        isTest: path.endsWith(".test.ts"),
      });
    }
  }
  return files;
}
