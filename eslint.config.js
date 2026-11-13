import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

// Allowed imports per layer (specification 2.4).
const LAYERS = {
  model: [],
  state: ["model"],
  persistence: ["state", "model"],
  ui: ["state", "model"],
  blocks: ["ui", "state", "model"],
  features: ["blocks", "ui", "state", "model"],
  app: ["features", "blocks", "ui", "persistence", "state", "model"],
};
const ALL_LAYERS = Object.keys(LAYERS);

// Packages with a single owner. Every other file is refused the import.
const PACKAGE_OWNERS = {
  valibot: ["src/model/**/*.ts", "src/**/*.schema.ts"],
  idb: ["src/persistence/indexed-db-adapter.ts"],
  zustand: ["src/state/store.ts"],
  "@tanstack/table-core": ["src/features/database/table-model.selectors.ts"],
};
const PACKAGES = Object.keys(PACKAGE_OWNERS);
const OWNER_GLOBS = [...new Set(Object.values(PACKAGE_OWNERS).flat())];

const BANNED_NAMES = "utils,helpers,common,shared,misc,lib";
const ROLE_SUFFIXES = "view,commands,selectors,definition,schema,test";

const DEEP_IMPORT = {
  regex: "^(\\.\\./)+(features|blocks)/[^/]+/(?!index\\.ts$).+",
  message: "Import through index.ts only.",
};
const SIBLING_DEEP_IMPORT = {
  regex: "^\\.\\./[^./][^/]*/(?!index\\.ts$).+",
  message: "Import a sibling through its index.ts only.",
};

// The modules at the root of src/blocks/ are reached through its index.ts
// from every other layer (ADR-0011).
const BLOCKS_ROOT_IMPORT = {
  regex: "^(\\.\\./)+blocks/(?!index\\.ts$)[^/]+$",
  message: "Import blocks through src/blocks/index.ts.",
};

function layerPatterns(layer) {
  const allowed = LAYERS[layer];
  const forbidden = ALL_LAYERS.filter(
    (name) => name !== layer && !allowed.includes(name),
  );
  const patterns = [DEEP_IMPORT];
  if (layer !== "blocks") patterns.push(BLOCKS_ROOT_IMPORT);
  if (layer === "features" || layer === "blocks") {
    patterns.push(SIBLING_DEEP_IMPORT);
  }
  if (forbidden.length > 0) {
    patterns.push({
      regex: `^(\\.\\./)+(${forbidden.join("|")})(/|$)`,
      message: `'${layer}' may import only: ${allowed.join(", ") || "nothing"}.`,
    });
  }
  return patterns;
}

function packagePatterns(allowedPackages) {
  return PACKAGES.filter((name) => !allowedPackages.includes(name)).map(
    (name) => ({
      regex: `^${name}(/|$)`,
      message: `'${name}' has one owner. See docs/ownership.md.`,
    }),
  );
}

function importRule(layer, allowedPackages) {
  const patterns = [
    ...layerPatterns(layer),
    ...packagePatterns(allowedPackages),
  ];
  return { "no-restricted-imports": ["error", { patterns }] };
}

// Flat config replaces rule options instead of merging them, so each file
// group gets one complete entry: the layer default, then one per owner glob.
function layerConfigs(layer) {
  const base = {
    files: [`src/${layer}/**/*.ts`],
    rules: importRule(layer, []),
  };
  const owners = OWNER_GLOBS.map((glob) => ({
    files: [glob.replace(/^src\/\*\*/, `src/${layer}/**`)],
    ignores:
      glob.startsWith(`src/${layer}/`) || glob.startsWith("src/**")
        ? []
        : ["**"],
    rules: importRule(
      layer,
      PACKAGES.filter((name) => PACKAGE_OWNERS[name].includes(glob)),
    ),
  })).filter((entry) => entry.ignores.length === 0);
  return [base, ...owners.map(({ files, rules }) => ({ files, rules }))];
}

export default defineConfig([
  // .captures holds photos and the Chrome profile kept for them.
  globalIgnores([
    "dist/",
    "src/styles/tokens.generated.css",
    ".specify/",
    ".captures/",
  ]),
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      "max-lines": ["error", { max: 250 }],
      "max-lines-per-function": ["error", { max: 40 }],
      "max-params": ["error", { max: 3 }],
      complexity: ["error", 10],
      "no-restricted-exports": [
        "error",
        {
          restrictDefaultExports: {
            direct: true,
            named: true,
            defaultFrom: true,
            namedFrom: true,
            namespaceFrom: true,
          },
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "ExportAllDeclaration",
          message: "`export *` is allowed only in index.ts.",
        },
        {
          selector:
            "CallExpression[callee.property.name='setState'], CallExpression[callee.name='setState']",
          message: "Only src/state/dispatch.ts writes to the store.",
        },
      ],
      // `const { removed, ...rest } = record` is how a key is left out.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { ignoreRestSiblings: true },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "never" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports" },
      ],
    },
  },
  ...ALL_LAYERS.flatMap(layerConfigs),
  { files: ["**/*.js"], extends: [tseslint.configs.disableTypeChecked] },
  { files: ["src/**/index.ts"], rules: { "no-restricted-syntax": "off" } },
  {
    files: ["src/state/dispatch.ts"],
    rules: { "no-restricted-syntax": "off" },
  },
  { files: ["**/*.test.ts"], rules: { "max-lines-per-function": "off" } },
  { files: ["*.config.{js,ts}"], rules: { "no-restricted-exports": "off" } },
  {
    files: [`**/{${BANNED_NAMES}}.*`, `**/{${BANNED_NAMES}}/**`],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Program",
          message: "Banned file or folder name: name the owner instead.",
        },
      ],
    },
  },
  {
    files: ["src/**/*.*.ts"],
    ignores: [`src/**/*.{${ROLE_SUFFIXES}}.ts`],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: "Program", message: "Unknown role suffix." },
      ],
    },
  },
]);
