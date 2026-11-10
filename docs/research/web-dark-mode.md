# web-dark-mode

## Guide
- id: `dark-mode` ("Dark mode"), modern-web-guidance CLI, retrieved 2026-11-10.
- Stated support:
  - `color-scheme`: Baseline Widely available since 2022-02-03.
  - `light-dark()`: Newly available since 2024-05-13 (Chrome/Edge 123, Firefox 120, Safari 17.5).
  - `light-dark()` image values: Newly available since 2026-09-14 (Chrome/Edge 150, Firefox 150, Safari 27).
  - `scrollbar-color`: Newly available since 2025-12-12 (Safari 26.2).
  - `accent-color`: Limited availability (Chrome/Edge 93, Firefox 92, Safari 26.2).
  - `image()`: not supported by any major browser.

## Rules we will follow
```html
<meta name="color-scheme" content="light dark">   <!-- in <head>, before any stylesheet -->
```
```css
/* tokens.generated.css, @layer tokens */
:root {
  color-scheme: light dark;
  --color-text-primary: var(--color-text-primary-light);            /* fallback */
  @media (prefers-color-scheme: dark) { --color-text-primary: var(--color-text-primary-dark); }
  @supports (color: light-dark(white, black)) {
    --color-text-primary: light-dark(var(--color-text-primary-light), var(--color-text-primary-dark));
  }
  accent-color: var(--color-accent);
  scrollbar-color: var(--color-scrollbar-thumb) var(--color-scrollbar-track);
}
:root[data-theme="light"] { color-scheme: light; }   /* spec 5.4 user override */
:root[data-theme="dark"]  { color-scheme: dark; }
```
- `color-scheme` goes on `:root`, never only on `body`; the base value stays `light dark`.
- `build-tokens.ts` emits each themed semantic colour as raw light and dark custom properties plus one `light-dark()` property, so `data-theme` only has to switch `color-scheme`.
- Any element that overrides `color-scheme` (e.g. a code block) must re-declare inherited colour properties such as `accent-color`.
- Scrollbars: pair `scrollbar-color` with `scrollbar-width`; thumb at least 3:1 against the track; never transition `scrollbar-color`.
- Use `::selection`, `::placeholder`, `::spelling-error` with themed tokens before rebuilding native UI.
- JS that reads `matchMedia("(prefers-color-scheme: dark)")` must also listen for `change`.
- Test `accent-color` contrast in Safari in both schemes.

## Fallbacks required
- `light-dark()` (Newly available): define light and dark values as separate custom properties, set the default to light, switch in `@media (prefers-color-scheme: dark)` on `:root`, then opt into `light-dark()` inside `@supports (color: light-dark(white, black))`. Note: the media-query fallback follows the system, not `data-theme`, so the generated file must also emit `:root[data-theme="dark"]` / `[data-theme="light"]` reassignments for the fallback branch.
- `light-dark()` images: `image-set()` switch with `--light-type` / `--dark-type` custom properties flipped in the media query (a manual toggle must flip them too), or one custom property per image. We have no themed images in version 1.
- `scrollbar-color`: progressive enhancement; optional `::-webkit-scrollbar` rules inside `@supports not (scrollbar-color: auto)`.
- `accent-color`: progressive enhancement, ignored where unsupported.
- `image()`: use `linear-gradient(<color> 0 100%)` instead.

## Verbatim quotes
- "MANDATORY: Apply the `color-scheme` property to the `html` element or the `:root` pseudo-class."
- "It is recommended that you also keep the raw color values in separate custom properties, which makes it easier to combine them in different ways (and makes fallback behavior easier, if needed)."
- "Any JS reading `matchMedia("(prefers-color-scheme: dark)").matches` MUST also handle its `change` event as the system preference can change at any time."
- "Do NOT animate or transition `scrollbar-color`."
- "You MUST pair custom colors with `scrollbar-width` (e.g., `thin` or `auto`) to force macOS to render them."
- "Avoid using the media query on individual components unless the component requires a very specific type of dark mode customization beyond colors."

## Decision it supports
Theme is driven by `color-scheme` alone: semantic colour tokens are generated as `light-dark()` pairs with a media-query fallback, so feature CSS never branches on theme and `data-theme` is a one-line `color-scheme` override.

## Sources
- modern-web-guidance id `dark-mode`
- https://bugs.webkit.org/show_bug.cgi?id=311752
- Related ids named by the guide: `dark-mode-toggle`, `component-specific-light-dark-theme`
