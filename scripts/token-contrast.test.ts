import { describe, expect, it } from "vitest";
import { readJson } from "./build-tokens.ts";
import { contrastRatio, oklchOf, type Oklch } from "./token-contrast.ts";
import { aliasTarget, flattenTokens } from "./token-tree.ts";

// Text and the surfaces it is drawn on, in each theme: WCAG AA asks 4.5:1
// for text of ordinary size.
const TEXTS = ["text.secondary", "text.tertiary", "text.accent", "text.danger"];
const SURFACES = [
  "bg.app",
  "bg.sidebar",
  "bg.raised",
  "bg.hover",
  "bg.selected",
];
const FILLS = [
  ["text.onAccent", "accent.fill"],
  ["text.onAccent", "accent.fillHover"],
  ["text.onAccent", "status.dangerFill"],
  ["text.danger", "status.dangerBg"],
] as const;
const PAIRS = [
  ...TEXTS.flatMap((text) => SURFACES.map((surface) => [text, surface])),
  ...FILLS,
];
const AA = 4.5;

async function themeColors(file: string) {
  const base = flattenTokens(await readJson("tokens/base.tokens.json"));
  const theme = flattenTokens(await readJson(file));
  return (name: string): Oklch => {
    const target = aliasTarget(theme.get(`color.${name}`)?.value);
    const color = oklchOf(base.get(target ?? "")?.value);
    if (color === undefined) throw new Error(`no color ${name}`);
    return color;
  };
}

describe("the theme colors", () => {
  it.each(["light", "dark"])(
    "draw text at 4.5:1 or more in the %s theme",
    async (name) => {
      const color = await themeColors(`tokens/themes/${name}.tokens.json`);
      const failing = PAIRS.flatMap(([text = "", surface = ""]) => {
        const ratio = contrastRatio(color(text), color(surface));
        return ratio < AA ? [`${text} on ${surface}: ${ratio.toFixed(2)}`] : [];
      });

      expect(failing).toEqual([]);
    },
  );
});
