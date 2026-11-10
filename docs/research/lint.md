# Lint and format

## Version checked

2026-11-10. `eslint@10.14.0`, `@eslint/js@10.0.1`, `typescript-eslint@8.72.2` (on TS 6.0.3, see `typescript.md`), `stylelint@18.0.0`, `stylelint-config-standard@41.0.0`, `prettier@3.9.10`. Both configs below were run against sample files with one deliberate violation per rule; every violation was reported and the clean files passed.

## Findings

**Import rules: use core `no-restricted-imports` with `regex` patterns per layer.** No extra dependency, works on relative imports that carry `.ts` extensions.

| Option | Result |
| --- | --- |
| Core `no-restricted-imports` | Works; 0 dependencies; caught all five sample violations. **Recommended.** |
| `eslint-plugin-import-x@4.18.1` `no-restricted-paths` | Works on ESLint 10 (caught the sample), but adds a native resolver (`unrs-resolver`) and the "index.ts only" rule is verbose in zones. |
| `eslint-plugin-boundaries@7.4.2` | Loads on ESLint 10, but two attempts with the documented element settings reported nothing and printed deprecation warnings (rule and option renames in v6 and v7). Rejected: resolver setup plus API churn. |

```js
// eslint.config.js (abridged to the parts that matter; ran as shown)
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

const LAYERS = { model: [], state: ["model"], persistence: ["state", "model"], ui: ["state", "model"],
  blocks: ["ui", "state", "model"], features: ["blocks", "ui", "state", "model"],
  app: ["features", "blocks", "ui", "persistence", "state", "model"] };
const ALL_LAYERS = Object.keys(LAYERS);
const BANNED_NAMES = "utils,helpers,common,shared,misc,lib";
const ROLE_SUFFIXES = "view,commands,selectors,definition,schema,test";
const DEEP_IMPORT = { regex: "^(\\.\\./)+(features|blocks)/[^/]+/(?!index\\.ts$).+", message: "Import through index.ts only." };
const SIBLING_DEEP_IMPORT = { regex: "^\\.\\./[^./][^/]*/(?!index\\.ts$).+", message: "Import a sibling through its index.ts only." };

function layerConfig(layer) {
  const forbidden = ALL_LAYERS.filter((name) => name !== layer && !LAYERS[layer].includes(name));
  const patterns = [DEEP_IMPORT];
  if (layer === "features" || layer === "blocks") patterns.push(SIBLING_DEEP_IMPORT);
  if (forbidden.length > 0) patterns.push({ regex: `^(\\.\\./)+(${forbidden.join("|")})(/|$)`, message: `'${layer}' may import only: ${LAYERS[layer].join(", ") || "nothing"}.` });
  return { files: [`src/${layer}/**/*.ts`], rules: { "no-restricted-imports": ["error", { patterns }] } };
}

export default defineConfig([
  globalIgnores(["dist/"]),
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  { languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } } },
  { rules: {
    "max-lines": ["error", { max: 250 }],
    "max-lines-per-function": ["error", { max: 40 }],
    "max-params": ["error", { max: 3 }],
    "no-restricted-exports": ["error", { restrictDefaultExports: { direct: true, named: true, defaultFrom: true, namedFrom: true, namespaceFrom: true } }],
    "no-restricted-syntax": ["error", { selector: "ExportAllDeclaration", message: "`export *` is allowed only in index.ts." }],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
    "@typescript-eslint/consistent-type-imports": "error",
  } },
  ...ALL_LAYERS.map(layerConfig),
  { files: ["**/*.js"], extends: [tseslint.configs.disableTypeChecked] },
  { files: ["src/**/index.ts"], rules: { "no-restricted-syntax": "off" } },
  { files: ["src/model/**/*.schema.ts"], rules: { "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "as" }] } },
  { files: ["**/*.test.ts"], rules: { "max-lines-per-function": "off" } },
  { files: ["*.config.{js,ts}"], rules: { "no-restricted-exports": "off" } },
  { files: [`**/{${BANNED_NAMES}}.*`, `**/{${BANNED_NAMES}}/**`], rules: { "no-restricted-syntax": ["error", { selector: "Program", message: "Banned file or folder name: name the owner." }] } },
  { files: ["src/**/*.*.ts"], ignores: [`src/**/*.{${ROLE_SUFFIXES}}.ts`], rules: { "no-restricted-syntax": ["error", { selector: "Program", message: "Unknown role suffix." }] } },
]);
```

Proof (excerpt of real output): `src/model/bad-direction.ts 1:1 error '../state/store.ts' import is restricted ... 'model' may import only: nothing`; `src/app/bad-deep.ts ... '../features/sidebar/sidebar.view.ts' ... Import through index.ts only`; `src/persistence/...` importing `blocks` and `src/blocks/...` importing `features` also failed; `as const` and `as` inside `*.schema.ts` passed.

Run with `eslint . --max-warnings 0 --cache --cache-location node_modules/.cache/eslint/`. Cold 3.3 s on the sample (typed rules), warm 0.9 s; ESLint + Stylelint warm 1.3 s.

```js
// stylelint.config.js (ran as shown; nesting, @layer, @container and color-mix() passed)
const SEGMENT = "[a-z][a-z0-9]*(-[a-z0-9]+)*";
export default {
  extends: ["stylelint-config-standard"],
  ignoreFiles: ["dist/**", "src/styles/tokens.generated.css"],
  reportNeedlessDisables: true,
  rules: {
    "color-no-hex": true,
    "color-named": "never",
    "function-disallowed-list": ["rgb", "rgba", "hsl", "hsla", "hwb", "lab", "lch", "oklab", "oklch", "color"],
    "unit-disallowed-list": ["px", "ms", "s"],
    "value-type-custom-property-required-list": [["color", "length", "time"], { ignoreValues: ["0", "transparent", "currentcolor"] }],
    "declaration-property-value-allowed-list": {
      "font-family": ["/^var\\(--font-family-[a-zA-Z0-9-]+\\)$/", "inherit"],
      "font-weight": ["/^var\\(--font-weight-/", "inherit"],
      "z-index": ["/^var\\(--layer-/", "auto"],
    },
    "property-disallowed-list": ["font"],
    "declaration-property-value-disallowed-list": { "/.+/": ["/var\\(--base-/"] },
    "declaration-property-custom-property-allowed-list": { "/color$/": ["/^--color-/"], "/^(margin|padding|gap|inset)/": ["/^--space-/"], "/radius$/": ["/^--radius-/"] },
    "declaration-no-important": true,
    "selector-max-id": 0,
    "selector-class-pattern": `^${SEGMENT}(__${SEGMENT})?$`,
    "custom-property-pattern": "^[a-z][a-zA-Z0-9]*(-[a-zA-Z0-9]+)*$",
    "layer-name-pattern": "^(reset|tokens|base|ui|blocks|features)$",
  },
};
```

Run with `stylelint "src/**/*.css" --max-warnings 0 --cache --cache-location node_modules/.cache/stylelint/`.

Prettier: no config file (defaults: 80 columns, 2 spaces, double quotes, semicolons, trailing commas `all`). Add `.prettierignore` with `dist` and `src/styles/tokens.generated.css`. The typescript-eslint and stylelint-config-standard presets contain no formatting rules, so `eslint-config-prettier` is not needed.

## Pitfalls

- `stylelint-declaration-strict-value@1.12.1` peers `stylelint >=16 <=17`: **not usable on 18**. Stylelint 18's new core rules `value-type-custom-property-required-list` (experimental) and `declaration-property-custom-property-allowed-list` replace it. `stylelint-use-logical` also stops at `<18`.
- `@eslint/js` is not installed with ESLint 10; add it as a devDependency.
- Flat config does not merge options: a later `no-restricted-imports` or `no-restricted-syntax` entry for the same file **replaces** the earlier one. Keep all patterns for a layer in one entry (as `layerConfig` does).
- `no-restricted-imports` ignores dynamic `import()`; ban it separately if it appears.
- The regexes key on folder names: a nested folder named like a layer (`features/x/model/`) is treated as that layer, and `features/database/properties/<type>/` folders must import each other through `index.ts`.
- `max-lines-per-function: 40` flags `describe` callbacks, so it is off for `*.test.ts`. `vite.config.ts`, `eslint.config.js` and `stylelint.config.js` need default exports, so the rule is off for `*.config.*`.
- Typed lint plus `--cache` can miss errors caused by a change in another file; `npm run verify` should rely on `tsc` for cross-file breakage.
- `unit-disallowed-list` leaves `rem` legal because `@container` and `@media` conditions cannot use custom properties; `value-type-custom-property-required-list` still forces tokens in declarations.
- Core Stylelint cannot check that a class prefix equals its folder name; only the `folder__part` shape is enforced.
- The base-token ban assumes base tokens are emitted with a `--base-` prefix (see `design-tokens.md`).

## Decision it supports

ADR for lint and format: core-rule-only boundary enforcement in `eslint.config.js`, Stylelint 18 core rules plus `stylelint-config-standard`, Prettier defaults.

## Sources

- https://eslint.org/docs/latest/rules/no-restricted-imports and https://eslint.org/docs/latest/use/configure/configuration-files
- https://typescript-eslint.io/rules/consistent-type-assertions/ and https://typescript-eslint.io/getting-started/typed-linting/
- https://stylelint.io/migration-guide/to-18
- https://stylelint.io/user-guide/rules/value-type-custom-property-required-list
- https://stylelint.io/user-guide/rules/declaration-property-custom-property-allowed-list
- https://www.jsboundaries.dev/docs/releases/migration-guides/v6-to-v7/ and https://github.com/un-ts/eslint-plugin-import-x
- https://prettier.io/docs/options
