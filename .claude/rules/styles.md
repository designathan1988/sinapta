---
paths:
  - "src/**/*.css"
  - "tokens/**/*.json"
---

# Style and token rules

- Layer order is declared once, in `src/styles/index.css`:
  `reset, tokens, base, ui, blocks, features`. Every rule sits in a layer.
- A view's CSS file sits next to it, in `@layer features`, `@layer blocks`
  or `@layer ui`.
- Class names: folder name, then `__part`: `.sidebar__item`. State is
  expressed with `data-*` or ARIA attributes, never a modifier class.
- CSS uses semantic token custom properties only. No hex colors, no `px`,
  `rem` or `ms` literals, no font names, no base tokens. The exceptions are
  `0`, percentages, `fr`, unitless numbers and media or container query
  conditions.
- No `!important`, no id selectors, no inline `style` attributes.
- Use logical properties (`inline-size`, `margin-block`), nesting and
  container queries for component layout.
- Every animation and transition is disabled under
  `prefers-reduced-motion: reduce`.
- Tokens: Design Tokens Format 2025.10. Three tiers: `base` (raw scales),
  `semantic` (roles aliasing base), themes (reassign semantic colors).
- Token paths are dot-separated lower camelCase; `color.text.primary`
  becomes `--color-text-primary`.
- Never edit `src/styles/tokens.generated.css`; run `npm run tokens`.
- A new visual value is a new token first, then a use.
