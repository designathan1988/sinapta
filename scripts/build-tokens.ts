// Reads tokens/*.tokens.json and writes src/styles/tokens.generated.css.
// Run with `npm run tokens`; the Vite plugin calls buildTokens on change.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { buildTokenCss, type TokenCssResult } from "./token-css.ts";

const ROOT = new URL("../", import.meta.url);
const OUTPUT = new URL("src/styles/tokens.generated.css", ROOT);

const SOURCES = {
  base: "tokens/base.tokens.json",
  semantic: "tokens/semantic.tokens.json",
  light: "tokens/themes/light.tokens.json",
  dark: "tokens/themes/dark.tokens.json",
} as const;

// A token file can be read while an editor is still writing it, so a file
// that does not parse is an ordinary error, not a crash.
// A token file's JSON, or undefined when the file cannot be read or is
// not JSON: a file that an editor or git replaces is briefly missing, and
// that must be reported, never thrown at a watcher.
export async function readJson(path: string): Promise<unknown> {
  try {
    const parsed: unknown = JSON.parse(
      await readFile(new URL(path, ROOT), "utf8"),
    );
    return parsed;
  } catch {
    return undefined;
  }
}

export async function buildTokens(): Promise<TokenCssResult> {
  const [base, semantic, light, dark] = await Promise.all(
    Object.values(SOURCES).map(readJson),
  );
  const unreadable = Object.values(SOURCES).filter(
    (_, index) => [base, semantic, light, dark][index] === undefined,
  );
  if (unreadable.length > 0) {
    const errors = unreadable.map((path) => ({
      path,
      message: "File cannot be read or is not valid JSON.",
    }));
    return { ok: false, errors };
  }
  const result = buildTokenCss({ base, semantic, light, dark });
  if (result.ok) await writeFile(OUTPUT, result.css);
  return result;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await buildTokens();
  if (result.ok) {
    console.log("Wrote src/styles/tokens.generated.css");
  } else {
    for (const error of result.errors) {
      console.error(`${error.path}: ${error.message}`);
    }
    process.exitCode = 1;
  }
}
