# web-dark-mode-toggle

## Guide
- id: `dark-mode-toggle` ("Dark mode toggles"), modern-web-guidance CLI, retrieved 2026-11-10.
- Stated support: the guide carries no Baseline block of its own. It builds on `dark-mode` (`color-scheme` Widely available; `light-dark()` Newly available since 2024-05-13) and uses `:has()` (Widely available since 2023-12-19, per the `menu` guide) and CSS nesting.

## Rules we will follow
Three-state control in the settings dialog only (no persistent toggle in the top bar):
```html
<fieldset>
  <legend>Theme</legend>
  <label><input type="radio" name="theme" value="system" checked> System (currently light)</label>
  <label><input type="radio" name="theme" value="light"> Light</label>
  <label><input type="radio" name="theme" value="dark"> Dark</label>
</fieldset>
```
```css
:root {
  color-scheme: light dark;                      /* base MUST stay light dark */
  &[data-theme="dark"],
  &:has(> head > meta[name="color-scheme"][content="dark"]) { color-scheme: dark; }
  &[data-theme="light"],
  &:has(> head > meta[name="color-scheme"][content="light"]) { color-scheme: light; }
}
```
```ts
// ui.setTheme handler effect (single owner): 'system' removes the override
const meta = document.querySelector('meta[name="color-scheme"]');
if (theme === 'system') { root.removeAttribute('data-theme'); meta.content = 'light dark'; }
else { root.dataset.theme = theme; meta.content = theme; }
```
- Data model has three states: system (no stored value), `"light"`, `"dark"`. `system` is the default.
- Keep `<meta name="color-scheme">` and `data-theme` in sync so native UI and the canvas follow.
- Apply the stored value before first paint (see conflict below) and keep it in sync across tabs (`storage` event in the guide; for us the persistence layer's change notification).
- Never clear the stored override because the OS preference happens to match it.
- The "System" option shows the current resolved scheme, in text or icon.
- Non-colour branches (icons, font weight) use the same `:root[data-theme]` / `:has(meta…)` selectors combined with the media query, not a JS-only class.

## Fallbacks required
- No feature in this guide is below Widely available except what `dark-mode` covers (`light-dark()` fallback via `prefers-color-scheme`).
- Required robustness rules instead of fallbacks: CSS must work when JS never runs (system scheme applies); `localStorage` may throw, so wrap in `try..catch` and still apply the theme for the session.

## Verbatim quotes
- "Most sites do not need a persistent color scheme toggle in the site UI (header, nav, footer, etc.)."
- "Since `dark-mode` (via `npx -y modern-web-guidance@latest retrieve "dark-mode"`) sets `color-scheme: light dark` on `:root`, updating the `<meta>` alone is a **no-op** — CSS wins."
- "**DO NOT** hardcode `color-scheme: light` or `color-scheme: dark` as the root default; the base declaration MUST stay `light dark`."
- "To avoid a flash of the wrong scheme, apply the stored value in an inline script (NOT `type=module`, NOT `defer`) placed immediately after the `<meta>` element:"
- "**DO NOT** use `matchMedia()` to remove the stored value when the system preference changes to match it."
- "In all cases, the UI MUST support reverting or setting the color scheme to system."

## Decision it supports
Theme lives in the `ui` slice as `system | light | dark`, is edited in Settings with three explicit options, and is reflected to both `data-theme` (spec 5.4) and the `<meta>`. Conflicts to resolve in an ADR: the guide keys the override off the `<meta>` and persists in `localStorage` with an inline blocking script, while the spec uses `data-theme`, IndexedDB-only persistence and a CSP without `unsafe-inline` scripts. A workable merge: a tiny external classic (non-module, non-deferred) script in `<head>` that reads a `localStorage` mirror of the theme, or a CSP hash for the inline script.

## Sources
- modern-web-guidance id `dark-mode-toggle`
- Related ids named by the guide: `dark-mode`, `selector-atrule-combinations`
