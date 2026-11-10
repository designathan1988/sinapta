# web-css

## Guide
- id: `css` ("CSS: Modern Architecture"), modern-web-guidance CLI, retrieved 2026-11-10.
- Stated support: this guide prints no Baseline blocks. It recommends cascade layers, `:where()`/`:is()`, `:has()`, native nesting, `@scope`, logical properties, `revert-layer`, and `corner-shape: squircle` (explicitly "as a progressive enhancement"). Support figures for related features come from the sibling guides (`:has()` Widely available; container queries Widely available since 2023-02-14).

## Rules we will follow
```css
/* src/styles/index.css: one order, declared up front (spec 5.6) */
@layer reset, tokens, base, ui, blocks, features;

@layer reset {
  /* element-targeted, never `*` */
  :where(button, input, select, textarea) { font: inherit; color: inherit; }
  :where(ul[role="tree"], ul[role="group"]) { list-style: none; padding: 0; margin: 0; }
}

@layer ui {
  .ui-button:hover:not(:disabled) { background: var(--color-surface-hover); }
  .ui-button:disabled { color: var(--color-text-disabled); }
  .ui-menu > :where(button):not(:last-child) { margin-block-end: var(--space-1); }
  [popover]:where(:popover-open, .\:popover-open) { border-radius: var(--radius-md); }
}

@layer features {
  .sidebar-row {
    padding-inline: var(--space-2);
    margin-inline-start: calc(var(--sidebar-depth) * var(--space-4));
    &:has(:focus-visible) { background: var(--color-surface-selected); }
  }
}
```
- Logical properties by default; a physical property only when it must not flip in RTL.
- Specificity is managed with `@layer` and `:where()`, not naming conventions; no `!important`, no id selectors.
- `:has()` for parent-from-child state instead of JS-managed classes; never nest `:has()` or put pseudo-elements inside it.
- Exclude states with `:not()` instead of write-then-override (`:hover:not(:disabled)`).
- `@scope (.x) to (.y)` when nested subtrees must be excluded or when proximity should win (nested callouts, a block that overrides `color-scheme`).
- Every non-trivial value is a token custom property; only trivial values (`0`, `transparent`, `auto`, `none`) are literal.
- Prefer built-ins over variables: `currentColor`, `inherit`, `em`, `cqi`/`cqb`.
- Per-instance dynamic data (tree depth, drop-marker position, column width) is passed as a custom property via `style`, with the visual rule in the stylesheet.

## Fallbacks required
- The guide lists no fallback section. Its one fallback rule: for pseudo-classes that may be unsupported, use the forgiving `:is()` / `:where()` list instead of duplicating rules (not usable for pseudo-elements).
- `@scope` and `corner-shape` carry no support data here; treat both as progressive enhancement and confirm Baseline status before depending on `@scope` for correctness.
- Overrides in an experimental branch: `revert-layer`, which only works when the fallback value is also layered.

## Verbatim quotes
- "**Avoid** introducing BEM naming conventions to manage specificity."
- "**DO NOT** use global resets (styles on `*`) as they cannot be overridden by web components or lower-priority cascade layers (without `!important`)."
- "**DO NOT** specify nontrivial styling values inline. E.g. `background: transparent` or `padding: 0` is ok, but `background: #f06` or `padding: .3em` are not."
- "Do not use logical properties indiscriminately — ask yourself "would I want this to flip in RTL?" — if the answer is no, use the physical property instead."
- "**DO NOT** nest `:has()` or use pseudo-elements inside it (browser API limitation)"
- "The smaller the scope of the use case, the fewer tiers it needs."

## Decision it supports
Confirms the spec's layer order, token-only values and logical properties, and adds three working rules: the `reset` layer targets elements rather than `*`, selectors exclude with `:not()` and `:where()` instead of overrides, and the folder-name class prefix is a namespace only, never a specificity tool.

## Sources
- modern-web-guidance id `css`
- Related ids named by the guide: `accessibility`, `dark-mode`, `component-specific-light-dark-theme`, `color`, `browser-ui-theming`, `responsive-design`, `typography`, `visual-effects`, `motion`, `performance`, `accessible-generated-content`, `child-state-based-styling`, `content-based-styling`
