import { describe, expect, it } from "vitest";
import { buildTokenCss, type TokenSources } from "./token-css.ts";

const GRAY = { colorSpace: "oklch", components: [0.2, 0.01, 85] };
const WHITE = { colorSpace: "oklch", components: [0.99, 0, 85] };

function createSources(overrides: Partial<TokenSources> = {}): TokenSources {
  return {
    base: {
      base: {
        color: {
          $type: "color",
          gray: { $value: GRAY },
          white: { $value: WHITE },
        },
      },
    },
    semantic: {
      color: {
        $type: "color",
        text: { primary: { $value: "{base.color.gray}" } },
      },
    },
    light: { color: { text: { primary: { $value: "{base.color.gray}" } } } },
    dark: { color: { text: { primary: { $value: "{base.color.white}" } } } },
    ...overrides,
  };
}

function cssOf(sources: TokenSources): string {
  const result = buildTokenCss(sources);
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  return result.css;
}

describe("buildTokenCss", () => {
  it("emits one custom property per base token with a base prefix", () => {
    const css = cssOf(createSources());

    expect(css).toContain("--base-color-gray: oklch(0.2 0.01 85);");
  });

  it("emits a themed color once with light-dark and aliases as var", () => {
    const css = cssOf(createSources());

    expect(css).toContain(
      "--color-text-primary: light-dark(var(--base-color-gray), var(--base-color-white));",
    );
    expect(css.match(/--color-text-primary:/g)).toHaveLength(1);
  });

  it("wraps the output in the tokens layer with the color scheme rules", () => {
    const css = cssOf(createSources());

    expect(css).toContain("@layer tokens {");
    expect(css).toContain("color-scheme: light dark;");
    expect(css).toContain(':root[data-theme="dark"]');
  });

  it("converts camelCase path segments to kebab-case", () => {
    const sources = createSources({
      semantic: {
        font: { lineHeight: { $type: "number", body: { $value: 1.6 } } },
      },
      light: {},
      dark: {},
    });

    expect(cssOf(sources)).toContain("--font-line-height-body: 1.6;");
  });

  it.each([
    ["dimension", { value: 0.5, unit: "rem" }, "0.5rem"],
    ["duration", { value: 120, unit: "ms" }, "120ms"],
    ["fontWeight", 600, "600"],
    ["cubicBezier", [0.2, 0, 0, 1], "cubic-bezier(0.2, 0, 0, 1)"],
    [
      "fontFamily",
      ["system-ui", "Segoe UI", "sans-serif"],
      'system-ui, "Segoe UI", sans-serif',
    ],
    [
      "color",
      { colorSpace: "oklch", components: [0.16, 0.006, 85], alpha: 0.45 },
      "oklch(0.16 0.006 85 / 0.45)",
    ],
  ])("formats a %s value", (type, value, expected) => {
    const sources = createSources({
      semantic: { sample: { $type: type, token: { $value: value } } },
      light: {},
      dark: {},
    });

    expect(cssOf(sources)).toContain(`--sample-token: ${expected};`);
  });

  it("formats a shadow with an aliased color", () => {
    const px = (value: number) => ({ value, unit: "px" });
    const sources = createSources({
      semantic: {
        color: { $type: "color", shade: { $value: "{base.color.gray}" } },
        shadow: {
          $type: "shadow",
          overlay: {
            $value: [
              {
                color: "{color.shade}",
                offsetX: px(0),
                offsetY: px(4),
                blur: px(16),
                spread: px(0),
              },
            ],
          },
        },
      },
      light: {},
      dark: {},
    });

    expect(cssOf(sources)).toContain(
      "--shadow-overlay: 0px 4px 16px 0px var(--color-shade);",
    );
  });

  it("reports an unknown alias with the token path", () => {
    const sources = createSources({
      semantic: {
        color: { $type: "color", bad: { $value: "{color.missing}" } },
      },
      light: {},
      dark: {},
    });

    const result = buildTokenCss(sources);

    expect(result).toEqual({
      ok: false,
      errors: [
        { path: "color.bad", message: "Unknown alias {color.missing}." },
      ],
    });
  });

  it("reports a theme token that the other theme does not define", () => {
    const result = buildTokenCss(createSources({ dark: {} }));

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ errors: [{ path: "color.text.primary" }] });
  });

  it("reports a token without a type", () => {
    const sources = createSources({
      semantic: { loose: { $value: 3 } },
      light: {},
      dark: {},
    });

    expect(buildTokenCss(sources)).toMatchObject({
      ok: false,
      errors: [{ path: "loose" }],
    });
  });
});
