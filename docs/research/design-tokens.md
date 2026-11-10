# Design tokens

## Version checked

2026-11-10. Design Tokens Format Module 2025.10 with its Color and Resolver modules (all marked stable). Node 22.23.4 for running the build script. A 114-line prototype of `scripts/build-tokens.ts` was run against sample token files covering every type below.

## Findings

**Format rules**

- A token is an object with `$value`; a group is an object without it. Optional: `$type`, `$description`, `$deprecated`, `$extensions`. Files end in `.tokens.json` (or `.tokens`).
- Names must not start with `$` or contain `{`, `}` or `.`.
- `$type` resolution order: the token's own `$type`, else the type of the token it aliases, else the nearest ancestor group's `$type`. Tools must not guess from the value.
- Alias: `"$value": "{color.text.primary}"` targets a whole token and may chain; cycles are errors. JSON Pointer `{"$ref": "#/a/b/$value/components/0"}` exists for sub-values; the build script does not need it.

```json
{
  "base": {
    "color": {
      "$type": "color",
      "gray": {
        "900": { "$value": { "colorSpace": "oklch", "components": [0.21, 0.01, 250], "alpha": 1, "hex": "#1a1c1f" } }
      }
    },
    "space": { "$type": "dimension", "2": { "$value": { "value": 0.5, "unit": "rem" } } },
    "duration": { "$type": "duration", "fast": { "$value": { "value": 120, "unit": "ms" } } },
    "font": {
      "family": { "$type": "fontFamily", "sans": { "$value": ["system-ui", "Segoe UI", "sans-serif"] } },
      "weight": { "$type": "fontWeight", "strong": { "$value": "semi-bold" } },
      "lineHeight": { "$type": "number", "body": { "$value": 1.5 } }
    },
    "easing": { "$type": "cubicBezier", "standard": { "$value": [0.2, 0, 0, 1] } }
  }
}
```

- `color`: `colorSpace` (one of `srgb`, `srgb-linear`, `hsl`, `hwb`, `lab`, `lch`, `oklab`, `oklch`, `display-p3`, `a98-rgb`, `prophoto-rgb`, `rec2020`, `xyz-d65`, `xyz-d50`), `components` (numbers or `"none"`; sRGB channels are 0 to 1), optional `alpha` (default 1), optional `hex` (6-digit fallback only).
- `dimension`: `{ "value": number, "unit": "px" | "rem" }`, unit required even for 0. `duration`: unit `"ms"` or `"s"`.
- `fontFamily`: string or array. `fontWeight`: number 1 to 1000 or a fixed alias (`thin`, `light`, `normal`, `regular`, `medium`, `semi-bold`, `bold`, `extra-bold`, `black`, ...). `number`: a JSON number (line height and z-order). `cubicBezier`: four numbers.
- `shadow`: one object or an array of `{ "color", "offsetX", "offsetY", "blur", "spread", "inset"? }`; each field may be a value or an alias.
- **Themes:** the Resolver module (`*.resolver.json` with `version: "2025.10"`, `sets`, `modifiers.theme.contexts.light|dark`, `resolutionOrder`, input `{ "theme": "dark" }`) merges files in order, later wins, aliases resolved after the merge. Separate theme files with the same token paths are the token-level expression of this.

**Recommended build script (prototype verified, 0.08 s per run)**

1. Read the four files in fixed order: `base`, `semantic`, `themes/light`, `themes/dark`. This mirrors the resolver's merge order without implementing the resolver.
2. Walk each tree, carrying the inherited `$type`, into a `Map<path, { type, value }>`.
3. Resolve alias chains only to find the `$type` and to detect unknown targets and cycles (throw with the token path).
4. Emit one custom property per token inside `@layer tokens { :root { ... } }`. Aliases become `var(--target)`, so the tiers stay visible in dev tools.
5. Per type: color → `oklch(L C H / a)` or `color(srgb r g b / a)` (support `oklch`, `oklab`, `srgb`, `display-p3`; throw on the rest); dimension and duration → `value` + `unit`; fontFamily → comma list with quotes around names that are not plain keywords; fontWeight → number; cubicBezier → `cubic-bezier(...)`; shadow → layers joined by commas.
6. Themes: a token present in both theme files is emitted once as `light-dark(<light>, <dark>)`. Throw if a theme token is missing from `semantic`, from the other theme, or is not a color.

```css
@layer tokens {
  :root {
    color-scheme: light dark;
    --base-color-gray-900: oklch(0.21 0.01 250);
    --color-text-primary: light-dark(var(--base-color-gray-900), var(--base-color-gray-50));
    --space-inline: var(--base-space-2);
  }
  :root[data-theme="light"] { color-scheme: light; }
  :root[data-theme="dark"] { color-scheme: dark; }
}
```

`light-dark()` follows `color-scheme`, so system preference and the `data-theme` override both work without a `prefers-color-scheme` block and without emitting each color twice.

**Running the script:** `node scripts/build-tokens.ts` works on Node 22.23.4 with no flag and no dependency (`process.features.typescript === "strip"`). `tsx` (4.23.15) and `vite-node` are unnecessary. Export `buildTokens()` so the Vite plugin calls it in-process, and guard the CLI entry with `process.argv[1] === fileURLToPath(import.meta.url)`.

## Pitfalls

- Type stripping only erases types: no `enum`, namespaces or parameter properties (`erasableSyntaxOnly` catches these), imports need the `.ts` extension, and `package.json` needs `"type": "module"` or Node prints a reparse warning.
- Put all base tokens under one top-level `base` group so they become `--base-*`. That is what lets Stylelint forbid base tokens in hand-written CSS with a single pattern.
- camelCase path segments survive into property names (`font.lineHeight.body` → `--font-lineHeight-body`); custom properties are case-sensitive and the Stylelint pattern must allow capitals.
- Theme files are complete replacements for the semantic color values; `semantic.tokens.json` still declares every color token so its path and type exist.
- Vite's Lightning CSS rewrites `light-dark()` for old targets (see `vite-vitest.md`); output stays correct.
- `value` + `unit` produces `px` and `ms` in the generated file, which is why Stylelint ignores that file.
- The prototype used a four-parameter recursive walker and bracket access; the real script needs an options object and dot access to pass the lint rules in `lint.md`.

## Decision it supports

ADR for tokens: four `.tokens.json` files, base tokens under a `base` group, a dependency-free `scripts/build-tokens.ts` run by native Node, themes emitted with `light-dark()`.

## Sources

- https://www.designtokens.org/tr/2025.10/
- https://www.designtokens.org/tr/2025.10/format/
- https://www.designtokens.org/tr/2025.10/color/
- https://www.designtokens.org/tr/2025.10/resolver/
- https://nodejs.org/docs/latest-v22.x/api/typescript.html
- https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark
