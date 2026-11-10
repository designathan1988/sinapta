const SEGMENT = "[a-z][a-z0-9]*(-[a-z0-9]+)*";

export default {
  extends: ["stylelint-config-standard"],
  ignoreFiles: ["dist/**", "src/styles/tokens.generated.css"],
  reportNeedlessDisables: true,
  rules: {
    "color-no-hex": true,
    "color-named": "never",
    "function-disallowed-list": [
      "rgb",
      "rgba",
      "hsl",
      "hsla",
      "hwb",
      "lab",
      "lch",
      "oklab",
      "oklch",
      "color",
    ],
    "unit-disallowed-list": ["px", "ms", "s"],
    "value-type-custom-property-required-list": [
      ["color", "length", "time"],
      { ignoreValues: ["0", "transparent", "currentcolor"] },
    ],
    "declaration-property-value-allowed-list": {
      "font-family": ["/^var\\(--font-family-[a-z0-9-]+\\)$/", "inherit"],
      "font-weight": ["/^var\\(--font-weight-/", "inherit"],
      "z-index": ["/^var\\(--layer-/", "auto"],
    },
    "property-disallowed-list": ["font"],
    "declaration-property-value-disallowed-list": {
      "/.+/": ["/var\\(--base-/"],
    },
    "declaration-no-important": true,
    "selector-max-id": 0,
    "selector-class-pattern": `^${SEGMENT}(__${SEGMENT})?$`,
    "custom-property-pattern": `^${SEGMENT}$`,
    "layer-name-pattern": "^(reset|tokens|base|ui|blocks|features)$",
  },
};
