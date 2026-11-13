import { describe, expect, it } from "vitest";
import { readJson } from "./build-tokens.ts";
import {
  alphaOf,
  contrastRatio,
  oklchOf,
  over,
  srgbOf,
  type Srgb,
} from "./token-contrast.ts";
import { aliasTarget, flattenTokens } from "./token-tree.ts";

// Text and the surfaces it is drawn on, in each theme: WCAG AA asks 4.5:1
// for text of ordinary size. A translucent surface, as the hover wash is,
// is checked laid over each surface it is used on.
const TEXTS = ["text.secondary", "text.tertiary", "text.accent", "text.danger"];
const SURFACES = [
  ["bg.app"],
  ["bg.sidebar"],
  ["bg.raised"],
  ["bg.hover", "bg.app"],
  ["bg.hover", "bg.sidebar"],
  ["bg.hover", "bg.raised"],
  ["bg.selected"],
] as const;
const FILLS = [
  ["text.onAccent", ["accent.fill"]],
  ["text.onAccent", ["accent.fillHover"]],
  ["text.onAccent", ["status.dangerFill"]],
  ["text.danger", ["status.dangerBg"]],
  // The date picker and the filter pill (n76): today's number on its
  // circle, a range's days on the band, a rule's words on its pill.
  ["text.onAccent", ["status.today"]],
  ["text.primary", ["accent.range"]],
  ["text.pill", ["accent.pill"]],
  ["text.pill", ["accent.pillOpen"]],
] as const;
const PAIRS: readonly (readonly [string, readonly string[]])[] = [
  ...TEXTS.flatMap((text) =>
    SURFACES.map((surface): readonly [string, readonly string[]] => [
      text,
      surface,
    ]),
  ),
  ...FILLS,
];
const AA = 4.5;

async function themeColors(file: string) {
  const base = flattenTokens(await readJson("tokens/base.tokens.json"));
  const theme = flattenTokens(await readJson(file));
  const token = (name: string) => {
    const target = aliasTarget(theme.get(`color.${name}`)?.value);
    const value = base.get(target ?? "")?.value;
    const color = oklchOf(value);
    if (color === undefined) throw new Error(`no color ${name}`);
    return { color, alpha: alphaOf(value) };
  };
  // A surface, laid over the one under it when it is translucent.
  return (names: readonly string[]): Srgb => {
    const [top = "", under] = names;
    const { color, alpha } = token(top);
    if (under === undefined || alpha === 1) return srgbOf(color);
    return over(color, alpha, srgbOf(token(under).color));
  };
}

describe("the theme colors", () => {
  it.each(["light", "dark"])(
    "draw text at 4.5:1 or more in the %s theme",
    async (name) => {
      const paint = await themeColors(`tokens/themes/${name}.tokens.json`);
      const failing = PAIRS.flatMap(([text, surface]) => {
        const ratio = contrastRatio(paint([text]), paint(surface));
        return ratio < AA
          ? [`${text} on ${surface.join(" over ")}: ${ratio.toFixed(2)}`]
          : [];
      });

      expect(failing).toEqual([]);
    },
  );

  it("lays a translucent color over another as the browser does", () => {
    const white: readonly [number, number, number] = [1, 0, 0];
    const black: readonly [number, number, number] = [0, 0, 0];

    const half = over(white, 0.5, srgbOf(black));

    expect(half.map((channel) => channel.toFixed(2))).toEqual([
      "0.50",
      "0.50",
      "0.50",
    ]);
  });
});
